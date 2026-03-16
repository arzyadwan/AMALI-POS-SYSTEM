import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function update() {
  const result = await prisma.transaction.updateMany({
    where: { type: 'CREDIT', status: 'COMPLETED' },
    data: { status: 'ACTIVE' }
  })
  console.log(`Updated ${result.count} transactions to ACTIVE`)
  process.exit(0)
}

update()
