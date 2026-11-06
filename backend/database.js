
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDirectory = path.join(__dirname, 'data')

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true })
}

const db = new Database(
  path.join(dataDirectory, '260hub.db')
)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

// Основная таблица
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Проверяем существующие колонки
const columns = db.prepare(
  'PRAGMA table_info(users)'
).all()

const existingColumns = new Set(
  columns.map(column => column.name)
)

// Безопасные миграции
const migrations = [
  {
    name: 'favorite_game',
    sql: 'ALTER TABLE users ADD COLUMN favorite_game TEXT DEFAULT NULL'
  },
  {
    name: 'bio',
    sql: "ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''"
  },
  {
    name: 'updated_at',
    sql: 'ALTER TABLE users ADD COLUMN updated_at DATETIME'
  }
]

for (const migration of migrations) {
  if (!existingColumns.has(migration.name)) {
    db.exec(migration.sql)
    console.log(`Migration completed: ${migration.name}`)
  }
}

// Заполняем updated_at для старых аккаунтов
db.prepare(`
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE updated_at IS NULL
`).run()

// Индексы
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON users(created_at);

  CREATE INDEX IF NOT EXISTS idx_users_favorite_game
  ON users(favorite_game);
`)

console.log('260HUB DATABASE CONNECTED')

module.exports = db
