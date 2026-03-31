import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X
} from 'lucide-react'
import { formatRupiah } from '../utils/formatCurrency'
import { useAuth } from '../context/AuthContext'

export default function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState(null)
  const [formData, setFormData] = useState({
    monthIndex: '',
    amount: '',
    dueDate: '',
    status: 'PENDING',
    paymentDate: ''
  })

  useEffect(() => {
    fetchTransactionDetail()
  }, [id])

  const fetchTransactionDetail = async () => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('amali_token')}` }
      })
      const data = await res.json()
      if (res.ok) {
        setTransaction(data)
      } else {
        console.error('Error fetching transaction:', data.error)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (installmentId) => {
    if (!confirm('Proses pembayaran untuk angsuran ini?')) return
    
    try {
      // The current API expects { transactionId, amount } for bulk pay, 
      // but we can make it more specific if needed.
      // For now, let's use the bulk pay API with the exact amount of one installment.
      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('amali_token')}`
        },
        body: JSON.stringify({
          transactionId: transaction.id,
          amount: transaction.monthlyPayment
        })
      })
      
      if (res.ok) {
        alert('Pembayaran berhasil diproses!')
        fetchTransactionDetail()
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      alert('Terjadi kesalahan saat memproses pembayaran')
    }
  }

  const openAddModal = () => {
    setEditingInstallment(null)
    setFormData({
      monthIndex: (transaction.installments?.length || 0) + 1,
      amount: transaction.monthlyPayment,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      paymentDate: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (inst) => {
    setEditingInstallment(inst)
    setFormData({
      monthIndex: inst.monthIndex,
      amount: inst.amount,
      dueDate: new Date(inst.dueDate).toISOString().split('T')[0],
      status: inst.status,
      paymentDate: inst.paymentDate ? new Date(inst.paymentDate).toISOString().split('T')[0] : ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (instId) => {
    if (!confirm('Hapus data angsuran ini secara permanen?')) return
    try {
      const res = await fetch(`/api/installments/${instId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('amali_token')}` }
      })
      if (res.ok) {
        fetchTransactionDetail()
      } else {
        const err = await res.json()
        alert('Gagal menghapus: ' + err.error)
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url = editingInstallment ? `/api/installments/${editingInstallment.id}` : '/api/installments/manual'
    const method = editingInstallment ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('amali_token')}`
        },
        body: JSON.stringify({
          ...formData,
          transactionId: transaction.id
        })
      })
      
      if (res.ok) {
        setIsModalOpen(false)
        fetchTransactionDetail()
      } else {
        const err = await res.json()
        alert('Gagal menyimpan: ' + err.error)
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Transaksi Tidak Ditemukan</h2>
        <button 
          onClick={() => navigate('/customers')}
          className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold"
        >
          Kembali ke Pelanggan
        </button>
      </div>
    )
  }

  const { customer, installments } = transaction
  const startDate = new Date(transaction.startDate)
  const firstPaymentDate = installments?.length > 0 ? new Date(installments[0].dueDate) : null
  const remainingPrice = transaction.totalPrice - transaction.dpAmount
  const adminFee = 200000 // Specified in plan

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div className="max-w-5xl mx-auto pb-20">
        {/* Header Action */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm">Kembali</span>
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 clean-card p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-primary-600 text-white rounded-lg font-bold text-xs shadow-md">
                  {transaction.bookCode || 'N/A'}
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{transaction.itemName || 'Produk Kredit'}</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  Kontrak: {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  transaction.status === 'ACTIVE' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : transaction.status === 'PAID_OFF'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {transaction.status === 'ACTIVE' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {transaction.status === 'ACTIVE' ? 'KREDIT AKTIF' : transaction.status === 'PAID_OFF' ? 'LUNAS' : transaction.status}
                </div>
              </div>
            </div>
          </div>
          
          <div className="clean-card p-6 bg-primary-600 text-white shadow-primary-200">
            <p className="text-primary-100 font-bold uppercase tracking-widest text-[10px] mb-1">Angsuran / Bulan</p>
            <h2 className="text-3xl font-black mb-4">{formatRupiah(transaction.monthlyPayment)}</h2>
            <div className="pt-4 border-t border-primary-500/50 flex justify-between items-center">
              <span className="text-xs font-medium opacity-80">Tenor {transaction.tenor} Bulan</span>
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-lg font-bold">Total Kredit: {formatRupiah(transaction.totalCredit)}</span>
            </div>
          </div>
        </div>

        {/* Detailed Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer & Contract Card */}
          <div className="space-y-6">
            <div className="clean-card p-6">
              <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" /> Informasi Nasabah
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label>
                    <p className="text-sm font-bold text-slate-800">{customer?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Alamat</label>
                    <p className="text-sm font-bold text-slate-800">{customer?.address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">No. Handphone</label>
                    <p className="text-sm font-bold text-slate-800 font-mono tracking-wider">{customer?.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="clean-card p-6 border-l-4 border-l-primary-500">
              <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" /> Detail Kontrak
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tanggal Kontrak</label>
                  <p className="text-sm font-bold text-slate-800">{startDate.toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jatuh Tempo Pertama</label>
                  <p className="text-sm font-bold text-slate-800">{firstPaymentDate ? firstPaymentDate.toLocaleDateString('id-ID') : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="clean-card p-0 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-600" /> Rincian Biaya
              </h3>
            </div>
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-slate-500">Harga Barang</span>
                <span className="text-sm font-bold text-slate-800">{formatRupiah(transaction.totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-slate-500">Uang Muka (DP)</span>
                <span className="text-sm font-bold text-emerald-600">-{formatRupiah(transaction.dpAmount)}</span>
              </div>
              <div className="h-[1px] w-full bg-slate-100 my-2"></div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-bold text-slate-700">Sisa Harga (Pokok)</span>
                <span className="text-sm font-black text-slate-900">{formatRupiah(remainingPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-slate-500">Biaya Administrasi</span>
                <span className="text-sm font-bold text-slate-800">{formatRupiah(adminFee)}</span>
              </div>
              <div className="bg-primary-50 p-4 rounded-xl mt-4 border border-primary-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary-700 uppercase">Tenor Kredit</span>
                  <span className="text-sm font-black text-primary-900">{transaction.tenor} Bulan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Progress List */}
        <div className="clean-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" /> Progres Pembayaran Cicilan
            </h3>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                {installments?.filter(i => i.status === 'PAID').length || 0} / {transaction.tenor} Terbayar
              </span>
              {isAdmin && (
                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Manual
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ke-</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan / Tempo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Biaya Angsuran</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tgl Pembayaran</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {installments?.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {inst.monthIndex}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800">Bulan Ke-{inst.monthIndex}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Tempo: {new Date(inst.dueDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-slate-700">{formatRupiah(inst.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black ${
                        inst.status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inst.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-slate-500">
                        {inst.paymentDate ? new Date(inst.paymentDate).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button 
                              onClick={() => openEditModal(inst)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                              title="Edit Angsuran"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(inst.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              title="Hapus Angsuran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          inst.status === 'PENDING' ? (
                            <button 
                              onClick={() => handlePay(inst.id)}
                              className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-[10px] font-bold hover:bg-primary-700 transition-colors flex items-center gap-1 ml-auto"
                            >
                              Bayar <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">Terbayar</span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Installment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-zoomIn">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {editingInstallment ? 'Edit Angsuran' : 'Tambah Angsuran Manual'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{transaction.itemName}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Bulan Ke-</label>
                  <input 
                    type="number" 
                    value={formData.monthIndex}
                    onChange={(e) => setFormData({...formData, monthIndex: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Biaya Angsuran</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tanggal Jatuh Tempo</label>
                <input 
                  type="date" 
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">LUNAS (PAID)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tanggal Bayar</label>
                  <input 
                    type="date" 
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    disabled={formData.status === 'PENDING'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
