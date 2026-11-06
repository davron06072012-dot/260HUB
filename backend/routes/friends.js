
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// ==========================================
// DATABASE TABLES
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,

    CHECK(sender_id != receiver_id)
  );

  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CHECK(user1_id < user2_id),
    UNIQUE(user1_id, user2_id),

    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver
  ON friend_requests(receiver_id, status);

  CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
  ON friend_requests(sender_id, status);

  CREATE INDEX IF NOT EXISTS idx_friends_user1
  ON friends(user1_id);

  CREATE INDEX IF NOT EXISTS idx_friends_user2
  ON friends(user2_id);
`)

// ==========================================
// AUTHENTICATION
// ==========================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const accessToken = authHeader?.split(' ')[1]

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: 'Необходима авторизация.'
    })
  }

  jwt.verify(accessToken, process.env.JWT_SECRET, (error, decoded) => {
    if (error || !decoded?.id) {
      return res.status(403).json({
        success: false,
        message: 'Недействительный токен.'
      })
    }

    req.user = decoded
    next()
  })
}

router.use(authenticateToken)

// ==========================================
// HELPERS
// ==========================================

function validId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function getFriendshipIds(firstId, secondId) {
  return {
    user1: Math.min(firstId, secondId),
    user2: Math.max(firstId, secondId)
  }
}

// ==========================================
// GET FRIENDS
// GET /api/friends
// ==========================================

router.get('/', (req, res) => {
  try {
    const userId = validId(req.user.id)

    const friends = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.favorite_game,
        u.bio,
        f.created_at AS friends_since
      FROM friends f
      JOIN users u
        ON u.id = CASE
          WHEN f.user1_id = ? THEN f.user2_id
          ELSE f.user1_id
        END
      WHERE f.user1_id = ? OR f.user2_id = ?
      ORDER BY f.created_at DESC
    `).all(userId, userId, userId)

    res.json({
      success: true,
      friends
    })
  } catch (error) {
    console.error('FRIENDS LIST ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить список друзей.'
    })
  }
})

// ==========================================
// GET FRIEND REQUESTS
// GET /api/friends/requests
// ==========================================

router.get('/requests', (req, res) => {
  try {
    const userId = validId(req.user.id)

    const incoming = db.prepare(`
      SELECT
        fr.id,
        fr.sender_id,
        fr.created_at,
        u.username,
        u.favorite_game,
        u.bio
      FROM friend_requests fr
      JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = ?
        AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(userId)

    const outgoing = db.prepare(`
      SELECT
        fr.id,
        fr.receiver_id,
        fr.created_at,
        u.username,
        u.favorite_game
      FROM friend_requests fr
      JOIN users u ON u.id = fr.receiver_id
      WHERE fr.sender_id = ?
        AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `).all(userId)

    res.json({
      success: true,
      incoming,
      outgoing,
      incomingCount: incoming.length
    })
  } catch (error) {
    console.error('FRIEND REQUESTS ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить заявки.'
    })
  }
})

// ==========================================
// SEND FRIEND REQUEST
// POST /api/friends/request/:userId
// ==========================================

router.post('/request/:userId', (req, res) => {
  try {
    const senderId = validId(req.user.id)
    const receiverId = validId(req.params.userId)

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID игрока.'
      })
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя добавить самого себя.'
      })
    }

    const receiver = db.prepare(`
      SELECT id, username
      FROM users
      WHERE id = ?
    `).get(receiverId)

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Игрок не найден.'
      })
    }

    const ids = getFriendshipIds(senderId, receiverId)

    const friendship = db.prepare(`
      SELECT id
      FROM friends
      WHERE user1_id = ? AND user2_id = ?
    `).get(ids.user1, ids.user2)

    if (friendship) {
      return res.status(409).json({
        success: false,
        alreadyFriends: true,
        message: 'Вы уже друзья.'
      })
    }

    // Проверяем встречную заявку.
    const reverseRequest = db.prepare(`
      SELECT id
      FROM friend_requests
      WHERE sender_id = ?
        AND receiver_id = ?
        AND status = 'pending'
    `).get(receiverId, senderId)

    if (reverseRequest) {
      return res.json({
        success: true,
        incomingRequest: true,
        requestId: reverseRequest.id,
        message: 'Этот игрок уже отправил вам заявку.'
      })
    }

    // Проверяем повторную заявку.
    const existingRequest = db.prepare(`
      SELECT id
      FROM friend_requests
      WHERE sender_id = ?
        AND receiver_id = ?
        AND status = 'pending'
    `).get(senderId, receiverId)

    if (existingRequest) {
      return res.json({
        success: true,
        alreadySent: true,
        requestId: existingRequest.id,
        message: 'Заявка уже отправлена.'
      })
    }

    // Если раньше заявка была отклонена,
    // разрешаем отправить новую.
    const oldRequest = db.prepare(`
      SELECT id
      FROM friend_requests
      WHERE sender_id = ?
        AND receiver_id = ?
        AND status = 'rejected'
      ORDER BY id DESC
      LIMIT 1
    `).get(senderId, receiverId)

    let requestId

    if (oldRequest) {
      db.prepare(`
        UPDATE friend_requests
        SET status = 'pending',
            created_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(oldRequest.id)

      requestId = oldRequest.id
    } else {
      const result = db.prepare(`
        INSERT INTO friend_requests (
          sender_id,
          receiver_id
        )
        VALUES (?, ?)
      `).run(senderId, receiverId)

      requestId = Number(result.lastInsertRowid)
    }

    res.status(201).json({
      success: true,
      requestId,
      receiver: {
        id: receiver.id,
        username: receiver.username
      },
      message: 'Заявка в друзья успешно отправлена.'
    })
  } catch (error) {
    console.error('SEND FRIEND REQUEST ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось отправить заявку.'
    })
  }
})

// ==========================================
// ACCEPT FRIEND REQUEST
// POST /api/friends/requests/:requestId/accept
// ==========================================

router.post('/requests/:requestId/accept', (req, res) => {
  try {
    const userId = validId(req.user.id)
    const requestId = validId(req.params.requestId)

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заявки.'
      })
    }

    const acceptRequest = db.transaction(() => {
      const friendRequest = db.prepare(`
        SELECT id, sender_id, receiver_id
        FROM friend_requests
        WHERE id = ?
          AND receiver_id = ?
          AND status = 'pending'
      `).get(requestId, userId)

      if (!friendRequest) {
        return null
      }

      const ids = getFriendshipIds(
        friendRequest.sender_id,
        friendRequest.receiver_id
      )

      db.prepare(`
        INSERT OR IGNORE INTO friends (
          user1_id,
          user2_id
        )
        VALUES (?, ?)
      `).run(ids.user1, ids.user2)

      db.prepare(`
        UPDATE friend_requests
        SET status = 'accepted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(requestId)

      // Закрываем встречную заявку, если она существует.
      db.prepare(`
        UPDATE friend_requests
        SET status = 'accepted',
            updated_at = CURRENT_TIMESTAMP
        WHERE sender_id = ?
          AND receiver_id = ?
          AND status = 'pending'
      `).run(userId, friendRequest.sender_id)

      return friendRequest
    })

    const result = acceptRequest()

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена или уже обработана.'
      })
    }

    res.json({
      success: true,
      message: 'Заявка принята. Теперь вы друзья!',
      friendId: result.sender_id
    })
  } catch (error) {
    console.error('ACCEPT FRIEND REQUEST ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось принять заявку.'
    })
  }
})

// ==========================================
// REJECT FRIEND REQUEST
// POST /api/friends/requests/:requestId/reject
// ==========================================

router.post('/requests/:requestId/reject', (req, res) => {
  try {
    const userId = validId(req.user.id)
    const requestId = validId(req.params.requestId)

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID заявки.'
      })
    }

    const result = db.prepare(`
      UPDATE friend_requests
      SET status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND receiver_id = ?
        AND status = 'pending'
    `).run(requestId, userId)

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Заявка не найдена или уже обработана.'
      })
    }

    res.json({
      success: true,
      message: 'Заявка отклонена.'
    })
  } catch (error) {
    console.error('REJECT FRIEND REQUEST ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось отклонить заявку.'
    })
  }
})

// ==========================================
// REMOVE FRIEND
// DELETE /api/friends/:userId
// ==========================================

router.delete('/:userId', (req, res) => {
  try {
    const userId = validId(req.user.id)
    const friendId = validId(req.params.userId)

    if (!friendId || userId === friendId) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID игрока.'
      })
    }

    const ids = getFriendshipIds(userId, friendId)

    const result = db.prepare(`
      DELETE FROM friends
      WHERE user1_id = ? AND user2_id = ?
    `).run(ids.user1, ids.user2)

    if (!result.changes) {
      return res.status(404).json({
        success: false,
        message: 'Этот игрок не находится в вашем списке друзей.'
      })
    }

    res.json({
      success: true,
      message: 'Игрок удалён из друзей.'
    })
  } catch (error) {
    console.error('REMOVE FRIEND ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось удалить друга.'
    })
  }
})

module.exports = router
