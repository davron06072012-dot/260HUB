[1mdiff --git a/backend/routes/auth.js b/backend/routes/auth.js[m
[1mdeleted file mode 100644[m
[1mindex 807158a..0000000[m
[1m--- a/backend/routes/auth.js[m
[1m+++ /dev/null[m
[36m@@ -1,251 +0,0 @@[m
[31m-[m
[31m-const express = require('express')[m
[31m-const bcrypt = require('bcryptjs')[m
[31m-const jwt = require('jsonwebtoken')[m
[31m-const db = require('../database')[m
[31m-[m
[31m-const router = express.Router()[m
[31m-[m
[31m-function createToken(user) {[m
[31m-  return jwt.sign([m
[31m-    {[m
[31m-      id: user.id,[m
[31m-      username: user.username[m
[31m-    },[m
[31m-    process.env.JWT_SECRET,[m
[31m-    { expiresIn: '7d' }[m
[31m-  )[m
[31m-}[m
[31m-[m
[31m-function authenticateToken(req, res, next) {[m
[31m-  const header = req.headers.authorization[m
[31m-[m
[31m-  if (!header || !header.startsWith('Bearer ')) {[m
[31m-    return res.status(401).json({[m
[31m-      success: false,[m
[31m-      message: 'Необходима авторизация.'[m
[31m-    })[m
[31m-  }[m
[31m-[m
[31m-  try {[m
[31m-    req.user = jwt.verify([m
[31m-      header.slice(7),[m
[31m-      process.env.JWT_SECRET[m
[31m-    )[m
[31m-[m
[31m-    next()[m
[31m-  } catch (error) {[m
[31m-    return res.status(401).json({[m
[31m-      success: false,[m
[31m-      message: 'Сессия недействительна или истекла.'[m
[31m-    })[m
[31m-  }[m
[31m-}[m
[31m-[m
[31m-// REGISTER[m
[31m-router.post('/register', async (req, res) => {[m
[31m-  try {[m
[31m-    const { username, email, password } = req.body || {}[m
[31m-[m
[31m-    if ([m
[31m-      typeof username !== 'string' ||[m
[31m-      typeof email !== 'string' ||[m
[31m-      typeof password !== 'string'[m
[31m-    ) {[m
[31m-      return res.status(400).json({[m
[31m-        success: false,[m
[31m-        message: 'Проверь введённые данные.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const cleanUsername = username.trim()[m
[31m-    const cleanEmail = email.trim().toLowerCase()[m
[31m-[m
[31m-    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername)) {[m
[31m-      return res.status(400).json({[m
[31m-        success: false,[m
[31m-        message: 'Никнейм должен содержать 3–20 символов.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {[m
[31m-      return res.status(400).json({[m
[31m-        success: false,[m
[31m-        message: 'Некорректный email.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    if (password.length < 8 || password.length > 128) {[m
[31m-      return res.status(400).json({[m
[31m-        success: false,[m
[31m-        message: 'Пароль должен содержать 8–128 символов.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const existingUser = db.prepare(`[m
[31m-      SELECT id[m
[31m-      FROM users[m
[31m-      WHERE username = ? OR email = ?[m
[31m-    `).get(cleanUsername, cleanEmail)[m
[31m-[m
[31m-    if (existingUser) {[m
[31m-      return res.status(409).json({[m
[31m-        success: false,[m
[31m-        message: 'Никнейм или email уже занят.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const hashedPassword = await bcrypt.hash(password, 12)[m
[31m-[m
[31m-    const result = db.prepare(`[m
[31m-      INSERT INTO users (username, email, password)[m
[31m-      VALUES (?, ?, ?)[m
[31m-    `).run([m
[31m-      cleanUsername,[m
[31m-      cleanEmail,[m
[31m-      hashedPassword[m
[31m-    )[m
[31m-[m
[31m-    const user = {[m
[31m-      id: Number(result.lastInsertRowid),[m
[31m-      username: cleanUsername,[m
[31m-      email: cleanEmail[m
[31m-    }[m
[31m-[m
[31m-    return res.status(201).json({[m
[31m-      success: true,[m
[31m-      message: 'Аккаунт создан!',[m
[31m-      token: createToken(user),[m
[31m-      user[m
[31m-    })[m
[31m-  } catch (error) {[m
[31m-    console.error('REGISTER ERROR:', error)[m
[31m-[m
[31m-    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {[m
[31m-      return res.status(409).json({[m
[31m-        success: false,[m
[31m-        message: 'Никнейм или email уже занят.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    return res.status(500).json({[m
[31m-      success: false,[m
[31m-      message: 'Ошибка регистрации.'[m
[31m-    })[m
[31m-  }[m
[31m-})[m
[31m-[m
[31m-// LOGIN[m
[31m-router.post('/login', async (req, res) => {[m
[31m-  try {[m
[31m-    const { login, password } = req.body || {}[m
[31m-[m
[31m-    if ([m
[31m-      typeof login !== 'string' ||[m
[31m-      typeof password !== 'string' ||[m
[31m-      !login.trim() ||[m
[31m-      !password[m
[31m-    ) {[m
[31m-      return res.status(400).json({[m
[31m-        success: false,[m
[31m-        message: 'Введи логин и пароль.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const cleanLogin = login.trim()[m
[31m-[m
[31m-    const user = db.prepare(`[m
[31m-      SELECT id, username, email, password[m
[31m-      FROM users[m
[31m-      WHERE username = ? OR email = ?[m
[31m-    `).get([m
[31m-      cleanLogin,[m
[31m-      cleanLogin.toLowerCase()[m
[31m-    )[m
[31m-[m
[31m-    if (!user) {[m
[31m-      return res.status(401).json({[m
[31m-        success: false,[m
[31m-        message: 'Неверный логин или пароль.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const passwordMatches = await bcrypt.compare([m
[31m-      password,[m
[31m-      user.password[m
[31m-    )[m
[31m-[m
[31m-    if (!passwordMatches) {[m
[31m-      return res.status(401).json({[m
[31m-        success: false,[m
[31m-        message: 'Неверный логин или пароль.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    const publicUser = {[m
[31m-      id: user.id,[m
[31m-      username: user.username,[m
[31m-      email: user.email[m
[31m-    }[m
[31m-[m
[31m-    return res.json({[m
[31m-      success: true,[m
[31m-      message: 'Вход выполнен!',[m
[31m-      token: createToken(publicUser),[m
[31m-      user: publicUser[m
[31m-    })[m
[31m-  } catch (error) {[m
[31m-    console.error('LOGIN ERROR:', error)[m
[31m-[m
[31m-    return res.status(500).json({[m
[31m-      success: false,[m
[31m-      message: 'Ошибка входа.'[m
[31m-    })[m
[31m-  }[m
[31m-})[m
[31m-[m
[31m-// CURRENT USER[m
[31m-router.get('/me', authenticateToken, (req, res) => {[m
[31m-  try {[m
[31m-    const user = db.prepare(`[m
[31m-      SELECT[m
[31m-        id,[m
[31m-        username,[m
[31m-        email,[m
[31m-        favorite_game,[m
[31m-        bio,[m
[31m-        created_at[m
[31m-      FROM users[m
[31m-      WHERE id = ?[m
[31m-    `).get(req.user.id)[m
[31m-[m
[31m-    if (!user) {[m
[31m-      return res.status(404).json({[m
[31m-        success: false,[m
[31m-        message: 'Пользователь не найден.'[m
[31m-      })[m
[31m-    }[m
[31m-[m
[31m-    return res.json({[m
[31m-      success: true,[m
[31m-      user[m
[31m-    })[m
[31m-  } catch (error) {[m
[31m-    console.error('ME ERROR:', error)[m
[31m-[m
[31m-    return res.status(500).json({[m
[31m-      success: false,[m
[31m-      message: 'Не удалось загрузить аккаунт.'[m
[31m-    })[m
[31m-  }[m
[31m-})[m
[31m-[m
[31m-// LOGOUT[m
[31m-router.post('/logout', (req, res) => {[m
[31m-  return res.json({[m
[31m-    success: true,[m
[31m-    message: 'Выход выполнен.'[m
[31m-  })[m
[31m-})[m
[31m-[m
[31m-module.exports = router[m
