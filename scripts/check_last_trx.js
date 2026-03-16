import { PrismaClient } from '@prisma/client'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const lastTrx = await prisma.transaction.findFirst({
    orderBy: { id: 'desc' },
    include: { items: true }
  })
  console.log(JSON.stringify(lastTrx, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
