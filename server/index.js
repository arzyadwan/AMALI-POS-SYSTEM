import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })
const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'amali-kredit-secret-key-2024'

// ============ AUTH MIDDLEWARE ============
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' })
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Admin yang diizinkan.' })
  }
  next()
}

function isSuperAdmin(req, res, next) {
  if (req.user?.role !== 'SUPER ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Super Admin yang diizinkan.' })
  }
  next()
}

// ============ BACKUP SYSTEM ============
app.get('/api/backup/download', verifyToken, isAdmin, (req, res) => {
  console.log('--- Backup download request received ---')
  const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db')
  console.log('Database path:', dbPath)
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath)
    return res.status(404).json({ error: 'File database tidak ditemukan' })
  }

  const filename = `backup-${new Date().toISOString().split('T')[0]}.db`
  console.log('Streaming backup file:', filename)
  
  res.download(dbPath, filename, (err) => {
    if (err) {
      console.error('Backup download error:', err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal mengunduh cadangan database' })
      }
    } else {
      console.log('Backup download successful')
    }
  })
})




const CREDIT_FACTORS = {
  3: 0.368,
  6: 0.208,
  9: 0.1475,
  12: 0.121
}

const ADMIN_FEE = 200000

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } }
  })
  res.json(categories)
})

app.post('/api/categories', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, icon } = req.body
    const category = await prisma.category.create({
      data: { name, icon: icon || 'Package' }
    })
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/categories/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, icon } = req.body
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: { name, icon }
    })
    res.json(category)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/categories/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const count = await prisma.product.count({ where: { categoryId: id } })
    if (count > 0) {
      return res.status(400).json({ error: 'Kategori tidak dapat dihapus karena masih memiliki produk.' })
    }
    await prisma.category.delete({ where: { id } })
    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ PRODUCTS ============
app.get('/api/products', async (req, res) => {
  const { search, categoryId } = req.query
  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } }
    ]
  }
  if (categoryId) {
    where.categoryId = parseInt(categoryId)
  }
  const products = await prisma.product.findMany({
    where,
    include: { category: true, supplier: true },
    orderBy: { name: 'asc' }
  })
  res.json(products)
})

app.get('/api/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { category: true, supplier: true }
  })
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, price, costPrice, stock, image, categoryId, supplierId } = req.body
    const product = await prisma.product.create({
      data: { name, sku, price, costPrice, stock, image, categoryId, supplierId },
      include: { category: true, supplier: true }
    })
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, sku, price, costPrice, stock, image, categoryId, supplierId } = req.body
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { name, sku, price, costPrice, stock, image, categoryId, supplierId },
      include: { category: true, supplier: true }
    })
    res.json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Product deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ CUSTOMERS ============
app.get('/api/customers', async (req, res) => {
  const { search, sortBy, order = 'asc', filter, batch } = req.query
  const andConditions = []

  // Filter Logic
  if (filter === 'active_credit') {
    andConditions.push({ transactions: { some: { type: 'CREDIT' } } })
  } else if (filter === 'no_credit') {
    andConditions.push({ transactions: { none: {} } })
  }

  // Batch Filter (U, W, etc)
  if (batch) {
    andConditions.push({ 
      transactions: { 
        some: { 
          bookCode: { startsWith: batch } 
        } 
      } 
    })
  }

  // Search Logic
  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { address: { contains: search } },
        { transactions: { some: { bookCode: { contains: search } } } },
        { transactions: { some: { itemName: { contains: search } } } }
      ]
    })
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {}

  // Sorting Logic
  let orderBy = { name: 'asc' }
  const direction = order === 'desc' ? 'desc' : 'asc'
  
  if (sortBy === 'name') orderBy = { name: direction }
  else if (sortBy === 'address') orderBy = { address: direction }
  else if (sortBy === 'phone') orderBy = { phone: direction }
  else if (sortBy === 'transactions') orderBy = { transactions: { _count: direction } }
  else if (sortBy === 'newest') orderBy = { createdAt: 'desc' }

  try {
    const customers = await prisma.customer.findMany({
      where,
      include: { 
        transactions: {
          where: { type: 'CREDIT' },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { transactions: true } } 
      },
      orderBy
    })
    res.json(customers)
  } catch (err) {
    console.error('Customer Fetch Error:', err)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body })
    res.status(201).json(customer)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })
    res.json(customer)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/customers/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Customer deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ SUPPLIERS ============
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    })
    res.json(suppliers)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body })
    res.status(201).json(supplier)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })
    res.json(supplier)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Supplier deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ TRANSACTIONS ============
app.get('/api/transactions', async (req, res) => {
  const { type, status, customerId } = req.query
  const where = {}
  if (type) where.type = type
  if (status) where.status = status
  
  if (customerId && !isNaN(parseInt(customerId))) {
    where.customerId = parseInt(customerId)
  }
  
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      customer: true,
      items: { include: { product: true } },
      installments: true
    },
    orderBy: { createdAt: 'desc' }
  })
  
  res.json(transactions)
})

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        items: { include: { product: true } },
        installments: { orderBy: { monthIndex: 'asc' } }
      }
    })
    
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' })
    res.json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { bookCode, itemName, totalPrice, monthlyPayment, tenor, status, startDate } = req.body
    const transaction = await prisma.transaction.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        bookCode, 
        itemName, 
        totalPrice: parseFloat(totalPrice),
        monthlyPayment: parseFloat(monthlyPayment),
        tenor: parseInt(tenor),
        status,
        startDate: startDate ? new Date(startDate) : undefined
      }
    })
    res.json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/transactions/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Transaction deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/transactions', async (req, res) => {
  try {
    const { customerId, type, tenor, dpAmount, items } = req.body

    // Calculate total price from items
    let totalPrice = 0
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new Error(`Product ${item.productId} not found`)
      if (product.stock < item.quantity) throw new Error(`Stok ${product.name} tidak cukup`)
      totalPrice += product.price * item.quantity
    }

    let monthlyPayment = 0
    let totalCredit = 0
    let finalTotalPrice = totalPrice
    if (type === 'CREDIT') {
      if (!customerId) throw new Error('Pelanggan wajib dipilih untuk transaksi kredit')
      const factor = CREDIT_FACTORS[tenor]
      if (!factor) throw new Error('Invalid tenor')
      const principal = totalPrice - (dpAmount || 0)
      monthlyPayment = Math.round(principal * factor)
      totalCredit = monthlyPayment * tenor
      finalTotalPrice = totalCredit + (dpAmount || 0) + ADMIN_FEE
      
      const logMsg = `[${new Date().toISOString()}] CREDIT TRX: ItemSum=${totalPrice}, DP=${dpAmount}, Admin=${ADMIN_FEE}, Principal=${principal}, Monthly=${monthlyPayment}, CreditTotal=${totalCredit}, FinalTotal=${finalTotalPrice}\n`
      fs.appendFileSync('transaction_debug.log', logMsg)
    } else {
      const logMsg = `[${new Date().toISOString()}] CASH TRX: ItemSum=${totalPrice}, FinalTotal=${finalTotalPrice}\n`
      fs.appendFileSync('transaction_debug.log', logMsg)
    }

    // Create transaction and update stock
    const transaction = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          customerId: customerId || null,
          type,
          tenor: type === 'CREDIT' ? tenor : 0,
          dpAmount: type === 'CREDIT' ? (dpAmount || 0) : 0,
          totalPrice: finalTotalPrice,
          monthlyPayment,
          totalCredit,
          status: type === 'CREDIT' ? 'ACTIVE' : 'COMPLETED',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          customer: true,
          items: { include: { product: true } }
        }
      })

      // Update stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      // Auto-generate installment schedule for credit transactions
      if (type === 'CREDIT') {
        const startDate = new Date()
        for (let i = 1; i <= tenor; i++) {
          const dueDate = new Date(startDate)
          dueDate.setMonth(dueDate.getMonth() + i)
          await tx.installment.create({
            data: {
              transactionId: trx.id,
              amount: monthlyPayment,
              dueDate,
              monthIndex: i,
              status: 'PENDING'
            }
          })
        }
      }

      return trx
    })

    res.status(201).json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/transactions/manual', async (req, res) => {
  try {
    const { 
      customerId, 
      itemName, 
      totalPrice, 
      monthlyPayment, 
      tenor, 
      dpAmount, 
      bookCode, 
      startDate,
      status 
    } = req.body

    const transaction = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          customerId: parseInt(customerId),
          type: 'CREDIT',
          totalPrice: parseFloat(totalPrice),
          monthlyPayment: parseFloat(monthlyPayment),
          totalCredit: parseFloat(monthlyPayment) * parseInt(tenor),
          tenor: parseInt(tenor),
          dpAmount: parseFloat(dpAmount || 0),
          bookCode,
          itemName,
          startDate: startDate ? new Date(startDate) : new Date(),
          status: status || 'ACTIVE'
        }
      })

      // Generate installment schedule
      const baseDate = startDate ? new Date(startDate) : new Date()
      for (let i = 1; i <= parseInt(tenor); i++) {
        const dueDate = new Date(baseDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        await tx.installment.create({
          data: {
            transactionId: trx.id,
            amount: parseFloat(monthlyPayment),
            dueDate,
            monthIndex: i,
            status: 'PENDING'
          }
        })
      }
      return trx
    })

    res.status(201).json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ INSTALLMENTS ============
app.get('/api/installments/:transactionId', async (req, res) => {
  try {
    const installments = await prisma.installment.findMany({
      where: { transactionId: parseInt(req.params.transactionId) },
      orderBy: { dueDate: 'asc' }
    })
    res.json(installments)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/installments', async (req, res) => {
  try {
    const { transactionId, amount } = req.body
    const txId = parseInt(transactionId)
    let remainingPayment = parseFloat(amount)
    const now = new Date()
    const LATE_FEE_PER_MONTH = 50000

    // Find all pending installments for this transaction
    const pendingInstallments = await prisma.installment.findMany({
      where: { transactionId: txId, status: 'PENDING' },
      orderBy: { dueDate: 'asc' }
    })

    if (pendingInstallments.length === 0) {
      return res.status(400).json({ error: 'Tidak ada cicilan yang perlu dibayar' })
    }

    let totalLateFee = 0
    let lastProcessedInstallment = null

    // Distribute payment across pending installments
    for (const inst of pendingInstallments) {
      if (remainingPayment <= 0) break

      let lateFee = 0
      if (now > new Date(inst.dueDate)) {
        const diffMs = now - new Date(inst.dueDate)
        const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
        lateFee = diffMonths * LATE_FEE_PER_MONTH
      }

      // Determine how much to pay for this installment
      // We prioritize exact installment amount, but allow excess to spill over
      const payToThis = Math.min(remainingPayment, inst.amount)
      
      const updated = await prisma.installment.update({
        where: { id: inst.id },
        data: {
          status: 'PAID',
          paymentDate: now,
          amount: payToThis,
          lateFee
        }
      })

      remainingPayment -= payToThis
      totalLateFee += lateFee
      lastProcessedInstallment = updated
    }

    // Check if everything is now paid
    const remainingCount = await prisma.installment.count({
      where: { transactionId: txId, status: 'PENDING' }
    })

    if (remainingCount === 0) {
      await prisma.transaction.update({
        where: { id: txId },
        data: { status: 'PAID_OFF' }
      })
    }

    res.status(201).json({ ...lastProcessedInstallment, lateFee: totalLateFee, finished: remainingCount === 0 })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/installments/manual', verifyToken, isAdmin, async (req, res) => {
  try {
    const { transactionId, amount, dueDate, monthIndex, status, paymentDate } = req.body
    const installment = await prisma.installment.create({
      data: {
        transactionId: parseInt(transactionId),
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        monthIndex: parseInt(monthIndex),
        status: status || 'PENDING',
        paymentDate: paymentDate ? new Date(paymentDate) : null
      }
    })
    res.status(201).json(installment)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/installments/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { amount, dueDate, monthIndex, status, paymentDate } = req.body
    const id = parseInt(req.params.id)
    const installment = await prisma.installment.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        monthIndex: monthIndex !== undefined ? parseInt(monthIndex) : undefined,
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : (status === 'PAID' ? new Date() : null)
      }
    })
    res.json(installment)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.delete('/api/installments/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await prisma.installment.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Installment deleted' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ============ CREDIT COLLECTION ============
const LATE_FEE_PER_MONTH = 50000

app.get('/api/collection/overdue', async (req, res) => {
  try {
    const now = new Date()
    const overdue = await prisma.installment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now }
      },
      include: {
        transaction: {
          include: { customer: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    const result = overdue.map(inst => {
      const diffMs = now - new Date(inst.dueDate)
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
      return {
        ...inst,
        overdueDays: diffDays,
        estimatedLateFee: diffMonths * LATE_FEE_PER_MONTH
      }
    })

    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/collection/aging', async (req, res) => {
  try {
    const now = new Date()
    const overdue = await prisma.installment.findMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      include: { transaction: { include: { customer: true } } }
    })

    // Group by customer
    const byCustomer = {}
    for (const inst of overdue) {
      const cid = inst.transaction.customerId || 'unknown'
      const customerName = inst.transaction.customer?.name || 'Pelanggan Tidak Diketahui'
      const customerPhone = inst.transaction.customer?.phone || ''
      if (!byCustomer[cid]) {
        byCustomer[cid] = { customerId: cid, customerName, customerPhone, current: 0, days1_30: 0, days31_60: 0, days61_90: 0, daysOver90: 0, totalOverdue: 0, installments: [] }
      }
      const diffDays = Math.floor((now - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24))
      byCustomer[cid].totalOverdue += inst.amount
      byCustomer[cid].installments.push({ ...inst, overdueDays: diffDays })
      if (diffDays <= 30) byCustomer[cid].days1_30 += inst.amount
      else if (diffDays <= 60) byCustomer[cid].days31_60 += inst.amount
      else if (diffDays <= 90) byCustomer[cid].days61_90 += inst.amount
      else byCustomer[cid].daysOver90 += inst.amount
    }

    res.json(Object.values(byCustomer))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ============ CREDIT SIMULATION ============
app.post('/api/credit/simulate', (req, res) => {
  const { price, dp, tenor } = req.body
  const principal = price - (dp || 0)
  const factor = CREDIT_FACTORS[tenor]

  if (!factor) return res.status(400).json({ error: 'Invalid tenor' })

  const monthlyPayment = Math.round(principal * factor)
  const totalCredit = monthlyPayment * tenor

  // Calculate all tenors for comparison
  const allTenors = Object.entries(CREDIT_FACTORS).map(([t, f]) => {
    const m = Math.round(principal * f)
    return {
      tenor: parseInt(t),
      factor: f,
      monthlyPayment: m,
      totalCredit: m * parseInt(t)
    }
  })

  res.json({
    principal,
    tenor,
    factor,
    monthlyPayment,
    totalCredit,
    allTenors
  })
})

// ============ DASHBOARD STATS ============
app.get('/api/stats', async (req, res) => {
  const [totalProducts, totalCustomers, totalTransactions, transactions] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.transaction.count(),
    prisma.transaction.findMany({ select: { totalPrice: true, type: true } })
  ])

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalPrice, 0)
  const cashTransactions = transactions.filter(t => t.type === 'CASH').length
  const creditTransactions = transactions.filter(t => t.type === 'CREDIT').length

  res.json({
    totalProducts,
    totalCustomers,
    totalTransactions,
    totalRevenue,
    cashTransactions,
    creditTransactions
  })
})

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' })
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return res.status(401).json({ error: 'Username atau password salah' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Username atau password salah' })
    const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/auth/register', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashed, name: name || '', role: role || 'CASHIER' }
    })
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role })
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Username sudah terdaftar' })
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/auth/users', verifyToken, isAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true, name: true, role: true, createdAt: true } })
  res.json(users)
})

app.delete('/api/auth/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (id === req.user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' })
    await prisma.user.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Check if first-time setup is needed
app.get('/api/auth/check-setup', async (req, res) => {
  const count = await prisma.user.count()
  res.json({ needsSetup: count === 0 })
})

// First-time admin setup (only works if NO users exist)
app.post('/api/auth/setup', async (req, res) => {
  try {
    const count = await prisma.user.count()
    if (count > 0) return res.status(400).json({ error: 'Setup sudah pernah dilakukan' })
    const { username, password, name } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashed, name: name || 'Administrator', role: 'ADMIN' }
    })
    const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ============ SYSTEM MANAGEMENT ============
app.post('/api/system/reset', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] SYSTEM RESET REQUEST by ${req.user.username}`)
    
    // Perform reset in a transaction to ensure atomic deletion
    await prisma.$transaction([
      prisma.installment.deleteMany(),
      prisma.transactionItem.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.product.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.supplier.deleteMany(),
      prisma.category.deleteMany(),
    ])

    // Try to delete debug log if exists
    const logPath = path.resolve(__dirname, '..', 'transaction_debug.log')
    if (fs.existsSync(logPath)) {
      try {
        fs.unlinkSync(logPath)
      } catch (err) {
        console.error('Failed to delete log file:', err)
      }
    }

    console.log('System reset successful')
    res.json({ success: true, message: 'Seluruh data (kecuali akun pengguna) telah berhasil dihapus.' })
  } catch (e) {
    console.error('System reset failed:', e)
    res.status(500).json({ error: 'Gagal melakukan reset sistem: ' + e.message })
  }
})

// ============ ANALYTICS ============
app.get('/api/stats/summary', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalTransactions = await prisma.transaction.count()
    const transactions = await prisma.transaction.findMany({
      include: { items: { include: { product: true } } }
    })
    
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalPrice, 0)
    
    // Calculate profit
    let totalProfit = 0
    transactions.forEach(tx => {
      let txCost = 0
      tx.items.forEach(item => {
        txCost += (item.product.costPrice || 0) * item.quantity
      })
      totalProfit += (tx.totalPrice - txCost)
    })
    
    const totalCustomers = await prisma.customer.count()
    const activeCreditCount = await prisma.transaction.count({ where: { type: 'CREDIT', status: 'ACTIVE' } })
    
    res.json({
      totalRevenue,
      totalProfit,
      totalTransactions,
      totalCustomers,
      activeCreditCount
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/stats/sales-trend', verifyToken, isAdmin, async (req, res) => {
  try {
    const days = 30 // Last 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: startDate } },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'asc' }
    })
    
    // Group by date
    const trend = {}
    for (let i = 0; i <= days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        trend[dateStr] = { date: dateStr, revenue: 0, profit: 0, count: 0 }
    }
    
    transactions.forEach(tx => {
      const dateStr = tx.createdAt.toISOString().split('T')[0]
      if (trend[dateStr]) {
        trend[dateStr].revenue += tx.totalPrice
        trend[dateStr].count += 1
        
        let txCost = 0
        tx.items.forEach(item => {
          txCost += (item.product.costPrice || 0) * item.quantity
        })
        trend[dateStr].profit += (tx.totalPrice - txCost)
      }
    })
    
    res.json(Object.values(trend).sort((a,b) => a.date.localeCompare(b.date)))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/stats/top-products', verifyToken, isAdmin, async (req, res) => {
  try {
    const items = await prisma.transactionItem.findMany({
      include: { product: true }
    })
    
    const productSales = {}
    items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.price * item.quantity
    })
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      
    res.json(topProducts)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 AMALI KREDIT API running on http://localhost:${PORT}`)
})
