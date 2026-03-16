import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const allTxs = await prisma.transaction.findMany()
  console.log('Total Txs in DB:', allTxs.length)
  
  const filteredTxs = await prisma.transaction.findMany({
    where: { customerId: 1 }
  })
  console.log('Filtered Txs for customerId 1:', filteredTxs.length)
  
  if (filteredTxs.length > 0) {
    console.log('First filtered Tx customerId:', filteredTxs[0].customerId)
  }
  
  // also check other customers
  const uniqueCustomerIds = [...new Set(allTxs.map(t => t.customerId))]
  console.log('Unique customerIds in DB:', uniqueCustomerIds)
  
  process.exit(0)
}

check()
