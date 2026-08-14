const prisma              = require('../../config/prisma')
const { deleteLocalFile } = require('../../utils/fileHelper')
const { ok, created, fail, notFound } = require('../../utils/apiResponse')

// ── helpers ───────────────────────────────────────────────────────────────────
function toInt(v, fallback = 0) { const n = parseInt(v); return isNaN(n) ? fallback : n }
function toFloat(v, fallback = 0) { const n = parseFloat(v); return isNaN(n) ? fallback : n }
function toArr(v) {
  if (!v) return []
  return Array.isArray(v) ? v : v.split(',').map(s => s.trim()).filter(Boolean)
}
function slugify(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now()
}

// ── list ─────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  const { category, q, page = 1, limit = 30 } = req.query
  const skip  = (parseInt(page) - 1) * parseInt(limit)
  const where = {}
  if (category) where.categorySlug = category
  if (q) {
    where.OR = [
      { name:     { contains: q, mode: 'insensitive' } },
      { nameUrdu: { contains: q, mode: 'insensitive' } }
    ]
  }
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where })
  ])
  return ok(res, { products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
}

// ── create ───────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const d = req.body
  if (!d.name || !d.categorySlug || !d.price) return fail(res, 'name, categorySlug, price required', 400)
  const product = await prisma.product.create({
    data: {
      name:          d.name,
      nameUrdu:      d.nameUrdu      ?? null,
      slug:          slugify(d.name),
      categorySlug:  d.categorySlug,
      alsoIn:        toArr(d.alsoIn),
      type:          d.type          ?? null,
      price:         toInt(d.price),
      originalPrice: d.originalPrice ? toInt(d.originalPrice) : null,
      sizes:         toArr(d.sizes),
      minQty:        toInt(d.minQty, 1),
      description:   d.description   ?? null,
      features:      toArr(d.features),
      badge:         d.badge         ?? null,
      badgeColor:    d.badgeColor    ?? null,
      rating:        toFloat(d.rating),
      reviewCount:   toInt(d.reviewCount),
      featured:      d.featured      === 'true' || d.featured === true,
      isPublished:   d.isPublished !== 'false' && d.isPublished !== false,
      inStock:       d.inStock     !== 'false' && d.inStock     !== false,
      gradient:      d.gradient      ?? null,
      sortOrder:     toInt(d.sortOrder),
      colors:        d.colors ? (typeof d.colors === 'string' ? JSON.parse(d.colors) : d.colors) : [],
    }
  })
  return created(res, product)
}

// ── get ───────────────────────────────────────────────────────────────────────
exports.get = async (req, res) => {
  const product = await prisma.product.findUnique({
    where:   { id: req.params.id },
    include: { catalogItems: { orderBy: { sortOrder: 'asc' } } }
  })
  if (!product) return notFound(res, 'Product not found')
  return ok(res, product)
}

// ── update ───────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  const d   = req.body
  const cur = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!cur) return notFound(res, 'Product not found')

  const data = {}
  if (d.name          !== undefined) data.name          = d.name
  if (d.nameUrdu      !== undefined) data.nameUrdu      = d.nameUrdu
  if (d.categorySlug  !== undefined) data.categorySlug  = d.categorySlug
  if (d.alsoIn        !== undefined) data.alsoIn        = toArr(d.alsoIn)
  if (d.type          !== undefined) data.type          = d.type
  if (d.price         !== undefined) data.price         = toInt(d.price)
  if (d.originalPrice !== undefined) data.originalPrice = d.originalPrice ? toInt(d.originalPrice) : null
  if (d.sizes         !== undefined) data.sizes         = toArr(d.sizes)
  if (d.minQty        !== undefined) data.minQty        = toInt(d.minQty, 1)
  if (d.description   !== undefined) data.description   = d.description
  if (d.features      !== undefined) data.features      = toArr(d.features)
  if (d.badge         !== undefined) data.badge         = d.badge
  if (d.badgeColor    !== undefined) data.badgeColor    = d.badgeColor
  if (d.rating        !== undefined) data.rating        = toFloat(d.rating)
  if (d.reviewCount   !== undefined) data.reviewCount   = toInt(d.reviewCount)
  if (d.featured      !== undefined) data.featured      = d.featured === 'true' || d.featured === true
  if (d.isPublished   !== undefined) data.isPublished   = d.isPublished !== 'false' && d.isPublished !== false
  if (d.inStock       !== undefined) data.inStock       = d.inStock     !== 'false' && d.inStock     !== false
  if (d.gradient      !== undefined) data.gradient      = d.gradient
  if (d.sortOrder     !== undefined) data.sortOrder     = toInt(d.sortOrder)
  if (d.colors        !== undefined) data.colors        = typeof d.colors === 'string' ? JSON.parse(d.colors) : d.colors

  const product = await prisma.product.update({ where: { id: req.params.id }, data })
  return ok(res, product)
}

// ── remove ───────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return notFound(res, 'Product not found')

  // delete local files
  deleteLocalFile(product.image)
  const gallery = Array.isArray(product.gallery) ? product.gallery : []
  gallery.forEach(g => deleteLocalFile(g?.url))

  await prisma.product.delete({ where: { id: req.params.id } })
  return ok(res, { message: 'Product deleted' })
}

// ── image upload ──────────────────────────────────────────────────────────────
exports.uploadImage = async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400)
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return notFound(res, 'Product not found')

  deleteLocalFile(product.image)
  const url = `/uploads/${req.file.filename}`
  await prisma.product.update({ where: { id: req.params.id }, data: { image: url } })
  return ok(res, { url })
}

exports.addGalleryImage = async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400)
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return notFound(res, 'Product not found')

  const url     = `/uploads/${req.file.filename}`
  const gallery = Array.isArray(product.gallery) ? [...product.gallery, { url }] : [{ url }]
  await prisma.product.update({ where: { id: req.params.id }, data: { gallery } })
  return ok(res, { url, gallery })
}

exports.removeGalleryImage = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return notFound(res, 'Product not found')

  const { url } = req.body
  deleteLocalFile(url)
  const gallery = (Array.isArray(product.gallery) ? product.gallery : []).filter(g => g?.url !== url)
  await prisma.product.update({ where: { id: req.params.id }, data: { gallery } })
  return ok(res, { gallery })
}

// ── catalog ───────────────────────────────────────────────────────────────────
exports.getCatalog = async (req, res) => {
  const items = await prisma.catalogItem.findMany({
    where:   { productId: req.params.id },
    orderBy: { sortOrder: 'asc' }
  })
  return ok(res, items)
}

exports.addCatalogItem = async (req, res) => {
  const d = req.body
  if (!d.title) return fail(res, 'title is required', 400)

  const image = req.file ? `/uploads/${req.file.filename}` : null
  const item  = await prisma.catalogItem.create({
    data: {
      productId:   req.params.id,
      title:       d.title,
      image,
      description: d.description ?? null,
      extraPrice:  toInt(d.extraPrice),
      colorHex:    d.colorHex    ?? null,
      type:        d.type        ?? null,
      tags:        toArr(d.tags),
      inStock:     d.inStock     !== 'false',
      sortOrder:   toInt(d.sortOrder)
    }
  })
  await prisma.product.update({ where: { id: req.params.id }, data: { hasCatalog: true } })
  return created(res, item)
}

exports.updateCatalogItem = async (req, res) => {
  const { id: productId, itemId } = req.params
  const existing = await prisma.catalogItem.findFirst({ where: { id: itemId, productId } })
  if (!existing) return notFound(res, 'Catalog item not found')

  const d    = req.body
  const data = {}
  if (d.title       !== undefined) data.title       = d.title
  if (d.description !== undefined) data.description = d.description
  if (d.extraPrice  !== undefined) data.extraPrice  = toInt(d.extraPrice)
  if (d.colorHex    !== undefined) data.colorHex    = d.colorHex
  if (d.type        !== undefined) data.type        = d.type
  if (d.tags        !== undefined) data.tags        = toArr(d.tags)
  if (d.inStock     !== undefined) data.inStock     = d.inStock !== 'false'
  if (d.sortOrder   !== undefined) data.sortOrder   = toInt(d.sortOrder)

  if (req.file) {
    deleteLocalFile(existing.image)
    data.image = `/uploads/${req.file.filename}`
  }

  const item = await prisma.catalogItem.update({ where: { id: itemId }, data })
  return ok(res, item)
}

exports.removeCatalogItem = async (req, res) => {
  const { id: productId, itemId } = req.params
  const existing = await prisma.catalogItem.findFirst({ where: { id: itemId, productId } })
  if (!existing) return notFound(res, 'Catalog item not found')

  deleteLocalFile(existing.image)
  await prisma.catalogItem.delete({ where: { id: itemId } })

  const remaining = await prisma.catalogItem.count({ where: { productId } })
  if (remaining === 0) await prisma.product.update({ where: { id: productId }, data: { hasCatalog: false } })

  return ok(res, { message: 'Catalog item deleted' })
}

exports.reorderCatalog = async (req, res) => {
  const { order } = req.body // [{id, sortOrder}]
  if (!Array.isArray(order)) return fail(res, 'order array required', 400)

  await Promise.all(order.map(({ id, sortOrder }) =>
    prisma.catalogItem.update({ where: { id }, data: { sortOrder } })
  ))
  return ok(res, { message: 'Reordered' })
}
