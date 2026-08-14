const prisma = require('../../config/prisma')
const { ok, created, notFound } = require('../../utils/apiResponse')

exports.list = async (req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } })
    return ok(res, banners)
  } catch (e) { next(e) }
}

exports.create = async (req, res, next) => {
  try {
    const { title, subtitle, link, sortOrder } = req.body
    const image = req.file ? `/uploads/${req.file.filename}` : null
    if (!image) return res.status(400).json({ success: false, message: 'Image is required' })
    const banner = await prisma.banner.create({
      data: { image, title: title || null, subtitle: subtitle || null, link: link || null, sortOrder: Number(sortOrder) || 0 }
    })
    return created(res, banner)
  } catch (e) { next(e) }
}

exports.update = async (req, res, next) => {
  try {
    const { title, subtitle, link, sortOrder, isActive } = req.body
    const data = {}
    if (title     !== undefined) data.title     = title || null
    if (subtitle  !== undefined) data.subtitle  = subtitle || null
    if (link      !== undefined) data.link      = link || null
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0
    if (isActive  !== undefined) data.isActive  = isActive === 'true' || isActive === true
    if (req.file) data.image = `/uploads/${req.file.filename}`
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data })
    return ok(res, banner)
  } catch (e) { next(e) }
}

exports.remove = async (req, res, next) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } })
    return ok(res, { deleted: true })
  } catch (e) { next(e) }
}
