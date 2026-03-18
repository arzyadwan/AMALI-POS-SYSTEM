import { useState, useEffect } from 'react'
import { Search, Filter, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, User, X, Check, ChevronDown, Download } from 'lucide-react'
import { formatRupiah } from '../utils/formatCurrency'
import { calculateMonthly, calculateTotalCredit, TENOR_OPTIONS, CREDIT_FACTORS, ADMIN_FEE } from '../utils/creditCalculator'

export default function POSPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [paymentType, setPaymentType] = useState('CASH')
  const [tenor, setTenor] = useState(12)
  const [dpAmount, setDpAmount] = useState(0)

  // Customer State
  const [customers, setCustomers] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [lastTransaction, setLastTransaction] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [search, activeCategory])

  const fetchProducts = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (activeCategory) params.set('categoryId', activeCategory)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data)
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(data)
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: 1
      }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item
      const newQty = item.quantity + delta
      if (newQty <= 0) return null
      if (newQty > item.stock) return item
      return { ...item, quantity: newQty }
    }).filter(Boolean))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const dpMinimum = Math.round(subtotal * 0.2)
  const isDpLowerThanMin = paymentType === 'CREDIT' && dpAmount < dpMinimum
  
  const principal = subtotal - dpAmount
  const monthlyPayment = paymentType === 'CREDIT' ? calculateMonthly(principal > 0 ? principal : 0, tenor) : 0
  const totalCredit = paymentType === 'CREDIT' ? calculateTotalCredit(principal > 0 ? principal : 0, tenor) : 0
  
  // Total to pay at checkout (including DP and Admin Fee)
  const checkoutTotal = paymentType === 'CREDIT' 
    ? totalCredit + dpAmount + ADMIN_FEE 
    : subtotal

  const handleCheckout = async () => {
    if (cart.length === 0) return

    try {
      const body = {
        type: paymentType,
        tenor: paymentType === 'CREDIT' ? tenor : 0,
        dpAmount: paymentType === 'CREDIT' ? dpAmount : 0,
        adminFee: paymentType === 'CREDIT' ? ADMIN_FEE : 0,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }

      if (paymentType === 'CREDIT') {
        if (!selectedCustomerId) {
          alert('Harap pilih pelanggan yang terdaftar untuk transaksi kredit.')
          return
        }
        body.customerId = parseInt(selectedCustomerId)
      } else {
        // Create custom customer if name provided for CASH
        if (customerName.trim()) {
          const custRes = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customerName, phone: customerPhone })
          })
          const customer = await custRes.json()
          body.customerId = customer.id
        }
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const transaction = await res.json()
      setLastTransaction(transaction)
      setCheckoutSuccess(true)
      setCart([])
      setDpAmount(0)
      setCustomerName('')
      setCustomerPhone('')
      setSelectedCustomerId('')
      setCustomerSearch('')
      fetchProducts()
    } catch (err) {
      console.error('Checkout failed:', err)
    }
  }

  return (
    <>
      <div className="flex h-full">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="mb-6 animate-fadeInUp">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Kasir <span className="text-primary-600">POS</span></h2>
          <p className="text-slate-500 text-sm">Pilih produk untuk ditambahkan ke keranjang</p>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk atau SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-5 flex-wrap animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              !activeCategory
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg glow-blue'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg glow-blue'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {products.map((product, i) => (
              <div
                key={product.id}
                onClick={() => product.stock > 0 && addToCart(product)}
                className="product-card glass-card p-4 cursor-pointer group relative"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Stock Badge */}
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold flex flex-col items-end ${
                  product.stock > 5
                    ? 'bg-success-500/20 text-success-400'
                    : product.stock > 0
                    ? 'bg-warning-500/20 text-warning-400 border border-warning-500/15'
                    : 'bg-danger-500/20 text-danger-400 font-black'
                }`}>
                  <span>{product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}</span>
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="text-[7px] uppercase tracking-tighter opacity-80 mt-0.5">Stok Rendah</span>
                  )}
                </div>

                {/* Emoji Image */}
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {product.image || '📦'}
                </div>

                {/* Info */}
                <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-[10px] text-slate-500 mb-2 font-mono">{product.sku}</p>
                <p className="text-sm font-bold text-primary-400">{formatRupiah(product.price)}</p>

                {/* Category badge */}
                <div className="mt-2 text-left">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {product.category?.name}
                  </span>
                </div>

                {/* Cart indicator */}
                {cart.find(item => item.productId === product.id) && (
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {cart.find(item => item.productId === product.id).quantity}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="flex items-center justify-center h-40 text-slate-500">
              <p>Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart / Receipt Sidebar */}
      <div className="w-[380px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
              <h3 className="text-base font-bold text-slate-900">Keranjang</h3>
            </div>
            {cart.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} item
              </span>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Keranjang kosong</p>
              <p className="text-xs mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="cart-item clean-card p-3 rounded-xl flex items-center gap-3">
                <span className="text-2xl">{item.image}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-primary-600 font-bold">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId, -1) }}
                    className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId, 1) }}
                    className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-slate-600" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.productId) }}
                    className="w-6 h-6 rounded-lg bg-danger-50 flex items-center justify-center hover:bg-danger-100 transition-colors ml-1"
                  >
                    <Trash2 className="w-3 h-3 text-danger-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Section */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50/30">
            {/* Payment Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setPaymentType('CASH'); setDpAmount(0) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  paymentType === 'CASH'
                    ? 'bg-gradient-to-r from-emerald-500 to-success-500 text-white shadow-lg glow-green'
                    : 'bg-white text-slate-500 border border-slate-200 shadow-sm hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button
                onClick={() => {
                  setPaymentType('CREDIT')
                  // Set default DP to 20%
                  setDpAmount(Math.round(subtotal * 0.2))
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  paymentType === 'CREDIT'
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg glow-blue'
                    : 'bg-white text-slate-500 border border-slate-200 shadow-sm hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Kredit
              </button>
            </div>

            {/* Credit Options */}
            {paymentType === 'CREDIT' && (
              <div className="space-y-2 animate-fadeInUp">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Uang Muka (DP)</label>
                  <input
                    type="number"
                    value={dpAmount || ''}
                    onChange={e => setDpAmount(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className={`input-modern mt-1 ${isDpLowerThanMin ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-100 bg-amber-50/10' : ''}`}
                  />
                  {isDpLowerThanMin && (
                    <p className="text-[9px] text-amber-600 font-bold mt-1 flex items-center gap-1 animate-pulse">
                      ⚠️ DP minimal 20% ({formatRupiah(dpMinimum)})
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tenor</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {TENOR_OPTIONS.map(t => (
                      <button
                        key={t}
                        onClick={() => setTenor(t)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          tenor === t
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        {t} bln
                      </button>
                    ))}
                  </div>
                </div>
                <div className="clean-card p-3 space-y-1.5 bg-slate-50/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Harga Pokok</span>
                    <span className="text-slate-900 font-semibold">{formatRupiah(principal > 0 ? principal : 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya Admin</span>
                    <span className="text-primary-600 font-bold">{formatRupiah(ADMIN_FEE)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Faktor ×</span>
                    <span className="text-accent-600 font-mono font-semibold">{CREDIT_FACTORS[tenor]}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Cicilan/Bulan</span>
                    <span className="text-primary-600 font-bold">{formatRupiah(monthlyPayment)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">Total Kewajiban</span>
                    <span className="text-slate-900 font-bold">{formatRupiah(totalCredit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-400" />
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {paymentType === 'CREDIT' ? 'Pelanggan (Wajib)' : 'Pelanggan (Opsional)'}
                </label>
              </div>

              {paymentType === 'CREDIT' ? (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari nama atau no. HP..."
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                        if (selectedCustomerId) {
                          const selected = customers.find(c => c.id === parseInt(selectedCustomerId))
                          if (selected && selected.name !== e.target.value) {
                             setSelectedCustomerId('')
                          }
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="input-modern text-xs w-full pl-9 pr-8"
                    />
                    {selectedCustomerId && (
                      <button 
                        onClick={() => {
                          setSelectedCustomerId('')
                          setCustomerSearch('')
                          setShowCustomerDropdown(true)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-danger-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {showCustomerDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                      {customers.filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                        c.phone.includes(customerSearch)
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-center text-slate-500">
                          Pelanggan tidak ditemukan
                        </div>
                      ) : (
                        customers.filter(c => 
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                          c.phone.includes(customerSearch)
                        ).map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id.toString())
                              setCustomerSearch(c.name)
                              setShowCustomerDropdown(false)
                            }}
                            className={`p-2.5 text-xs cursor-pointer hover:bg-primary-50 transition-colors border-b border-slate-50 last:border-0 ${selectedCustomerId === c.id.toString() ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700'}`}
                          >
                            <div className="font-semibold">{c.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{c.phone || '-'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Nama pelanggan"
                    className="input-modern text-xs"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="No. HP"
                    className="input-modern text-xs mt-2"
                  />
                </>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900 font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              {paymentType === 'CREDIT' && dpAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">DP</span>
                  <span className="text-emerald-600 font-semibold">- {formatRupiah(dpAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <span className="text-slate-800">Total</span>
                <span className="gradient-text">
                  {formatRupiah(checkoutTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {paymentType === 'CASH' ? 'Bayar Cash' : 'Proses Kredit'}
            </button>
          </div>
        )}
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <div className="clean-card w-[420px] p-6 animate-fadeInUp shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Transaksi</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100/50 hover:bg-slate-100 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Item</p>
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700">{item.image} {item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                    <span className="text-slate-900 font-semibold">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-500">Tipe Pembayaran</span>
                  <span className={`font-bold ${paymentType === 'CASH' ? 'text-emerald-600' : 'text-primary-600'}`}>
                    {paymentType === 'CASH' ? '💵 Cash' : '💳 Kredit'}
                  </span>
                </div>
                {paymentType === 'CREDIT' && (
                  <>
                    <div className="flex justify-between text-xs py-1 border-t border-slate-100 mt-1">
                      <span className="text-slate-500">Tenor</span>
                      <span className="text-slate-900 font-medium">{tenor} Bulan</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100 mb-1">
                      <span className="text-slate-500">Cicilan/Bulan</span>
                      <span className="text-primary-600 font-bold">{formatRupiah(monthlyPayment)}</span>
                    </div>
                  </>
                )}
                <div className="pt-2 flex justify-between text-sm">
                  <span className="text-slate-800 font-bold">Total</span>
                  <span className="gradient-text font-bold">
                    {formatRupiah(checkoutTotal)}
                  </span>
                </div>
              </div>

              {paymentType === 'CASH' && customerName && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Pelanggan</p>
                  <p className="text-xs text-slate-900 font-medium">{customerName}</p>
                  {customerPhone && <p className="text-xs text-slate-500">{customerPhone}</p>}
                </div>
              )}
              {paymentType === 'CREDIT' && selectedCustomerId && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Pelanggan Terdaftar</p>
                  <p className="text-xs text-slate-900 font-medium">
                    {customers.find(c => c.id === parseInt(selectedCustomerId))?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {customers.find(c => c.id === parseInt(selectedCustomerId))?.phone}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 btn-secondary text-sm">
                Batal
              </button>
              <button
                onClick={() => { handleCheckout(); setShowCheckoutModal(false) }}
                className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <div className="clean-card w-[400px] p-8 text-center animate-fadeInUp shadow-xl">
            <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <Check className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Transaksi Berhasil! 🎉</h3>
            <p className="text-sm text-slate-500 mb-6">Transaksi telah berhasil disimpan</p>

            {lastTransaction && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 text-left relative overflow-hidden">
                {/* Decorative receipt edges */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSIwIiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat-x"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI4IiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat-x"></div>
                
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-3 tracking-wider text-center">📋 Struk Digital</p>
                <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5">
                  <p className="text-center text-xs text-slate-800 font-bold uppercase tracking-widest">AMALI KREDIT</p>
                  <p className="text-center text-[10px] text-slate-500 mb-3">Toko Elektronik & Perlengkapan Rumah</p>
                  <div className="border-t border-dashed border-slate-200 my-2" />
                  {lastTransaction.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-[11px] py-0.5">
                      <span className="text-slate-600">{item.product?.name || 'Produk'} <span className="text-slate-400">×{item.quantity}</span></span>
                      <span className="text-slate-900 font-medium">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {lastTransaction.type === 'CREDIT' && (
                    <div className="flex justify-between text-[11px] py-0.5">
                      <span className="text-slate-600 italic">Biaya Admin</span>
                      <span className="text-primary-600 font-medium">{formatRupiah(200000)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-200 my-2" />
                  <div className="flex justify-between text-xs font-bold py-1">
                    <span className="text-slate-800">TOTAL</span>
                    <span className="text-primary-600 text-sm">{formatRupiah(lastTransaction.totalPrice)}</span>
                  </div>
                  <div className="bg-slate-200/50 p-2 rounded-lg mt-3">
                    <p className="text-[10px] text-slate-600 font-medium text-center flex items-center justify-center gap-1.5">
                      {lastTransaction.type === 'CASH' ? '💵 Pembayaran Cash' : `💳 Kredit ${lastTransaction.tenor} Bulan`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Cetak Struk
              </button>
              <button
                onClick={() => { setCheckoutSuccess(false); setLastTransaction(null) }}
                className="btn-primary flex-1 text-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Hidden Thermal Receipt for Printing */}
      <div id="thermal-receipt">
        {lastTransaction && (
          <div className="p-4 bg-white text-black font-mono">
           <div className="text-center mb-4">
             <h2 className="text-lg font-bold uppercase">AMALI KREDIT</h2>
             <p className="text-[10px]">Toko Elektronik & Rumah</p>
             <p className="text-[9px]">Jln. Raya Amali No. 12</p>
             <p className="text-[9px]">Telp: 0812-3456-7890</p>
           </div>
           
           <div className="border-t border-dashed border-black my-2" />
           
           <div className="text-[10px] space-y-0.5">
             <div className="flex justify-between">
               <span>No: #{lastTransaction.id}</span>
               <span>{new Date(lastTransaction.createdAt).toLocaleDateString('id-ID')}</span>
             </div>
             <div>Kasir: {lastTransaction.user?.name || 'Admin'}</div>
             {lastTransaction.customer && (
               <div>Plgn: {lastTransaction.customer.name}</div>
             )}
           </div>
           
           <div className="border-t border-dashed border-black my-2" />
           
           <div className="space-y-1">
             {lastTransaction.items?.flatMap(item => (
                <div key={item.id} className="text-[10px]">
                  <div className="flex justify-between">
                    <span>{item.product?.name || 'Produk'}</span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span>{item.quantity} x {formatRupiah(item.price)}</span>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                </div>
             ))}
           </div>
           
           <div className="border-t border-dashed border-black my-2" />
           
           <div className="text-[10px] space-y-1">
             <div className="flex justify-between font-bold">
               <span>TOTAL</span>
               <span>{formatRupiah(lastTransaction.totalPrice)}</span>
             </div>
             {lastTransaction.type === 'CREDIT' && (
               <>
                 <div className="flex justify-between">
                   <span>DP</span>
                   <span>{formatRupiah(lastTransaction.dpAmount)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Cicilan ({lastTransaction.tenor}x)</span>
                   <span>{formatRupiah(lastTransaction.monthlyPayment)}</span>
                 </div>
               </>
             )}
             <div className="flex justify-between">
               <span>Bayar: {lastTransaction.type}</span>
             </div>
           </div>
           
           <div className="border-t border-dashed border-black my-4" />
           
           <div className="text-center text-[9px]">
             <p>Terima Kasih Atas</p>
             <p>Kunjungan Anda</p>
             <p className="mt-2 text-[8px]">AMALI KREDIT v2.1.0-hardware</p>
           </div>
          </div>
        )}
      </div>
    </>
  )
}
