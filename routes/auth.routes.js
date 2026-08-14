const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth')

router.post('/register',         ctrl.register)
router.post('/login',            ctrl.login)
router.post('/refresh',          ctrl.refresh)
router.get( '/me',    protect,   ctrl.getMe)
router.put( '/me',    protect,   ctrl.updateMe)
router.post('/logout', protect,  ctrl.logout)
router.post('/change-password', protect, ctrl.changePassword)

module.exports = router
