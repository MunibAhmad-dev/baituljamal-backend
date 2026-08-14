const prisma = require('../../config/prisma')
const { ok } = require('../../utils/apiResponse')

exports.get = async (req, res) => {
  let config = await prisma.siteConfig.findFirst()
  if (!config) {
    config = await prisma.siteConfig.create({ data: { key: 'main' } })
  }
  return ok(res, config)
}

exports.update = async (req, res) => {
  let config = await prisma.siteConfig.findFirst()
  if (!config) config = await prisma.siteConfig.create({ data: { key: 'main' } })

  const d    = req.body
  const data = {}
  if (d.freeThreshold   !== undefined) data.freeThreshold   = parseInt(d.freeThreshold)
  if (d.flatFee         !== undefined) data.flatFee         = parseInt(d.flatFee)
  if (d.estimatedDays   !== undefined) data.estimatedDays   = d.estimatedDays
  if (d.freeAreas       !== undefined) data.freeAreas       = Array.isArray(d.freeAreas) ? d.freeAreas : d.freeAreas.split(',').map(s => s.trim())
  if (d.phone           !== undefined) data.phone           = d.phone
  if (d.whatsapp        !== undefined) data.whatsapp        = d.whatsapp
  if (d.email           !== undefined) data.email           = d.email
  if (d.storeName       !== undefined) data.storeName       = d.storeName
  if (d.storeNameArabic !== undefined) data.storeNameArabic = d.storeNameArabic
  if (d.storeAddress    !== undefined) data.storeAddress    = d.storeAddress
  if (d.storeHours      !== undefined) data.storeHours      = d.storeHours
  if (d.announcement    !== undefined) data.announcement    = d.announcement
  if (d.seoTitle        !== undefined) data.seoTitle        = d.seoTitle
  if (d.seoDescription  !== undefined) data.seoDescription  = d.seoDescription

  const updated = await prisma.siteConfig.update({ where: { id: config.id }, data })
  return ok(res, updated)
}
