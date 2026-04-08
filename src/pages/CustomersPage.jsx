import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search, Edit3, X, Check, Phone, MapPin, CreditCard, ChevronRight, Zap, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function CustomersPage() {
  const navigate = useNavigate()
  const { isAdmin, isSuperAdmin, token } = useAuth()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [filter, setFilter] = useState('')
  const [batch, setBatch] = useState('')
  const [showTrxModal, setShowTrxModal] = useState(false)
  const [editTrxData, setEditTrxData] = useState(null)
  const [form, setForm] = useState({ 
    name: '', 
    phone: '', 
    address: ''
  })

  useEffect(() => { fetchCustomers() }, [])
  useEffect(() => { fetchCustomers() }, [search, sortBy, sortOrder, filter, batch])

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const fetchCustomers = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortOrder) params.set('order', sortOrder)
    if (filter) params.set('filter', filter)
    if (batch) params.set('batch', batch)
    
    const res = await fetch(`/api/customers?${params}`)
    const data = await res.json()
    setCustomers(data)
  }

  const openAdd = () => {
    setEditCustomer(null)
    setForm({ 
      name: '', 
      phone: '', 
      address: ''
    })
    setShowModal(true)
  }

  const openEdit = (customer) => {
    setEditCustomer(customer)
    setForm({ 
      name: customer.name, 
      phone: customer.phone || '', 
      address: customer.address || ''
    })
    setShowModal(true)
  }

  const openEditTrx = (e, tx) => {
    e.stopPropagation()
    setEditTrxData({ ...tx })
    setShowTrxModal(true)
  }

  const openAddTrx = (e, customer) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setEditTrxData({ 
      customerId: customer.id,
      bookCode: '',
      itemName: '',
      totalPrice: 0,
      monthlyPayment: 0,
      tenor: 12,
      dpAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    })
    setShowTrxModal(true)
  }

  const handleTrxSubmit = async () => {
    if (!editTrxData.bookCode) {
      alert('Kode buku wajib diisi!')
      return
    }

    // Ensure totalPrice is calculated correctly before sending
    const finalData = {
      ...editTrxData,
      totalPrice: (parseFloat(editTrxData.monthlyPayment) || 0) * (parseInt(editTrxData.tenor) || 0)
    }

    const isNew = !editTrxData.id
    const url = isNew ? '/api/transactions/manual' : `/api/transactions/${editTrxData.id}`
    const method = isNew ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalData)
      })

      if (!res.ok) {
        const err = await res.json()
        alert('Gagal menyimpan data kredit: ' + (err.error || 'Terjadi kesalahan sistem'))
        return
      }

      setShowTrxModal(false)
      fetchCustomers()
    } catch (err) {
      console.error('Error submitting transaction:', err)
      alert('Terjadi kesalahan jaringan atau server')
    }
  }

  const handleSubmit = async (thenAddCredit = false) => {
    if (!form.name) {
      alert('Nama wajib diisi!')
      return
    }

    const payload = form
    let savedCustomer = null

    if (editCustomer) {
      const res = await fetch(`/api/customers/${editCustomer.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) savedCustomer = await res.json()
    } else {
      const res = await fetch('/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) savedCustomer = await res.json()
    }

    setShowModal(false)
    fetchCustomers()

    if (thenAddCredit && savedCustomer) {
      setTimeout(() => {
        openAddTrx(null, savedCustomer)
      }, 100)
    }
  }

  const handleTrxDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data kredit ini? Tindakan ini tidak dapat dibatalkan.')) return
    const res = await fetch(`/api/transactions/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
        const err = await res.json()
        alert('Gagal: ' + err.error)
    }
    setShowTrxModal(false)
    fetchCustomers()
  }

  const handleDeleteCustomer = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini? Seluruh riwayat kredit pelanggan ini juga akan terhapus.')) return
    const res = await fetch(`/api/customers/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
        const err = await res.json()
        alert('Gagal: ' + err.error)
    }
    fetchCustomers()
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8 animate-fadeInUp">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">Manajemen <span className="gradient-text">Pelanggan</span></h2>
              <p className="text-slate-500 text-xs md:text-sm">{customers.length} pelanggan terdaftar</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={openAdd} className="btn-primary hidden md:flex items-center gap-2 text-sm px-5 py-2.5">
              <Plus className="w-4 h-4" /> Tambah Pelanggan
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, kode buku, atau barang..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-modern pl-10 pr-4 py-2.5"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <div className="relative">
                <select 
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl px-4 py-2 outline-none focus:border-primary-300 transition-all cursor-pointer appearance-none pr-8"
                >
                  <option value="">Semua Batch</option>
                  <option value="U">Batch U</option>
                  <option value="W">Batch W</option>
                  <option value="X">Batch X</option>
                  <option value="Y">Batch Y</option>
                  <option value="Z">Batch Z</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                </div>
              </div>
              
              <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
              
              <select 
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-primary-300 transition-all cursor-pointer"
              >
                <option value="name-asc">A-Z (Nama)</option>
                <option value="name-desc">Z-A (Nama)</option>
                <option value="transactions-desc">Paling Banyak Kredit</option>
                <option value="transactions-asc">Paling Sedikit Kredit</option>
                <option value="newest-desc">Terbaru</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table List Container (Desktop) */}
        <div className="hidden md:block clean-card shadow-sm border border-slate-200/60 overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-12"></th>
                  <th 
                    onClick={() => toggleSort('name')}
                    className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest min-w-[200px] cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Nasabah {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('address')}
                    className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Alamat {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('phone')}
                    className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      No. HP {sortBy === 'phone' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('transactions')}
                    className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-32 cursor-pointer hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Kredit Aktif {sortBy === 'transactions' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(customer => (
                  <React.Fragment key={customer.id}>
                    <tr 
                      className={`group transition-all cursor-pointer relative ${expandedRows[customer.id] ? 'bg-primary-50/20' : 'hover:bg-slate-50'}`}
                      onClick={() => toggleRow(customer.id)}
                    >
                      <td className="py-4 px-6 text-center">
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedRows[customer.id] ? 'rotate-90 text-primary-500' : ''}`} />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 max-w-[200px] truncate">
                        {customer.address || '-'}
                      </td>
                      <td className="py-4 px-6 text-xs font-mono text-slate-600">
                        {customer.phone || '-'}
                      </td>
                      <td className="py-4 px-6 text-center">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${customer.transactions?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                           {customer.transactions?.length || 0} Akun
                         </span>
                      </td>
                       <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(customer); }}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 hover:shadow-sm transition-all shadow-sm"
                              title="Edit Nasabah"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:shadow-sm transition-all shadow-sm"
                              title="Hapus Nasabah"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedRows[customer.id] && (
                      <tr>
                        <td colSpan="6" className="bg-slate-50/50 p-0 border-b border-slate-200">
                          <div className="px-12 py-4 animate-fadeInDown">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Daftar Kredit Aktif
                              </h4>
                              {isAdmin && (
                                <button 
                                  onClick={(e) => openAddTrx(e, customer)}
                                  className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 hover:bg-primary-100 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Tambah Kredit
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {(customer.transactions || []).length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic py-2">Belum ada catatan kredit aktif</p>
                              ) : (
                                customer.transactions.map(tx => (
                                  <div key={tx.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-primary-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="px-2.5 py-1 bg-primary-600 text-white rounded-lg font-bold text-xs shadow-sm">
                                        {tx.bookCode || 'N/A'}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800">{tx.itemName || 'Produk Kredit'}</span>
                                        <span className="text-[10px] text-slate-400">Dimulai: {new Date(tx.startDate).toLocaleDateString('id-ID')}</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-8">
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Harga Barang</span>
                                        <span className="text-xs font-bold text-slate-700">Rp {tx.totalPrice.toLocaleString('id-ID')}</span>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Angsuran / bln</span>
                                        <span className="text-xs font-bold text-primary-600">Rp {tx.monthlyPayment.toLocaleString('id-ID')}</span>
                                      </div>
                                      <div className="flex flex-col items-end min-w-[60px]">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Tenor</span>
                                        <span className="text-xs font-bold text-slate-700">{tx.tenor} Bulan</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isAdmin && (
                                        <button 
                                          onClick={(e) => openEditTrx(e, tx)}
                                          className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                                          title="Edit Kredit"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => navigate(`/transactions/detail/${tx.id}`)}
                                        className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                                        title="Detail Pinjaman"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List (Mobile) */}
        <div className="md:hidden space-y-3 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          {customers.map(customer => (
            <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50">
              <div 
                onClick={() => toggleRow(customer.id)}
                className={`p-4 flex items-start gap-3 transition-colors ${expandedRows[customer.id] ? 'bg-primary-50/30' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 truncate pr-2">{customer.name}</h3>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedRows[customer.id] ? 'rotate-90 text-primary-500' : ''}`} />
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] truncate max-w-[100px]">{customer.address || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span className="text-[10px] font-mono">{customer.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${customer.transactions?.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {customer.transactions?.length || 0} Akun Kredit
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(customer); }}
                        className="p-1 px-3 text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-100 rounded-lg"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Expanded Details */}
              {expandedRows[customer.id] && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 animate-fadeInDown">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-primary-500" /> Detail Kredit
                      </h4>
                      <div className="flex gap-2">
                        {isSuperAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                            className="text-[9px] font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Hapus Pelanggan
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={(e) => openAddTrx(e, customer)}
                            className="text-[9px] font-bold text-primary-600 px-2 py-1 bg-primary-50 rounded-lg flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> Tambah Kredit
                          </button>
                        )}
                      </div>
                    </div>
                  {(customer.transactions || []).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Belum ada kredit aktif</p>
                  ) : (
                    customer.transactions.map(tx => (
                      <div key={tx.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-none space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px] font-bold">
                            {tx.bookCode || 'N/A'}
                          </div>
                          <span className="text-[10px] text-slate-400">{new Date(tx.startDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 mb-1">{tx.itemName || 'Produk Kredit'}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <p className="text-[8px] text-slate-400 uppercase font-bold">Harga</p>
                              <p className="text-[10px] font-bold text-slate-700">Rp {tx.totalPrice.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg text-right">
                              <p className="text-[8px] text-slate-400 uppercase font-bold">Angsuran</p>
                              <p className="text-[10px] font-bold text-primary-600">Rp {tx.monthlyPayment.toLocaleString('id-ID')}/bln</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate(`/transactions/detail/${tx.id}`)}
                              className="flex-1 py-2 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                              Lihat Riwayat
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={(e) => openEditTrx(e, tx)}
                                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Edit Transaction Modal */}
        {showTrxModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay text-left">
            <div className="clean-card w-full max-w-[450px] p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900 italic">{editTrxData.id ? 'Edit Informasi' : 'Tambah'} <span className="gradient-text">Kredit</span></h3>
                <button onClick={() => setShowTrxModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Kode Buku</label>
                    <input type="text" value={editTrxData.bookCode || ''} onChange={e => setEditTrxData({...editTrxData, bookCode: e.target.value})}
                      placeholder="U-01" className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Status</label>
                    <select value={editTrxData.status} onChange={e => setEditTrxData({...editTrxData, status: e.target.value})} className="input-modern bg-white">
                      <option value="ACTIVE">AKTIF</option>
                      <option value="PAID_OFF">LUNAS</option>
                      <option value="CANCELLED">DIBATALKAN</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Nama Barang</label>
                  <input type="text" value={editTrxData.itemName || ''} onChange={e => setEditTrxData({...editTrxData, itemName: e.target.value})}
                    placeholder="Nama barang..." className="input-modern" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Tanggal Kontrak</label>
                  <input type="date" value={editTrxData.startDate ? new Date(editTrxData.startDate).toISOString().split('T')[0] : ''} 
                    onChange={e => setEditTrxData({...editTrxData, startDate: e.target.value})}
                    className="input-modern" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Harga</label>
                    <input 
                      type="number" 
                      value={(editTrxData.monthlyPayment || 0) * (editTrxData.tenor || 0)} 
                      readOnly
                      className="input-modern bg-slate-50 text-slate-500 font-bold cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Angsuran</label>
                    <input 
                      type="number" 
                      value={editTrxData.monthlyPayment} 
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        setEditTrxData({...editTrxData, monthlyPayment: val, totalPrice: val * (editTrxData.tenor || 0)})
                      }}
                      className="input-modern" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Tenor</label>
                    <select 
                      value={editTrxData.tenor} 
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0
                        setEditTrxData({...editTrxData, tenor: val, totalPrice: (editTrxData.monthlyPayment || 0) * val})
                      }}
                      className="input-modern"
                    >
                      {[3, 6, 9, 12].map(t => (
                        <option key={t} value={t}>{t} Bulan</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                {isSuperAdmin && (
                  <button 
                    onClick={() => handleTrxDelete(editTrxData.id)} 
                    className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Hapus Kredit
                  </button>
                )}
                <div className="flex-1"></div>
                <button onClick={() => setShowTrxModal(false)} className="px-4 py-2 btn-secondary text-xs">Batal</button>
                <button onClick={handleTrxSubmit} className="px-6 py-2 btn-primary text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" /> Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {customers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 animate-fadeInUp">
            <Users className="w-12 h-12 mb-3 opacity-30 text-slate-300" />
            <p className="text-sm">Belum ada pelanggan</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay">
            <div className="clean-card w-full max-w-[450px] p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Masukkan nama nasabah" 
                    className="input-modern"
                    autoFocus 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">No. HP</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="08..." className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Alamat</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      placeholder="Masukkan alamat" className="input-modern" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                    Batal
                  </button>
                  <button onClick={() => handleSubmit(false)} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-100 transition-all transform active:scale-95">
                    <Check className="w-4 h-4" /> {editCustomer ? 'Simpan Perubahan' : 'Simpan Saja'}
                  </button>
                </div>
                {!editCustomer && (
                  <button onClick={() => handleSubmit(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 glow-green-sm transition-all transform active:scale-95 border-b-4 border-emerald-800/20">
                    <Zap className="w-4 h-4" /> Simpan & Tambah Kredit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {isAdmin && (
        <button 
          onClick={openAdd}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform animate-bounce-slow"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </div>
  )
}
