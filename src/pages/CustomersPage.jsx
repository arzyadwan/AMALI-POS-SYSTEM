import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search, Edit3, X, Check, Phone, MapPin, CreditCard, ChevronRight } from 'lucide-react'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', nik: '' })

  useEffect(() => { fetchCustomers() }, [])
  useEffect(() => { fetchCustomers() }, [search])

  const fetchCustomers = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/customers?${params}`)
    setCustomers(await res.json())
  }

  const openAdd = () => {
    setEditCustomer(null)
    setForm({ name: '', phone: '', address: '', nik: '' })
    setShowModal(true)
  }

  const openEdit = (customer) => {
    setEditCustomer(customer)
    setForm({ name: customer.name, phone: customer.phone, address: customer.address, nik: customer.nik })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editCustomer) {
      await fetch(`/api/customers/${editCustomer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
    } else {
      await fetch('/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
    }
    setShowModal(false)
    fetchCustomers()
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manajemen <span className="gradient-text">Pelanggan</span></h2>
              <p className="text-slate-500 text-sm">{customers.length} pelanggan terdaftar</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Tambah Pelanggan
          </button>
        </div>

        {/* Search */}
        <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, telp, atau NIK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-modern pl-10 pr-4 py-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          {customers.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => navigate(`/transactions?customerId=${customer.id}`)}
              className="clean-card shadow-sm p-5 hover:border-primary-300 transition-all cursor-pointer group hover:shadow-md relative"
            >
              {/* Chevron indicator for clickable card */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                <ChevronRight className="w-5 h-5 text-primary-300" />
              </div>

              <div className="flex items-start justify-between mb-3 pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 font-bold flex items-center justify-center text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{customer.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(customer); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-primary-600" />
                </button>
              </div>

              {customer.address && (
                <div className="flex items-start gap-1.5 mb-2">
                  <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">{customer.address}</p>
                </div>
              )}

              {customer.nik && (
                <div className="flex items-center gap-1.5 mb-3">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <p className="text-[11px] text-slate-500 font-mono">{customer.nik}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-medium">
                  {customer._count?.transactions || 0} transaksi
                </span>
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 animate-fadeInUp">
            <Users className="w-12 h-12 mb-3 opacity-30 text-slate-300" />
            <p className="text-sm">Belum ada pelanggan</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <div className="clean-card w-[450px] p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Nama Lengkap</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="input-modern" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">No. HP</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">NIK</label>
                    <input type="text" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})}
                      className="input-modern" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Alamat</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2}
                    className="input-modern resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary text-sm">Batal</button>
                <button onClick={handleSubmit} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {editCustomer ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
