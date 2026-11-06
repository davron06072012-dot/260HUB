import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, Users, MessageCircle, Trophy, User, Settings,
  LogOut, Menu, X, Search, Send, Gamepad2, Plus, ChevronRight,
  Shield, Bell, RefreshCw, Save, ArrowLeft, Globe, Lock, Mail,
  UserRound, Loader2, UserPlus, Check, MessageSquare
} from 'lucide-react'

const API = 'http://localhost:3000/api'
const TOKEN_KEY = '260hub_token'

const GAMES = ['Standoff 2', 'Counter-Strike 2', 'Brawl Stars']

const translations = {
  ru: {
    dashboard: 'Главная', players: 'Игроки', messages: 'Сообщения',
    tournaments: 'Турниры', profile: 'Мой профиль', settings: 'Настройки',
    logout: 'Выйти', welcome: 'Добро пожаловать в 260HUB',
    subtitle: 'Найди команду. Играй вместе. Побеждай вместе.',
    findPlayers: 'Найти игроков', popularGames: 'Доступные игры',
    searchPlayers: 'Поиск игроков...', allGames: 'Все игры',
    noPlayers: 'Игроки не найдены', noBio: 'Игрок пока не добавил описание.',
    favoriteGame: 'Любимая игра', bio: 'О себе',
    save: 'Сохранить изменения', editProfile: 'Редактировать профиль',
    createTeam: 'Создать команду', teamName: 'Название команды',
    cancel: 'Отмена', create: 'Создать', comingSoon: 'Скоро',
    tournamentsText: 'Раздел турниров находится в разработке.',
    login: 'Войти', register: 'Регистрация', username: 'Никнейм',
    email: 'Электронная почта', password: 'Пароль',
    loginPlaceholder: 'Никнейм или почта', noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?', send: 'Отправить',
    typeMessage: 'Напишите сообщение...', selectChat: 'Выберите диалог',
    selectChatText: 'Выберите игрока, чтобы начать переписку.',
    noConversations: 'Пока нет диалогов', startConversation: 'Найдите игрока и начните общение.',
    loading: 'Загрузка...', language: 'Язык', authRequired: 'Сначала войдите в аккаунт.',
    noMessages: 'Сообщений пока нет. Напишите первым!',
    addFriend: 'Добавить в друзья', friends: 'В друзьях',
    requestSent: 'Заявка отправлена', incomingRequests: 'Заявки в друзья',
    accept: 'Принять', reject: 'Отклонить', noRequests: 'Новых заявок нет',
    message: 'Написать', profileUpdated: 'Профиль обновлён.',
    refresh: 'Обновить', error: 'Произошла ошибка.',
    teamEmpty: 'Вы пока не создали команду.'
  },
  en: {
    dashboard: 'Dashboard', players: 'Players', messages: 'Messages',
    tournaments: 'Tournaments', profile: 'My Profile', settings: 'Settings',
    logout: 'Log out', welcome: 'Welcome to 260HUB',
    subtitle: 'Find your team. Play together. Win together.',
    findPlayers: 'Find players', popularGames: 'Available games',
    searchPlayers: 'Search players...', allGames: 'All games',
    noPlayers: 'No players found', noBio: 'No description added.',
    favoriteGame: 'Favorite game', bio: 'About me',
    save: 'Save changes', editProfile: 'Edit profile',
    createTeam: 'Create team', teamName: 'Team name',
    cancel: 'Cancel', create: 'Create', comingSoon: 'Coming soon',
    tournamentsText: 'Tournament features are being prepared.',
    login: 'Log in', register: 'Register', username: 'Username',
    email: 'Email', password: 'Password', loginPlaceholder: 'Username or email',
    noAccount: "Don't have an account?", haveAccount: 'Already have an account?',
    send: 'Send', typeMessage: 'Write a message...', selectChat: 'Select a conversation',
    selectChatText: 'Choose a player to start chatting.',
    noConversations: 'No conversations yet', startConversation: 'Find a player and start chatting.',
    loading: 'Loading...', language: 'Language', authRequired: 'Please log in first.',
    noMessages: 'No messages yet. Say hello!', addFriend: 'Add friend',
    friends: 'Friends', requestSent: 'Request sent', incomingRequests: 'Friend requests',
    accept: 'Accept', reject: 'Decline', noRequests: 'No new requests',
    message: 'Message', profileUpdated: 'Profile updated.',
    refresh: 'Refresh', error: 'Something went wrong.',
    teamEmpty: 'You have not created a team yet.'
  },
  uz: {
    dashboard: 'Bosh sahifa', players: 'O‘yinchilar', messages: 'Xabarlar',
    tournaments: 'Turnirlar', profile: 'Profilim', settings: 'Sozlamalar',
    logout: 'Chiqish', welcome: '260HUB ga xush kelibsiz',
    subtitle: 'Jamoangizni toping. Birga o‘ynang. G‘alaba qiling.',
    findPlayers: 'O‘yinchilarni topish', popularGames: 'Mavjud o‘yinlar',
    searchPlayers: 'O‘yinchilarni qidirish...', allGames: 'Barcha o‘yinlar',
    noPlayers: 'O‘yinchilar topilmadi', noBio: 'Tavsif mavjud emas.',
    favoriteGame: 'Sevimli o‘yin', bio: 'Men haqimda',
    save: 'Saqlash', editProfile: 'Profilni tahrirlash',
    createTeam: 'Jamoa yaratish', teamName: 'Jamoa nomi',
    cancel: 'Bekor qilish', create: 'Yaratish', comingSoon: 'Tez orada',
    tournamentsText: 'Turnirlar bo‘limi tayyorlanmoqda.',
    login: 'Kirish', register: 'Ro‘yxatdan o‘tish', username: 'Username',
    email: 'Email', password: 'Parol', loginPlaceholder: 'Login yoki email',
    noAccount: 'Hisobingiz yo‘qmi?', haveAccount: 'Hisobingiz bormi?',
    send: 'Yuborish', typeMessage: 'Xabar yozing...', selectChat: 'Suhbatni tanlang',
    selectChatText: 'Suhbatni boshlash uchun o‘yinchini tanlang.',
    noConversations: 'Hozircha suhbatlar yo‘q', startConversation: 'O‘yinchini toping va suhbatni boshlang.',
    loading: 'Yuklanmoqda...', language: 'Til', authRequired: 'Avval hisobingizga kiring.',
    noMessages: 'Hali xabarlar yo‘q.', addFriend: 'Do‘stlarga qo‘shish',
    friends: 'Do‘stlar', requestSent: 'So‘rov yuborildi', incomingRequests: 'Do‘stlik so‘rovlari',
    accept: 'Qabul qilish', reject: 'Rad etish', noRequests: 'Yangi so‘rovlar yo‘q',
    message: 'Xabar yozish', profileUpdated: 'Profil yangilandi.',
    refresh: 'Yangilash', error: 'Xatolik yuz berdi.',
    teamEmpty: 'Siz hali jamoa yaratmagansiz.'
  }
}

function token() {
  return localStorage.getItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers
    }
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data
}

function Avatar({ name, size = 'md' }) {
  const dimensions = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-3xl'
  }

  return (
    <div className={`${dimensions[size]} shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-white font-black`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function Heading({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div>
        <h1 className="text-3xl font-black text-white">{title}</h1>
        {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function PlayerCard({ player, currentUser, t, onMessage, isFriend, requestSent, onFriend }) {
  const isSelf = Number(currentUser?.id) === Number(player.id)

  return (
    <div className="bg-[#151517] border border-white/[0.08] hover:border-orange-500/30 rounded-[22px] p-6 transition-all">
      <div className="flex items-center gap-3">
        <Avatar name={player.username} />
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-lg truncate">{player.username}</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {player.favorite_game || 'No game selected'}
          </p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
      </div>

      <p className="text-sm text-zinc-500 mt-5 mb-6 min-h-5">
        {player.bio || t.noBio}
      </p>

      {!isSelf && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onFriend(player.id)}
            disabled={isFriend || requestSent}
            className={`min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              isFriend
                ? 'bg-[#202023] text-green-400 border border-green-500/30 cursor-default'
                : requestSent
                  ? 'bg-[#202023] text-blue-400 border border-blue-500/30 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15'
            }`}
          >
            {isFriend ? <Check size={17} /> : <UserPlus size={17} />}
            <span className="truncate">{isFriend ? t.friends : requestSent ? t.requestSent : t.addFriend}</span>
          </button>

          <button
            onClick={() => onMessage(player)}
            className="min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 text-sm font-bold transition-all"
          >
            <MessageCircle size={17} />
            <span>{t.message}</span>
          </button>
        </div>
      )}

      {isSelf && (
        <div className="w-full min-h-[48px] rounded-xl bg-white/[0.05] text-zinc-500 flex items-center justify-center gap-2 text-sm font-bold">
          <User size={17} /> {t.profile}
        </div>
      )}
    </div>
  )
}

function App() {
  const [lang, setLang] = useState('ru')
  const t = translations[lang]

  const [page, setPage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [login, setLogin] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [players, setPlayers] = useState([])
  const [playersLoading, setPlayersLoading] = useState(false)
  const [playersError, setPlayersError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState('all')

  const [friends, setFriends] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [friendNotice, setFriendNotice] = useState('')
  const previousIncomingIds = useRef(new Set())

  const [conversations, setConversations] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  const [profileBio, setProfileBio] = useState('')
  const [profileGame, setProfileGame] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState('')

  const [team, setTeam] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [teamModal, setTeamModal] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const bottomRef = useRef(null)

  const navigation = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'players', label: t.players, icon: Users },
    { id: 'messages', label: t.messages, icon: MessageCircle },
    { id: 'tournaments', label: t.tournaments, icon: Trophy }
  ]

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true)
    setPlayersError('')

    try {
      const data = await request('/players')
      setPlayers(Array.isArray(data) ? data : data.players || data.users || [])
    } catch (error) {
      setPlayersError(error.message)
    } finally {
      setPlayersLoading(false)
    }
  }, [])

  const loadConversations = useCallback(async () => {
        if (!token()) return
    try {
      const data = await request('/messages/conversations')
      setConversations(data.conversations || [])
    } catch (error) {
      console.error(error)
    }
  }, [])

  const loadFriendData = useCallback(async (showNewNotice = false) => {
    if (!token()) {
      setFriends([])
      setIncomingRequests([])
      setOutgoingRequests([])
      previousIncomingIds.current = new Set()
      return
    }

    try {
      const [friendsData, requestsData] = await Promise.all([
        request('/friends'),
        request('/friends/requests')
      ])

      const incoming = requestsData.incoming || []
      const currentIds = new Set(incoming.map(item => Number(item.id)))

      if (showNewNotice) {
        const newRequest = incoming.find(item => !previousIncomingIds.current.has(Number(item.id)))
        if (newRequest) {
          setFriendNotice(`${newRequest.username} хочет добавить вас в друзья.`)
        }
      }

      previousIncomingIds.current = currentIds
      setFriends((friendsData.friends || []).map(friend => Number(friend.id)))
      setIncomingRequests(incoming)
      setOutgoingRequests(requestsData.outgoing || [])
    } catch (error) {
      console.error('Friend data loading error:', error)
    }
  }, [])

  const loadChat = useCallback(async (id, silent = false) => {
    if (!id) return
    if (!silent) setChatLoading(true)

    try {
      const data = await request(`/messages/${id}`)
      setChatUser(data.user)
      setChatMessages(data.messages || [])
      setChatError('')
    } catch (error) {
      setChatError(error.message)
    } finally {
      if (!silent) setChatLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function restore() {
      if (!token()) {
        setChecking(false)
        return
      }

      try {
        const data = await request('/auth/me')
        if (active) {
          const restoredUser = data.user || data
          setUser(restoredUser)
          setProfileBio(restoredUser.bio || '')
          setProfileGame(restoredUser.favorite_game || '')
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
      } finally {
        if (active) setChecking(false)
      }
    }

    restore()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (page === 'dashboard' || page === 'players') loadPlayers()
  }, [page, loadPlayers])

  useEffect(() => {
    if (page === 'messages' && user) loadConversations()
  }, [page, user, loadConversations])

  useEffect(() => {
    if (page !== 'messages' || !selectedChatId) return

    loadChat(selectedChatId, true)
    const interval = setInterval(() => {
      loadChat(selectedChatId, true)
      loadConversations()
    }, 5000)

    return () => clearInterval(interval)
  }, [page, selectedChatId, loadChat, loadConversations])

  useEffect(() => {
    if (!user) {
      setFriends([])
      setIncomingRequests([])
      setOutgoingRequests([])
      previousIncomingIds.current = new Set()
      return
    }

    loadFriendData(false)
    const interval = setInterval(() => loadFriendData(true), 5000)
    return () => clearInterval(interval)
  }, [user, loadFriendData])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function submitAuth(event) {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const registering = authMode === 'register'
      const data = await request(registering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(registering
          ? { username: username.trim(), email: email.trim(), password }
          : { login: login.trim(), password })
      })

      if (!data.token) throw new Error(data.message || 'Token not received')

      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      setProfileBio(data.user?.bio || '')
      setProfileGame(data.user?.favorite_game || '')
      previousIncomingIds.current = new Set()
      loadFriendData(false)
      setAuthOpen(false)
      setPassword('')
      loadPlayers()
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' })
    } catch {}

    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setConversations([])
    setFriends([])
    setIncomingRequests([])
    setOutgoingRequests([])
    previousIncomingIds.current = new Set()
    setChatMessages([])
    setSelectedChatId(null)
    setPage('dashboard')
  }

  async function toggleFriend(id) {
    if (!user) {
      setAuthOpen(true)
      return
    }

    try {
      const data = await request(`/friends/request/${id}`, { method: 'POST' })
      setFriendNotice(data.message || t.requestSent)
      await loadFriendData(false)
    } catch (error) {
      setFriendNotice(error.message)
    }
  }

  async function acceptFriendRequest(requestId) {
    try {
      const data = await request(`/friends/requests/${requestId}/accept`, { method: 'POST' })
      setFriendNotice(data.message || t.friends)
      await loadFriendData(false)
    } catch (error) {
      setFriendNotice(error.message)
    }
  }

  async function rejectFriendRequest(requestId) {
    try {
      const data = await request(`/friends/requests/${requestId}/reject`, { method: 'POST' })
      setFriendNotice(data.message || t.reject)
      await loadFriendData(false)
    } catch (error) {
      setFriendNotice(error.message)
    }
  }

  function openChat(player) {
    if (!user) {
      setAuthOpen(true)
      return
    }

    if (Number(player.id) === Number(user.id)) {
      setPage('profile')
      return
    }

    setSelectedChatId(Number(player.id))
    setChatUser(player)
    setChatMessages([])
    setMessageText('')
    setChatError('')
    setPage('messages')
    setMenuOpen(false)
    loadChat(Number(player.id))
  }

  async function sendMessage(event) {
    event.preventDefault()
    const body = messageText.trim()

    if (!body || !selectedChatId || sending) return

    setSending(true)
    setChatError('')

    try {
      const data = await request(`/messages/${selectedChatId}`, {
        method: 'POST',
        body: JSON.stringify({ body })
      })

      if (data.message) {
        setChatMessages(prev => [...prev, data.message])
      }

      setMessageText('')
      loadConversations()
    } catch (error) {
      setChatError(error.message)
    } finally {
      setSending(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setProfileSaving(true)
    setProfileNotice('')

    try {
      await request('/players/me', {
        method: 'PATCH',
        body: JSON.stringify({
          favorite_game: profileGame,
          bio: profileBio
        })
      })

      setUser(prev => ({
        ...prev,
        favorite_game: profileGame,
                bio: profileBio
      }))

      setProfileNotice(t.profileUpdated)
    } catch (error) {
      setProfileNotice(error.message)
    } finally {
      setProfileSaving(false)
    }
  }

  function createTeam(event) {
    event.preventDefault()
    if (!teamName.trim()) return
    setTeam({ name: teamName.trim() })
    setTeamName('')
    setTeamModal(false)
  }

  function changePage(id) {
    setPage(id)
    setMenuOpen(false)
    if (id !== 'messages') setSelectedChatId(null)
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = (player.username || '')
      .toLowerCase().includes(search.toLowerCase())

    const matchesGame = selectedGame === 'all' ||
      player.favorite_game === selectedGame

    return matchesSearch && matchesGame
  })

  const currentChatName = chatUser?.username ||
    conversations.find(item => Number(item.user_id) === Number(selectedChatId))?.username ||
    'Player'

  if (checking) {
    return (
      <div className="min-h-screen bg-[#09090A] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090A] text-white flex">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 bg-[#111113] border-r border-white/[0.06] flex flex-col transition-transform duration-300 ${
        menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-[82px] px-6 flex items-center justify-between border-b border-white/[0.06]">
          <button onClick={() => changePage('dashboard')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
              <Gamepad2 size={23} />
            </div>
            <div className="text-left">
              <div className="font-black text-xl">260<span className="text-orange-500">HUB</span></div>
              <div className="text-[9px] tracking-[3px] text-zinc-600 font-bold">FIND YOUR TEAM</div>
            </div>
          </button>
          <button onClick={() => setMenuOpen(false)} className="lg:hidden text-zinc-500">
            <X />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-600 px-3 mb-3">Menu</p>
          <nav className="space-y-1">
            {navigation.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => changePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
                    page === item.id
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                  {item.id === 'messages' && conversations.length > 0 && (
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="px-4 pt-8">
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-600 px-3 mb-3">Account</p>
          <button onClick={() => changePage('profile')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${
            page === 'profile' ? 'bg-orange-600' : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
          }`}>
            <User size={19} /> {t.profile}
          </button>
          <button onClick={() => changePage('settings')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${
            page === 'settings' ? 'bg-orange-600' : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
          }`}>
            <Settings size={19} /> {t.settings}
          </button>
        </div>

        <div className="mt-auto p-4">
          <div className="bg-[#1A1A1D] rounded-2xl p-4 border border-white/[0.05]">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={user.username} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user.username}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs font-bold">
                  <LogOut size={15} /> {t.logout}
                </button>
              </>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="w-full py-3 bg-orange-600 rounded-xl font-bold text-sm">
                {t.login}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0 flex-1">
        <header className="h-[82px] border-b border-white/[0.06] bg-[#09090A]/90 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-xl bg-[#1A1A1D] flex items-center justify-center">
              <Menu size={20} />
            </button>
            <div>
              <p className="font-bold">{navigation.find(item => item.id === page)?.label || (page === 'profile' ? t.profile : t.settings)}</p>
              <p className="text-[11px] text-zinc-600">260HUB / {page.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(value => !value)
                  if (!notificationsOpen) loadFriendData(false)
                }}
                className="w-10 h-10 rounded-xl bg-[#171719] flex items-center justify-center text-zinc-400 relative"
                aria-label={t.incomingRequests}
              >
                <Bell size={18} />
                {incomingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-[340px] max-w-[90vw] bg-[#18181B] border border-white/10 rounded-2xl p-4 z-50 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-sm">{t.incomingRequests}</p>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">{incomingRequests.length}</span>
                  </div>
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-5 text-center">{t.noRequests}</p>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto">
                      {incomingRequests.map(item => (
                        <div key={item.id} className="bg-[#242427] rounded-xl p-3">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar name={item.username} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm truncate">{item.username}</p>
                              <p className="text-xs text-zinc-500">{item.favorite_game || '260HUB'}</p>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 mb-3">{item.username} хочет добавить вас в друзья.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => acceptFriendRequest(item.id)} className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-xs font-bold">{t.accept}</button>
                            <button onClick={() => rejectFriendRequest(item.id)} className="bg-white/5 hover:bg-red-500/20 text-zinc-300 rounded-lg py-2 text-xs font-bold">{t.reject}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <select value={lang} onChange={e => setLang(e.target.value)} className="h-10 bg-[#171719] border border-white/[0.06] rounded-xl px-2 text-xs font-bold outline-none">
              <option value="ru">RU</option>
              <option value="en">EN</option>
              <option value="uz">UZ</option>
            </select>

            {user && (
              <button onClick={() => changePage('profile')} className="flex items-center gap-2">
                <Avatar name={user.username} size="sm" />
                <span className="hidden md:block text-sm font-bold">{user.username}</span>
              </button>
            )}
          </div>
        </header>

        {friendNotice && (
          <div className="fixed bottom-5 right-5 z-[120] max-w-sm bg-[#202023] border border-blue-500/30 text-white rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3">
            <Bell className="text-blue-400 shrink-0" size={18} />
            <p className="text-sm flex-1">{friendNotice}</p>
            <button onClick={() => setFriendNotice('')} className="text-zinc-500 hover:text-white"><X size={16} /></button>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-[1500px] mx-auto">

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <div className="space-y-8">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#351506] via-[#1D100B] to-[#111113] border border-orange-500/20 p-8 md:p-12">
                <div className="absolute -right-20 -top-28 w-96 h-96 bg-orange-600/15 blur-[100px] rounded-full" />
                <div className="relative max-w-2xl">
                  <span className="inline-flex bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider mb-6">
                    GAMING COMMUNITY
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black">{t.welcome}</h1>
                  <p className="text-zinc-400 mt-4">{t.subtitle}</p>
                  <button onClick={() => changePage('players')} className="mt-8 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold text-sm flex items-center gap-2">
                    {t.findPlayers} <ChevronRight size={17} />
                  </button>
                </div>
              </section>

              <section>
                <Heading title={t.popularGames} description="Choose your game and find teammates." />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {GAMES.map((game, index) => (
                    <button key={game} onClick={() => { setSelectedGame(game); changePage('players') }} className="text-left bg-[#151517] border border-white/[0.06] hover:border-orange-500/40 rounded-2xl p-5 transition">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center font-black text-lg mb-5">
                        {['SO2', 'CS2', 'BS'][index]}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-black">{game}</span>
                        <ChevronRight className="text-zinc-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <Heading title={t.players} action={<button onClick={() => changePage('players')} className="text-orange-500 text-sm font-bold">{t.findPlayers} →</button>} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {players.slice(0, 3).map(player => (
                    <PlayerCard key={player.id} player={player} currentUser={user} t={t} onMessage={openChat} isFriend={friends.includes(Number(player.id))} requestSent={outgoingRequests.some(item => Number(item.receiver_id) === Number(player.id))} onFriend={toggleFriend} />
                  ))}
                </div>
              </section>

              <section className="bg-[#151517] border border-white/[0.06] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg">{team?.name || t.createTeam}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{team ? 'Your team' : t.teamEmpty}</p>
                                  </div>
                <button onClick={() => setTeamModal(true)} className="bg-orange-600 hover:bg-orange-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus size={17} /> {t.createTeam}
                </button>
              </section>
            </div>
          )}

          {/* PLAYERS */}
          {page === 'players' && (
            <div>
              <Heading title={t.players} description="Find teammates for your favorite game." action={
                <button onClick={loadPlayers} className="p-3 rounded-xl bg-[#18181B] text-zinc-400 hover:text-white"><RefreshCw size={18} /></button>
              } />

              <div className="flex flex-col md:flex-row gap-3 mb-7">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlayers} className="w-full h-[60px] bg-[#151517] border border-white/[0.07] rounded-2xl pl-14 pr-4 outline-none focus:border-orange-500/50" />
                </div>
                <select value={selectedGame} onChange={e => setSelectedGame(e.target.value)} className="h-[60px] bg-[#151517] border border-white/[0.07] rounded-2xl px-4 outline-none">
                  <option value="all">{t.allGames}</option>
                  {GAMES.map(game => <option key={game} value={game}>{game}</option>)}
                </select>
              </div>

              {playersError && <p className="text-red-400 text-sm mb-4">{playersError}</p>}

              {playersLoading ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin text-orange-500 mx-auto" /></div>
              ) : filteredPlayers.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">{t.noPlayers}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} currentUser={user} t={t} onMessage={openChat} isFriend={friends.includes(Number(player.id))} requestSent={outgoingRequests.some(item => Number(item.receiver_id) === Number(player.id))} onFriend={toggleFriend} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES */}
          {page === 'messages' && (
            <div>
              <Heading title={t.messages} description="Your private conversations on 260HUB." />
              {!user ? (
                <div className="bg-[#151517] rounded-2xl p-10 text-center">
                  <p className="mb-4">{t.authRequired}</p>
                  <button onClick={() => setAuthOpen(true)} className="bg-orange-600 px-5 py-3 rounded-xl font-bold">{t.login}</button>
                </div>
              ) : (
                <div className="h-[calc(100vh-190px)] min-h-[500px] bg-[#121214] border border-white/[0.07] rounded-2xl overflow-hidden flex">
                  <div className={`w-full md:w-[320px] shrink-0 border-r border-white/[0.06] flex flex-col ${selectedChatId ? 'hidden md:flex' : ''}`}>
                    <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                      <div>
                        <h2 className="font-black">{t.messages}</h2>
                        <p className="text-xs text-zinc-600 mt-1">{conversations.length} conversations</p>
                      </div>
                      <button onClick={loadConversations} className="text-zinc-400"><RefreshCw size={17} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="p-6 text-center mt-8">
                          <MessageSquare className="mx-auto text-zinc-600 mb-3" size={30} />
                          <p className="font-bold text-sm">{t.noConversations}</p>
                          <p className="text-xs text-zinc-600 mt-2">{t.startConversation}</p>
                          <button onClick={() => changePage('players')} className="mt-4 text-orange-500 text-sm font-bold">{t.findPlayers}</button>
                        </div>
                      ) : conversations.map(item => (
                        <button key={item.user_id} onClick={() => {
                          setSelectedChatId(Number(item.user_id))
                          setChatUser({ id: item.user_id, username: item.username })
                          setChatMessages([])
                          loadChat(Number(item.user_id))
                        }} className={`w-full p-4 flex items-center gap-3 text-left border-b border-white/[0.04] ${Number(selectedChatId) === Number(item.user_id) ? 'bg-orange-500/10' : 'hover:bg-white/[0.03]'}`}>
                          <Avatar name={item.username} />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{item.username}</p>
                            <p className="text-xs text-zinc-500 truncate mt-1">{item.last_message}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`flex-1 min-w-0 flex flex-col ${selectedChatId ? '' : 'hidden md:flex'}`}>
                    {!selectedChatId ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <MessageCircle size={40} className="text-orange-500 mb-5" />
                        <h3 className="font-black text-xl">{t.selectChat}</h3>
                        <p className="text-sm text-zinc-500 mt-2">{t.selectChatText}</p>
                      </div>
                    ) : (
                      <>
                        <div className="h-[75px] shrink-0 border-b border-white/[0.06] px-4 flex items-center gap-3">
                          <button onClick={() => setSelectedChatId(null)} className="md:hidden text-zinc-400"><ArrowLeft /></button>
                          <Avatar name={currentChatName} />
                          <p className="font-black text-sm">{currentChatName}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                          {chatLoading ? (
                            <div className="text-center py-10"><Loader2 className="animate-spin text-orange-500 mx-auto" /></div>
                          ) : chatMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">{t.noMessages}</div>
                          ) : chatMessages.map(message => {
                            const own = Number(message.sender_id) === Number(user.id)
                            return (
                              <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${own ? 'bg-orange-600 rounded-br-md' : 'bg-[#242427] rounded-bl-md'}`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                                  <p className="text-[9px] mt-2 text-right opacity-60">
                                    {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={bottomRef} />
                        </div>

                        {chatError && <p className="text-xs text-red-400 px-4">{chatError}</p>}

                        <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-white/[0.06] flex gap-2">
                          <input value={messageText} onChange={e => setMessageText(e.target.value)} maxLength={2000} placeholder={t.typeMessage} className="flex-1 min-w-0 h-12 bg-[#202023] rounded-xl px-4 text-sm outline-none focus:ring-1 focus:ring-orange-500" />
                          <button disabled={!messageText.trim() || sending} className="w-12 h-12 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded-xl flex items-center justify-center">
                            {sending ? <Loader2 className="animate-spin" size={19} /> : <Send size={19} />}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOURNAMENTS */}
          {page === 'tournaments' && (
            <div>
              <Heading title={t.tournaments} description="Compete with other players." />
              <div className="bg-[#151517] border border-white/[0.06] rounded-3xl p-12 text-center">
                <Trophy size={40} className="text-orange-500 mx-auto mb-5" />
                <h2 className="text-2xl font-black">{t.comingSoon}</h2>
                <p className="text-zinc-500 mt-2">{t.tournamentsText}</p>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {page === 'profile' && (
            <div>
              <Heading title={t.profile} description="260HUB player profile." />
              {!user ? (
                <button onClick={() => setAuthOpen(true)} className="bg-orange-600 px-5 py-3 rounded-xl">{t.login}</button>
              ) : (
                <div className="max-w-3xl space-y-5">
                  <div className="bg-[#151517] border border-white/[0.06] rounded-2xl p-7 flex items-center gap-5">
                    <Avatar name={user.username} size="lg" />
                    <div>
                      <h2 className="text-2xl font-black">{user.username}</h2>
                      <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
                      <p className="text-xs text-orange-400 mt-3">260HUB PLAYER</p>
                    </div>
                  </div>

                  <form onSubmit={saveProfile} className="bg-[#151517] border border-white/[0.06] rounded-2xl p-7 space-y-5">
                    <h3 className="font-black text-lg">{t.editProfile}</h3>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-2">{t.favoriteGame}</label>
                      <select value={profileGame} onChange={e => setProfileGame(e.target.value)} className="w-full h-12 bg-[#222225] rounded-xl px-4 outline-none">
                        <option value="">—</option>
                        {GAMES.map(game => <option key={game} value={game}>{game}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-2">{t.bio}</label>
                      <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} maxLength={500} rows={5} className="w-full bg-[#222225] rounded-xl p-4 outline-none resize-y" />
                    </div>
                    {profileNotice && <p className="text-sm text-orange-400">{profileNotice}</p>}
                    <button disabled={profileSaving} className="px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold flex items-center gap-2">
                      <Save size={16} /> {profileSaving ? t.loading : t.save}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {page === 'settings' && (
            <div>
              <Heading title={t.settings} description="Manage your 260HUB preferences." />
              <div className="max-w-2xl bg-[#151517] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Globe className="text-orange-500" />
                  <p className="font-bold">{t.language}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[['ru', 'Русский'], ['en', 'English'], ['uz', "O'zbek"]].map(([id, label]) => (
                    <button key={id} onClick={() => setLang(id)} className={`p-3 rounded-xl border text-sm font-bold ${lang === id ? 'bg-orange-600/10 border-orange-500 text-orange-400' : 'bg-[#202023] border-white/5 text-zinc-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/[0.06] mt-6 pt-5 flex items-center gap-3">
                  <Shield className="text-orange-500" />
                  <div>
                    <p className="font-bold text-sm">260HUB API</p>
                    <p className="text-xs text-zinc-600">localhost:3000</p>
                  </div>
                  <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#171719] border border-white/10 rounded-3xl p-7 relative">
            <button onClick={() => setAuthOpen(false)} className="absolute right-5 top-5 text-zinc-500"><X /></button>
            <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mb-5"><Gamepad2 size={25} /></div>
            <h2 className="text-2xl font-black">{authMode === 'login' ? t.login : t.register}</h2>

            <form onSubmit={submitAuth} className="space-y-4 mt-6">
              {authMode === 'register' ? (
                <>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder={t.username} required minLength={3} maxLength={20} className="w-full h-12 bg-[#252529] rounded-xl px-4 outline-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email} required className="w-full h-12 bg-[#252529] rounded-xl px-4 outline-none" />
                </>
              ) : (
                <input value={login} onChange={e => setLogin(e.target.value)} placeholder={t.loginPlaceholder} required className="w-full h-12 bg-[#252529] rounded-xl px-4 outline-none" />
              )}
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.password} required minLength={8} maxLength={128} className="w-full h-12 bg-[#252529] rounded-xl px-4 outline-none" />
              {authError && <p className="text-sm text-red-400">{authError}</p>}
              <button disabled={authLoading} className="w-full h-12 bg-orange-600 hover:bg-orange-500 rounded-xl font-black">
                {authLoading ? t.loading : authMode === 'login' ? t.login : t.register}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-500 mt-6">
              {authMode === 'login' ? t.noAccount : t.haveAccount}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }} className="text-orange-500 font-bold ml-2">
                {authMode === 'login' ? t.register : t.login}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* TEAM MODAL */}
      {teamModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={createTeam} className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-xl">{t.createTeam}</h2>
              <button type="button" onClick={() => setTeamModal(false)}><X className="text-zinc-500" /></button>
            </div>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder={t.teamName} maxLength={30} required className="w-full h-12 bg-[#252529] rounded-xl px-4 outline-none" />
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setTeamModal(false)} className="flex-1 py-3 bg-white/[0.05] rounded-xl font-bold">{t.cancel}</button>
              <button className="flex-1 py-3 bg-orange-600 rounded-xl font-bold">{t.create}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App