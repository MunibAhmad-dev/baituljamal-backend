const router = require('express').Router()
const ctrl = require('../controllers/product.controller')

router.get('/',            ctrl.getProducts)
router.get('/featured',    ctrl.getFeatured)
router.get('/:id',         ctrl.getProduct)
router.get('/:id/catalog', ctrl.getProductCatalog)

module.exports = router
