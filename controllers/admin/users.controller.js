const prisma = require('../../config/prisma')
const { ok, notFound, fail, unauthorized } = require('../../utils/apiResponse')

exports.list = async (req, res) => {
  const { q, role, page = 1, limit = 30 } = req.query
  const skip  = (parseInt(page) - 1) * parseInt(limit)
  const where = {}
  if (role) where.role = role
  if (q) {
    where.OR = [
      { name:  { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } }
    ]
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take:    parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select:  { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true }
    }),
    prisma.user.count({ where })
  ])
  return ok(res, { users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
}

exports.get = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.params.id },
    select: { id: true, name: true, phone: true, role: true, isActive: true, createdAt: true }
  })
  if (!user) return notFound(res, 'User not found')

  const orders = await prisma.order.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take:    10,
    select:  { orderId: true, grandTotal: true, status: true, createdAt: true }
  })
  return ok(res, { ...user, orders })
}

exports.setRole = async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) return fail(res, 'role must be user or admin', 400)
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return notFound(res, 'User not found')
  const updated = await prisma.user.update({
    where:  { id: req.params.id },
    data:   { role },
    select: { id: true, name: true, phone: true, role: true }
  })
  return ok(res, updated)
}

exports.deactivate = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return notFound(res, 'User not found')
  const updated = await prisma.user.update({
    where:  { id: req.params.id },
    data:   { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true }
  })
  return ok(res, updated)
}

// Used once to bootstrap the first admin — protected by env key, not admin auth
exports.makeAdmin = async (req, res) => {
  const { phone, setupKey } = req.body
  if (setupKey !== process.env.ADMIN_SETUP_KEY) return unauthorized(res, 'Invalid setup key')
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) return notFound(res, 'User not found — register first')
  const updated = await prisma.user.update({
    where:  { phone },
    data:   { role: 'admin' },
    select: { id: true, name: true, phone: true, role: true }
  })
  return ok(res, updated)
}
