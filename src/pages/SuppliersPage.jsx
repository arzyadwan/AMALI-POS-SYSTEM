import { useState, useEffect } from 'react'
import { Truck, Plus, Search, Edit3, X, Check, Phone, MapPin, Mail, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SuppliersPage() {
  const { token } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  useEffect(() => { fetchSuppliers() }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', { headers: authHeaders })
      const data = await res.json()
      setSuppliers(data)
    } catch (e) {
      console.error("Failed to fetch suppliers", e)
    }
  }

  const openAdd = () => {
    setEditSupplier(null)
    setForm({ name: '', phone: '', email: '', address: '' })
    setShowModal(true)
  }

  const openEdit = (supplier) => {
    setEditSupplier(supplier)
    setForm({ 
      name: supplier.name, 
      phone: supplier.phone || '', 
      email: supplier.email || '', 
      address: supplier.address || '' 
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editSupplier 
        ? `/api/suppliers/${editSupplier.id}` 
        : '/api/suppliers'
      
      const method = editSupplier ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowModal(false)
        fetchSuppliers()
      }
    } catch (e) {
      console.error("Failed to save supplier", e)
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search))
  )

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manajemen <span className="gradient-text">Supplier</span></h2>
              <p className="text-slate-500 text-sm">{suppliers.length} pemasok terdaftar</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary bg-orange-600 hover:bg-orange-700 flex items-center gap-2 text-sm shadow-orange-200">
            <Plus className="w-4 h-4" /> Tambah Supplier
          </button>
        </div>

        {/* Search */}
        <div className="mb-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau telepon supplier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-modern pl-10 pr-4 py-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="clean-card shadow-sm p-5 hover:border-orange-300 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-3 pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-lg">
                    {supplier.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 transition-colors">{supplier.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone || '-'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(supplier)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-orange-600" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {supplier.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <p className="text-[11px] text-slate-500 truncate">{supplier.email}</p>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-slate-500 leading-relaxed text-pretty">{supplier.address}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Package className="w-3 h-3" />
                  <span>{supplier._count?.products || 0} produk disediakan</span>
                </div>
                <span className="text-[10px] text-slate-300">ID: {supplier.id}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 animate-fadeInUp">
            <Truck className="w-12 h-12 mb-3 opacity-30 text-slate-300" />
            <p className="text-sm">Tidak ditemukan supplier</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <div className="clean-card w-[450px] p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editSupplier ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Nama Supplier</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Contoh: PT. Maju Jaya Jaya"
                    className="input-modern" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Telepon</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="0812..."
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="supplier@mail.com"
                      className="input-modern" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Alamat</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2}
                    placeholder="Alamat kantor..."
                    className="input-modern resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary text-sm">Batal</button>
                <button onClick={handleSubmit} className="flex-1 btn-primary bg-orange-600 hover:bg-orange-700 text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {editSupplier ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
