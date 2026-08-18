const prisma          = require('../config/prisma')
const generateOrderId = require('../utils/generateOrderId')
const { ok, created, fail, notFound } = require('../utils/apiResponse')

exports.placeOrder = async (req, res) => {
  const { customer, items, payment } = req.body
  if (!customer?.name || !customer?.phone || !customer?.address)
    return fail(res, 'customer name, phone and address are required', 400)
  if (!items?.length) return fail(res, 'Order must have at least one item', 400)

  const config   = await prisma.siteConfig.findFirst() ?? { freeThreshold: 5000, flatFee: 300 }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0)

  // Check if any item belongs to a kit category → free delivery
  let isKitOrder = false
  const productIds = items.map(i => i.productId).filter(Boolean)
  if (productIds.length > 0) {
    const prods = await prisma.product.findMany({
      where:  { id: { in: productIds } },
      select: { categorySlug: true },
    })
    const catSlugs = [...new Set(prods.map(p => p.categorySlug).filter(Boolean))]
    if (catSlugs.length > 0) {
      const kitCount = await prisma.category.count({ where: { slug: { in: catSlugs }, isKit: true } })
      isKitOrder = kitCount > 0
    }
  }

  const deliveryFee = isKitOrder || subtotal >= config.freeThreshold ? 0 : config.flatFee
  const grandTotal  = subtotal + deliveryFee
  const orderId     = await generateOrderId()

  const phone = customer.phone.replace(/\D/g, '').replace(/^92/, '0')

  const order = await prisma.order.create({
    data: {
      orderId,
      userId:        req.user?.id ?? null,
      customerName:  customer.name,
      customerPhone: phone,
      customerCity:  customer.city  ?? null,
      customerAddr:  customer.address,
      customerNotes: customer.notes ?? null,
      subtotal,
      deliveryFee,
      grandTotal,
      payment: payment === 'bank' ? 'bank' : 'cod',
      items: {
        create: items.map(i => ({
          productId:   i.productId   ?? null,
          name:        i.name,
          nameUrdu:    i.nameUrdu    ?? null,
          image:       i.image       ?? null,
          size:        i.size        ?? null,
          qty:         i.qty,
          unitPrice:   i.unitPrice,
          totalPrice:  i.unitPrice * i.qty,
          catalogItem: i.catalogItem ?? null
        }))
      },
      statusHistory: { create: [{ status: 'placed', note: 'Order placed' }] }
    },
    include: { items: true, statusHistory: true }
  })

  return created(res, order)
}

exports.getByOrderId = async (req, res) => {
  const order = await prisma.order.findFirst({
    where:   { orderId: { equals: req.params.orderId.toUpperCase() } },
    include: { items: true, statusHistory: { orderBy: { at: 'asc' } } }
  })
  if (!order) return notFound(res, 'Order not found')
  return ok(res, order)
}

exports.getByPhone = async (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').replace(/^92/, '0')
  const orders = await prisma.order.findMany({
    where:   { customerPhone: phone },
    include: { items: true, statusHistory: { orderBy: { at: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  })
  return ok(res, orders)
}

exports.getMyOrders = async (req, res) => {
  const orders = await prisma.order.findMany({
    where:   { userId: req.user.id },
    include: { items: true, statusHistory: { orderBy: { at: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  })
  return ok(res, orders)
}
