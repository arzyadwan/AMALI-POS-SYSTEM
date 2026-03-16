import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.transactionItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.category.deleteMany()

  // Create categories
  const elektronik = await prisma.category.create({
    data: { name: 'Elektronik', icon: 'Zap' }
  })
  const furnitur = await prisma.category.create({
    data: { name: 'Furnitur', icon: 'Sofa' }
  })

  // Create products
  const products = [
    // Elektronik
    { name: 'Kulkas 2 Pintu Samsung', sku: 'ELK-001', price: 4500000, stock: 8, categoryId: elektronik.id, image: '🧊' },
    { name: 'Mesin Cuci LG 8kg', sku: 'ELK-002', price: 3200000, stock: 5, categoryId: elektronik.id, image: '🫧' },
    { name: 'Laptop ASUS VivoBook', sku: 'ELK-003', price: 7950000, stock: 12, categoryId: elektronik.id, image: '💻' },
    { name: 'TV LED 43" Sharp', sku: 'ELK-004', price: 3800000, stock: 6, categoryId: elektronik.id, image: '📺' },
    { name: 'AC Daikin 1 PK', sku: 'ELK-005', price: 4200000, stock: 10, categoryId: elektronik.id, image: '❄️' },
    { name: 'Rice Cooker Miyako', sku: 'ELK-006', price: 450000, stock: 20, categoryId: elektronik.id, image: '🍚' },
    { name: 'Kipas Angin Cosmos', sku: 'ELK-007', price: 350000, stock: 15, categoryId: elektronik.id, image: '🌀' },
    { name: 'Setrika Philips', sku: 'ELK-008', price: 280000, stock: 18, categoryId: elektronik.id, image: '👔' },
    // Furnitur
    { name: 'Spring Bed Comforta 160x200', sku: 'FUR-001', price: 5500000, stock: 4, categoryId: furnitur.id, image: '🛏️' },
    { name: 'Sofa L Minimalis', sku: 'FUR-002', price: 4800000, stock: 3, categoryId: furnitur.id, image: '🛋️' },
    { name: 'Meja Makan Set 4 Kursi', sku: 'FUR-003', price: 3200000, stock: 5, categoryId: furnitur.id, image: '🪑' },
    { name: 'Lemari Pakaian 3 Pintu', sku: 'FUR-004', price: 2800000, stock: 7, categoryId: furnitur.id, image: '🗄️' },
    { name: 'Kursi Tamu Set Jati', sku: 'FUR-005', price: 6500000, stock: 2, categoryId: furnitur.id, image: '💺' },
    { name: 'Rak TV Minimalis', sku: 'FUR-006', price: 1200000, stock: 10, categoryId: furnitur.id, image: '📐' },
    { name: 'Meja Belajar Anak', sku: 'FUR-007', price: 850000, stock: 12, categoryId: furnitur.id, image: '📝' },
    { name: 'Kitchen Set Aluminium', sku: 'FUR-008', price: 3500000, stock: 4, categoryId: furnitur.id, image: '🍳' },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  // Create sample customers
  const customers = [
    { name: 'Ahmad Fauzi', phone: '081234567890', address: 'Jl. Merdeka No. 10, Jakarta', nik: '3171012345670001' },
    { name: 'Siti Nurhaliza', phone: '082345678901', address: 'Jl. Sudirman No. 25, Bandung', nik: '3273012345670002' },
    { name: 'Budi Santoso', phone: '083456789012', address: 'Jl. Diponegoro No. 5, Surabaya', nik: '3578012345670003' },
  ]

  for (const customer of customers) {
    await prisma.customer.create({ data: customer })
  }

  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
