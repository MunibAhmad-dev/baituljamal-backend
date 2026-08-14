const prisma = require('../config/prisma')
const { ok, notFound } = require('../utils/apiResponse')

exports.getCategories = async (req, res) => {
  const cats = await prisma.category.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  const withCount = await Promise.all(cats.map(async (cat) => {
    const productCount = await prisma.product.count({
      where: {
        isPublished: true,
        OR: [{ categorySlug: cat.slug }, { alsoIn: { has: cat.slug } }]
      }
    })
    return { ...cat, productCount }
  }))

  return ok(res, withCount)
}

exports.getCategory = async (req, res) => {
  const cat = await prisma.category.findUnique({ where: { slug: req.params.slug } })
  if (!cat) return notFound(res, 'Category not found')
  return ok(res, cat)
}

exports.getCategoryProducts = async (req, res) => {
  const { slug } = req.params
  const { type, page = 1, limit = 20 } = req.query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const cat = await prisma.category.findUnique({ where: { slug } })
  if (!cat) return notFound(res, 'Category not found')

  const where = {
    isPublished: true,
    OR: [{ categorySlug: slug }, { alsoIn: { has: slug } }]
  }
  if (type) where.type = type

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take:    parseInt(limit),
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }]
    }),
    prisma.product.count({ where })
  ])

  return ok(res, { category: cat, products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
}
