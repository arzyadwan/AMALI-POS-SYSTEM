import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Users, DollarSign, Clock, TrendingUp, ChevronRight, X, CreditCard, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatCurrency'

const AGING_COLORS = {
  current:  { bar: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Lancar' },
  days1_30: { bar: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   label: '1-30 Hari' },
  days31_60:{ bar: 'bg-orange-400',  text: 'text-orange-600',  bg: 'bg-orange-50',  label: '31-60 Hari' },
  days61_90:{ bar: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50',     label: '61-90 Hari' },
  daysOver90:{ bar: 'bg-rose-700',   text: 'text-rose-700',    bg: 'bg-rose-50',    label: '>90 Hari' },
}

export default function CollectionPage() {
  const { token } = useAuth()
  const [agingData, setAgingData] = useState([])
  const [overdueList, setOverdueList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [payingInst, setPayingInst] = useState(null)
  const [payMsg, setPayMsg] = useState('')

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  async function fetchData() {
    setLoading(true)
    try {
      const [agingRes, overdueRes] = await Promise.all([
        fetch('/api/collection/aging', { headers: authHeaders }),
        fetch('/api/collection/overdue', { headers: authHeaders })
      ])
      setAgingData(await agingRes.json())
      setOverdueList(await overdueRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const summary = useMemo(() => ({
    totalOverdue: agingData.reduce((s, c) => s + c.totalOverdue, 0),
    customerCount: agingData.length,
    installmentCount: overdueList.length,
    estimatedFees: overdueList.reduce((s, i) => s + (i.estimatedLateFee || 0), 0),
  }), [agingData, overdueList])

  async function handlePayInstallment(inst) {
    setPayMsg('')
    setPayingInst(inst)
  }

  async function confirmPay() {
    try {
      const res = await fetch('/api/installments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ transactionId: payingInst.transactionId, amount: payingInst.amount })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPayingInst(null)
      setPayMsg(`✅ Cicilan bulan ke-${payingInst.monthIndex} berhasil dicatat.${data.lateFee > 0 ? ` Denda: ${formatRupiah(data.lateFee)}` : ''}`)
      fetchData()
      setTimeout(() => setPayMsg(''), 5000)
    } catch (e) {
      setPayMsg('❌ ' + e.message)
    }
  }

  const customerOverdue = selectedCustomer
    ? overdueList.filter(i => i.transaction?.customerId === selectedCustomer.customerId)
    : overdueList

  function agingBadge(days) {
    if (days <= 0) return AGING_COLORS.current
    if (days <= 30) return AGING_COLORS.days1_30
    if (days <= 60) return AGING_COLORS.days31_60
    if (days <= 90) return AGING_COLORS.days61_90
    return AGING_COLORS.daysOver90
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fadeInUp flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Piutang & <span className="gradient-text">Penagihan</span></h2>
            <p className="text-slate-500 text-sm">Laporan aging dan cicilan yang melewati jatuh tempo</p>
          </div>
        </div>

        {payMsg && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${payMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {payMsg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          {[
            { label: 'Total Piutang', value: formatRupiah(summary.totalOverdue), icon: DollarSign, color: 'text-red-500 bg-red-50' },
            { label: 'Pelanggan Menunggak', value: summary.customerCount, icon: Users, color: 'text-amber-500 bg-amber-50' },
            { label: 'Cicilan Overdue', value: summary.installmentCount, icon: Clock, color: 'text-orange-500 bg-orange-50' },
            { label: 'Est. Total Denda', value: formatRupiah(summary.estimatedFees), icon: TrendingUp, color: 'text-rose-500 bg-rose-50' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="clean-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-black text-slate-900">{s.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Aging Report Table */}
          <div className="lg:col-span-3 space-y-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Laporan Aging Piutang
            </h3>
            <div className="clean-card shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-slate-400 text-sm">Memuat data...</div>
              ) : agingData.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Tidak ada piutang yang jatuh tempo 🎉</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Pelanggan</th>
                      <th className="text-right text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">1-30 Hr</th>
                      <th className="text-right text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">31-60 Hr</th>
                      <th className="text-right text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">&gt;60 Hr</th>
                      <th className="text-right text-[10px] text-slate-400 font-semibold uppercase tracking-wider p-4">Total</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData.map((c, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${selectedCustomer?.customerId === c.customerId ? 'bg-primary-50' : 'hover:bg-slate-50/50'}`}
                        onClick={() => setSelectedCustomer(selectedCustomer?.customerId === c.customerId ? null : c)}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{c.customerName}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.customerPhone}</p>
                        </td>
                        <td className="p-4 text-right">
                          {c.days1_30 > 0 ? <span className="text-amber-600 font-semibold">{formatRupiah(c.days1_30)}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="p-4 text-right">
                          {c.days31_60 > 0 ? <span className="text-orange-600 font-semibold">{formatRupiah(c.days31_60)}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="p-4 text-right">
                          {c.days61_90 + c.daysOver90 > 0 ? <span className="text-red-600 font-semibold">{formatRupiah(c.days61_90 + c.daysOver90)}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="p-4 text-right font-black text-slate-900">{formatRupiah(c.totalOverdue)}</td>
                        <td className="p-4"><ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedCustomer?.customerId === c.customerId ? 'rotate-90' : ''}`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>

          {/* Overdue Installments */}
          <div className="lg:col-span-2 space-y-4 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Cicilan Jatuh Tempo</span>
              {selectedCustomer && (
                <button onClick={() => setSelectedCustomer(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <X className="w-3 h-3" /> Reset Filter
                </button>
              )}
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="clean-card p-6 text-center text-slate-400 text-sm">Memuat...</div>
              ) : customerOverdue.length === 0 ? (
                <div className="clean-card p-6 text-center text-slate-400 text-sm">Tidak ada cicilan overdue</div>
              ) : customerOverdue.map((inst, i) => {
                const badge = agingBadge(inst.overdueDays)
                return (
                  <div key={i} className="clean-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{inst.transaction?.customer?.name || 'Pelanggan'}</p>
                        <p className="text-[11px] text-slate-400">Cicilan ke-{inst.monthIndex} · Transaksi #{inst.transactionId}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${badge.bg} ${badge.text}`}>{badge.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{formatRupiah(inst.amount)}</p>
                        {inst.estimatedLateFee > 0 && (
                          <p className="text-[11px] text-red-500 font-medium">+ {formatRupiah(inst.estimatedLateFee)} denda</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Jatuh tempo: {new Date(inst.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {inst.overdueDays > 0 && ` · ${inst.overdueDays} hari lewat`}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePayInstallment(inst)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Bayar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Confirm Payment Modal */}
        {payingInst && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeInUp">
              <h3 className="font-bold text-slate-900 mb-1">Konfirmasi Pembayaran Cicilan</h3>
              <p className="text-slate-500 text-sm mb-4">
                {payingInst.transaction?.customer?.name} · Cicilan ke-{payingInst.monthIndex}
              </p>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pokok Cicilan</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(payingInst.amount)}</span>
                </div>
                {payingInst.estimatedLateFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Estimasi Denda</span>
                    <span className="font-semibold text-red-500">{formatRupiah(payingInst.estimatedLateFee)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between">
                  <span className="font-bold text-slate-700">Total Bayar</span>
                  <span className="font-black text-slate-900">{formatRupiah(payingInst.amount + (payingInst.estimatedLateFee || 0))}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPayingInst(null)} className="flex-1 btn-secondary text-sm">Batal</button>
                <button onClick={confirmPay} className="flex-1 btn-primary text-sm">Konfirmasi Bayar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
