const jwt    = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { unauthorized, forbidden } = require('../utils/apiResponse')

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null
  if (!token) return unauthorized(res, 'Not authenticated')

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where:  { id },
      select: { id: true, name: true, phone: true, role: true, isActive: true }
    })
    if (!user || !user.isActive) return unauthorized(res, 'User not found or inactive')
    req.user = user
    next()
  } catch {
    return unauthorized(res, 'Invalid or expired token')
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return forbidden(res, 'Admin access required')
  next()
}

module.exports = { protect, adminOnly }
