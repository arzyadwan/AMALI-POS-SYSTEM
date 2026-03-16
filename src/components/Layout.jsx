import { NavLink, useLocation } from 'react-router-dom'
import { ShoppingCart, Calculator, Package, Users, Receipt, Sparkles } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Kasir POS', icon: ShoppingCart },
  { path: '/simulator', label: 'Simulator Kredit', icon: Calculator },
  { path: '/products', label: 'Produk', icon: Package },
  { path: '/customers', label: 'Pelanggan', icon: Users },
  { path: '/transactions', label: 'Transaksi', icon: Receipt },
]

export default function Layout({ children }) {
  const location = useLocation()

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
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100">
          <div className="clean-card p-3 rounded-xl bg-slate-50 text-center border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              <span className="text-primary-600 font-bold block mb-0.5">AMALI KREDIT v1.0</span>
              &copy; 2026 Hak Cipta
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
