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
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya Admin yang diizinkan.' })
  }
  next()
}

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
    const product = await prisma.product.create({
      data: req.body,
      include: { category: true, supplier: true }
    })
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
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
  const { search } = req.query
  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { nik: { contains: search } }
    ]
  }
  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { transactions: true } } },
    orderBy: { name: 'asc' }
  })
  res.json(customers)
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

app.delete('/api/customers/:id', async (req, res) => {
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
    const paidAmount = parseFloat(amount)
    const now = new Date()
    const LATE_FEE_PER_MONTH = 50000

    // Find the next PENDING installment for this transaction
    const nextPending = await prisma.installment.findFirst({
      where: { transactionId: txId, status: 'PENDING' },
      orderBy: { dueDate: 'asc' }
    })

    if (!nextPending) {
      return res.status(400).json({ error: 'Tidak ada cicilan yang perlu dibayar' })
    }

    // Calculate late fee if paying after due date
    let lateFee = 0
    if (now > new Date(nextPending.dueDate)) {
      const diffMs = now - new Date(nextPending.dueDate)
      const diffMonths = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
      lateFee = diffMonths * LATE_FEE_PER_MONTH
    }

    const installment = await prisma.installment.update({
      where: { id: nextPending.id },
      data: {
        status: 'PAID',
        paymentDate: now,
        amount: paidAmount,
        lateFee
      }
    })

    const allInstallments = await prisma.installment.findMany({
      where: { transactionId: txId }
    })
    const pendingCount = allInstallments.filter(i => i.status === 'PENDING').length

    if (pendingCount === 0) {
      await prisma.transaction.update({
        where: { id: txId },
        data: { status: 'PAID_OFF' }
      })
    }

    res.status(201).json({ ...installment, lateFee })
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

app.listen(PORT, () => {
  console.log(`🚀 AMALI KREDIT API running on http://localhost:${PORT}`)
})
