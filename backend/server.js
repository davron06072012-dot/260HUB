
// ==========================================
// 260HUB BACKEND SERVER
// ==========================================

require('dotenv').config()

const express = require('express')
const cors = require('cors')

// ==========================================
// ENVIRONMENT
// ==========================================

const PORT = process.env.PORT || 3000

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET отсутствует или содержит меньше 32 символов.')
  process.exit(1)
}

// ==========================================
// DATABASE
// ==========================================

const db = require('./database')

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require('./src/auth')
const playersRoutes = require('./routes/players')
const messagesRoutes = require('./routes/messages')
const friendsRoutes = require('./routes/friends')
const adminRoutes = require('./routes/admin')
const tournamentRoutes = require('./routes/tournaments')

// ==========================================
// EXPRESS
// ==========================================

const app = express()

app.disable('x-powered-by')

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/260hub(?:-[a-z0-9-]+)?\.vercel\.app$/,
  ...(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
]

app.use(cors({
  origin(origin, callback) {
    const isAllowed = !origin || allowedOrigins.some(allowed =>
      allowed instanceof RegExp
        ? allowed.test(origin)
        : allowed === origin
    )

    if (isAllowed) {
      return callback(null, true)
    }

    console.warn('CORS blocked origin:', origin)
    return callback(new Error('CORS: Origin не разрешён.'))
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204
}))

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json({
  limit: '20kb'
}))

app.use(express.urlencoded({
  extended: false,
  limit: '20kb'
}))

// ==========================================
// HOME
// ==========================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    app: '260HUB',
    message: 'Welcome to 260HUB API',
    status: 'ONLINE'
  })
})

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get()

    res.json({
      success: true,
      status: 'ok',
      app: '260HUB',
      database: 'connected'
    })
  } catch (error) {
    console.error('HEALTH CHECK ERROR:', error)

    res.status(500).json({
      success: false,
      status: 'error',
      database: 'disconnected'
    })
  }
})

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/auth', authRoutes)

app.use('/api/players', playersRoutes)

app.use('/api/messages', messagesRoutes)

app.use('/api/friends', friendsRoutes)

// ADMIN PANEL API
app.use('/api/admin', adminRoutes)

// TOURNAMENTS API
app.use('/api/tournaments', tournamentRoutes)

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден.',
    path: req.originalUrl,
    method: req.method
  })
})

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error('SERVER ERROR:', error)

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Некорректный JSON.'
    })
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Размер запроса слишком большой.'
    })
  }

  if (error.message?.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      message: 'Запрос заблокирован политикой CORS.'
    })
  }

  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера.'
  })
})

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, () => {
  console.log('')
  console.log('================================')
  console.log('       260HUB SERVER')
  console.log('================================')
  console.log(`API:      http://localhost:${PORT}/api`)
  console.log(`Health:   http://localhost:${PORT}/api/health`)
  console.log(`Admin:    http://localhost:${PORT}/api/admin`)
  console.log(`Tournaments: http://localhost:${PORT}/api/tournaments`)
  console.log('Database: CONNECTED')
  console.log('Status:   ONLINE')
  console.log('================================')
  console.log('')
})

// ==========================================
// SERVER ERRORS
// ==========================================

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Порт ${PORT} уже используется.`)
  } else {
    console.error('SERVER START ERROR:', error)
  }

  process.exit(1)
})

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

function shutdown() {
  console.log('\nОстановка 260HUB SERVER...')

  server.close(() => {
    db.close()
    console.log('Сервер остановлен.')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
