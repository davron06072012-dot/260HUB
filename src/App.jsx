import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, Users, MessageCircle, Trophy, User, Settings, LogOut,
  Menu, X, Search, Send, Gamepad2, Shield, ShieldCheck, RefreshCw,
  Loader2, Crown, Ban, CheckCircle2, Plus, ChevronRight, Swords,
  CalendarDays, Mail, Lock, ArrowLeft, Medal, Eye, Trash2, Pencil,
  Globe, AlertCircle
} from 'lucide-react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')
const TOKEN_KEY = '260hub_token'
const GAMES = ['Standoff 2', 'Counter-Strike 2', 'Brawl Stars', 'Valorant', 'Minecraft', 'Fortnite', 'PUBG', 'Dota 2', 'Roblox']
const FORMATS = ['1v1', '2v2', '5v5']
const STATUSES = ['draft', 'registration', 'live', 'completed', 'cancelled']

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function hasAdminAccess(user) {
  return ['root', 'admin'].includes(user?.role)
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
  return data
}

function Avatar({ name = '?', size = 'md' }) {
  const sizes = { sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-20 h-20 text-3xl' }
  return <div className={`${sizes[size]} shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center font-black text-white`}>{String(name || '?').slice(0, 1).toUpperCase()}</div>
}

function Heading({ title, subtitle, action }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl md:text-3xl font-black">{title}</h1>{subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}</div>{action}</div>
}

function Stat({ label, value, icon: Icon }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-[#151517] p-5"><div className="flex justify-between items-center text-zinc-500 text-sm"><span>{label}</span><Icon size={19} className="text-orange-500" /></div><div className="text-3xl font-black mt-4">{value ?? '—'}</div></div>
}

function Field({ label, ...props }) {
  return <label className="block"><span className="block text-xs text-zinc-400 mb-2">{label}</span><input {...props} className={`w-full h-12 rounded-xl bg-[#222225] border border-white/[0.07] px-4 outline-none focus:border-orange-500/60 ${props.className || ''}`} /></label>
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authOpen, setAuthOpen] = useState(false)
  const [authData, setAuthData] = useState({ login: '', username: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const [players, setPlayers] = useState([])
  const [playersSearch, setPlayersSearch] = useState('')
  const [adminUsers, setAdminUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userStatus, setUserStatus] = useState('all')
  const [adminStats, setAdminStats] = useState(null)
  const [adminTab, setAdminTab] = useState('overview')
  const [banTarget, setBanTarget] = useState(null)
  const [banReason, setBanReason] = useState('Нарушение правил сообщества')

  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [participants, setParticipants] = useState([])
  const [tournamentModal, setTournamentModal] = useState(false)
  const [editingTournament, setEditingTournament] = useState(null)
  const emptyTournament = { title: '', description: '', game: GAMES[0], format: '5v5', start_at: '', registration_deadline: '', max_players: 10, prize_pool: '', rules: '', status: 'registration', registration_open: true }
  const [tournamentForm, setTournamentForm] = useState(emptyTournament)

  const [conversations, setConversations] = useState([])
  const [chatUsers, setChatUsers] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [chatError, setChatError] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const [profile, setProfile] = useState({ bio: '', favorite_game: '' })
  const [language, setLanguage] = useState('ru')

  const isAdmin = hasAdminAccess(user)
  const isRoot = user?.role === 'root'

  const loadPlayers = useCallback(async () => {
    try {
      const data = await api('/players')
      setPlayers(Array.isArray(data) ? data : data.players || data.users || [])
    } catch (error) { setNotice(error.message) }
  }, [])

  const loadAdminData = useCallback(async () => {
    if (!hasAdminAccess(user)) return
    try {
      const [statsData, usersData, tournamentsData] = await Promise.all([
        api('/admin/stats'),
        api('/admin/users'),
        api('/tournaments')
      ])
      setAdminStats(statsData.stats || statsData)
      setAdminUsers(usersData.users || [])
      setTournaments(tournamentsData.tournaments || [])
    } catch (error) { setNotice(`Admin API: ${error.message}`) }
  }, [user])

  const loadTournaments = useCallback(async () => {
    try {
      const data = await api('/tournaments')
      setTournaments(data.tournaments || [])
    } catch (error) { setNotice(error.message) }
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const data = await api('/messages/conversations')
      setConversations(data.conversations || [])
    } catch (error) {
      // Some older message APIs do not expose a conversations endpoint.
      setConversations([])
    }
  }, [])

  const loadChat = useCallback(async (id) => {
    if (!id) return
    setChatLoading(true)
    setChatError('')
    try {
      const data = await api(`/messages/${id}`)
      setChatUser(data.user || chatUsers.find(item => Number(item.id) === Number(id)) || { id, username: 'User' })
      setMessages(data.messages || [])
    } catch (error) { setChatError(error.message) }
    finally { setChatLoading(false) }
  }, [chatUsers])

  useEffect(() => {
    let active = true
    async function restore() {
      if (!getToken()) { setChecking(false); return }
      try {
        const data = await api('/auth/me')
        if (!active) return
        const current = data.user || data
        setUser(current)
        setProfile({ bio: current.bio || '', favorite_game: current.favorite_game || '' })
      } catch { localStorage.removeItem(TOKEN_KEY) }
      finally { if (active) setChecking(false) }
    }
    restore()
    return () => { active = false }
  }, [])

  useEffect(() => { if (user) { loadPlayers(); loadTournaments(); loadConversations() } }, [user, loadPlayers, loadTournaments, loadConversations])
  useEffect(() => { if (page === 'admin' && isAdmin) loadAdminData() }, [page, isAdmin, loadAdminData])
  useEffect(() => {
    if (page === 'messages' && selectedChatId) {
      loadChat(selectedChatId)
      const timer = setInterval(() => loadChat(selectedChatId), 6000)
      return () => clearInterval(timer)
    }
  }, [page, selectedChatId, loadChat])

  async function submitAuth(event) {
    event.preventDefault()
    setBusy(true); setAuthError('')
    try {
      const registering = authMode === 'register'
      const payload = registering
        ? { username: authData.username.trim(), email: authData.email.trim(), password: authData.password }
        : { login: authData.login.trim(), password: authData.password }
      const result = await api(registering ? '/auth/register' : '/auth/login', { method: 'POST', body: JSON.stringify(payload) })
      if (!result.token) throw new Error(result.message || 'Токен не получен')
      localStorage.setItem(TOKEN_KEY, result.token)
      const me = await api('/auth/me')
      const current = me.user || me
      setUser(current)
      setProfile({ bio: current.bio || '', favorite_game: current.favorite_game || '' })
      setAuthOpen(false); setAuthData({ login: '', username: '', email: '', password: '' })
    } catch (error) { setAuthError(error.message) }
    finally { setBusy(false) }
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem(TOKEN_KEY)
    setUser(null); setPage('dashboard'); setMessages([]); setConversations([]); setSelectedChatId(null)
  }

  function go(next) {
    if (next === 'admin' && !isAdmin) return
    if (!user && ['messages', 'profile', 'admin'].includes(next)) { setAuthOpen(true); return }
    setPage(next); setMobileMenu(false)
  }

  async function refreshUsers() {
    const data = await api(`/admin/users?search=${encodeURIComponent(userSearch)}&status=${userStatus}`)
    setAdminUsers(data.users || [])
  }

  async function changeBan(target) {
    if (!target) return
    if (target.role === 'root' || (target.role === 'admin' && !isRoot)) {
      setNotice('Недостаточно прав для блокировки этого администратора.')
      return
    }
    if (target.role === 'admin') {
      setNotice('Текущий backend запрещает блокировку администраторов. Нужно отдельно обновить серверные права.')
      return
    }
    try {
      await api(`/admin/users/${target.id}/${target.is_banned ? 'unban' : 'ban'}`, {
        method: 'PATCH',
        body: JSON.stringify(target.is_banned ? {} : { reason: banReason.trim() || 'Нарушение правил' })
      })
      setBanTarget(null); await refreshUsers(); await loadAdminData()
      setNotice(target.is_banned ? 'Блокировка снята.' : 'Игрок заблокирован.')
    } catch (error) { setNotice(error.message) }
  }

  async function changeRole(target, role) {
    if (!isRoot) { setNotice('Назначать администраторов может только ROOT.'); return }
    try {
      await api(`/admin/users/${target.id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
      await refreshUsers()
      setNotice(role === 'admin' ? 'Права администратора выданы.' : 'Права администратора сняты.')
    } catch (error) { setNotice(error.message) }
  }

  function openCreateTournament() {
    setEditingTournament(null)
    setTournamentForm(emptyTournament)
    setTournamentModal(true)
  }

  function openEditTournament(tournament) {
    setEditingTournament(tournament)
    setTournamentForm({
      title: tournament.title || '', description: tournament.description || '',
      game: tournament.game || GAMES[0], format: tournament.format || '5v5',
      start_at: tournament.start_at ? new Date(tournament.start_at).toISOString().slice(0, 16) : '',
      registration_deadline: tournament.registration_deadline ? new Date(tournament.registration_deadline).toISOString().slice(0, 16) : '',
      max_players: tournament.max_players || 10, prize_pool: tournament.prize_pool || '',
      rules: tournament.rules || '', status: tournament.status || 'registration',
      registration_open: Boolean(tournament.registration_open)
    })
    setTournamentModal(true)
  }

  async function saveTournament(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...tournamentForm,
        start_at: new Date(tournamentForm.start_at).toISOString(),
        registration_deadline: new Date(tournamentForm.registration_deadline).toISOString(),
        max_players: Number(tournamentForm.max_players)
      }
      const result = editingTournament
        ? await api(`/tournaments/${editingTournament.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await api('/tournaments', { method: 'POST', body: JSON.stringify(payload) })
      setTournamentModal(false)
      await loadTournaments(); await loadAdminData()
      setNotice(result.message || 'Турнир сохранён.')
    } catch (error) { setNotice(error.message) }
    finally { setBusy(false) }
  }

  async function removeTournament(tournament) {
    if (!window.confirm(`Удалить турнир «${tournament.title}»?`)) return
    try {
      await api(`/tournaments/${tournament.id}`, { method: 'DELETE' })
      if (Number(selectedTournament?.id) === Number(tournament.id)) { setSelectedTournament(null); setParticipants([]) }
      await loadTournaments()
      setNotice('Турнир удалён.')
    } catch (error) { setNotice(error.message) }
  }

  async function openBracket(tournament) {
    setSelectedTournament(tournament)
    setParticipants([])
    setAdminTab('brackets')
    try {
      const data = await api(`/tournaments/${tournament.id}`)
      setParticipants(data.participants || [])
    } catch (error) { setNotice(error.message) }
  }

  const myTournaments = useMemo(() => tournaments.filter(item => Number(item.created_by) === Number(user?.id)), [tournaments, user])
  const bracketRounds = useMemo(() => {
    const entries = [...participants]
    if (!entries.length) return []
    let size = 1
    while (size < entries.length) size *= 2
    const slots = Array.from({ length: size }, (_, index) => entries[index] || null)
    const rounds = []
    let current = slots
    while (current.length > 1) {
      const matches = []
      for (let i = 0; i < current.length; i += 2) {
        matches.push([current[i], current[i + 1]])
      }
      rounds.push(matches)
      current = matches.map(pair => pair[0])
    }
    return rounds
  }, [participants])

  async function openAdminChat(target) {
    setChatUsers(adminUsers)
    setSelectedChatId(Number(target.id))
    setChatUser(target)
    setPage('messages')
    setAdminTab('users')
    await loadChat(Number(target.id))
  }

  async function sendMessage(event) {
    event.preventDefault()
    const content = messageText.trim()
    if (!content || !selectedChatId) return
    try {
      const result = await api(`/messages/${selectedChatId}`, { method: 'POST', body: JSON.stringify({ body: content }) })
      if (result.message) setMessages(previous => [...previous, result.message])
      else await loadChat(selectedChatId)
      setMessageText('')
      loadConversations()
    } catch (error) { setChatError(error.message) }
  }

  async function saveProfile(event) {
    event.preventDefault()
    try {
      await api('/players/me', { method: 'PATCH', body: JSON.stringify(profile) })
      setUser(previous => ({ ...previous, ...profile }))
      setNotice('Профиль обновлён.')
    } catch (error) { setNotice(error.message) }
  }

  const filteredPlayers = players.filter(item => `${item.username || ''} ${item.favorite_game || ''}`.toLowerCase().includes(playersSearch.toLowerCase()))
  const visibleUsers = adminUsers.filter(item => `${item.username || ''} ${item.email || ''}`.toLowerCase().includes(userSearch.toLowerCase()))
  const nav = [
    ['dashboard', 'Главная', LayoutDashboard], ['players', 'Игроки', Users],
    ['messages', 'Чаты', MessageCircle], ['tournaments', 'Турниры', Trophy]
  ]

  if (checking) return <div className="min-h-screen bg-[#09090A] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={34} /></div>

  return (
    <div className="min-h-screen bg-[#09090A] text-white flex">
      {mobileMenu && <button aria-label="Закрыть меню" onClick={() => setMobileMenu(false)} className="fixed inset-0 bg-black/70 z-40 lg:hidden" />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 bg-[#111113] border-r border-white/[0.06] flex flex-col transition-transform ${mobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-[82px] px-6 flex items-center justify-between border-b border-white/[0.06]">
          <button onClick={() => go('dashboard')} className="flex items-center gap-3 text-left"><div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center"><Gamepad2 size={23} /></div><div><div className="font-black text-xl">260<span className="text-orange-500">HUB</span></div><div className="text-[9px] tracking-[3px] text-zinc-600 font-bold">FIND YOUR TEAM</div></div></button>
          <button onClick={() => setMobileMenu(false)} className="lg:hidden text-zinc-500"><X /></button>
        </div>
        <div className="px-4 pt-7"><p className="text-[10px] uppercase tracking-[2px] text-zinc-600 px-3 mb-3">Menu</p><nav className="space-y-1">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${page === id ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'}`}><Icon size={19} />{label}</button>)}</nav></div>
        {isAdmin && <div className="px-4 pt-7"><p className="text-[10px] uppercase tracking-[2px] text-orange-500 px-3 mb-3">Administration</p><button onClick={() => go('admin')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold ${page === 'admin' ? 'bg-orange-600' : 'text-orange-400 hover:bg-orange-500/10'}`}><ShieldCheck size={19} />Admin Panel</button></div>}
        <div className="px-4 pt-7"><p className="text-[10px] uppercase tracking-[2px] text-zinc-600 px-3 mb-3">Account</p><button onClick={() => go('profile')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm ${page === 'profile' ? 'bg-orange-600' : 'text-zinc-500 hover:bg-white/[0.04]'}`}><User size={19} />Мой профиль</button><button onClick={() => go('settings')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm ${page === 'settings' ? 'bg-orange-600' : 'text-zinc-500 hover:bg-white/[0.04]'}`}><Settings size={19} />Настройки</button></div>
        <div className="mt-auto p-4"><div className="bg-[#1A1A1D] rounded-2xl p-4 border border-white/[0.05]">{user ? <><div className="flex items-center gap-3 mb-4"><Avatar name={user.username} /><div className="min-w-0"><p className="font-bold text-sm truncate">{user.username}</p><p className="text-xs text-zinc-500 truncate">{user.role === 'root' ? 'ROOT ADMIN' : user.role === 'admin' ? 'ADMIN' : user.email}</p></div></div><button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs font-bold"><LogOut size={15} />Выйти</button></> : <button onClick={() => setAuthOpen(true)} className="w-full py-3 bg-orange-600 rounded-xl font-bold text-sm">Войти</button>}</div></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="h-[76px] border-b border-white/[0.06] bg-[#09090A]/90 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="lg:hidden w-10 h-10 rounded-xl bg-[#1A1A1D] flex items-center justify-center"><Menu size={20} /></button><div><p className="font-bold">{page === 'admin' ? 'Admin Panel' : nav.find(item => item[0] === page)?.[1] || (page === 'profile' ? 'Мой профиль' : 'Настройки')}</p><p className="text-[11px] text-zinc-600">260HUB / {page.toUpperCase()}</p></div></div>
          <div className="flex items-center gap-3"><select value={language} onChange={e => setLanguage(e.target.value)} className="h-10 bg-[#171719] border border-white/[0.06] rounded-xl px-2 text-xs"><option value="ru">RU</option><option value="en">EN</option><option value="uz">UZ</option></select>{user && <button onClick={() => go('profile')} className="flex items-center gap-2"><Avatar name={user.username} size="sm" /><span className="hidden md:block text-sm font-bold">{user.username}</span></button>}</div>
        </header>

        <div className="p-4 md:p-8 max-w-[1500px] mx-auto">
          {page === 'dashboard' && <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#351506] via-[#1D100B] to-[#111113] border border-orange-500/20 p-8 md:p-12"><div className="relative max-w-2xl"><span className="inline-flex bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-3 py-1.5 text-[10px] font-black tracking-wider mb-6">GAMING COMMUNITY</span><h1 className="text-3xl md:text-5xl font-black">Добро пожаловать в 260HUB</h1><p className="text-zinc-400 mt-4">Найди команду. Играй вместе. Побеждай вместе.</p><button onClick={() => go('players')} className="mt-8 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold text-sm flex items-center gap-2">Найти игроков <ChevronRight size={17} /></button></div></section>
            <Heading title="Популярные игры" subtitle="Выбери игру и найди напарников." />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{GAMES.slice(0, 6).map(game => <button key={game} onClick={() => { setPlayersSearch(game); go('players') }} className="text-left bg-[#151517] border border-white/[0.06] hover:border-orange-500/40 rounded-2xl p-5"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center mb-5"><Gamepad2 /></div><div className="flex justify-between font-black">{game}<ChevronRight className="text-zinc-500" /></div></button>)}</div>
          </div>}

          {page === 'players' && <div><Heading title="Игроки" subtitle="Ищи игроков по никнейму или любимой игре." action={<button onClick={loadPlayers} className="p-3 rounded-xl bg-[#18181B]"><RefreshCw size={18} /></button>} /><div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} /><input value={playersSearch} onChange={e => setPlayersSearch(e.target.value)} placeholder="Поиск игроков..." className="w-full h-14 bg-[#151517] border border-white/[0.07] rounded-2xl pl-12 pr-4 outline-none focus:border-orange-500/50" /></div><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filteredPlayers.map(player => <div key={player.id} className="bg-[#151517] border border-white/[0.07] rounded-2xl p-5"><div className="flex items-center gap-3"><Avatar name={player.username} /><div className="min-w-0"><p className="font-black truncate">{player.username}</p><p className="text-xs text-zinc-500">{player.favorite_game || 'Игра не выбрана'}</p></div></div><p className="text-sm text-zinc-500 mt-4 min-h-8">{player.bio || 'Описание не добавлено.'}</p><button onClick={() => { setChatUsers(players); setSelectedChatId(Number(player.id)); setChatUser(player); go('messages') }} className="mt-4 w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-bold flex justify-center gap-2"><MessageCircle size={16} />Написать</button></div>)}</div></div>}

          {page === 'messages' && <div><Heading title="Чаты" subtitle="Личные переписки 260HUB." /><div className="min-h-[600px] h-[calc(100vh-180px)] bg-[#121214] border border-white/[0.07] rounded-2xl overflow-hidden flex">
            <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-[300px] shrink-0 border-r border-white/[0.06] flex-col`}><div className="p-4 border-b border-white/[0.06] flex justify-between"><b>Диалоги</b><button onClick={loadConversations}><RefreshCw size={17} /></button></div><div className="flex-1 overflow-y-auto">{[...conversations, ...chatUsers.filter(item => !conversations.some(c => Number(c.user_id) === Number(item.id))).map(item => ({ user_id: item.id, username: item.username, last_message: 'Открыть чат' }))].filter((item, index, arr) => arr.findIndex(other => Number(other.user_id) === Number(item.user_id)) === index).map(item => <button key={item.user_id} onClick={() => { setSelectedChatId(Number(item.user_id)); setChatUser(item); loadChat(Number(item.user_id)) }} className={`w-full p-4 flex items-center gap-3 text-left border-b border-white/[0.04] ${Number(selectedChatId) === Number(item.user_id) ? 'bg-orange-500/10' : 'hover:bg-white/[0.03]'}`}><Avatar name={item.username} /><div className="min-w-0"><p className="font-bold text-sm truncate">{item.username}</p><p className="text-xs text-zinc-500 truncate">{item.last_message || 'Открыть переписку'}</p></div></button>)}</div></div>
            <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>{selectedChatId ? <><div className="h-[70px] border-b border-white/[0.06] px-4 flex items-center gap-3"><button className="md:hidden" onClick={() => setSelectedChatId(null)}><ArrowLeft /></button><Avatar name={chatUser?.username || 'User'} /><b>{chatUser?.username || 'Пользователь'}</b></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{chatLoading && <Loader2 className="animate-spin text-orange-500 mx-auto" />}{messages.map(message => <div key={message.id} className={`flex ${Number(message.sender_id) === Number(user?.id) ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-3 ${Number(message.sender_id) === Number(user?.id) ? 'bg-orange-600' : 'bg-[#242427]'}`}><p className="text-sm whitespace-pre-wrap break-words">{message.body ?? message.content}</p><p className="text-[9px] mt-2 text-right opacity-60">{message.created_at ? new Date(message.created_at).toLocaleString() : ''}</p></div></div>)}</div>{chatError && <p className="text-xs text-red-400 px-4 py-2">{chatError}</p>}<form onSubmit={sendMessage} className="p-3 border-t border-white/[0.06] flex gap-2"><input value={messageText} onChange={e => setMessageText(e.target.value)} maxLength={2000} placeholder="Напишите сообщение..." className="flex-1 min-w-0 h-12 bg-[#202023] rounded-xl px-4 text-sm outline-none" /><button disabled={!messageText.trim()} className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center disabled:opacity-40"><Send size={18} /></button></form></> : <div className="flex-1 flex items-center justify-center text-zinc-500">Выберите пользователя слева.</div>}</div>
          </div></div>}

          {page === 'tournaments' && <div><Heading title="Турниры" subtitle="Соревнования сообщества 260HUB." action={isAdmin ? <button onClick={openCreateTournament} className="px-4 py-3 rounded-xl bg-orange-600 flex items-center gap-2 text-sm font-bold"><Plus size={17} />Создать турнир</button> : null} /><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{tournaments.map(item => <div key={item.id} className="bg-[#151517] border border-white/[0.07] rounded-2xl p-5"><div className="flex items-center justify-between"><span className="text-xs text-orange-400 font-bold">{item.game} · {item.format}</span><span className="text-[10px] uppercase text-zinc-500">{item.status}</span></div><h3 className="font-black text-xl mt-4">{item.title}</h3><p className="text-sm text-zinc-500 mt-2 line-clamp-2">{item.description || 'Описание не добавлено.'}</p><div className="flex items-center gap-2 text-xs text-zinc-500 mt-5"><Users size={14} />{item.participants_count || 0} / {item.max_players} участников</div><div className="flex gap-2 mt-5"><button onClick={() => openBracket(item)} className="flex-1 py-3 rounded-xl bg-white/[0.06] hover:bg-white/10 text-sm font-bold">Участники</button>{isAdmin && Number(item.created_by) === Number(user?.id) && <button onClick={() => openEditTournament(item)} className="px-3 rounded-xl bg-orange-600/15 text-orange-400"><Pencil size={17} /></button>}</div></div>)}</div>{tournaments.length === 0 && <div className="text-center py-20 text-zinc-500">Пока нет турниров.</div>}</div>}

          {page === 'admin' && <div><Heading title="Admin Panel" subtitle="Управление платформой 260HUB." action={<button onClick={loadAdminData} className="p-3 rounded-xl bg-[#18181B]"><RefreshCw size={18} /></button>} />
            <div className="bg-gradient-to-r from-orange-600/15 to-transparent border border-orange-500/20 rounded-2xl p-5 mb-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-400"><ShieldCheck /></div><div><p className="font-black text-lg">Welcome, {user?.username}</p><p className="text-xs text-orange-400 mt-1">{isRoot ? '260HUB ROOT ADMINISTRATOR' : '260HUB ADMINISTRATOR'}</p></div></div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-7"><Stat label="Пользователи" value={adminStats?.users} icon={Users} /><Stat label="Заблокировано" value={adminStats?.banned} icon={Ban} /><Stat label="Турниры" value={adminStats?.tournaments} icon={Trophy} /><Stat label="Участники" value={adminStats?.participants} icon={Medal} /></div>
            <div className="flex flex-wrap gap-2 mb-6">{[['overview','Обзор'],['users','Пользователи'],['tournaments','Мои турниры'],['brackets','Сетки турниров']].map(([id,label]) => <button key={id} onClick={() => setAdminTab(id)} className={`px-4 py-3 rounded-xl text-sm font-bold ${adminTab === id ? 'bg-orange-600' : 'bg-[#18181B] text-zinc-400'}`}>{label}</button>)}</div>
            {adminTab === 'overview' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={() => setAdminTab('users')} className="text-left bg-[#151517] border border-white/[0.07] rounded-2xl p-6"><Users className="text-orange-500 mb-4" /><h3 className="font-black text-lg">Пользователи</h3><p className="text-sm text-zinc-500 mt-2">Просмотр email, ролей и статуса блокировки.</p></button><button onClick={() => setAdminTab('tournaments')} className="text-left bg-[#151517] border border-white/[0.07] rounded-2xl p-6"><Trophy className="text-orange-500 mb-4" /><h3 className="font-black text-lg">Турниры и сетки</h3><p className="text-sm text-zinc-500 mt-2">Управление созданными турнирами и участниками.</p></button></div>}
            {adminTab === 'users' && <div><div className="flex flex-col md:flex-row gap-3 mb-4"><input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Поиск по никнейму или email..." className="flex-1 h-12 bg-[#151517] rounded-xl px-4 outline-none border border-white/[0.07]" /><select value={userStatus} onChange={e => setUserStatus(e.target.value)} className="h-12 bg-[#151517] rounded-xl px-4"><option value="all">Все статусы</option><option value="active">Активные</option><option value="banned">Заблокированные</option></select><button onClick={refreshUsers} className="px-4 rounded-xl bg-orange-600 font-bold">Применить</button></div><div className="bg-[#151517] border border-white/[0.07] rounded-2xl overflow-x-auto"><table className="w-full text-left min-w-[850px]"><thead className="bg-white/[0.03] text-xs uppercase text-zinc-500"><tr><th className="p-4">Пользователь</th><th className="p-4">Email</th><th className="p-4">Роль</th><th className="p-4">Статус</th><th className="p-4">Действия</th></tr></thead><tbody>{visibleUsers.map(item => <tr key={item.id} className="border-t border-white/[0.05]"><td className="p-4"><div className="flex items-center gap-3"><Avatar name={item.username} size="sm" /><div><p className="font-bold">{item.username}</p><p className="text-xs text-zinc-600">ID: {item.id}</p></div></div></td><td className="p-4 text-sm text-zinc-400">{item.email || '—'}</td><td className="p-4"><span className={`text-xs font-bold ${item.role === 'root' ? 'text-amber-400' : item.role === 'admin' ? 'text-orange-400' : 'text-zinc-400'}`}>{item.role || 'player'}</span></td><td className="p-4"><span className={`text-xs ${item.is_banned ? 'text-red-400' : 'text-green-400'}`}>{item.is_banned ? 'Заблокирован' : 'Активен'}</span></td><td className="p-4"><div className="flex items-center gap-2"><button onClick={() => openAdminChat(item)} title="Открыть чат" className="p-2 rounded-lg bg-blue-600/15 text-blue-400"><MessageCircle size={16} /></button>{item.role !== 'root' && item.id !== user?.id && <button onClick={() => item.is_banned ? changeBan(item) : setBanTarget(item)} title={item.is_banned ? 'Разблокировать' : 'Заблокировать'} className="p-2 rounded-lg bg-red-500/10 text-red-400"><Ban size={16} /></button>}{isRoot && item.role !== 'root' && item.id !== user?.id && <button onClick={() => changeRole(item, item.role === 'admin' ? 'player' : 'admin')} title={item.role === 'admin' ? 'Снять права администратора' : 'Назначить администратором'} className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Crown size={16} /></button>}</div></td></tr>)}</tbody></table>{visibleUsers.length === 0 && <p className="p-8 text-center text-zinc-500">Пользователи не найдены.</p>}</div><p className="text-xs text-zinc-600 mt-3">Показаны пользователи, возвращённые сервером (до 200 записей).</p></div>}
            {adminTab === 'tournaments' && <div><div className="flex justify-end mb-4"><button onClick={openCreateTournament} className="px-4 py-3 rounded-xl bg-orange-600 font-bold flex items-center gap-2"><Plus size={17} />Создать турнир</button></div><div className="space-y-3">{myTournaments.map(item => <div key={item.id} className="bg-[#151517] border border-white/[0.07] rounded-2xl p-5 flex flex-wrap items-center gap-4"><div className="flex-1 min-w-[200px]"><p className="font-black">{item.title}</p><p className="text-xs text-zinc-500 mt-1">{item.game} · {item.format} · {item.participants_count || 0}/{item.max_players}</p></div><button onClick={() => openBracket(item)} className="px-3 py-2 rounded-lg bg-white/[0.06] text-sm">Участники / сетка</button><button onClick={() => openEditTournament(item)} className="p-2 rounded-lg bg-orange-500/10 text-orange-400"><Pencil size={16} /></button><button onClick={() => removeTournament(item)} className="p-2 rounded-lg bg-red-500/10 text-red-400"><Trash2 size={16} /></button></div>)}{myTournaments.length === 0 && <p className="text-center text-zinc-500 py-12">Ты ещё не создал турниров.</p>}</div></div>}
            {adminTab === 'brackets' && <div>{selectedTournament ? <><div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h2 className="font-black text-xl">{selectedTournament.title}</h2><p className="text-xs text-zinc-500 mt-1">{selectedTournament.game} · {selectedTournament.format}</p></div><button onClick={() => setSelectedTournament(null)} className="px-3 py-2 rounded-lg bg-white/[0.06] text-sm">Все турниры</button></div><div className="bg-[#151517] border border-white/[0.07] rounded-2xl p-5 mb-5"><h3 className="font-bold mb-3">Участники ({participants.length})</h3>{participants.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{participants.map((p,index) => <div key={p.user_id || p.id || index} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]"><span className="text-xs text-orange-400 font-black w-6">#{index+1}</span><Avatar name={p.team_name || p.team || p.username} size="sm" /><div className="min-w-0"><p className="font-bold text-sm truncate">{p.team_name || p.team || p.username || `Участник ${index+1}`}</p><p className="text-xs text-zinc-500">{p.username && (p.team_name || p.team) ? `Капитан/игрок: ${p.username}` : `ID: ${p.user_id ?? '—'}`} · {p.status || 'registered'}</p></div></div>)}</div> : <p className="text-sm text-zinc-500">Пока нет зарегистрированных участников.</p>}</div><h3 className="font-black text-lg mb-4">Сетка турнира</h3><p className="text-xs text-zinc-500 mb-4">Автоматическая предварительная сетка по текущему списку участников. Победители не определяются автоматически — результаты матчей нужно будет добавить на сервере.</p>{participants.length < 2 ? <p className="text-zinc-500 text-sm">Для построения сетки нужно минимум 2 участника.</p> : <div className="flex gap-5 overflow-x-auto pb-4">{bracketRounds.map((round,index) => <div key={index} className="min-w-[230px] space-y-3"><p className="text-xs uppercase tracking-wider text-orange-400 font-black">Раунд {index+1}</p>{round.map((pair,matchIndex) => <div key={matchIndex} className="bg-[#151517] border border-white/[0.07] rounded-xl p-3 space-y-2"><div className="text-sm p-2 bg-white/[0.03] rounded-lg">{pair[0]?.team_name || pair[0]?.team || pair[0]?.username || 'BYE'}</div><div className="border-t border-white/[0.06]" /><div className="text-sm p-2 bg-white/[0.03] rounded-lg">{pair[1]?.team_name || pair[1]?.team || pair[1]?.username || 'BYE'}</div></div>)}</div>)}</div>}</> : <div className="space-y-3">{myTournaments.map(item => <button key={item.id} onClick={() => openBracket(item)} className="w-full text-left bg-[#151517] border border-white/[0.07] rounded-xl p-4 hover:border-orange-500/40"><p className="font-bold">{item.title}</p><p className="text-xs text-zinc-500 mt-1">{item.game} · {item.participants_count || 0} участников</p></button>)}{myTournaments.length === 0 && <p className="text-zinc-500 py-10 text-center">Создай турнир, чтобы увидеть его участников и сетку.</p>}</div>}</div>}
          </div>}

          {page === 'profile' && <div><Heading title="Мой профиль" subtitle="Настройки профиля 260HUB." />{user ? <div className="max-w-2xl space-y-5"><div className="bg-[#151517] border border-white/[0.06] rounded-2xl p-6 flex items-center gap-4"><Avatar name={user.username} size="lg" /><div><h2 className="text-2xl font-black">{user.username}</h2><p className="text-sm text-zinc-500">{user.email}</p><p className="text-xs text-orange-400 mt-2">{user.role || 'player'}</p></div></div><form onSubmit={saveProfile} className="bg-[#151517] border border-white/[0.06] rounded-2xl p-6 space-y-5"><label className="block"><span className="block text-xs text-zinc-400 mb-2">Любимая игра</span><select value={profile.favorite_game} onChange={e => setProfile(v => ({ ...v, favorite_game: e.target.value }))} className="w-full h-12 bg-[#222225] rounded-xl px-4"><option value="">Не выбрана</option>{GAMES.map(game => <option key={game}>{game}</option>)}</select></label><label className="block"><span className="block text-xs text-zinc-400 mb-2">О себе</span><textarea value={profile.bio} onChange={e => setProfile(v => ({ ...v, bio: e.target.value }))} maxLength={500} rows={5} className="w-full bg-[#222225] rounded-xl p-4 outline-none" /></label><button className="px-6 py-3 bg-orange-600 rounded-xl font-bold">Сохранить изменения</button></form></div> : <button onClick={() => setAuthOpen(true)} className="px-5 py-3 bg-orange-600 rounded-xl">Войти</button>}</div>}

          {page === 'settings' && <div><Heading title="Настройки" subtitle="Настройки приложения." /><div className="max-w-xl bg-[#151517] border border-white/[0.06] rounded-2xl p-6"><div className="flex items-center gap-3"><Globe className="text-orange-500" /><b>Язык интерфейса</b></div><div className="flex gap-2 mt-4">{[['ru','Русский'],['en','English'],['uz',"O'zbek"]].map(([key,label]) => <button key={key} onClick={() => setLanguage(key)} className={`px-4 py-3 rounded-xl text-sm ${language === key ? 'bg-orange-600' : 'bg-white/[0.05] text-zinc-400'}`}>{label}</button>)}</div><div className="border-t border-white/[0.06] mt-6 pt-5 flex items-center gap-3"><Shield className="text-orange-500" /><div><p className="font-bold text-sm">260HUB API</p><p className="text-xs text-zinc-600">localhost:3000</p></div></div></div></div>}
        </div>
      </main>

      {notice && <div className="fixed bottom-5 right-5 z-[150] max-w-md bg-[#202023] border border-orange-500/30 rounded-xl px-4 py-3 shadow-2xl flex gap-3 items-start"><AlertCircle size={18} className="text-orange-400 shrink-0 mt-0.5" /><p className="text-sm flex-1">{notice}</p><button onClick={() => setNotice('')}><X size={16} /></button></div>}

      {authOpen && <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-md bg-[#171719] border border-white/10 rounded-3xl p-7 relative"><button onClick={() => setAuthOpen(false)} className="absolute right-5 top-5 text-zinc-500"><X /></button><div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center mb-5"><Gamepad2 /></div><h2 className="text-2xl font-black">{authMode === 'login' ? 'Войти' : 'Регистрация'}</h2><form onSubmit={submitAuth} className="space-y-4 mt-6">{authMode === 'register' ? <><Field label="Никнейм" value={authData.username} onChange={e => setAuthData(v => ({ ...v, username: e.target.value }))} minLength={3} maxLength={20} required /><Field label="Email" type="email" value={authData.email} onChange={e => setAuthData(v => ({ ...v, email: e.target.value }))} required /></> : <Field label="Никнейм или email" value={authData.login} onChange={e => setAuthData(v => ({ ...v, login: e.target.value }))} required />}<Field label="Пароль" type="password" value={authData.password} onChange={e => setAuthData(v => ({ ...v, password: e.target.value }))} minLength={8} maxLength={128} required />{authError && <p className="text-sm text-red-400">{authError}</p>}<button disabled={busy} className="w-full h-12 bg-orange-600 hover:bg-orange-500 rounded-xl font-black disabled:opacity-50">{busy ? 'Загрузка...' : authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button></form><p className="text-center text-xs text-zinc-500 mt-6">{authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'} <button onClick={() => { setAuthMode(v => v === 'login' ? 'register' : 'login'); setAuthError('') }} className="text-orange-500 font-bold ml-1">{authMode === 'login' ? 'Регистрация' : 'Войти'}</button></p></div></div>}

      {banTarget && <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-2xl p-6"><div className="flex items-center justify-between mb-5"><h2 className="font-black text-xl">Блокировка игрока</h2><button onClick={() => setBanTarget(null)}><X /></button></div><p className="text-sm text-zinc-400 mb-4">{banTarget.username} · {banTarget.email}</p><label className="block text-xs text-zinc-400 mb-2">Причина</label><textarea value={banReason} onChange={e => setBanReason(e.target.value)} maxLength={500} rows={3} className="w-full bg-[#252529] rounded-xl p-3 outline-none" /><div className="flex gap-3 mt-5"><button onClick={() => setBanTarget(null)} className="flex-1 py-3 bg-white/[0.05] rounded-xl font-bold">Отмена</button><button onClick={() => changeBan(banTarget)} className="flex-1 py-3 bg-red-600 rounded-xl font-bold">Заблокировать</button></div></div></div>}

      {tournamentModal && <div className="fixed inset-0 z-[110] bg-black/80 overflow-y-auto flex items-center justify-center p-4"><form onSubmit={saveTournament} className="w-full max-w-2xl bg-[#18181B] border border-white/10 rounded-2xl p-6 space-y-4 my-8"><div className="flex items-center justify-between"><h2 className="font-black text-xl">{editingTournament ? 'Редактировать турнир' : 'Создать турнир'}</h2><button type="button" onClick={() => setTournamentModal(false)}><X /></button></div><Field label="Название" value={tournamentForm.title} onChange={e => setTournamentForm(v => ({ ...v, title: e.target.value }))} maxLength={100} required /><label className="block"><span className="block text-xs text-zinc-400 mb-2">Игра</span><select value={tournamentForm.game} onChange={e => setTournamentForm(v => ({ ...v, game: e.target.value }))} className="w-full h-12 bg-[#222225] rounded-xl px-4">{GAMES.map(game => <option key={game}>{game}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block"><span className="block text-xs text-zinc-400 mb-2">Формат</span><select value={tournamentForm.format} onChange={e => setTournamentForm(v => ({ ...v, format: e.target.value }))} className="w-full h-12 bg-[#222225] rounded-xl px-4">{FORMATS.map(format => <option key={format}>{format}</option>)}</select></label><Field label="Макс. участников" type="number" min="2" max="1000" value={tournamentForm.max_players} onChange={e => setTournamentForm(v => ({ ...v, max_players: e.target.value }))} required /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Field label="Начало турнира" type="datetime-local" value={tournamentForm.start_at} onChange={e => setTournamentForm(v => ({ ...v, start_at: e.target.value }))} required /><Field label="Дедлайн регистрации" type="datetime-local" value={tournamentForm.registration_deadline} onChange={e => setTournamentForm(v => ({ ...v, registration_deadline: e.target.value }))} required /></div><Field label="Призовой фонд" value={tournamentForm.prize_pool} onChange={e => setTournamentForm(v => ({ ...v, prize_pool: e.target.value }))} /><label className="block"><span className="block text-xs text-zinc-400 mb-2">Описание</span><textarea value={tournamentForm.description} onChange={e => setTournamentForm(v => ({ ...v, description: e.target.value }))} rows={3} className="w-full bg-[#222225] rounded-xl p-3 outline-none" /></label><label className="block"><span className="block text-xs text-zinc-400 mb-2">Правила</span><textarea value={tournamentForm.rules} onChange={e => setTournamentForm(v => ({ ...v, rules: e.target.value }))} rows={3} className="w-full bg-[#222225] rounded-xl p-3 outline-none" /></label><label className="block"><span className="block text-xs text-zinc-400 mb-2">Статус</span><select value={tournamentForm.status} onChange={e => setTournamentForm(v => ({ ...v, status: e.target.value }))} className="w-full h-12 bg-[#222225] rounded-xl px-4">{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label><label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={tournamentForm.registration_open} onChange={e => setTournamentForm(v => ({ ...v, registration_open: e.target.checked }))} />Открыть регистрацию</label><div className="flex gap-3 pt-2"><button type="button" onClick={() => setTournamentModal(false)} className="flex-1 py-3 bg-white/[0.05] rounded-xl font-bold">Отмена</button><button disabled={busy} className="flex-1 py-3 bg-orange-600 rounded-xl font-bold disabled:opacity-50">{busy ? 'Сохранение...' : 'Сохранить'}</button></div></form></div>}
    </div>
  )
}

export default App
