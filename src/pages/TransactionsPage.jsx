import { useState, useEffect } from 'react'
import { Receipt, Search, Eye, X, Banknote, CreditCard, User, FilterX } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { formatRupiah, formatDate, formatShortDate } from '../utils/formatCurrency'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [filterType, setFilterType] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const customerId = searchParams.get('customerId')

  useEffect(() => { fetchTransactions() }, [filterType, customerId])

  const fetchTransactions = async () => {
    const params = new URLSearchParams()
    if (filterType === 'CASH') params.set('type', 'CASH')
    else if (filterType === 'CREDIT_ACTIVE') { params.set('type', 'CREDIT'); params.set('status', 'ACTIVE') }
    else if (filterType === 'CREDIT_PAID') { params.set('type', 'CREDIT'); params.set('status', 'PAID_OFF') }
    else if (filterType === 'CREDIT') params.set('type', 'CREDIT')
    
    if (customerId) params.set('customerId', customerId)
    
    const res = await fetch(`/api/transactions?${params}`)
    setTransactions(await res.json())
  }

  const handlePayInstallment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) return alert('Jumlah tagihan tidak valid')
    
    try {
      await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          amount: parseFloat(paymentAmount)
        })
      })
      setShowPaymentModal(false)
      setPaymentAmount('')
      setSelectedTx(null)
      fetchTransactions()
    } catch (err) {
      alert('Gagal membayar cicilan')
    }
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0)

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-soft-green">
              <Receipt className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Riwayat <span className="gradient-text">Transaksi</span></h2>
              <p className="text-slate-500 text-sm">{transactions.length} transaksi • Total: <span className="font-semibold text-slate-700">{formatRupiah(totalRevenue)}</span></p>
            </div>
          </div>
        </div>

        {/* Customer Filter Alert */}
        {customerId && (
          <div className="mb-6 bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between animate-fadeInUp">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-sm font-medium text-primary-900">
                Menampilkan transaksi khusus untuk pelanggan yang dipilih.
              </p>
            </div>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:text-slate-900 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FilterX className="w-3.5 h-3.5" /> Hapus Filter
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="clean-card p-4 text-center shadow-sm">
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
          </div>
          <div className="clean-card p-4 text-center shadow-sm">
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Transaksi Cash</p>
            <p className="text-2xl font-bold text-emerald-600">{transactions.filter(t => t.type === 'CASH').length}</p>
          </div>
          <div className="clean-card p-4 text-center shadow-sm">
            <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Transaksi Kredit</p>
            <p className="text-2xl font-bold text-primary-600">{transactions.filter(t => t.type === 'CREDIT').length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-5 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          {[
            { value: '', label: 'Semua', icon: null },
            { value: 'CASH', label: 'Cash', icon: Banknote },
            { value: 'CREDIT_ACTIVE', label: 'Kredit Aktif', icon: CreditCard },
            { value: 'CREDIT_PAID', label: 'Kredit Lunas', icon: CreditCard },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-300 shadow-sm ${
                filterType === filter.value
                  ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {transactions.map(tx => (
            <div key={tx.id} className="clean-card p-4 shadow-sm hover:border-primary-300 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === 'CASH'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-primary-500/15 text-primary-400'
                  }`}>
                    {tx.type === 'CASH' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900">TRX-{String(tx.id).padStart(4, '0')}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'CASH'
                          ? 'bg-emerald-50 text-emerald-600'
                          : tx.status === 'PAID_OFF' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-50 text-primary-700'
                      }`}>
                        {tx.type === 'CASH' ? '💵 Cash' : tx.status === 'PAID_OFF' ? `💳 Lunas` : `💳 Kredit ${tx.tenor} bln`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {tx.customer?.name || 'Pelanggan Umum'} • {formatShortDate(tx.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatRupiah(tx.totalPrice)}</p>
                    {tx.type === 'CREDIT' && (
                      <div className="mt-1.5 text-right flex flex-col items-end">
                        <span className="text-primary-600 font-bold text-[10px] leading-tight">
                          Cicilan: {formatRupiah(tx.monthlyPayment)}/bln
                        </span>
                        
                        <div className="mt-2 w-32">
                          <div className="flex justify-between text-[9px] mb-1 font-bold">
                            <span className="text-slate-400">PROGRES</span>
                            <span className="text-primary-600">
                              {tx.status === 'PAID_OFF' ? '100' : Math.round((tx.installments?.reduce((sum, i) => sum + i.amount, 0) || 0) / tx.totalCredit * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                            {Array.from({ length: tx.tenor }).map((_, idx) => {
                              const totalPaid = tx.installments?.reduce((sum, i) => sum + i.amount, 0) || 0;
                              // Threshold for "paid" month is slightly less than monthlyPayment to account for floats
                              const monthsPaid = Math.floor((totalPaid + 100) / tx.monthlyPayment);
                              const isPaid = idx < monthsPaid || tx.status === 'PAID_OFF';
                              return (
                                <div 
                                  key={idx} 
                                  className={`h-full flex-1 transition-all duration-500 rounded-[1px] ${
                                    isPaid ? 'bg-primary-500 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-slate-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1 text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                            <span>0 BLN</span>
                            <span>{tx.tenor} BLN</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="w-4 h-4 text-slate-400 hover:text-primary-600" />
                  </button>
                </div>
              </div>

              {/* Items preview */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                {tx.items?.map(item => (
                  <span key={item.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/50">
                    {item.product?.image} {item.product?.name} ×{item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 animate-fadeInUp">
            <Receipt className="w-12 h-12 mb-3 opacity-30 text-slate-300" />
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <div className="clean-card w-[450px] p-6 animate-fadeInUp shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Detail Transaksi</h3>
                <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Style */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl relative">
                {/* Decorative receipt edges */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSIwIiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat-x"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI4IiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat-x"></div>

                <div className="text-center mb-4 mt-2">
                  <p className="text-sm font-bold gradient-text">AMALI KREDIT</p>
                  <p className="text-[10px] text-slate-500">Toko Elektronik & Perlengkapan Rumah</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">TRX-{String(selectedTx.id).padStart(4, '0')} • {formatDate(selectedTx.createdAt)}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                {selectedTx.customer && (
                  <>
                    <p className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Pelanggan:</p>
                    <p className="text-xs text-slate-900 font-bold mb-3">{selectedTx.customer.name} ({selectedTx.customer.phone})</p>
                  </>
                )}

                <div className="space-y-2">
                  {selectedTx.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-600">
                        {item.product?.image} {item.product?.name} <span className="text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="text-slate-900 font-medium">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900 font-bold">{formatRupiah(selectedTx.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 bg-slate-100/50 rounded-lg px-2 -mx-2">
                    <span className="text-slate-500">Tipe</span>
                    <span className={`font-bold ${selectedTx.type === 'CASH' ? 'text-emerald-600' : 'text-primary-600'}`}>
                      {selectedTx.type === 'CASH' ? '💵 Cash' : '💳 Kredit'}
                    </span>
                  </div>
                  {selectedTx.type === 'CREDIT' && (
                    <>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-500">Tenor</span>
                        <span className="text-slate-900 font-medium">{selectedTx.tenor} Bulan</span>
                      </div>
                      {selectedTx.dpAmount > 0 && (
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-slate-500">Uang Muka</span>
                          <span className="text-emerald-600 font-semibold">- {formatRupiah(selectedTx.dpAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-500">Cicilan/Bulan</span>
                        <span className="text-primary-600 font-bold">{formatRupiah(selectedTx.monthlyPayment)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-sm">
                        <span className="text-slate-800 font-bold">Total Kewajiban</span>
                        <span className="text-warning-600 font-bold">{formatRupiah(selectedTx.totalCredit)}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1 mt-1">
                        <span className="text-slate-500">Telah Dibayar</span>
                        <span className="text-emerald-600 font-bold">
                          {formatRupiah(selectedTx.installments?.reduce((sum, i) => sum + i.amount, 0) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-500">Sisa Tagihan</span>
                        <span className="text-danger-600 font-bold">
                          {formatRupiah(Math.max(0, selectedTx.totalCredit - (selectedTx.installments?.reduce((sum, i) => sum + i.amount, 0) || 0)))}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-300 my-3" />
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold pb-1">Terima kasih</p>
              </div>

              <div className="mt-4 space-y-2">
                {selectedTx.type === 'CREDIT' && selectedTx.status === 'ACTIVE' && (
                  <button 
                    onClick={() => {
                      setPaymentAmount(selectedTx.monthlyPayment)
                      setShowPaymentModal(true)
                    }} 
                    className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm shadow-sm border-0"
                  >
                    Bayar Cicilan
                  </button>
                )}
                <button onClick={() => setSelectedTx(null)} className="w-full btn-secondary text-sm">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedTx && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] modal-overlay">
            <div className="clean-card w-[400px] p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Bayar Cicilan</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sisa Tagihan</span>
                  <span className="text-slate-900 font-bold">{formatRupiah(Math.max(0, selectedTx.totalCredit - (selectedTx.installments?.reduce((sum, i) => sum + i.amount, 0) || 0)))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cicilan per Bulan</span>
                  <span className="text-slate-900 font-bold">{formatRupiah(selectedTx.monthlyPayment)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Jumlah Bayar (Rp)</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                    className="input-modern" />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary text-sm">Batal</button>
                <button onClick={handlePayInstallment} className="flex-1 btn-primary text-sm bg-emerald-600 hover:bg-emerald-700 shadow-sm border-0">
                  Konfirmasi Bayar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
