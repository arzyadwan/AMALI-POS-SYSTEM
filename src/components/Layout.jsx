import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Calculator, Package, Users, Receipt, Shield, LogOut, AlertTriangle, BarChart3, Truck, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()

  const navItems = [
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
  ]


  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-white flex flex-col border-r border-slate-200 z-10 shadow-sm relative">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-soft-green text-white">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AMALI <span className="text-primary-600">KREDIT</span></h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">POS & Simulator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
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
        <div className="p-4 border-t border-slate-100 space-y-3">
          {user && (
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
          )}
          <div className="text-center">
            <p className="text-[10px] text-slate-400">
              <span className="text-primary-500 font-bold">AMALI KREDIT v2.0</span> &copy; 2026
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
