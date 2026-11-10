
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database')

const router = express.Router()

// ======================================
// USER ROLES
// ======================================

function getRootEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

function getUserRole(user) {
  const email = String(user.email || '').toLowerCase()

  // Главные администраторы из .env
  if (getRootEmails().includes(email)) {
    return 'root'
  }

  // Администраторы из базы данных
  if (user.role === 'admin') {
    return 'admin'
  }

  return 'player'
}

// ======================================
// JWT TOKEN
// ======================================

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// ======================================
// AUTHENTICATION
// ======================================

function authenticateToken(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Необходима авторизация.'
    })
  }

  try {
    const decoded = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    )

    const user = db.prepare(`
      SELECT id, username, email, role, is_banned, ban_reason
      FROM users
      WHERE id = ?
    `).get(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Ваш аккаунт заблокирован.',
        reason: user.ban_reason || null
      })
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: getUserRole(user)
    }

    next()
  } catch (error) {
    console.error('AUTH ERROR:', error)

    return res.status(401).json({
      success: false,
      message: 'Сессия недействительна или истекла.'
    })
  }
}

// ======================================
// REGISTER
// ======================================

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {}

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Проверь введённые данные.'
      })
    }

    const cleanUsername = username.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Никнейм должен содержать 3–20 символов.'
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный email.'
      })
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать 8–128 символов.'
      })
    }

    const existingUser = db.prepare(`
      SELECT id
      FROM users
      WHERE username = ? OR email = ?
    `).get(cleanUsername, cleanEmail)

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Никнейм или email уже занят.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `).run(cleanUsername, cleanEmail, hashedPassword)

    const user = {
      id: Number(result.lastInsertRowid),
      username: cleanUsername,
      email: cleanEmail,
      role: 'player'
    }

    user.role = getUserRole(user)

    return res.status(201).json({
      success: true,
      message: 'Аккаунт создан!',
      token: createToken(user),
      user
    })

  } catch (error) {
    console.error('REGISTER ERROR:', error)

    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Никнейм или email уже занят.'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Ошибка регистрации.'
    })
  }
})

// ======================================
// LOGIN
// ======================================

router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body || {}

    if (
      typeof login !== 'string' ||
      typeof password !== 'string' ||
      !login.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Введи логин и пароль.'
      })
    }

    const cleanLogin = login.trim()

    const user = db.prepare(`
      SELECT
        id,
        username,
        email,
        password,
        role,
        is_banned,
        ban_reason
      FROM users
      WHERE username = ? OR email = ?
    `).get(
      cleanLogin,
      cleanLogin.toLowerCase()
    )

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль.'
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль.'
      })
    }

    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: 'Ваш аккаунт заблокирован.',
        reason: user.ban_reason || null
      })
    }

    const publicUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: getUserRole(user)
    }

    return res.json({
      success: true,
      message: 'Вход выполнен!',
      token: createToken(user),
      user: publicUser
    })

  } catch (error) {
    console.error('LOGIN ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Ошибка входа.'
    })
  }
})

// ======================================
// CURRENT USER
// ======================================

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT
        id,
        username,
        email,
        favorite_game,
        bio,
        created_at,
        role,
        is_banned
      FROM users
      WHERE id = ?
    `).get(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден.'
      })
    }

    return res.json({
      success: true,
      user: {
        ...user,
        role: getUserRole(user)
      }
    })

  } catch (error) {
    console.error('ME ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Не удалось загрузить аккаунт.'
    })
  }
})

// ======================================
// LOGOUT
// ======================================

router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Выход выполнен.'
  })
})

module.exports = router
