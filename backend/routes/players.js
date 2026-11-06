
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

const ALLOWED_GAMES = [
  'Standoff 2',
  'Counter-Strike 2',
  'Brawl Stars'
]

// Проверка авторизации
function authenticateToken(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Необходима авторизация.'
    })
  }

  try {
    req.user = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    )
    next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Недействительная сессия.'
    })
  }
}

// Безопасные публичные данные игрока
const PLAYER_FIELDS = `
  id,
  username,
  favorite_game,
  bio,
  created_at
`

// GET /api/players
// Получение реальных игроков
router.get('/', (req, res) => {
  try {
    const search = String(req.query.search || '').trim()
    const game = String(req.query.game || '').trim()

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 30, 1),
      50
    )

    const conditions = []
    const params = []

    if (search) {
      conditions.push('username LIKE ?')
      params.push(`%${search}%`)
    }

    if (game) {
      if (!ALLOWED_GAMES.includes(game)) {
        return res.status(400).json({
          success: false,
          message: 'Неизвестная игра.'
        })
      }

      conditions.push('favorite_game = ?')
      params.push(game)
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const players = db.prepare(`
      SELECT ${PLAYER_FIELDS}
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT ?
    `).all(...params, limit)

    res.json({
      success: true,
      count: players.length,
      players
    })
  } catch (error) {
    console.error('GET PLAYERS ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить игроков.'
    })
  }
})

// GET /api/players/:id
// Получение профиля конкретного игрока
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID игрока.'
      })
    }

    const player = db.prepare(`
      SELECT ${PLAYER_FIELDS}
      FROM users
      WHERE id = ?
    `).get(id)

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Игрок не найден.'
      })
    }

    res.json({
      success: true,
      player
    })
  } catch (error) {
    console.error('GET PLAYER ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить профиль.'
    })
  }
})

// PATCH /api/players/me
// Обновление собственного игрового профиля
router.patch('/me', authenticateToken, (req, res) => {
  try {
    const { favorite_game, bio } = req.body || {}

    if (
      favorite_game === undefined &&
      bio === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Нет данных для обновления.'
      })
    }

    if (
      favorite_game !== undefined &&
      favorite_game !== null &&
      !ALLOWED_GAMES.includes(favorite_game)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Выбери одну из доступных игр.'
      })
    }

    if (
      bio !== undefined &&
      (typeof bio !== 'string' || bio.length > 300)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Описание должно содержать до 300 символов.'
      })
    }

    const currentUser = db.prepare(`
      SELECT favorite_game, bio
      FROM users
      WHERE id = ?
    `).get(req.user.id)

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    const newGame = favorite_game === undefined
      ? currentUser.favorite_game
      : favorite_game

    const newBio = bio === undefined
      ? currentUser.bio
      : bio.trim()

    db.prepare(`
      UPDATE users
      SET favorite_game = ?,
          bio = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newGame, newBio, req.user.id)

    const player = db.prepare(`
      SELECT ${PLAYER_FIELDS}
      FROM users
      WHERE id = ?
    `).get(req.user.id)

    res.json({
      success: true,
      message: 'Профиль обновлён.',
      player
    })
  } catch (error) {
    console.error('UPDATE PLAYER ERROR:', error)

    res.status(500).json({
      success: false,
      message: 'Не удалось обновить профиль.'
    })
  }
})

module.exports = router
