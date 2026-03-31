import { useState } from 'react'
import { Database, Download, ShieldCheck, HardDrive, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleDownloadBackup = async () => {
    setLoading(true)
    setSuccess(false)
    try {
      const response = await fetch('/api/backup/download', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorMsg = await response.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(errorMsg.error || 'Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `amali-kredit-backup-${date}.db`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      setSuccess(true)
    } catch (error) {
      console.error('Backup error:', error)
      alert(`Gagal mengunduh cadangan database: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResetSystem = async () => {
    const confirm1 = window.confirm('APAKAH ANDA YAKIN? Tindakan ini akan MENGHAPUS SELURUH DATA transaksi, pelanggan, dan produk. Data yang sudah dihapus tidak dapat dikembalikan!')
    if (!confirm1) return

    const confirm2 = window.confirm('KONFIRMASI TERAKHIR: Anda benar-benar yakin ingin mengosongkan sistem? (Data akun login tetap aman)')
    if (!confirm2) return

    setLoading(true)
    try {
      const response = await fetch('/api/system/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Reset failed')

      alert(data.message || 'Sistem berhasil direset!')
      window.location.reload() // Reload to clear any cached data in state
    } catch (error) {
      console.error('Reset error:', error)
      alert(`Gagal melakukan reset sistem: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 animate-fadeInUp">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pengaturan <span className="gradient-text">Sistem</span></h2>
            <p className="text-slate-500 text-sm">Kelola keamanan dan pemeliharaan aplikasi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Backup Card */}
          <div className="clean-card p-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cadangan Database</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Unduh salinan lengkap database SQLite Anda (`dev.db`). Gunakan file ini untuk memulihkan data jika terjadi kegagalan sistem.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
                loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {loading ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Menyiapkan...' : 'Unduh Cadangan .db'}
            </button>
            {success && (
              <p className="text-success-600 text-[11px] font-bold mt-3 text-center flex items-center justify-center gap-1">
                ✅ Berhasil diunduh! Simpan file di tempat aman.
              </p>
            )}
          </div>

          {/* System Info Card */}
          <div className="clean-card p-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Informasi Sistem</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-xs">Versi Aplikasi</span>
                <span className="text-slate-900 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded">v2.1.0-backup</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500 text-xs">Format Database</span>
                <span className="text-slate-900 text-xs font-bold">SQLite 3</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500 text-xs">Status Server</span>
                <span className="flex items-center gap-1 text-success-600 text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></div> Online
                </span>
              </div>
            </div>
          </div>

          {/* Reset System Card */}
          <div className="clean-card p-6 border-red-100 bg-red-50/10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Reset Sistem</h3>
            <p className="text-red-700/70 text-sm mb-6 leading-relaxed">
              Hapus seluruh data bisnis (transaksi, produk, pelanggan, dll). 
              <span className="block mt-2 font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Tindakan ini tidak dapat dibatalkan!
              </span>
            </p>
            <button
              onClick={handleResetSystem}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
                loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
              }`}
            >
              {loading ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {loading ? 'Memproses...' : 'Hapus Semua Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
