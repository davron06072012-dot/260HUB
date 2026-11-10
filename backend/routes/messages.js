
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// ======================================
// DATABASE
// ======================================

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
    ON messages(sender_id, receiver_id);

  CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender
    ON messages(receiver_id, sender_id);
`)

// ======================================
// HELPERS
// ======================================

function validId(value) {
  const id = Number(value)

  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function getUser(id) {
  return db.prepare(`
    SELECT id, username, email, is_banned
    FROM users
    WHERE id = ?
  `).get(id)
}

function hasTable(name) {
  return Boolean(db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(name))
}

// ======================================
// AUTHENTICATION
// ======================================

function authenticateToken(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ')
    ? header.slice(7)
    : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Необходима авторизация.'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный или просроченный токен.'
      })
    }

    const userId = validId(decoded.id)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Некорректный пользователь.'
      })
    }

    try {
      const user = getUser(userId)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Аккаунт не найден.'
        })
      }

      if (user.is_banned) {
        return res.status(403).json({
          success: false,
          message: 'Ваш аккаунт заблокирован.'
        })
      }

      req.user = user
      next()
    } catch (dbError) {
      console.error('MESSAGE AUTH ERROR:', dbError)

      return res.status(500).json({
        success: false,
        message: 'Ошибка проверки аккаунта.'
      })
    }
  })
}

// Все маршруты требуют авторизации.
router.use(authenticateToken)

// ======================================
// GET CONVERSATIONS
// GET /api/messages/conversations
// ======================================

router.get('/conversations', (req, res) => {
  try {
    const userId = req.user.id

    const conversations = db.prepare(`
      WITH conversation_users AS (
        SELECT
          CASE
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END AS other_id,
          MAX(id) AS last_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_id
      )

      SELECT
        u.id AS user_id,
        u.username,
        m.body AS last_message,
        m.created_at AS last_message_at,
        m.sender_id AS last_sender_id

      FROM conversation_users c

      JOIN messages m ON m.id = c.last_id
      JOIN users u ON u.id = c.other_id

      WHERE COALESCE(u.is_banned, 0) = 0

      ORDER BY m.id DESC
    `).all(userId, userId, userId)

    return res.json({
      success: true,
      conversations
    })
  } catch (error) {
    console.error('CONVERSATIONS ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Не удалось загрузить диалоги.'
    })
  }
})

// ======================================
// REPORT MESSAGE
// POST /api/messages/reports/:messageId
// ======================================

router.post('/reports/:messageId', (req, res) => {
  try {
    if (!hasTable('message_reports')) {
      return res.status(500).json({
        success: false,
        message: 'Система жалоб ещё не настроена.'
      })
    }

    const messageId = validId(req.params.messageId)
    const reporterId = req.user.id

    const reason = String(req.body.reason || '').trim()
    const details = String(req.body.details || '').trim()

    const allowedReasons = [
      'harassment',
      'spam',
      'threats',
      'inappropriate',
      'other'
    ]

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID сообщения.'
      })
    }

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Выбери причину жалобы.'
      })
    }

    if (details.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Дополнительный текст слишком длинный.'
      })
    }

    // Пользователь может пожаловаться только
    // на сообщение, которое получил сам.
    const message = db.prepare(`
      SELECT id, sender_id, receiver_id
      FROM messages
      WHERE id = ?
    `).get(messageId)

    if (!message || message.receiver_id !== reporterId) {
      return res.status(404).json({
        success: false,
        message: 'Сообщение не найдено.'
      })
    }

    if (message.sender_id === reporterId) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя пожаловаться на собственное сообщение.'
      })
    }

    // Не допускаем повторную жалобу от одного пользователя.
    const existing = db.prepare(`
      SELECT id
      FROM message_reports
      WHERE reporter_id = ? AND message_id = ?
    `).get(reporterId, messageId)

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ты уже отправлял жалобу на это сообщение.'
      })
    }

    const result = db.prepare(`
      INSERT INTO message_reports (
        reporter_id,
        message_id,
        reported_user_id,
        reason,
        details
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      reporterId,
      messageId,
      message.sender_id,
      reason,
      details
    )

    return res.status(201).json({
      success: true,
      reportId: result.lastInsertRowid,
      message: 'Жалоба отправлена на рассмотрение.'
    })
  } catch (error) {
    console.error('MESSAGE REPORT ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Не удалось отправить жалобу.'
    })
  }
})

// ======================================
// GET MESSAGES
// GET /api/messages/:userId
// ======================================

router.get('/:userId', (req, res) => {
  try {
    const currentUserId = req.user.id
    const otherUserId = validId(req.params.userId)

    if (!otherUserId || currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный пользователь.'
      })
    }

    const otherUser = getUser(otherUserId)

    if (!otherUser || otherUser.is_banned) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    const messages = db.prepare(`
      SELECT
        id,
        sender_id,
        receiver_id,
        body,
        created_at
      FROM messages
      WHERE
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY id ASC
      LIMIT 200
    `).all(
      currentUserId,
      otherUserId,
      otherUserId,
      currentUserId
    )

    return res.json({
      success: true,
      user: {
        id: otherUser.id,
        username: otherUser.username
      },
      messages
    })
  } catch (error) {
    console.error('GET MESSAGES ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Не удалось загрузить сообщения.'
    })
  }
})

// ======================================
// SEND MESSAGE
// POST /api/messages/:userId
// ======================================

router.post('/:userId', (req, res) => {
  try {
    const senderId = req.user.id
    const receiverId = validId(req.params.userId)

    const body = typeof req.body?.body === 'string'
      ? req.body.body.trim()
      : ''

    if (!receiverId || senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный получатель.'
      })
    }

    if (!body || body.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Сообщение должно содержать от 1 до 2000 символов.'
      })
    }

    const receiver = getUser(receiverId)

    if (!receiver || receiver.is_banned) {
      return res.status(404).json({
        success: false,
        message: 'Получатель не найден.'
      })
    }

    const result = db.prepare(`
      INSERT INTO messages (
        sender_id,
        receiver_id,
        body
      )
      VALUES (?, ?, ?)
    `).run(senderId, receiverId, body)

    const message = db.prepare(`
      SELECT
        id,
        sender_id,
        receiver_id,
        body,
        created_at
      FROM messages
      WHERE id = ?
    `).get(result.lastInsertRowid)

    return res.status(201).json({
      success: true,
      message
    })
  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Не удалось отправить сообщение.'
    })
  }
})

module.exports = router
