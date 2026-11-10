
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Trophy,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Gamepad2,
  Bell,
  Shield,
  Loader2,
  ShieldCheck,
  Newspaper,
  Activity
} from 'lucide-react'

const API = 'http://localhost:3000/api'
const TOKEN_KEY = '260hub_token'

const translations = {
  ru: {
    dashboard: 'Главная',
    players: 'Игроки',
    messages: 'Сообщения',
    tournaments: 'Турниры',
    profile: 'Профиль',
    settings: 'Настройки',
    admin: 'Администратор',
    logout: 'Выйти',
    welcome: 'Добро пожаловать в 260HUB',
    subtitle: 'Твоя игровая площадка. Найди команду и играй вместе.',
    search: 'Поиск игроков...',
    login: 'Войти',
    register: 'Регистрация',
    email: 'Электронная почта',
    password: 'Пароль',
    username: 'Никнейм',
    noPlayers: 'Игроки пока не найдены',
    loading: 'Загрузка...',
    language: 'Язык',
    online: 'Игровое сообщество',
    findPlayers: 'Найти игроков',
    totalPlayers: 'Игроки',
    popularGames: 'Популярные игры',
    comingSoon: 'Этот раздел скоро появится.',
    authError: 'Не удалось выполнить запрос',
    adminTitle: 'Панель администратора',
    adminSubtitle: 'Центр управления платформой 260HUB',
    adminWelcome: 'Добро пожаловать в панель администратора',
    adminPlayers: 'Управление игроками',
    adminPlayersDesc: 'Поиск, блокировка и разблокировка аккаунтов.',
    adminTournaments: 'Управление турнирами',
    adminTournamentsDesc: 'Создание, редактирование и управление турнирами.',
    adminContent: 'Управление контентом',
    adminContentDesc: 'Новости, объявления и правила платформы.',
    adminProposals: 'Предложения игроков',
    adminProposalsDesc: 'Рассмотрение предложений пользователей.',
    adminLogs: 'Журнал действий',
    adminLogsDesc: 'История действий администрации.',
    adminStats: 'Статистика платформы',
    adminStatsDesc: 'Общая информация о состоянии 260HUB.',
    adminOnly: 'У вас нет доступа к этой странице.',
    member: '260HUB Member',
    administrator: '260HUB Administrator'
  },

  en: {
    dashboard: 'Dashboard',
    players: 'Players',
    messages: 'Messages',
    tournaments: 'Tournaments',
    profile: 'Profile',
    settings: 'Settings',
    admin: 'Administrator',
    logout: 'Log out',
    welcome: 'Welcome to 260HUB',
    subtitle: 'Your gaming platform. Find a team and play together.',
    search: 'Search players...',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    noPlayers: 'No players found',
    loading: 'Loading...',
    language: 'Language',
    online: 'Gaming community',
    findPlayers: 'Find players',
    totalPlayers: 'Players',
    popularGames: 'Popular games',
    comingSoon: 'This section is coming soon.',
    authError: 'Request failed',
    adminTitle: 'Admin Panel',
    adminSubtitle: '260HUB platform control center',
    adminWelcome: 'Welcome to the admin panel',
    adminPlayers: 'Player Management',
    adminPlayersDesc: 'Search, ban and unban accounts.',
    adminTournaments: 'Tournament Management',
    adminTournamentsDesc: 'Create, edit and manage tournaments.',
    adminContent: 'Content Management',
    adminContentDesc: 'News, announcements and platform rules.',
    adminProposals: 'Player Proposals',
    adminProposalsDesc: 'Review user-submitted proposals.',
    adminLogs: 'Action Logs',
    adminLogsDesc: 'History of administrator actions.',
    adminStats: 'Platform Statistics',
    adminStatsDesc: 'General information about 260HUB.',
    adminOnly: 'You do not have access to this page.',
    member: '260HUB Member',
    administrator: '260HUB Administrator'
  },

  uz: {
    dashboard: 'Bosh sahifa',
    players: 'O‘yinchilar',
    messages: 'Xabarlar',
    tournaments: 'Turnirlar',
    profile: 'Profil',
    settings: 'Sozlamalar',
    admin: 'Administrator',
    logout: 'Chiqish',
    welcome: '260HUB ga xush kelibsiz',
    subtitle: 'O‘yin platformangiz. Jamoa toping va birga o‘ynang.',
    search: 'O‘yinchilarni qidirish...',
    login: 'Kirish',
    register: 'Ro‘yxatdan o‘tish',
    email: 'Elektron pochta',
    password: 'Parol',
    username: 'Nikneyim',
    noPlayers: 'O‘yinchilar topilmadi',
    loading: 'Yuklanmoqda...',
    language: 'Til',
    online: 'O‘yinchilar hamjamiyati',
    findPlayers: 'O‘yinchilarni topish',
    totalPlayers: 'O‘yinchilar',
    popularGames: 'Mashhur o‘yinlar',
    comingSoon: 'Bu bo‘lim tez orada paydo bo‘ladi.',
    authError: 'So‘rov bajarilmadi',
    adminTitle: 'Admin paneli',
    adminSubtitle: '260HUB platformasini boshqarish',
    adminWelcome: 'Admin paneliga xush kelibsiz',
    adminPlayers: 'O‘yinchilarni boshqarish',
    adminPlayersDesc: 'Hisoblarni qidirish, bloklash va blokdan chiqarish.',
    adminTournaments: 'Turnirlarni boshqarish',
    adminTournamentsDesc: 'Turnirlarni yaratish va tahrirlash.',
    adminContent: 'Kontentni boshqarish',
    adminContentDesc: 'Yangiliklar, e’lonlar va platforma qoidalari.',
    adminProposals: 'O‘yinchilar takliflari',
    adminProposalsDesc: 'Foydalanuvchilar takliflarini ko‘rib chiqish.',
    adminLogs: 'Harakatlar jurnali',
    adminLogsDesc: 'Administratorlar harakatlari tarixi.',
    adminStats: 'Platforma statistikasi',
    adminStatsDesc: '260HUB platformasi haqida umumiy ma’lumot.',
    adminOnly: 'Sizda ushbu sahifaga kirish huquqi yo‘q.',
    member: '260HUB Member',
    administrator: '260HUB Administrator'
  }
}

const games = [
  'Counter-Strike 2',
  'Valorant',
  'Standoff 2',
  'Minecraft',
  'Fortnite',
  'PUBG',
  'Dota 2',
  'Roblox'
]

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `HTTP ${response.status}`
    )
  }

  return data
}

export default function App() {
  const [language, setLanguage] = useState('ru')
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState('')

  const t = translations[language]
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    apiRequest('/auth/me')
      .then(data => {
        const currentUser = data.user || data
        setUser(currentUser)

        if (currentUser.role !== 'admin' && activePage === 'admin') {
          setActivePage('dashboard')
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user && activePage === 'players') {
      loadPlayers()
    }
  }, [user, activePage])

  async function loadPlayers() {
    try {
      const data = await apiRequest('/players')
      setPlayers(Array.isArray(data) ? data : data.players || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAuth(event) {
    event.preventDefault()
    setError('')
    setAuthLoading(true)

    const form = new FormData(event.currentTarget)

    const payload = {
      email: form.get('email'),
      password: form.get('password')
    }

    if (authMode === 'register') {
      payload.username = form.get('username')
    }

    try {
      const data = await apiRequest(
        authMode === 'login' ? '/auth/login' : '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )

      const token = data.token || data.accessToken

      if (!token) {
        throw new Error('Сервер не вернул токен авторизации')
      }

      localStorage.setItem(TOKEN_KEY, token)

      const currentUser = data.user || data
      setUser(currentUser)
      setActivePage('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setActivePage('dashboard')
    setMobileMenu(false)
    setError('')
  }

  function navigate(page) {
    if (page === 'admin' && !isAdmin) {
      setActivePage('dashboard')
      return
    }

    setActivePage(page)
    setMobileMenu(false)
    setError('')
  }

  const navigation = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'players', label: t.players, icon: Users },
    { id: 'messages', label: t.messages, icon: MessageCircle },
    { id: 'tournaments', label: t.tournaments, icon: Trophy },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'settings', label: t.settings, icon: Settings },

    ...(isAdmin
      ? [{ id: 'admin', label: t.admin, icon: ShieldCheck }]
      : [])
  ]

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <Loader2 className="spin" size={36} />
          <p>{t.loading}</p>
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>

        <div className="auth-screen">
          <div className="auth-card">
            <div className="brand">
              <Gamepad2 size={30} />
              <span>
                260<span className="accent">HUB</span>
              </span>
            </div>

            <p className="muted">{t.online}</p>

            <h1>
              {authMode === 'login' ? t.login : t.register}
            </h1>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <label>
                  {t.username}
                  <input
                    name="username"
                    required
                    minLength={3}
                  />
                </label>
              )}

              <label>
                {t.email}
                <input
                  name="email"
                  type="email"
                  required
                />
              </label>

              <label>
                {t.password}
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                />
              </label>

              {error && (
                <div className="error">{error}</div>
              )}

              <button
                className="primary-button"
                disabled={authLoading}
              >
                {authLoading
                  ? t.loading
                  : authMode === 'login'
                    ? t.login
                    : t.register}
              </button>
            </form>

            <button
              className="switch-auth"
              onClick={() => {
                setAuthMode(
                  authMode === 'login' ? 'register' : 'login'
                )
                setError('')
              }}
            >
              {authMode === 'login'
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>

            <div className="language-switch">
              {['ru', 'en', 'uz'].map(lang => (
                <button
                  key={lang}
                  className={language === lang ? 'selected' : ''}
                  onClick={() => setLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  const filteredPlayers = players.filter(player =>
    (player.username || player.nickname || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <>
      <style>{styles}</style>

      <div className="app">
        {mobileMenu && (
          <div
            className="mobile-overlay"
            onClick={() => setMobileMenu(false)}
          />
        )}

        <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
          <div className="brand">
            <Gamepad2 size={28} />

            <span>
              260<span className="accent">HUB</span>
            </span>

            <button
              className="close-menu"
              onClick={() => setMobileMenu(false)}
            >
              <X />
            </button>
          </div>

          <p className="nav-heading">MENU</p>

          <nav>
            {navigation.map(item => {
              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  className={`nav-item ${
                    activePage === item.id ? 'active' : ''
                  } ${item.id === 'admin' ? 'admin-nav-item' : ''}`}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="sidebar-bottom">
            <div className="user-mini">
              <div className="avatar">
                {(user.username || 'U')[0].toUpperCase()}
              </div>

              <div className="user-info">
                <strong>{user.username || 'Player'}</strong>

                <span>
                  {isAdmin ? t.administrator : t.member}
                </span>
              </div>
            </div>

            <button
              className="nav-item logout"
              onClick={logout}
            >
              <LogOut size={19} />
              <span>{t.logout}</span>
            </button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <button
              className="menu-button"
              onClick={() => setMobileMenu(true)}
            >
              <Menu />
            </button>

            <div className="breadcrumb">
              260HUB / {t[activePage] || t.dashboard}
            </div>

            <div className="top-actions">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="ru">RU</option>
                <option value="en">EN</option>
                <option value="uz">UZ</option>
              </select>

              <button className="icon-button">
                <Bell size={19} />
              </button>

              <div className="avatar small">
                {(user.username || 'U')[0].toUpperCase()}
              </div>
            </div>
          </header>

          <div className="content">

            {/* DASHBOARD */}

            {activePage === 'dashboard' && (
              <>
                <section className="hero">
                  <div>
                    <span className="eyebrow">
                      YOUR GAMING COMMUNITY
                    </span>

                    <h1>{t.welcome}</h1>

                    <p>{t.subtitle}</p>

                    <button
                      className="primary-button hero-button"
                      onClick={() => navigate('players')}
                    >
                      <Users size={18} />
                      {t.findPlayers}
                    </button>
                  </div>

                  <div className="hero-icon">
                    <Gamepad2 size={100} />
                  </div>
                </section>

                <div className="stats-grid">
                  <div className="stat-card">
                    <Users size={24} />
                    <span>{t.totalPlayers}</span>
                    <strong>260HUB</strong>
                  </div>

                  <div className="stat-card">
                    <Trophy size={24} />
                    <span>{t.tournaments}</span>
                    <strong>Coming soon</strong>
                  </div>

                  <div className="stat-card">
                    <Shield size={24} />
                    <span>{t.online}</span>
                    <strong>ONLINE</strong>
                  </div>
                </div>

                <section className="section">
                  <h2>{t.popularGames}</h2>

                  <div className="games-grid">
                    {games.map(game => (
                      <div className="game-card" key={game}>
                        <Gamepad2 size={23} />
                        <span>{game}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* PLAYERS */}

            {activePage === 'players' && (
              <section className="section">
                <div className="section-title">
                  <div>
                    <h1>{t.players}</h1>
                    <p className="muted">{t.findPlayers}</p>
                  </div>

                  <button
                    className="icon-button"
                    onClick={loadPlayers}
                  >
                    <Search size={19} />
                  </button>
                </div>

                <div className="search-box">
                  <Search size={19} />

                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t.search}
                  />
                </div>

                {error && (
                  <div className="error">{error}</div>
                )}

                <div className="players-grid">
                  {filteredPlayers.map((player, index) => (
                    <div
                      className="player-card"
                      key={player.id || index}
                    >
                      <div className="avatar">
                        {(player.username || player.nickname || 'P')[0]
                          .toUpperCase()}
                      </div>

                      <strong>
                        {player.username || player.nickname || 'Player'}
                      </strong>

                      <span>
                        {player.favorite_game || 'Game not selected'}
                      </span>
                    </div>
                  ))}
                </div>

                {filteredPlayers.length === 0 && (
                  <p className="empty">{t.noPlayers}</p>
                )}
              </section>
            )}

            {/* PROFILE */}

            {activePage === 'profile' && (
              <section className="section">
                <h1>{t.profile}</h1>

                <div className="profile-card">
                  <div className="avatar large">
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>

                  <h2>{user.username || 'Player'}</h2>
                  <p>{user.email}</p>

                  <span className="profile-tag">
                    {isAdmin ? '260HUB ADMIN' : '260HUB MEMBER'}
                  </span>
                </div>
              </section>
            )}

            {/* SETTINGS */}

            {activePage === 'settings' && (
              <section className="section">
                <h1>{t.settings}</h1>

                <div className="settings-card">
                  <label>{t.language}</label>

                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="uz">O‘zbekcha</option>
                  </select>
                </div>
              </section>
            )}

            {/* ADMIN PANEL */}

            {activePage === 'admin' && (
              isAdmin ? (
                <section className="section admin-page">
                  <div className="admin-header">
                    <div>
                      <span className="eyebrow">
                        260HUB CONTROL CENTER
                      </span>

                      <h1>{t.adminTitle}</h1>
                      <p className="muted">{t.adminSubtitle}</p>
                    </div>

                    <div className="admin-icon">
                      <ShieldCheck size={38} />
                    </div>
                  </div>

                  <div className="admin-welcome">
                    <ShieldCheck size={28} />

                    <div>
                      <h2>{t.adminWelcome}</h2>
                      <p>
                        {user.username} · 260HUB ADMIN
                      </p>
                    </div>
                  </div>

                  <div className="admin-grid">
                    <button
                      className="admin-card"
                      onClick={() => navigate('players')}
                    >
                      <Users size={27} />
                      <h3>{t.adminPlayers}</h3>
                      <p>{t.adminPlayersDesc}</p>
                    </button>

                    <button
                      className="admin-card"
                      onClick={() => navigate('tournaments')}
                    >
                      <Trophy size={27} />
                      <h3>{t.adminTournaments}</h3>
                      <p>{t.adminTournamentsDesc}</p>
                    </button>

                    <button
                      className="admin-card"
                      onClick={() => setError('Раздел управления контентом пока не подключён к API.')}
                    >
                      <Newspaper size={27} />
                      <h3>{t.adminContent}</h3>
                      <p>{t.adminContentDesc}</p>
                    </button>

                    <button
                      className="admin-card"
                      onClick={() => setError('Раздел предложений пока не подключён к API.')}
                    >
                      <MessageCircle size={27} />
                      <h3>{t.adminProposals}</h3>
                      <p>{t.adminProposalsDesc}</p>
                    </button>

                    <button
                      className="admin-card"
                      onClick={() => setError('Журнал действий пока не подключён к API.')}
                    >
                      <Activity size={27} />
                      <h3>{t.adminLogs}</h3>
                      <p>{t.adminLogsDesc}</p>
                    </button>

                    <button
                      className="admin-card"
                      onClick={() => setError('Статистика пока не подключена к API.')}
                    >
                      <LayoutDashboard size={27} />
                      <h3>{t.adminStats}</h3>
                      <p>{t.adminStatsDesc}</p>
                    </button>
                  </div>

                  {error && (
                    <div className="error admin-error">
                      {error}
                    </div>
                  )}
                </section>
              ) : (
                <section className="section">
                  <div className="error">{t.adminOnly}</div>
                </section>
              )
            )}

            {/* MESSAGES AND TOURNAMENTS */}

            {['messages', 'tournaments'].includes(activePage) && (
              <section className="section coming-soon">
                {activePage === 'messages'
                  ? <MessageCircle size={48} />
                  : <Trophy size={48} />}

                <h1>{t[activePage]}</h1>
                <p>{t.comingSoon}</p>
              </section>
            )}

          </div>
        </main>
      </div>
    </>
  )
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #090b13;
  color: #f4f5fa;
  font-family: Inter, sans-serif;
}

button, input, select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  min-height: 100vh;
  display: flex;
}

.accent {
  color: #8b5cf6;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -1px;
}

.brand svg {
  color: #a78bfa;
}

.sidebar {
  width: 250px;
  background: #10121d;
  border-right: 1px solid #222536;
  padding: 26px 18px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.nav-heading {
  color: #666d84;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin: 45px 12px 15px;
}

.sidebar nav {
  display: grid;
  gap: 7px;
}

.nav-item {
  border: 0;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 14px;
  color: #9298ad;
  background: transparent;
  border-radius: 10px;
  text-align: left;
  transition: .2s;
}

.nav-item:hover,
.nav-item.active {
  color: white;
  background: #252039;
}

.nav-item.active {
  box-shadow: inset 3px 0 #9b75ff;
}

.admin-nav-item {
  color: #b6a0ff;
  background: #1d1930;
  border: 1px solid #39305a;
}

.admin-nav-item:hover,
.admin-nav-item.active {
  color: white;
  background: #30234f;
}

.sidebar-bottom {
  margin-top: auto;
}

.user-mini {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 17px 5px;
  border-top: 1px solid #292b3b;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: linear-gradient(135deg,#7250d8,#3d2a79);
  color: white;
  font-weight: 800;
}

.avatar.small {
  width: 35px;
  height: 35px;
  border-radius: 50%;
}

.avatar.large {
  width: 85px;
  height: 85px;
  border-radius: 25px;
  font-size: 30px;
  margin: auto;
}

.user-info {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.user-info strong {
  font-size: 13px;
}

.user-info span {
  font-size: 11px;
  color: #a78bfa;
}

.logout {
  color: #ef818b;
}

.main {
  flex: 1;
  min-width: 0;
}

.topbar {
  height: 76px;
  border-bottom: 1px solid #222536;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 35px;
}

.breadcrumb {
  color: #969bb0;
  font-size: 13px;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 17px;
}

.top-actions select,
.settings-card select {
  background: #171a28;
  border: 1px solid #303348;
  color: white;
  border-radius: 8px;
  padding: 9px;
}

.icon-button {
  border: 1px solid #303348;
  color: #c5c8d5;
  background: #171a28;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  place-items: center;
}

.content {
  padding: 38px;
  max-width: 1450px;
  margin: auto;
}

.hero {
  min-height: 270px;
  padding: 42px;
  border: 1px solid #40336d;
  border-radius: 20px;
  background: radial-gradient(circle at 80% 50%,#39265e 0,#201a37 35%,#171726 75%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
}

.eyebrow {
  color: #b6a0ff;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 700;
}

.hero h1 {
  font-size: clamp(25px,4vw,39px);
  margin: 16px 0 10px;
}

.hero p,
.muted {
  color: #9298ad;
  line-height: 1.7;
}

.hero-icon {
  color: #a78bfa;
  opacity: .7;
  padding: 25px;
}

.primary-button {
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg,#8b5cf6,#6541cf);
  color: white;
  padding: 13px 18px;
  font-weight: 700;
  transition: .2s;
}

.primary-button:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
}

.primary-button:disabled {
  opacity: .6;
  cursor: wait;
}

.hero-button {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 23px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 18px;
  margin: 25px 0 40px;
}

.stat-card {
  background: #121522;
  border: 1px solid #262a3b;
  border-radius: 15px;
  padding: 23px;
  display: grid;
  gap: 13px;
}

.stat-card svg {
  color: #a78bfa;
}

.stat-card span {
  color: #9298ad;
  font-size: 13px;
}

.stat-card strong {
  font-size: 19px;
}

.section {
  margin-top: 28px;
}

.section h1 {
  font-size: 28px;
}

.section h2 {
  font-size: 20px;
  margin-bottom: 18px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 13px;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 19px;
  border-radius: 13px;
  background: #121522;
  border: 1px solid #262a3b;
  color: #c5c8d5;
  font-size: 13px;
  transition: .2s;
}

.game-card:hover,
.player-card:hover {
  border-color: #8b5cf6;
  transform: translateY(-2px);
}

.game-card svg {
  color: #a78bfa;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin: 25px 0;
  border: 1px solid #303348;
  border-radius: 11px;
  background: #121522;
  color: #858ba0;
}

.search-box input {
  background: transparent;
  border: 0;
  outline: 0;
  color: white;
  width: 100%;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 15px;
}

.player-card {
  background: #121522;
  border: 1px solid #262a3b;
  border-radius: 14px;
  padding: 22px;
  display: grid;
  justify-items: center;
  gap: 12px;
  transition: .2s;
}

.player-card span,
.empty {
  color: #858ba0;
  font-size: 13px;
}

.profile-card {
  max-width: 420px;
  text-align: center;
  background: #121522;
  border: 1px solid #262a3b;
  border-radius: 17px;
  padding: 35px;
  margin-top: 25px;
}

.profile-card p {
  color: #9298ad;
}

.profile-tag {
  display: inline-block;
  background: #292044;
  color: #b9a4ff;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 10px;
  letter-spacing: 1px;
}

.settings-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 500px;
  background: #121522;
  border: 1px solid #262a3b;
  border-radius: 14px;
  padding: 20px;
  margin-top: 25px;
}

.coming-soon {
  min-height: 350px;
  display: grid;
  place-content: center;
  justify-items: center;
  color: #a78bfa;
}

.coming-soon p {
  color: #9298ad;
}

/* ADMIN PANEL */

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 30px;
  border: 1px solid #40336d;
  border-radius: 17px;
  background: linear-gradient(120deg,#201a37,#171726);
}

.admin-header h1 {
  margin: 13px 0 5px;
}

.admin-icon {
  width: 75px;
  height: 75px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #b6a0ff;
  background: #30234f;
  border-radius: 18px;
}

.admin-welcome {
  display: flex;
  align-items: center;
  gap: 17px;
  padding: 22px;
  margin-top: 22px;
  background: #171a28;
  border: 1px solid #303348;
  border-radius: 14px;
  color: #a78bfa;
}

.admin-welcome h2 {
  color: white;
  font-size: 17px;
  margin: 0 0 7px;
}

.admin-welcome p {
  color: #9298ad;
  font-size: 13px;
  margin: 0;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 17px;
  margin-top: 22px;
}

.admin-card {
  width: 100%;
  text-align: left;
  padding: 25px;
  background: #121522;
  border: 1px solid #262a3b;
  border-radius: 15px;
  color: white;
  transition: .2s;
}

.admin-card:hover {
  border-color: #8b5cf6;
  background: #171528;
  transform: translateY(-3px);
}

.admin-card svg {
  color: #a78bfa;
}

.admin-card h3 {
  margin: 17px 0 8px;
  font-size: 16px;
}

.admin-card p {
  color: #9298ad;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 0;
}

.admin-error {
  margin-top: 20px;
}

/* AUTH */

.auth-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: radial-gradient(circle at top,#21183e,#090b13 60%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 35px;
  background: #121522;
  border: 1px solid #303348;
  border-radius: 19px;
}

.auth-card .brand {
  justify-content: center;
  margin-bottom: 15px;
}

.auth-card > .muted {
  text-align: center;
  font-size: 13px;
}

.auth-card h1 {
  text-align: center;
  margin: 25px 0;
}

.auth-card form {
  display: grid;
  gap: 17px;
}

.auth-card label {
  display: grid;
  gap: 8px;
  color: #c5c8d5;
  font-size: 13px;
}

.auth-card input {
  width: 100%;
  padding: 13px;
  color: white;
  background: #090c17;
  border: 1px solid #303348;
  border-radius: 9px;
  outline: none;
}

.auth-card input:focus {
  border-color: #8b5cf6;
}

.auth-card form .primary-button {
  margin-top: 5px;
}

.switch-auth {
  width: 100%;
  margin-top: 20px;
  background: transparent;
  border: 0;
  color: #b6a0ff;
  font-size: 13px;
}

.language-switch {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

.language-switch button {
  color: #858ba0;
  background: transparent;
  border: 0;
}

.language-switch button.selected {
  color: #b6a0ff;
  font-weight: 800;
}

.error {
  color: #ff8995;
  background: #351b27;
  border: 1px solid #69303e;
  border-radius: 9px;
  padding: 12px;
  font-size: 13px;
}

.loading-screen {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 15px;
  background: #090b13;
  color: #a78bfa;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.menu-button,
.close-menu {
  display: none;
}

.mobile-overlay {
  display: none;
}

/* RESPONSIVE */

@media(max-width: 950px) {
  .games-grid {
    grid-template-columns: repeat(2,1fr);
  }

  .players-grid {
    grid-template-columns: repeat(2,1fr);
  }
}

@media(max-width: 700px) {
  .sidebar {
    position: fixed;
    z-index: 20;
    inset: 0 auto 0 0;
    transform: translateX(-100%);
    transition: .25s;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 19;
    background: #0009;
  }

  .menu-button,
  .close-menu {
    display: grid;
    place-items: center;
    color: white;
    background: transparent;
    border: 0;
  }

  .close-menu {
    margin-left: auto;
  }

  .topbar {
    padding: 0 16px;
    height: 65px;
    gap: 12px;
  }

  .content {
    padding: 20px 15px;
  }

  .hero {
    padding: 25px;
  }

  .hero-icon {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .games-grid,
  .players-grid {
    grid-template-columns: 1fr;
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }

  .admin-header {
    padding: 22px;
  }

  .breadcrumb {
    font-size: 11px;
  }
}

