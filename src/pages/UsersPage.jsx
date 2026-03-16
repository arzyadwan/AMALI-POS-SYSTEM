import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, ShieldCheck, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'CASHIER' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3002/api/auth/users', { headers: authHeaders })
      const data = await res.json()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const res = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowForm(false)
      setForm({ username: '', password: '', name: '', role: 'CASHIER' })
      fetchUsers()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Hapus pengguna ini?')) return
    await fetch(`http://localhost:3002/api/auth/users/${id}`, { method: 'DELETE', headers: authHeaders })
    fetchUsers()
  }

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-700 border border-red-200',
    CASHIER: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fadeInUp flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manajemen <span className="gradient-text">Pengguna</span></h2>
              <p className="text-slate-500 text-sm">Kelola akun Admin dan Kasir</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="clean-card p-6 mb-6 animate-fadeInUp shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-500" /> Pengguna Baru
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-modern" placeholder="Nama tampilan" />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Username</label>
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input-modern" placeholder="username" required />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-modern" placeholder="••••••••" required />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-modern">
                  <option value="CASHIER">Kasir (CASHIER)</option>
                  <option value="ADMIN">Admin (ADMIN)</option>
                </select>
              </div>
              {formError && (
                <div className="col-span-2 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setFormError('') }} className="btn-secondary text-sm">Batal</button>
                <button type="submit" disabled={formLoading} className="btn-primary text-sm">{formLoading ? 'Menyimpan...' : 'Simpan Pengguna'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="clean-card shadow-sm animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Memuat...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">Belum ada pengguna</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Pengguna</th>
                  <th className="text-left text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Username</th>
                  <th className="text-left text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Bergabung</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {u.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{u.name || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm font-mono">@{u.username}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${roleColors[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
