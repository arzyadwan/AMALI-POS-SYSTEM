import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Calculator, Package, Users, Receipt, Shield, LogOut, 
  AlertTriangle, BarChart3, Truck, Settings, Menu, X, LogIn, ShieldCheck, User as UserIcon, Lock, AlertCircle, CheckCircle2 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, login, logout, isAdmin } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const navItems = user ? [
    { path: '/', label: 'Kasir POS', icon: ShoppingCart },
    { path: '/simulator', label: 'Simulator Kredit', icon: Calculator },
    { path: '/customers', label: 'Pelanggan', icon: Users },
    { path: '/transactions', label: 'Transaksi', icon: Receipt },
    // Admin only items
    ...(isAdmin ? [
      { path: '/products', label: 'Produk', icon: Package, adminTag: true },
      { path: '/collection', label: 'Piutang', icon: AlertTriangle, adminTag: true },
      { path: '/analytics', label: 'Analitik', icon: BarChart3, adminTag: true },
      { path: '/suppliers', label: 'Supplier', icon: Truck, adminTag: true },
      { path: '/users', label: 'Pengguna', icon: Shield, adminTag: true },
      { path: '/settings', label: 'Pengaturan', icon: Settings, adminTag: true },
    ] : [])
  ] : [
    { path: '/', label: 'Simulator Kredit', icon: Calculator },
  ]

  const bottomNavItems = user ? [
    { path: '/', icon: ShoppingCart, label: 'Kasir' },
    { path: '/simulator', icon: Calculator, label: 'Kredit' },
    { path: '/transactions', icon: Receipt, label: 'History' },
    { path: '/customers', icon: Users, label: 'Data' },
  ] : [
    { path: '/', icon: Calculator, label: 'Simulator' },
  ]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-slate-900 text-base">AMALI <span className="text-primary-600">KREDIT</span></span>
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-5 h-5" />
              <span className="text-xs font-bold">Login</span>
            </button>
          )}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile Only) */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 modal-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col border-r border-slate-200 z-50 
        transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-10 shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo & Close Button (Mobile Only) */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-soft-green text-white bg-white">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AMALI <span className="text-primary-600">KREDIT</span></h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">POS & Simulator</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'text-primary-700 bg-primary-50 shadow-sm border border-primary-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.label}</span>
                {item.adminTag && (
                  <span className="ml-auto text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">ADMIN</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3 pb-safe-bottom">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                isAdmin ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {(user.name || user.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name || user.username}</p>
                <p className={`text-[10px] font-semibold ${isAdmin ? 'text-red-500' : 'text-emerald-600'}`}>
                  {isAdmin ? '🛡️ Admin' : '💼 Kasir'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all shadow-md shadow-primary-200 active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              MASUK KE SISTEM
            </button>
          )}
          <div className="text-center hidden lg:block">
            <p className="text-[10px] text-slate-400">
              <span className="text-primary-500 font-bold">AMALI KREDIT v2.0</span> &copy; 2026
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto lg:overflow-hidden relative pb-16 lg:pb-0">
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-30 pb-safe-bottom">
        {bottomNavItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors ${
                isActive ? 'text-primary-600 animate-fadeInUp' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onSuccess={() => {
            setIsLoginModalOpen(false)
            navigate('/')
          }}
        />
      )}
    </div>
  )
}

function LoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupName, setSetupName] = useState('')
  
  const { login } = useAuth()

  useEffect(() => {
    fetch('/api/auth/check-setup')
      .then(r => r.json())
      .then(d => setNeedsSetup(d.needsSetup))
      .catch(() => setNeedsSetup(false))
  }, [])

  async function handleAction(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    const url = needsSetup ? '/api/auth/setup' : '/api/auth/login'
    const body = needsSetup 
      ? { username, password, name: setupName }
      : { username, password }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      login(data.user, data.token)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mb-4">
              <ShieldCheck className="w-7 h-7 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {needsSetup ? '🛡️ Setup Admin' : 'Masuk ke Sistem'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {needsSetup ? 'Buat akun admin pertama Anda.' : 'Gunakan akun Kasir atau Admin.'}
            </p>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            {needsSetup && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="input-modern pl-10"
                    placeholder="Nama Anda"
                    value={setupName}
                    onChange={e => setSetupName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  className="input-modern pl-10"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  className="input-modern pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Memproses...' : needsSetup ? 'BUAT AKUN' : ' MASUK SEKARANG'}
            </button>
          </form>
          
          <p className="text-center text-[10px] text-slate-400 mt-6 font-medium"> AMALI KREDIT v2.0 - © 2026 </p>
        </div>
      </div>
    </div>
  )
}
