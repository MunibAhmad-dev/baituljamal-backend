const prisma = require('../config/prisma')

async function generateOrderId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `BJ-${today}-`

  const last = await prisma.order.findFirst({
    where:   { orderId: { startsWith: prefix } },
    orderBy: { orderId: 'desc' },
    select:  { orderId: true }
  })

  const next = last ? parseInt(last.orderId.split('-')[2]) + 1 : 1001
  return `${prefix}${next}`
}

module.exports = generateOrderId
