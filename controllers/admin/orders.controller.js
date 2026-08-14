const prisma = require('../../config/prisma')
const { ok, notFound, fail } = require('../../utils/apiResponse')

exports.list = async (req, res) => {
  const { status, payment, phone, from, to, page = 1, limit = 30 } = req.query
  const skip  = (parseInt(page) - 1) * parseInt(limit)
  const where = {}

  if (status)  where.status  = status
  if (payment) where.payment = payment
  if (phone) {
    const p = phone.replace(/\D/g, '').replace(/^92/, '0')
    where.customerPhone = { contains: p }
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to)   where.createdAt.lte = new Date(to)
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take:    parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } })
  ])

  const counts = statusCounts.reduce((acc, row) => {
    acc[row.status] = row._count._all
    return acc
  }, {})

  return ok(res, { orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), statusCounts: counts })
}

exports.get = async (req, res) => {
  const order = await prisma.order.findFirst({
    where:   { orderId: req.params.orderId.toUpperCase() },
    include: {
      items: { include: { product: { select: { name: true, image: true } } } },
      statusHistory: { orderBy: { at: 'asc' } },
      user: { select: { name: true, phone: true } }
    }
  })
  if (!order) return notFound(res, 'Order not found')
  return ok(res, order)
}

exports.updateStatus = async (req, res) => {
  const { status, note } = req.body
  if (!status) return fail(res, 'status is required', 400)

  const order = await prisma.order.findFirst({ where: { orderId: req.params.orderId.toUpperCase() } })
  if (!order) return notFound(res, 'Order not found')

  const updated = await prisma.order.update({
    where: { id: order.id },
    data:  {
      status,
      statusHistory: {
        create: { status, note: note ?? null, updatedBy: req.user.name }
      }
    },
    include: { statusHistory: { orderBy: { at: 'asc' } } }
  })
  return ok(res, updated)
}

exports.updateNote = async (req, res) => {
  const order = await prisma.order.findFirst({ where: { orderId: req.params.orderId.toUpperCase() } })
  if (!order) return notFound(res, 'Order not found')
  const updated = await prisma.order.update({
    where: { id: order.id },
    data:  { adminNote: req.body.note ?? null }
  })
  return ok(res, updated)
}

exports.stats = async (req, res) => {
  const [total, statusCounts, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { status: { not: 'cancelled' } }
    })
  ])

  return ok(res, {
    total,
    statusCounts: statusCounts.reduce((a, r) => { a[r.status] = r._count._all; return a }, {}),
    totalRevenue: revenue._sum.grandTotal ?? 0
  })
}
