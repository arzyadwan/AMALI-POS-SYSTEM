import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupName, setSetupName] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  // Check if setup is needed (no users yet)
  useEffect(() => {
    fetch('http://localhost:3002/api/auth/check-setup')
      .then(r => r.json())
      .then(d => setNeedsSetup(d.needsSetup))
      .catch(() => setNeedsSetup(false))
  }, [])

  async function handleSetup(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3002/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: setupName })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.user, data.token)
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.user, data.token)
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-400/30 mb-4 shadow-lg shadow-primary-500/20">
            <ShieldCheck className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-black gradient-text">AMALI KREDIT</h1>
          <p className="text-slate-400 text-sm mt-1">POS & Simulator Kredit Modern</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-white mb-1">
            {needsSetup ? '🛡️ Setup Admin Pertama' : '👋 Selamat Datang'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {needsSetup ? 'Buat akun admin untuk memulai.' : 'Masuk ke akun Anda untuk melanjutkan.'}
          </p>

          <form onSubmit={needsSetup ? handleSetup : handleLogin} className="space-y-4">
            {needsSetup && (
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={setupName}
                    onChange={e => setSetupName(e.target.value)}
                    placeholder="Nama Admin"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/20"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-400/50 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-400 text-sm">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-emerald-500 text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60 shadow-lg shadow-primary-500/30 mt-2"
            >
              {isLoading ? 'Memproses...' : needsSetup ? '🚀 Buat Akun Admin' : '🔐 Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">AMALI KREDIT v2.0 · © 2026</p>
      </div>
    </div>
  )
}
