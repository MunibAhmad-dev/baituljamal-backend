const router = require('express').Router()
const { protect, adminOnly } = require('../middleware/auth')
const upload = require('../middleware/upload')

const products    = require('../controllers/admin/products.controller')
const categories  = require('../controllers/admin/categories.controller')
const orders      = require('../controllers/admin/orders.controller')
const users       = require('../controllers/admin/users.controller')
const config      = require('../controllers/admin/config.controller')
const banners     = require('../controllers/admin/banners.controller')

// All admin routes require auth + admin role
router.use(protect, adminOnly)

// ── Products ─────────────────────────────────────────────────────────────────
router.get   ('/products',                          products.list)
router.post  ('/products',                          products.create)
router.get   ('/products/:id',                      products.get)
router.put   ('/products/:id',                      products.update)
router.delete('/products/:id',                      products.remove)

// Images
router.post  ('/products/:id/image',   upload.single('image'),  products.uploadImage)
router.post  ('/products/:id/gallery', upload.single('image'),  products.addGalleryImage)
router.delete('/products/:id/gallery',                          products.removeGalleryImage)

// Catalog
router.get   ('/products/:id/catalog',                          products.getCatalog)
router.post  ('/products/:id/catalog', upload.single('image'),  products.addCatalogItem)
router.put   ('/products/:id/catalog/:itemId', upload.single('image'), products.updateCatalogItem)
router.delete('/products/:id/catalog/:itemId',                  products.removeCatalogItem)
router.patch ('/products/:id/catalog/reorder',                  products.reorderCatalog)

// ── Categories ───────────────────────────────────────────────────────────────
router.get   ('/categories',                        categories.list)
router.post  ('/categories',                        categories.create)
router.get   ('/categories/:slug',                  categories.get)
router.put   ('/categories/:slug',                  categories.update)
router.delete('/categories/:slug',                  categories.remove)
router.post  ('/categories/:slug/image', upload.single('image'), categories.uploadImage)

// ── Orders ───────────────────────────────────────────────────────────────────
router.get   ('/orders',                            orders.list)
router.get   ('/orders/stats',                      orders.stats)
router.get   ('/orders/:orderId',                   orders.get)
router.patch ('/orders/:orderId/status',            orders.updateStatus)
router.patch ('/orders/:orderId/note',              orders.updateNote)

// ── Users ────────────────────────────────────────────────────────────────────
router.get   ('/users',                             users.list)
router.get   ('/users/:id',                         users.get)
router.patch ('/users/:id/role',                    users.setRole)
router.patch ('/users/:id/deactivate',              users.deactivate)

// ── Config ───────────────────────────────────────────────────────────────────
router.get   ('/config',                            config.get)
router.put   ('/config',                            config.update)

// ── Banners ──────────────────────────────────────────────────────────────────
router.get   ('/banners',          banners.list)
router.post  ('/banners',          upload.single('image'), banners.create)
router.put   ('/banners/:id',      upload.single('image'), banners.update)
router.delete('/banners/:id',      banners.remove)

module.exports = router
