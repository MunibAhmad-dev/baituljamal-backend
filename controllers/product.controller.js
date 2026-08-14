const prisma = require('../config/prisma')
const { ok, notFound } = require('../utils/apiResponse')

exports.getProducts = async (req, res) => {
  const { category, featured, type, inStock, q, page = 1, limit = 20 } = req.query
  const skip = (parseInt(page) - 1) * parseInt(limit)

  const where = { isPublished: true }

  if (category) {
    where.OR = [{ categorySlug: category }, { alsoIn: { has: category } }]
  }
  if (featured === 'true') where.featured = true
  if (type)    where.type    = type
  if (inStock) where.inStock = inStock === 'true'
  if (q) {
    const search = { contains: q, mode: 'insensitive' }
    const textOr = [
      { name:        search },
      { nameUrdu:    search },
      { description: search },
    ]
    where.OR = where.OR ? [{ AND: [{ OR: where.OR }, { OR: textOr }] }] : textOr
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take:    parseInt(limit),
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      select:  productListSelect()
    }),
    prisma.product.count({ where })
  ])

  return ok(res, { products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
}

exports.getFeatured = async (req, res) => {
  const products = await prisma.product.findMany({
    where:   { isPublished: true, featured: true },
    take:    12,
    orderBy: { sortOrder: 'asc' },
    select:  productListSelect()
  })
  return ok(res, products)
}

exports.getProduct = async (req, res) => {
  const product = await prisma.product.findUnique({
    where:   { id: req.params.id },
    include: {
      category:     { select: { slug: true, name: true, nameUrdu: true } },
      catalogItems: { orderBy: { sortOrder: 'asc' } }
    }
  })
  if (!product) return notFound(res, 'Product not found')
  return ok(res, product)
}

exports.getProductCatalog = async (req, res) => {
  const product = await prisma.product.findUnique({
    where:   { id: req.params.id },
    select:  { hasCatalog: true, catalogItems: { orderBy: { sortOrder: 'asc' } } }
  })
  if (!product) return notFound(res, 'Product not found')
  return ok(res, { hasCatalog: product.hasCatalog, catalog: product.catalogItems })
}

function productListSelect() {
  return {
    id: true, name: true, nameUrdu: true, slug: true,
    categorySlug: true, alsoIn: true, type: true,
    price: true, originalPrice: true, image: true, gallery: true,
    colors: true, sizes: true, badge: true, badgeColor: true,
    rating: true, reviewCount: true, featured: true, inStock: true,
    gradient: true, hasCatalog: true
  }
}
