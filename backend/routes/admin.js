
const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// ==========================================
// HELPERS
// ==========================================

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function isRootAdmin(email) {
  return getAdminEmails().includes(
    String(email || '').trim().toLowerCase()
  )
}

function hasColumn(table, column) {
  const allowedTables = ['users']

  if (!allowedTables.includes(table)) return false

  return db.prepare(`PRAGMA table_info("${table}")`)
    .all()
    .some(item => item.name === column)
}

function getPublicRole(user) {
  if (isRootAdmin(user.email)) return 'root'

  if (
    hasColumn('users', 'role') &&
    user.role === 'admin'
  ) {
    return 'admin'
  }

  return 'player'
}

function validId(value) {
  const id = Number(value)

  return Number.isInteger(id) && id > 0
    ? id
    : null
}

function logAction(admin, action, targetType = '', targetId = null, details = '') {
  db.prepare(`
    INSERT INTO admin_logs (
      admin_id,
      admin_username,
      action,
      target_type,
      target_id,
      details
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    admin.id,
    admin.username,
    action,
    targetType,
    targetId,
    String(details || '').slice(0, 1000)
  )
}

function sendServerError(res, label, error, message) {
  console.error(label, error)

  return res.status(500).json({
    success: false,
    message
  })
}

// ==========================================
// AUTHENTICATION
// ==========================================

function authenticateToken(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Требуется авторизация.'
    })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const user = db.prepare(`
      SELECT id, username, email, is_banned, role
      FROM users
      WHERE id = ?
    `).get(payload.id)

    if (!user || user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещён.'
      })
    }

    user.role = getPublicRole(user)
    req.user = user

    next()
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный или просроченный токен.'
      })
    }

    return sendServerError(
      res,
      'ADMIN AUTH:',
      error,
      'Ошибка авторизации.'
    )
  }
}

// ==========================================
// PERMISSIONS
// ==========================================

function requireAdmin(req, res, next) {
  if (!['root', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Недостаточно прав.'
    })
  }

  next()
}

function requireRoot(req, res, next) {
  if (req.user.role !== 'root') {
    return res.status(403).json({
      success: false,
      message: 'Это действие доступно только главным администраторам.'
    })
  }

  next()
}

// Все маршруты ниже защищены авторизацией.
router.use(authenticateToken, requireAdmin)

// ==========================================
// CURRENT ADMIN
// ==========================================

router.get('/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  })
})

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

router.get('/stats', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT COUNT(*) AS total FROM users
    `).get()

    const banned = db.prepare(`
      SELECT COUNT(*) AS total
      FROM users
      WHERE is_banned = 1
    `).get()

    const tournaments = db.prepare(`
      SELECT COUNT(*) AS total FROM tournaments
    `).get()

    const participants = db.prepare(`
      SELECT COUNT(*) AS total
      FROM tournament_participants
      WHERE status IN ('registered', 'confirmed')
    `).get()

    const reports = db.prepare(`
      SELECT COUNT(*) AS total
      FROM message_reports
      WHERE status = 'pending'
    `).get()

    res.json({
      success: true,
      stats: {
        users: users.total,
        banned: banned.total,
        tournaments: tournaments.total,
        participants: participants.total,
        pendingReports: reports.total
      }
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN STATS:',
      error,
      'Ошибка получения статистики.'
    )
  }
})

// ==========================================
// GET USERS
// ==========================================

router.get('/users', (req, res) => {
  try {
    const search = String(req.query.search || '')
      .trim()
      .slice(0, 100)

    const status = String(req.query.status || 'all')

    if (!['all', 'active', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный фильтр.'
      })
    }

    let query = `
      SELECT
        id,
        username,
        email,
        favorite_game,
        is_banned,
        ban_reason,
        banned_at,
        created_at,
        role
      FROM users
      WHERE 1 = 1
    `

    const params = []

    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    if (status === 'banned') {
      query += ` AND is_banned = 1`
    }

    if (status === 'active') {
      query += ` AND is_banned = 0`
    }

    query += ` ORDER BY created_at DESC LIMIT 200`

    const users = db.prepare(query)
      .all(...params)
      .map(user => ({
        ...user,
        role: getPublicRole(user)
      }))

    res.json({
      success: true,
      users
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN USERS:',
      error,
      'Ошибка получения пользователей.'
    )
  }
})

// ==========================================
// CHANGE USER ROLE — ROOT ONLY
// ==========================================

router.patch('/users/:id/role', requireRoot, (req, res) => {
  try {
    if (!hasColumn('users', 'role')) {
      return res.status(500).json({
        success: false,
        message: 'В базе данных отсутствует колонка role.'
      })
    }

    const id = validId(req.params.id)
    const role = String(req.body.role || '')

    if (!id || !['admin', 'player'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID или роль.'
      })
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя изменить собственную роль.'
      })
    }

    const target = db.prepare(`
      SELECT id, username, email, role
      FROM users
      WHERE id = ?
    `).get(id)

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    if (isRootAdmin(target.email)) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя изменить роль главного администратора.'
      })
    }

    db.prepare(`
      UPDATE users
      SET role = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, id)

    logAction(
      req.user,
      role === 'admin' ? 'ADMIN_GRANTED' : 'ADMIN_REMOVED',
      'user',
      id,
      `Роль пользователя ${target.username}: ${role}`
    )

    res.json({
      success: true,
      message: role === 'admin'
        ? 'Администратор назначен.'
        : 'Права администратора сняты.',
      role
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN ROLE:',
      error,
      'Ошибка изменения роли.'
    )
  }
})

// ==========================================
// BAN USER
// ==========================================

router.patch('/users/:id/ban', (req, res) => {
  try {
    const id = validId(req.params.id)
    const reason = String(req.body.reason || '').trim()

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID пользователя.'
      })
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать собственный аккаунт.'
      })
    }

    if (!reason || reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Укажи причину блокировки длиной до 500 символов.'
      })
    }

    const target = db.prepare(`
      SELECT id, username, email, role
      FROM users
      WHERE id = ?
    `).get(id)

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    if (getPublicRole(target) !== 'player') {
      return res.status(403).json({
        success: false,
        message: 'Нельзя заблокировать администратора.'
      })
    }

    if (target.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя заблокировать собственный аккаунт.'
      })
    }

    db.prepare(`
      UPDATE users
      SET is_banned = 1,
          ban_reason = ?,
          banned_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, id)

    logAction(req.user, 'USER_BANNED', 'user', id, reason)

    res.json({
      success: true,
      message: 'Пользователь заблокирован.'
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN BAN:',
      error,
      'Ошибка блокировки.'
    )
  }
})

// ==========================================
// UNBAN USER
// ==========================================

router.patch('/users/:id/unban', (req, res) => {
  try {
    const id = validId(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID.'
      })
    }

    const target = db.prepare(`
      SELECT id, username, email, role, is_banned
      FROM users
      WHERE id = ?
    `).get(id)

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    if (!target.is_banned) {
      return res.json({
        success: true,
        message: 'Аккаунт уже активен.'
      })
    }

    if (getPublicRole(target) !== 'player') {
      return res.status(403).json({
        success: false,
        message: 'Нельзя изменять блокировку администратора.'
      })
    }

    db.prepare(`
      UPDATE users
      SET is_banned = 0,
          ban_reason = NULL,
          banned_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id)

    logAction(
      req.user,
      'USER_UNBANNED',
      'user',
      id,
      target.username
    )

    res.json({
      success: true,
      message: 'Блокировка снята.'
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN UNBAN:',
      error,
      'Ошибка разблокировки.'
    )
  }
})

// ==========================================
// MESSAGE REPORTS
// ==========================================

// Получить список жалоб.
// Тексты личных сообщений здесь не выдаются.

router.get('/reports', (req, res) => {
  try {
    const status = String(req.query.status || 'pending')

    const allowedStatuses = [
      'pending',
      'reviewed',
      'dismissed',
      'all'
    ]

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный статус жалобы.'
      })
    }

    let query = `
      SELECT
        r.id,
        r.reporter_id,
        r.message_id,
        r.reported_user_id,
        r.reason,
        r.details,
        r.status,
        r.reviewed_by,
        r.reviewed_at,
        r.created_at,
        reporter.username AS reporter_username,
        reported.username AS reported_username,
        reviewer.username AS reviewer_username
      FROM message_reports r
      LEFT JOIN users reporter
        ON reporter.id = r.reporter_id
      LEFT JOIN users reported
        ON reported.id = r.reported_user_id
      LEFT JOIN users reviewer
        ON reviewer.id = r.reviewed_by
    `

    const params = []

    if (status !== 'all') {
      query += ` WHERE r.status = ?`
      params.push(status)
    }

    query += ` ORDER BY r.created_at DESC LIMIT 200`

    const reports = db.prepare(query).all(...params)

    res.json({
      success: true,
      reports
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN REPORTS:',
      error,
      'Ошибка получения жалоб.'
    )
  }
})

// ==========================================
// VIEW REPORTED MESSAGE — RESTRICTED
// ==========================================

// Администратор может просмотреть только сообщение,
// связанное с конкретной жалобой.
// Произвольный просмотр переписок запрещён.

router.get('/reports/:id/message', (req, res) => {
  try {
    const reportId = validId(req.params.id)

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID жалобы.'
      })
    }

    const report = db.prepare(`
      SELECT
        r.id,
        r.message_id,
        r.reporter_id,
        r.reported_user_id,
        r.reason,
        r.details,
        r.status,
        r.created_at
      FROM message_reports r
      WHERE r.id = ?
    `).get(reportId)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Жалоба не найдена.'
      })
    }

    // В messages.js поле текста сообщения называется body.
    const message = db.prepare(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.body,
        m.created_at,
        sender.username AS sender_username,
        receiver.username AS receiver_username
      FROM messages m
      LEFT JOIN users sender
        ON sender.id = m.sender_id
      LEFT JOIN users receiver
        ON receiver.id = m.receiver_id
      WHERE m.id = ?
        AND m.sender_id = ?
    `).get(
      report.message_id,
      report.reported_user_id
    )

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Сообщение не найдено или больше недоступно.'
      })
    }

    // Фиксируем просмотр конкретного сообщения.
    logAction(
      req.user,
      'REPORTED_MESSAGE_VIEWED',
      'message_report',
      report.id,
      `Просмотр сообщения ID ${message.id}`
    )

    res.json({
      success: true,
      report: {
        id: report.id,
        reason: report.reason,
        details: report.details,
        status: report.status,
        created_at: report.created_at
      },
      message
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN REPORTED MESSAGE:',
      error,
      'Ошибка получения сообщения.'
    )
  }
})

// ==========================================
// REVIEW MESSAGE REPORT
// ==========================================

router.patch('/reports/:id', (req, res) => {
  try {
    const id = validId(req.params.id)
    const status = String(req.body.status || '')

    if (!id || !['reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректные данные.'
      })
    }

    const report = db.prepare(`
      SELECT id, status
      FROM message_reports
      WHERE id = ?
    `).get(id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Жалоба не найдена.'
      })
    }

    db.prepare(`
      UPDATE message_reports
      SET status = ?,
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.id, id)

    logAction(
      req.user,
      'REPORT_REVIEWED',
      'message_report',
      id,
      status
    )

    res.json({
      success: true,
      message: 'Результат рассмотрения сохранён.'
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN REPORT REVIEW:',
      error,
      'Ошибка рассмотрения жалобы.'
    )
  }
})

// ==========================================
// PLAYER CHANGE PROPOSALS
// ==========================================

router.get('/proposals', (req, res) => {
  try {
    const status = String(req.query.status || 'pending')

    let query = `
      SELECT
        p.*,
        u.username AS username
      FROM change_proposals p
      LEFT JOIN users u
        ON u.id = p.user_id
    `

    const params = []

    if (['pending', 'approved', 'rejected'].includes(status)) {
      query += ` WHERE p.status = ?`
      params.push(status)
    } else if (status !== 'all') {
      return res.status(400).json({
        success: false,
        message: 'Некорректный статус.'
      })
    }

    query += ` ORDER BY p.created_at DESC LIMIT 200`

    const proposals = db.prepare(query).all(...params)

    res.json({
      success: true,
      proposals
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN PROPOSALS:',
      error,
      'Ошибка получения предложений.'
    )
  }
})

router.patch('/proposals/:id', (req, res) => {
  try {
    const id = validId(req.params.id)
    const status = String(req.body.status || '')
    const note = String(req.body.admin_note || '').trim()

    if (
      !id ||
      !['approved', 'rejected'].includes(status) ||
      note.length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Некорректные данные.'
      })
    }

    const proposal = db.prepare(`
      SELECT id
      FROM change_proposals
      WHERE id = ?
    `).get(id)

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Предложение не найдено.'
      })
    }

    db.prepare(`
      UPDATE change_proposals
      SET status = ?,
          admin_id = ?,
          admin_note = ?,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.id, note, id)

    logAction(
      req.user,
      'PROPOSAL_REVIEWED',
      'proposal',
      id,
      status
    )

    res.json({
      success: true,
      message: 'Решение сохранено.'
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN PROPOSAL REVIEW:',
      error,
      'Ошибка обработки предложения.'
    )
  }
})

// ==========================================
// SITE CONTENT
// ==========================================

router.get('/content', (req, res) => {
  try {
    const content = db.prepare(`
      SELECT *
      FROM content_items
      ORDER BY updated_at DESC
      LIMIT 200
    `).all()

    res.json({
      success: true,
      content
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN CONTENT:',
      error,
      'Ошибка получения контента.'
    )
  }
})

router.post('/content', (req, res) => {
  try {
    const type = String(req.body.content_type || '').trim()
    const title = String(req.body.title || '').trim()
    const body = String(req.body.body || '')
    const slug = String(req.body.slug || '').trim() || null
    const published = req.body.is_published === false ? 0 : 1

    if (
      !type ||
      !title ||
      type.length > 50 ||
      title.length > 200 ||
      body.length > 10000 ||
      (slug && slug.length > 200)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Проверь тип, заголовок, slug и текст.'
      })
    }

    const result = db.prepare(`
      INSERT INTO content_items (
        content_type,
        title,
        body,
        slug,
        is_published,
        created_by,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      type,
      title,
      body,
      slug,
      published,
      req.user.id,
      req.user.id
    )

    logAction(
      req.user,
      'CONTENT_CREATED',
      'content',
      result.lastInsertRowid,
      title
    )

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Материал создан.'
    })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Такой slug уже существует.'
      })
    }

    return sendServerError(
      res,
      'ADMIN CONTENT CREATE:',
      error,
      'Ошибка создания материала.'
    )
  }
})

router.patch('/content/:id', (req, res) => {
  try {
    const id = validId(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID.'
      })
    }

    const current = db.prepare(`
      SELECT *
      FROM content_items
      WHERE id = ?
    `).get(id)

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден.'
      })
    }

    const type = String(
      req.body.content_type ?? current.content_type
    ).trim()

    const title = String(
      req.body.title ?? current.title
    ).trim()

    const body = String(
      req.body.body ?? current.body
    )

    const slug = req.body.slug === undefined
      ? current.slug
      : (String(req.body.slug).trim() || null)

    const published = req.body.is_published === undefined
      ? current.is_published
      : (req.body.is_published ? 1 : 0)

    if (
      !type ||
      !title ||
      type.length > 50 ||
      title.length > 200 ||
      body.length > 10000 ||
      (slug && slug.length > 200)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Некорректные данные материала.'
      })
    }

    db.prepare(`
      UPDATE content_items
      SET content_type = ?,
          title = ?,
          body = ?,
          slug = ?,
          is_published = ?,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      type,
      title,
      body,
      slug,
      published,
      req.user.id,
      id
    )

    logAction(
      req.user,
      'CONTENT_UPDATED',
      'content',
      id,
      title
    )

    res.json({
      success: true,
      message: 'Материал обновлён.'
    })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Такой slug уже существует.'
      })
    }

    return sendServerError(
      res,
      'ADMIN CONTENT UPDATE:',
      error,
      'Ошибка обновления материала.'
    )
  }
})

router.delete('/content/:id', (req, res) => {
  try {
    const id = validId(req.params.id)

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный ID.'
      })
    }

    const result = db.prepare(`
      DELETE FROM content_items
      WHERE id = ?
    `).run(id)

    if (!result.changes) {
      return res.status(404).json({
        success: false,
        message: 'Материал не найден.'
      })
    }

    logAction(
      req.user,
      'CONTENT_DELETED',
      'content',
      id
    )

    res.json({
      success: true,
      message: 'Материал удалён.'
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN CONTENT DELETE:',
      error,
      'Ошибка удаления материала.'
    )
  }
})

// ==========================================
// ADMIN ACTION LOG
// ==========================================

router.get('/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT
        id,
        admin_id,
        admin_username,
        action,
        target_type,
        target_id,
        details,
        created_at
      FROM admin_logs
      ORDER BY created_at DESC
      LIMIT 200
    `).all()

    res.json({
      success: true,
      logs
    })
  } catch (error) {
    return sendServerError(
      res,
      'ADMIN LOGS:',
      error,
      'Ошибка получения журнала.'
    )
  }
})

module.exports = router
