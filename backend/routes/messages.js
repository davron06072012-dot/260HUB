
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// Создание таблицы сообщений
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

// Проверка JWT
function authenticateToken(req, res, next) {
  const header = req.headers.authorization
  const token = header && header.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Необходима авторизация.'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Недействительный токен.'
      })
    }

    req.user = user
    next()
  })
}

function validId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// Список диалогов
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const userId = validId(req.user.id)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Некорректный пользователь.'
      })
    }

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
      ORDER BY m.id DESC
    `).all(userId, userId, userId)

    res.json({
      success: true,
      conversations
    })
  } catch (error) {
    console.error('CONVERSATIONS ERROR:', error)
    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить диалоги.'
    })
  }
})

// Получение сообщений с пользователем
router.get('/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = validId(req.user.id)
    const otherUserId = validId(req.params.userId)

    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный пользователь.'
      })
    }

    const otherUser = db.prepare(
      'SELECT id, username FROM users WHERE id = ?'
    ).get(otherUserId)

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    const messages = db.prepare(`
      SELECT id, sender_id, receiver_id, body, created_at
      FROM messages
      WHERE
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY id ASC
      LIMIT 200
    `).all(currentUserId, otherUserId, otherUserId, currentUserId)

    res.json({
      success: true,
      user: otherUser,
      messages
    })
  } catch (error) {
    console.error('GET MESSAGES ERROR:', error)
    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить сообщения.'
    })
  }
})

// Отправка сообщения
router.post('/:userId', authenticateToken, (req, res) => {
  try {
    const currentUserId = validId(req.user.id)
    const otherUserId = validId(req.params.userId)
    const body = typeof req.body.body === 'string'
      ? req.body.body.trim()
      : ''

    if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный пользователь.'
      })
    }

    if (!body || body.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Сообщение должно содержать от 1 до 2000 символов.'
      })
    }

    const receiver = db.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).get(otherUserId)

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Получатель не найден.'
      })
    }

    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, body)
      VALUES (?, ?, ?)
    `).run(currentUserId, otherUserId, body)

    const message = db.prepare(`
      SELECT id, sender_id, receiver_id, body, created_at
      FROM messages
      WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      message
    })
  } catch (error) {
    console.error('SEND MESSAGE ERROR:', error)
    res.status(500).json({
      success: false,
      message: 'Не удалось отправить сообщение.'
    })
  }
})

module.exports = router
