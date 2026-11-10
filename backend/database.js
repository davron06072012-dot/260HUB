
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDirectory = path.join(__dirname, 'data')

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true })
}

const db = new Database(path.join(dataDirectory, '260hub.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

// ==========================================
// HELPERS
// ==========================================

function getColumns(table) {
  return new Set(
    db.prepare(`PRAGMA table_info("${table}")`)
      .all()
      .map(column => column.name)
  )
}

function addColumnIfMissing(table, column, definition) {
  const allowedTables = [
    'users',
    'tournaments',
    'tournament_participants'
  ]

  if (!allowedTables.includes(table)) {
    throw new Error(`Migration table not allowed: ${table}`)
  }

  if (!getColumns(table).has(column)) {
    db.exec(
      `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
    )
    console.log(`Migration completed: ${table}.${column}`)
  }
}

// ==========================================
// USERS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Add missing user fields before using them.
const migrateUsers = db.transaction(() => {
  addColumnIfMissing('users', 'favorite_game', "TEXT DEFAULT ''")
  addColumnIfMissing('users', 'bio', "TEXT DEFAULT ''")
  addColumnIfMissing('users', 'updated_at', 'DATETIME')
  addColumnIfMissing('users', 'is_banned', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing('users', 'ban_reason', 'TEXT')
  addColumnIfMissing('users', 'banned_at', 'DATETIME')

  addColumnIfMissing(
  'users',
  'role',
  "TEXT NOT NULL DEFAULT 'player'"
)

  db.prepare(`
    UPDATE users
    SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
    WHERE updated_at IS NULL
  `).run()
})

migrateUsers()

// ==========================================
// TOURNAMENTS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    game TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT '5v5',
    start_at DATETIME NOT NULL,
    registration_deadline DATETIME,
    max_players INTEGER NOT NULL DEFAULT 10,
    prize_pool TEXT DEFAULT '',
    rules TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'registration'
      CHECK (status IN (
        'draft',
        'registration',
        'live',
        'completed',
        'cancelled'
      )),
    registration_open INTEGER NOT NULL DEFAULT 1
      CHECK (registration_open IN (0, 1)),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by)
      REFERENCES users(id) ON DELETE SET NULL
  )
`)

const migrateTournaments = db.transaction(() => {
  addColumnIfMissing('tournaments', 'description', "TEXT DEFAULT ''")
  addColumnIfMissing('tournaments', 'game', "TEXT DEFAULT ''")
  addColumnIfMissing('tournaments', 'format', "TEXT DEFAULT '5v5'")
  addColumnIfMissing('tournaments', 'start_at', 'DATETIME')
  addColumnIfMissing('tournaments', 'registration_deadline', 'DATETIME')
  addColumnIfMissing('tournaments', 'max_players', 'INTEGER NOT NULL DEFAULT 10')
  addColumnIfMissing('tournaments', 'prize_pool', "TEXT DEFAULT ''")
  addColumnIfMissing('tournaments', 'rules', "TEXT DEFAULT ''")
  addColumnIfMissing('tournaments', 'status', "TEXT NOT NULL DEFAULT 'registration'")
  addColumnIfMissing('tournaments', 'registration_open', 'INTEGER NOT NULL DEFAULT 1')
  addColumnIfMissing('tournaments', 'created_by', 'INTEGER')
  addColumnIfMissing('tournaments', 'created_at', 'DATETIME')
  addColumnIfMissing('tournaments', 'updated_at', 'DATETIME')

  db.prepare(`
    UPDATE tournaments
    SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
    WHERE created_at IS NULL OR updated_at IS NULL
  `).run()
})

migrateTournaments()

// ==========================================
// TOURNAMENT PARTICIPANTS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS tournament_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered'
      CHECK (status IN ('registered', 'confirmed', 'cancelled')),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, user_id),
    FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE
  )
`)

const migrateParticipants = db.transaction(() => {
  addColumnIfMissing(
    'tournament_participants',
    'status',
    "TEXT NOT NULL DEFAULT 'registered'"
  )
  addColumnIfMissing(
    'tournament_participants',
    'registered_at',
    'DATETIME'
  )

  db.prepare(`
    UPDATE tournament_participants
    SET registered_at = COALESCE(registered_at, CURRENT_TIMESTAMP)
    WHERE registered_at IS NULL
  `).run()
})

migrateParticipants()

// ==========================================
// ADMIN ACTION LOG
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id)
      REFERENCES users(id) ON DELETE SET NULL
  )
`)

// ==========================================
// SITE CONTENT
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    slug TEXT UNIQUE,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by)
      REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by)
      REFERENCES users(id) ON DELETE SET NULL
  )
`)

// ==========================================
// PLAYER CHANGE PROPOSALS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS change_proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    proposal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_id INTEGER,
    admin_note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id)
      REFERENCES users(id) ON DELETE SET NULL
  )
`)



// ==========================================
// MESSAGE REPORTS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS message_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER,
    message_id INTEGER NOT NULL,
    reported_user_id INTEGER,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id)
      REFERENCES users(id) ON DELETE SET NULL,

    FOREIGN KEY (reported_user_id)
      REFERENCES users(id) ON DELETE SET NULL,

    FOREIGN KEY (reviewed_by)
      REFERENCES users(id) ON DELETE SET NULL
  )
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_message_reports_status
    ON message_reports(status);

  CREATE INDEX IF NOT EXISTS idx_message_reports_created
    ON message_reports(created_at);
`)

// ==========================================
// INDEXES
// ==========================================

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at);

  CREATE INDEX IF NOT EXISTS idx_users_favorite_game
    ON users(favorite_game);

  CREATE INDEX IF NOT EXISTS idx_users_is_banned
    ON users(is_banned);

  CREATE INDEX IF NOT EXISTS idx_tournaments_status
    ON tournaments(status);

  CREATE INDEX IF NOT EXISTS idx_tournaments_start_at
    ON tournaments(start_at);

  CREATE INDEX IF NOT EXISTS idx_participants_tournament
    ON tournament_participants(tournament_id);

  CREATE INDEX IF NOT EXISTS idx_participants_user
    ON tournament_participants(user_id);

  CREATE INDEX IF NOT EXISTS idx_admin_logs_created
    ON admin_logs(created_at);

  CREATE INDEX IF NOT EXISTS idx_proposals_status
    ON change_proposals(status);

  CREATE INDEX IF NOT EXISTS idx_proposals_user
    ON change_proposals(user_id);

  CREATE INDEX IF NOT EXISTS idx_content_type
    ON content_items(content_type);
`)

// ==========================================
// READY
// ==========================================

console.log('')
console.log('================================')
console.log('       260HUB DATABASE')
console.log('================================')
console.log('Users: READY')
console.log('Profiles: READY')
console.log('Tournaments: READY')
console.log('Participants: READY')
console.log('Admin Logs: READY')
console.log('Site Content: READY')
console.log('Change Proposals: READY')
console.log('================================')
console.log('User Roles: READY')
console.log('Message Reports: READY')
console.log('')

module.exports = db
