const router = require('express').Router()
const ctrl = require('../controllers/order.controller')
const { protect } = require('../middleware/auth')

router.post('/',                    ctrl.placeOrder)          // guest or logged-in
router.get('/my',      protect,     ctrl.getMyOrders)         // logged-in user's orders
router.get('/track/:phone',         ctrl.getByPhone)          // track by phone
router.get('/:orderId',             ctrl.getByOrderId)        // track by BJ-YYYYMMDD-XXXX

module.exports = router
