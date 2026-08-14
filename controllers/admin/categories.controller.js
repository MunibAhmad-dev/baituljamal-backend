const prisma              = require('../../config/prisma')
const { deleteLocalFile } = require('../../utils/fileHelper')
const { ok, created, fail, notFound } = require('../../utils/apiResponse')

exports.list = async (req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  const withCount = await Promise.all(cats.map(async cat => {
    const productCount = await prisma.product.count({
      where: { OR: [{ categorySlug: cat.slug }, { alsoIn: { has: cat.slug } }] }
    })
    return { ...cat, productCount }
  }))
  return ok(res, withCount)
}

exports.create = async (req, res) => {
  const d = req.body
  if (!d.slug || !d.name) return fail(res, 'slug and name are required', 400)
  const cat = await prisma.category.create({
    data: {
      slug:        d.slug,
      name:        d.name,
      nameUrdu:    d.nameUrdu    ?? null,
      nameSubtitle:d.nameSubtitle?? null,
      description: d.description ?? null,
      types:       d.types ? (Array.isArray(d.types) ? d.types : d.types.split(',').map(s => s.trim())) : [],
      sortOrder:   parseInt(d.sortOrder) || 0,
      isActive:    d.isActive !== 'false',
      gradient:    d.gradient    ?? null,
      lightColor:  d.lightColor  ?? null,
      textColor:   d.textColor   ?? null,
      borderColor: d.borderColor ?? null,
      icon:        d.icon        ?? null,
    }
  })
  return created(res, cat)
}

exports.get = async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } })
  if (!cat) return notFound(res, 'Category not found')
  return ok(res, cat)
}

exports.update = async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } })
  if (!cat) return notFound(res, 'Category not found')

  const d    = req.body
  const data = {}
  if (d.name         !== undefined) data.name        = d.name
  if (d.nameUrdu     !== undefined) data.nameUrdu    = d.nameUrdu
  if (d.nameSubtitle !== undefined) data.nameSubtitle= d.nameSubtitle
  if (d.description  !== undefined) data.description = d.description
  if (d.types        !== undefined) data.types       = Array.isArray(d.types) ? d.types : d.types.split(',').map(s => s.trim())
  if (d.sortOrder    !== undefined) data.sortOrder   = parseInt(d.sortOrder) || 0
  if (d.isActive     !== undefined) data.isActive    = d.isActive !== 'false'
  if (d.gradient     !== undefined) data.gradient    = d.gradient
  if (d.lightColor   !== undefined) data.lightColor  = d.lightColor
  if (d.textColor    !== undefined) data.textColor   = d.textColor
  if (d.borderColor  !== undefined) data.borderColor = d.borderColor
  if (d.icon         !== undefined) data.icon        = d.icon

  const updated = await prisma.category.update({ where: { slug: req.params.slug }, data })
  return ok(res, updated)
}

exports.remove = async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } })
  if (!cat) return notFound(res, 'Category not found')

  const count = await prisma.product.count({ where: { categorySlug: req.params.slug } })
  if (count > 0) return fail(res, `Cannot delete — ${count} products still in this category`, 400)

  deleteLocalFile(cat.image)
  await prisma.category.delete({ where: { slug: req.params.slug } })
  return ok(res, { message: 'Category deleted' })
}

exports.uploadImage = async (req, res) => {
  if (!req.file) return fail(res, 'No file uploaded', 400)
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } })
  if (!cat) return notFound(res, 'Category not found')

  deleteLocalFile(cat.image)
  const url = `/uploads/${req.file.filename}`
  await prisma.category.update({ where: { slug: req.params.slug }, data: { image: url } })
  return ok(res, { url })
}
