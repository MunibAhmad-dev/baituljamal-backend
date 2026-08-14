require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const morgan    = require('morgan')
const path      = require('path')
const rateLimit = require('express-rate-limit')

const app = express()
app.set('trust proxy', 1) // trust Cloudflare / reverse proxy

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Global rate limiter — 200 req / 15 min per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

// Stricter limiter for auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, require('./routes/auth.routes'))
app.use('/api/products',               require('./routes/product.routes'))
app.use('/api/categories',             require('./routes/category.routes'))
app.use('/api/orders',                 require('./routes/order.routes'))
app.use('/api/admin',                  require('./routes/admin.routes'))

// Public config (frontend reads store settings without auth)
app.get('/api/config',          require('./controllers/admin/config.controller').get)

// Public banners (home page carousel)
app.get('/api/banners',         require('./controllers/admin/banners.controller').list)

// One-time make-admin bootstrap (uses env key)
app.post('/api/auth/make-admin', require('./controllers/admin/users.controller').makeAdmin)

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  // Prisma unique constraint
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] ?? 'field'
    return res.status(409).json({ success: false, message: `${field} already exists` })
  }
  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' })
  }
  const status = err.status || err.statusCode || 500
  res.status(status).json({ success: false, message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`))
