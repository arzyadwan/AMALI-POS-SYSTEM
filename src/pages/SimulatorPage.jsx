import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, ArrowRight, Zap, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { formatRupiah } from '../utils/formatCurrency'
import { calculateMonthly, calculateTotalCredit, calculateEarlyPayoff, getAllTenorComparison, TENOR_OPTIONS, CREDIT_FACTORS, ADMIN_FEE } from '../utils/creditCalculator'

export default function SimulatorPage() {
  const [price, setPrice] = useState(1000000)
  const [dp, setDp] = useState(0)
  const [selectedTenor, setSelectedTenor] = useState(12)
  const [showEarlyPayoff, setShowEarlyPayoff] = useState(false)
  const [paidMonths, setPaidMonths] = useState(3)
  const [targetTenor, setTargetTenor] = useState(3)

  const dpMinimum = Math.round(price * 0.2)
  const isDpLowerThanMin = dp < dpMinimum
  
  const principal = Math.max(price - dp, 0)
  const monthly = calculateMonthly(principal, selectedTenor)
  const totalCredit = calculateTotalCredit(principal, selectedTenor)
  const grandTotal = totalCredit + dp + ADMIN_FEE
  const margin = totalCredit - principal
  const comparison = useMemo(() => getAllTenorComparison(principal), [principal])

  const earlyPayoff = calculateEarlyPayoff(principal, selectedTenor, targetTenor, paidMonths)

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
              <Calculator className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Simulator <span className="gradient-text">Kredit</span></h2>
              <p className="text-slate-500 text-sm">Hitung simulasi cicilan & pelunasan dipercepat</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="clean-card p-5 space-y-4 shadow-sm relative z-10">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-500" /> Input Simulasi
              </h3>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Harga Barang</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(parseInt(e.target.value) || 0)}
                  onBlur={() => {
                    if (dp < dpMinimum) {
                      setDp(dpMinimum)
                    }
                  }}
                  className="input-modern"
                />
                <p className="text-[11px] text-slate-500 mt-1">{formatRupiah(price)}</p>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1.5">Uang Muka (DP)</label>
                <input
                  type="number"
                  value={dp || ''}
                  onChange={e => setDp(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={`input-modern ${isDpLowerThanMin ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-100 bg-amber-50/10' : ''}`}
                />
                {isDpLowerThanMin ? (
                  <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                    ⚠️ DP minimal 20% ({formatRupiah(dpMinimum)})
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">{formatRupiah(dp)}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-2">Tenor</label>
                <div className="grid grid-cols-2 gap-2">
                  {TENOR_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTenor(t)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        selectedTenor === t
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {t} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Harga Pokok</span>
                  <span className="text-slate-900 font-bold">{formatRupiah(principal)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Biaya Admin</span>
                  <span className="text-primary-600 font-bold">{formatRupiah(ADMIN_FEE)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Faktor Pengali</span>
                  <span className="text-accent-600 font-mono font-bold">{CREDIT_FACTORS[selectedTenor]}</span>
                </div>
              </div>
            </div>

            {/* Early Payoff */}
            <div className="clean-card p-5 shadow-sm">
              <button
                onClick={() => setShowEarlyPayoff(!showEarlyPayoff)}
                className="w-full flex items-center justify-between text-sm font-bold text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Pelunasan Dipercepat
                </span>
                {showEarlyPayoff ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showEarlyPayoff && (
                <div className="mt-4 space-y-3 animate-fadeInUp">
                  <div className="bg-primary-50 border border-primary-100 p-3 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-primary-700 leading-relaxed">
                        Jika pelanggan ingin melunasi sebelum tenor habis, hitung sisa kewajiban berdasarkan skema tenor target.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1.5">Bulan Sudah Dibayar</label>
                    <input
                      type="number"
                      value={paidMonths}
                      onChange={e => setPaidMonths(parseInt(e.target.value) || 0)}
                      min="0"
                      max={selectedTenor}
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1.5">Tenor Target</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TENOR_OPTIONS.filter(t => t < selectedTenor).map(t => (
                        <button
                          key={t}
                          onClick={() => setTargetTenor(t)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            targetTenor === t
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {t} bln
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <p className="text-[10px] text-emerald-800 mb-1 font-semibold uppercase tracking-wider">Sisa Kewajiban Pelunasan</p>
                    <p className="text-xl font-bold text-emerald-600">{formatRupiah(Math.max(earlyPayoff, 0))}</p>
                    <p className="text-[10px] text-emerald-700/70 mt-1 font-mono">
                      Formula: (P × F<sub>{targetTenor}</sub> × {targetTenor}) - (Cicilan × {paidMonths})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <div className="clean-card p-4 lg:p-5 text-center shadow-sm">
                <p className="text-[10px] lg:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Cicilan / Bulan</p>
                <p className="text-xl lg:text-2xl font-bold text-primary-600">{formatRupiah(monthly)}</p>
                <p className="text-[10px] text-slate-400 mt-1">× {selectedTenor} bulan</p>
              </div>
              <div className="clean-card p-4 lg:p-5 text-center shadow-sm">
                <p className="text-[10px] lg:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Pembayaran</p>
                <p className="text-xl lg:text-2xl font-bold text-warning-500">{formatRupiah(grandTotal)}</p>
                <p className="text-[9px] lg:text-[10px] text-slate-400 mt-1 leading-tight">
                  {formatRupiah(totalCredit)} (K) + {formatRupiah(dp)} (D) + {formatRupiah(ADMIN_FEE)} (A)
                </p>
              </div>
              <div className="clean-card p-4 lg:p-5 text-center shadow-sm">
                <p className="text-[10px] lg:text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Margin Keuntungan</p>
                <p className="text-xl lg:text-2xl font-bold text-emerald-600">{formatRupiah(margin)}</p>
                <p className="text-[9px] lg:text-[10px] text-slate-400 mt-1">
                  {principal > 0 ? `${((margin / principal) * 100).toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="clean-card p-5 shadow-sm animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Perbandingan Semua Tenor
              </h3>
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">Tenor</th>
                      <th className="text-left text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">Faktor</th>
                      <th className="text-right text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">Cicilan/Bulan</th>
                      <th className="text-right text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">Total Kewajiban</th>
                      <th className="text-right text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">Margin</th>
                      <th className="text-right text-[10px] text-slate-500 font-semibold uppercase py-3 px-3">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map(row => (
                      <tr
                        key={row.tenor}
                        className={`border-b border-slate-100 transition-all hover:bg-slate-50 last:border-0 ${
                          row.tenor === selectedTenor ? 'bg-primary-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            row.tenor === selectedTenor
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.tenor} Bulan
                            {row.tenor === selectedTenor && <span className="text-[10px] font-bold">✓</span>}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-accent-600 font-mono text-sm font-semibold">{row.factor}</td>
                        <td className="py-3 px-3 text-right text-slate-900 font-semibold text-sm">{formatRupiah(row.monthly)}</td>
                        <td className="py-3 px-3 text-right text-warning-600 font-bold text-sm">{formatRupiah(row.total)}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 font-semibold text-sm">{formatRupiah(row.margin)}</td>
                        <td className="py-3 px-3 text-right text-slate-500 font-medium text-xs">{row.marginPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Breakdown */}
            <div className="clean-card p-5 shadow-sm animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Visualisasi Cicilan</h3>
              <div className="space-y-3">
                {comparison.map(row => {
                  const maxTotal = Math.max(...comparison.map(c => c.total))
                  const width = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0
                  return (
                    <div key={row.tenor} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-14 font-medium">{row.tenor} bln</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200/50">
                        <div
                          className={`h-full rounded-r-lg transition-all duration-700 ${
                            row.tenor === selectedTenor
                              ? 'bg-gradient-to-r from-primary-500 to-emerald-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${width}%` }}
                        />
                        <span className={`absolute inset-0 flex items-center justify-end pr-3 text-[10px] font-bold ${
                          row.tenor === selectedTenor ? 'text-white' : 'text-slate-600'
                        }`}>
                          {formatRupiah(row.total)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
