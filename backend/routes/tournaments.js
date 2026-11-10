
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// ==========================================
// HELPERS
// ==========================================

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message
  })
}

function getRootEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return sendError(res, 401, 'Необходима авторизация.')
  }

  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = db.prepare(`
      SELECT id, username, email, role, is_banned
      FROM users
      WHERE id = ?
    `).get(decoded.id)

    if (!user) {
      return sendError(res, 401, 'Пользователь не найден.')
    }

    if (user.is_banned) {
      return sendError(res, 403, 'Ваш аккаунт заблокирован.')
    }

    const isRoot = getRootEmails().includes(
      String(user.email).toLowerCase()
    )

    req.user = {
      ...user,
      role: isRoot ? 'root' : user.role || 'player'
    }

    next()
  } catch (error) {
    return sendError(res, 401, 'Недействительный токен.')
  }
}

function requireAdmin(req, res, next) {
  if (!['admin', 'root'].includes(req.user?.role)) {
    return sendError(res, 403, 'Доступ только для администратора.')
  }

  next()
}

function validId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function validDate(value) {
  return typeof value === 'string' &&
    !Number.isNaN(Date.parse(value))
}

function validateTournament(data) {
  const {
    title,
    description = '',
    game,
    format,
    start_at,
    registration_deadline,
    max_players,
    prize_pool = '',
    rules = '',
    status = 'registration',
    registration_open = true
  } = data

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 100
  ) {
    return 'Название обязательно (до 100 символов).'
  }

  if (
    typeof game !== 'string' ||
    !game.trim() ||
    game.trim().length > 60
  ) {
    return 'Укажи игру.'
  }

  if (!['1v1', '2v2', '5v5'].includes(format)) {
    return 'Недопустимый формат турнира.'
  }

  if (
    !validDate(start_at) ||
    !validDate(registration_deadline)
  ) {
    return 'Проверь даты турнира.'
  }

  if (
    new Date(registration_deadline) >=
    new Date(start_at)
  ) {
    return 'Дедлайн регистрации должен быть раньше начала турнира.'
  }

  if (
    !Number.isInteger(Number(max_players)) ||
    Number(max_players) < 2 ||
    Number(max_players) > 1000
  ) {
    return 'Количество участников должно быть от 2 до 1000.'
  }

  if (![
    'draft',
    'registration',
    'live',
    'completed',
    'cancelled'
  ].includes(status)) {
    return 'Недопустимый статус турнира.'
  }

  if (
    typeof description !== 'string' ||
    typeof rules !== 'string' ||
    typeof prize_pool !== 'string'
  ) {
    return 'Некорректные текстовые поля.'
  }

  if (typeof registration_open !== 'boolean') {
    return 'registration_open должен быть true или false.'
  }

  return null
}

function getTournament(id) {
  return db.prepare(`
    SELECT
      t.*,
      u.username AS creator_name,
      (
        SELECT COUNT(*)
        FROM tournament_participants p
        WHERE p.tournament_id = t.id
          AND p.status IN ('registered', 'confirmed')
      ) AS participants_count
    FROM tournaments t
    LEFT JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(id)
}

// ==========================================
// GET ALL TOURNAMENTS
// ==========================================

router.get('/', (req, res) => {
  try {
    const tournaments = db.prepare(`
      SELECT
        t.*,
        u.username AS creator_name,
        (
          SELECT COUNT(*)
          FROM tournament_participants p
          WHERE p.tournament_id = t.id
            AND p.status IN ('registered', 'confirmed')
        ) AS participants_count
      FROM tournaments t
      LEFT JOIN users u ON u.id = t.created_by
      ORDER BY t.created_at DESC
    `).all()

    res.json({
      success: true,
      tournaments
    })
  } catch (error) {
    console.error('GET TOURNAMENTS:', error)
    return sendError(res, 500, 'Не удалось загрузить турниры.')
  }
})

// ==========================================
// GET ONE TOURNAMENT
// ==========================================

router.get('/:id', (req, res) => {
  try {
    const id = validId(req.params.id)

    if (!id) {
      return sendError(res, 400, 'Некорректный ID.')
    }

    const tournament = getTournament(id)

    if (!tournament) {
      return sendError(res, 404, 'Турнир не найден.')
    }

    const participants = db.prepare(`
      SELECT
        p.user_id,
        u.username,
        p.status,
        p.registered_at
      FROM tournament_participants p
      JOIN users u ON u.id = p.user_id
      WHERE p.tournament_id = ?
        AND p.status IN ('registered', 'confirmed')
      ORDER BY p.registered_at ASC
    `).all(id)

    res.json({
      success: true,
      tournament,
      participants
    })
  } catch (error) {
    console.error('GET TOURNAMENT:', error)
    return sendError(res, 500, 'Не удалось загрузить турнир.')
  }
})

// ==========================================
// CREATE TOURNAMENT - ADMIN
// ==========================================

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const error = validateTournament(req.body)

      if (error) {
        return sendError(res, 400, error)
      }

      const data = req.body

      const result = db.prepare(`
        INSERT INTO tournaments (
          title,
          description,
          game,
          format,
          start_at,
          registration_deadline,
          max_players,
          prize_pool,
          rules,
          status,
          registration_open,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.title.trim(),
        data.description || '',
        data.game.trim(),
        data.format,
        data.start_at,
        data.registration_deadline,
        Number(data.max_players),
        data.prize_pool || '',
        data.rules || '',
        data.status || 'registration',
        data.registration_open === undefined
          ? 1
          : Number(data.registration_open),
        req.user.id
      )

      const tournament = getTournament(
        Number(result.lastInsertRowid)
      )

      res.status(201).json({
        success: true,
        message: 'Турнир создан.',
        tournament
      })
    } catch (error) {
      console.error('CREATE TOURNAMENT:', error)
      return sendError(res, 500, 'Не удалось создать турнир.')
    }
  }
)

// ==========================================
// UPDATE TOURNAMENT - ADMIN
// ==========================================

router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const id = validId(req.params.id)

      if (!id) {
        return sendError(res, 400, 'Некорректный ID.')
      }

      const current = db.prepare(`
        SELECT * FROM tournaments WHERE id = ?
      `).get(id)

      if (!current) {
        return sendError(res, 404, 'Турнир не найден.')
      }

      const data = {
        ...current,
        ...req.body
      }

      const error = validateTournament(data)

      if (error) {
        return sendError(res, 400, error)
      }

      const participants = db.prepare(`
        SELECT COUNT(*) AS count
        FROM tournament_participants
        WHERE tournament_id = ?
          AND status IN ('registered', 'confirmed')
      `).get(id).count

      if (Number(data.max_players) < participants) {
        return sendError(
          res,
          400,
          'Лимит меньше текущего количества участников.'
        )
      }

      db.prepare(`
        UPDATE tournaments SET
          title = ?,
          description = ?,
          game = ?,
          format = ?,
          start_at = ?,
          registration_deadline = ?,
          max_players = ?,
          prize_pool = ?,
          rules = ?,
          status = ?,
          registration_open = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.title.trim(),
        data.description || '',
        data.game.trim(),
        data.format,
        data.start_at,
        data.registration_deadline,
        Number(data.max_players),
        data.prize_pool || '',
        data.rules || '',
        data.status,
        Number(data.registration_open),
        id
      )

      res.json({
        success: true,
        message: 'Турнир обновлён.',
        tournament: getTournament(id)
      })
    } catch (error) {
      console.error('UPDATE TOURNAMENT:', error)
      return sendError(res, 500, 'Не удалось обновить турнир.')
    }
  }
)

// ==========================================
// DELETE TOURNAMENT - ADMIN
// ==========================================

router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const id = validId(req.params.id)

      if (!id) {
        return sendError(res, 400, 'Некорректный ID.')
      }

      const result = db.prepare(`
        DELETE FROM tournaments WHERE id = ?
      `).run(id)

      if (!result.changes) {
        return sendError(res, 404, 'Турнир не найден.')
      }

      res.json({
        success: true,
        message: 'Турнир удалён.'
      })
    } catch (error) {
      console.error('DELETE TOURNAMENT:', error)
      return sendError(
        res,
        500,
        'Не удалось удалить турнир. Проверь связанные записи.'
      )
    }
  }
)

// ==========================================
// REGISTER FOR TOURNAMENT
// ==========================================

router.post(
  '/:id/register',
  authenticateToken,
  (req, res) => {
    try {
      const id = validId(req.params.id)

      if (!id) {
        return sendError(res, 400, 'Некорректный ID.')
      }

      const register = db.transaction(() => {
        const tournament = db.prepare(`
          SELECT * FROM tournaments WHERE id = ?
        `).get(id)

        if (!tournament) {
          throw new Error('TOURNAMENT_NOT_FOUND')
        }

        if (
          tournament.status !== 'registration' ||
          !tournament.registration_open ||
          Date.now() >=
            new Date(tournament.registration_deadline).getTime()
        ) {
          throw new Error('REGISTRATION_CLOSED')
        }

        const existing = db.prepare(`
          SELECT id, status
          FROM tournament_participants
          WHERE tournament_id = ? AND user_id = ?
        `).get(id, req.user.id)

        if (existing) {
          throw new Error('ALREADY_REGISTERED')
        }

        const count = db.prepare(`
          SELECT COUNT(*) AS count
          FROM tournament_participants
          WHERE tournament_id = ?
            AND status IN ('registered', 'confirmed')
        `).get(id).count

        if (count >= tournament.max_players) {
          throw new Error('TOURNAMENT_FULL')
        }

        db.prepare(`
          INSERT INTO tournament_participants (
            tournament_id,
            user_id,
            status
          )
          VALUES (?, ?, 'registered')
        `).run(id, req.user.id)
      })

      register()

      res.status(201).json({
        success: true,
        message: 'Ты зарегистрирован на турнир!'
      })
    } catch (error) {
      const errors = {
        TOURNAMENT_NOT_FOUND: [404, 'Турнир не найден.'],
        REGISTRATION_CLOSED: [400, 'Регистрация закрыта.'],
        ALREADY_REGISTERED: [409, 'Ты уже зарегистрирован.'],
        TOURNAMENT_FULL: [409, 'Все места заняты.']
      }

      if (errors[error.message]) {
        return sendError(
          res,
          errors[error.message][0],
          errors[error.message][1]
        )
      }

      console.error('REGISTER TOURNAMENT:', error)
      return sendError(
        res,
        500,
        'Не удалось зарегистрироваться.'
      )
    }
  }
)

// ==========================================
// CANCEL OWN REGISTRATION
// ==========================================

router.delete(
  '/:id/register',
  authenticateToken,
  (req, res) => {
    try {
      const id = validId(req.params.id)

      if (!id) {
        return sendError(res, 400, 'Некорректный ID.')
      }

      const tournament = db.prepare(`
        SELECT * FROM tournaments WHERE id = ?
      `).get(id)

      if (!tournament) {
        return sendError(res, 404, 'Турнир не найден.')
      }

      if (
        Date.now() >=
        new Date(tournament.registration_deadline).getTime()
      ) {
        return sendError(
          res,
          400,
          'Отмена регистрации больше недоступна.'
        )
      }

      const result = db.prepare(`
        DELETE FROM tournament_participants
        WHERE tournament_id = ? AND user_id = ?
      `).run(id, req.user.id)

      if (!result.changes) {
        return sendError(res, 404, 'Регистрация не найдена.')
      }

      res.json({
        success: true,
        message: 'Регистрация отменена.'
      })
    } catch (error) {
      console.error('CANCEL REGISTRATION:', error)
      return sendError(
        res,
        500,
        'Не удалось отменить регистрацию.'
      )
    }
  }
)

// ==========================================
// ADMIN: GET PARTICIPANTS
// ==========================================

router.get(
  '/:id/participants',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const id = validId(req.params.id)

      if (!id) {
        return sendError(res, 400, 'Некорректный ID.')
      }

      const tournament = db.prepare(`
        SELECT id FROM tournaments WHERE id = ?
      `).get(id)

      if (!tournament) {
        return sendError(res, 404, 'Турнир не найден.')
      }

      const participants = db.prepare(`
        SELECT
          p.id,
          p.user_id,
          u.username,
          p.status,
          p.registered_at
        FROM tournament_participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.tournament_id = ?
        ORDER BY p.registered_at ASC
      `).all(id)

      res.json({
        success: true,
        participants
      })
    } catch (error) {
      console.error('GET PARTICIPANTS:', error)
      return sendError(
        res,
        500,
        'Не удалось загрузить участников.'
      )
    }
  }
)

module.exports = router
