import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const customers = await prisma.customer.findMany()
  fs.writeFileSync('customers_backup.json', JSON.stringify(customers, null, 2))
  console.log(`Backup of ${customers.length} records completed.`)
}

main().finally(() => prisma.$disconnect())
