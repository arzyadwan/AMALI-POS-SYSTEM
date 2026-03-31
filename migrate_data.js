import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const data = JSON.parse(fs.readFileSync('customers_backup.json', 'utf8'))
  console.log(`Starting migration of ${data.length} legacy records...`)

  // Group by name
  const groups = {}
  for (const row of data) {
    if (!groups[row.name]) groups[row.name] = []
    groups[row.name].push(row)
  }

  const names = Object.keys(groups)
  console.log(`Unique customers found: ${names.length}`)

  for (const name of names) {
    const rows = groups[name]
    
    // 1. Create or Find Customer
    // Since we just wiped the table, let's create it.
    const customer = await prisma.customer.create({
      data: {
        name: name,
        phone: '', // Placeholder
        address: '' // Placeholder
      }
    })

    // 2. Create Transactions for each record
    for (const row of rows) {
      await prisma.transaction.create({
        data: {
          customerId: customer.id,
          bookCode: row.bookCode,
          itemName: row.item || 'Produk Kredit',
          type: 'CREDIT',
          totalPrice: row.itemPrice || 0,
          monthlyPayment: row.monthlyInstallment || 0,
          tenor: 12, // Default
          startDate: row.creditDate ? new Date(row.creditDate) : new Date(),
          status: 'COMPLETED'
        }
      })
    }
  }

  console.log('Migration completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
