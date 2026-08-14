const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { ok, created, fail, unauthorized } = require('../utils/apiResponse')

const signTokens = (id) => ({
  accessToken:  jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: '15m' }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
})

const publicUser = ({ id, name, phone, role }) => ({ id, name, phone, role })

exports.register = async (req, res) => {
  const { name, phone, password } = req.body
  if (!name || !phone || !password) return fail(res, 'name, phone and password are required', 400)
  if (!/^(03\d{9}|3\d{9})$/.test(phone)) return fail(res, 'Invalid Pakistani phone number', 400)
  if (password.length < 6) return fail(res, 'Password must be at least 6 characters', 400)

  const exists = await prisma.user.findUnique({ where: { phone } })
  if (exists) return fail(res, 'Phone number already registered', 409)

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, phone, password: hashed } })

  const tokens = signTokens(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })

  return created(res, { user: publicUser(user), ...tokens })
}

exports.login = async (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) return fail(res, 'phone and password are required', 400)

  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || !user.isActive) return unauthorized(res, 'Invalid credentials')

  const match = await bcrypt.compare(password, user.password)
  if (!match) return unauthorized(res, 'Invalid credentials')

  const tokens = signTokens(user.id)
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })

  return ok(res, { user: publicUser(user), ...tokens })
}

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return unauthorized(res, 'Refresh token required')

  try {
    const { id } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.refreshToken !== refreshToken) return unauthorized(res, 'Invalid refresh token')

    const tokens = signTokens(user.id)
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } })

    return ok(res, tokens)
  } catch {
    return unauthorized(res, 'Invalid or expired refresh token')
  }
}

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { id: true, name: true, phone: true, role: true, createdAt: true }
  })
  return ok(res, user)
}

exports.updateMe = async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return fail(res, 'name is required', 400)
  const user = await prisma.user.update({
    where:  { id: req.user.id },
    data:   { name: name.trim() },
    select: { id: true, name: true, phone: true, role: true }
  })
  return ok(res, user)
}

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return fail(res, 'Both passwords required', 400)
  if (newPassword.length < 6) return fail(res, 'New password must be at least 6 characters', 400)

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) return fail(res, 'Current password is incorrect', 400)

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
  return ok(res, { message: 'Password changed' })
}

exports.logout = async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } })
  return ok(res, { message: 'Logged out' })
}
