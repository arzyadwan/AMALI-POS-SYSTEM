import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit3, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { formatRupiah } from '../utils/formatCurrency'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', price: 0, costPrice: 0, stock: 0, image: '', categoryId: '' })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [search, filterCategory])

  const fetchProducts = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterCategory) params.set('categoryId', filterCategory)
    const res = await fetch(`/api/products?${params}`)
    setProducts(await res.json())
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  const openAdd = () => {
    setEditProduct(null)
    setForm({ name: '', sku: '', price: 0, costPrice: 0, stock: 0, image: '', categoryId: categories[0]?.id || '' })
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      image: product.image,
      categoryId: product.categoryId
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const body = { 
      ...form, 
      price: parseFloat(form.price), 
      costPrice: parseFloat(form.costPrice),
      stock: parseInt(form.stock), 
      categoryId: parseInt(form.categoryId) 
    }
    if (editProduct) {
      await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    } else {
      await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    }
    setShowModal(false)
    fetchProducts()
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shadow-soft-green">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manajemen <span className="gradient-text">Produk</span></h2>
              <p className="text-slate-500 text-sm">{products.length} produk terdaftar</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-modern pl-10 pr-4 py-2.5"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-modern py-2.5 min-w-[160px]"
          >
            <option value="">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="clean-card shadow-sm rounded-2xl overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">Produk</th>
                  <th className="text-left text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">SKU</th>
                  <th className="text-left text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">Kategori</th>
                  <th className="text-right text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">Harga</th>
                  <th className="text-center text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">Stok</th>
                  <th className="text-center text-[10px] text-slate-500 font-semibold uppercase py-3 px-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.image || '📦'}</span>
                        <span className="text-slate-900 font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{product.sku}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-primary-400 font-semibold">{formatRupiah(product.price)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.stock > 5 ? 'bg-success-500/15 text-success-400' :
                        product.stock > 0 ? 'bg-warning-500/15 text-warning-400' :
                        'bg-danger-500/15 text-danger-400'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          <Edit3 className="w-3.5 h-3.5 text-slate-500 hover:text-primary-600" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-danger-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <div className="clean-card w-[480px] rounded-2xl p-6 animate-fadeInUp shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Nama Produk</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="input-modern" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">SKU</label>
                    <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Emoji Icon</label>
                    <input type="text" value={form.image} onChange={e => setForm({...form, image: e.target.value})}
                      className="input-modern" />
                  </div>
                </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Harga Jual</label>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Harga Modal</label>
                    <input type="number" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})}
                      className="input-modern" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Stok</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                      className="input-modern" />
                  </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Kategori</label>
                  <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}
                    className="input-modern">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary text-sm">Batal</button>
                <button onClick={handleSubmit} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {editProduct ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
