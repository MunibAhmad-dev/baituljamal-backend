const router = require('express').Router()
const ctrl = require('../controllers/category.controller')

router.get('/',                    ctrl.getCategories)
router.get('/:slug',               ctrl.getCategory)
router.get('/:slug/products',      ctrl.getCategoryProducts)

module.exports = router
