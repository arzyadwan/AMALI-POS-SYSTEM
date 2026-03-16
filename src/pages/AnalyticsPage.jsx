import { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, CreditCard, 
  Calendar, ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../utils/formatCurrency'

export default function AnalyticsPage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [summaryRes, trendRes, topRes] = await Promise.all([
          fetch('http://localhost:3002/api/stats/summary', { headers: authHeaders }),
          fetch('http://localhost:3002/api/stats/sales-trend', { headers: authHeaders }),
          fetch('http://localhost:3002/api/stats/top-products', { headers: authHeaders })
        ])
        
        setSummary(await summaryRes.json())
        setTrend(await trendRes.json())
        setTopProducts(await topRes.json())
      } catch (e) {
        console.error("Failed to fetch analytics", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Memuat data analitik...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316']

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeInUp">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary-600" />
              Laporan & <span className="gradient-text">Analitik</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Pantau performa bisnis dan pertumbuhan penjualan Anda</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 text-sm overflow-hidden">
            <button className="px-4 py-2 bg-primary-50 text-primary-700 font-bold rounded-lg transition-all">30 Hari Terakhir</button>
            <button className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold rounded-lg transition-all">Minggu Ini</button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <StatCard 
            label="Total Pendapatan" 
            value={formatRupiah(summary?.totalRevenue || 0)} 
            icon={DollarSign} 
            color="bg-indigo-50 text-indigo-600 border-indigo-100"
            subLabel="Total omzet kotor"
          />
          <StatCard 
            label="Estimasi Laba" 
            value={formatRupiah(summary?.totalProfit || 0)} 
            icon={TrendingUp} 
            color="bg-emerald-50 text-emerald-600 border-emerald-100"
            subLabel={`Profit margin ~${Math.round((summary?.totalProfit / (summary?.totalRevenue || 1)) * 100)}%`}
          />
          <StatCard 
            label="Total Transaksi" 
            value={summary?.totalTransactions || 0} 
            icon={ShoppingBag} 
            color="bg-amber-50 text-amber-600 border-amber-100"
            subLabel="Volume penjualan"
          />
          <StatCard 
            label="Kredit Aktif" 
            value={summary?.activeCreditCount || 0} 
            icon={CreditCard} 
            color="bg-rose-50 text-rose-600 border-rose-100"
            subLabel="Kontrak berjalan"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Sales Trend Chart */}
          <div className="lg:col-span-2 space-y-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              Tren Penjualan & Profit
            </h3>
            <div className="clean-card p-6 shadow-sm min-h-[400px]">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11}}
                      tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11}}
                      tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}jt` : val >= 1000 ? `${(val/1000)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(val) => [formatRupiah(val), '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Pendapatan" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      name="Estimasi Laba" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products Bar Chart */}
          <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              Produk Terlaris
            </h3>
            <div className="clean-card p-6 shadow-sm min-h-[400px]">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      width={80}
                      tick={{fill: '#64748b', fontSize: 10, fontWeight: 600}}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(val, name, props) => [
                        <div key="info">
                          <p className="font-bold">{val} Unit</p>
                          <p className="text-[10px] text-slate-400">{formatRupiah(props.payload.revenue)}</p>
                        </div>, 
                        'Terjual'
                      ]}
                    />
                    <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 font-medium truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{p.quantity} Unit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Business Insights Table (Mocked calculation for now) */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="clean-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Ringkasan Performa Produk</h3>
              {/* <button className="text-xs font-bold text-primary-600 hover:underline">Download Report</button> */}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                  <tr>
                    <th className="px-6 py-4">Nama Produk</th>
                    <th className="px-6 py-4 text-center">Unit Terjual</th>
                    <th className="px-6 py-4 text-right">Pendapatan</th>
                    <th className="px-6 py-4 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-400 italic">Belum ada data penjualan yang cukup</td>
                    </tr>
                  ) : topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">{p.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatRupiah(p.revenue)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {Math.round((p.revenue * 0.25) / p.revenue * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, subLabel }) {
  return (
    <div className="clean-card p-6 shadow-sm group hover:border-primary-300 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 border ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {subLabel && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{subLabel}</span>}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  )
}
