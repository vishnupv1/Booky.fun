const express = require('express');
const admin_route = express();
const session = require('express-session');
const config = require('../config/config')
const nocache = require('nocache')
admin_route.use(nocache())
const adminauth = require('../middleware/adminauth');


admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));
const auth = require('../middleware/auth');

const bodyParser = require('body-parser')


admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')



admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({ extended: true }))

const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('./public/productImages'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})

const upload = multer({ storage: storage })

const adminController = require('../controllers/adminController')
const userController = require('../controllers/userController')
const categoryController = require('../controllers/cateogryController')
const orderController = require('../controllers/orderController')
const productController = require('../controllers/productController')
const couponController = require('../controllers/couponController')
const bannerController = require('../controllers/bannerController')

const { sign } = require('crypto')
const { userInfo } = require('os')


admin_route.use(express.static('public'));

admin_route.get('/', adminauth.isLogout, adminController.loadLogin)
admin_route.get('/adminhome', adminauth.isLogin, adminController.loadHome)
admin_route.post('/adminhome', adminController.verifyLogin)
admin_route.get('/adminforgot', adminauth.isLogout, adminController.loadForgot)
admin_route.post('/adminforgot', adminController.forgotVerify)
admin_route.get('/adminforgotpassword', adminauth.isLogout, adminController.loadForgotPassword)
admin_route.post('/adminforgotpassword', adminController.resetPassword)
admin_route.get('/adminlogout', adminauth.isLogin, adminController.loadLogout)
admin_route.get('/userlist', adminauth.isLogin, userController.listUser)
admin_route.get('/blockuser', adminauth.isLogin, userController.blockUser)
admin_route.get('/unblockuser', adminauth.isLogin, userController.unblockUser)


admin_route.get('/productlist', adminauth.isLogin, productController.listProdcut)
admin_route.get('/addbook', adminauth.isLogin, productController.loadaddBook)
admin_route.post('/addbook', upload.array('image'), productController.addBook)
admin_route.get('/editbook', adminauth.isLogin, productController.loadeditBook)
admin_route.post('/updatebook', upload.array('image'), productController.updateBook)
admin_route.get('/deletebook', adminauth.isLogin, productController.deletebook)
admin_route.get('/undodelete', adminauth.isLogin, productController.undodelete)
admin_route.get('/stockManagement', productController.stockManagement)

admin_route.get('/orders', orderController.showorder)
admin_route.get('/viewOrder', orderController.viewOrder)
admin_route.get('/cancelOrder', orderController.cancelOrder)
admin_route.post('/updateOrderStatus', orderController.updateOrderStatus)
admin_route.post('/reportExport', adminController.reportExport)



admin_route.get('/category', adminauth.isLogin, categoryController.loadcategory)
admin_route.get('/addcategory', adminauth.isLogin, categoryController.loadaddcategory)
admin_route.post('/addcategory', categoryController.addcategory)
admin_route.get('/deletecategory', adminauth.isLogin, categoryController.deletecategory)
admin_route.get('/editcategory', adminauth.isLogin, categoryController.loadeditCategory)
admin_route.post('/updatecategory', categoryController.updateCategory)

admin_route.get('/couponManagement', adminauth.isLogin, couponController.loadedcouponManagement)
admin_route.post('/addCoupon', adminauth.isLogin, couponController.addCoupon)
admin_route.post('/editcoupon', adminauth.isLogin, couponController.editCoupon)
admin_route.get('/deleteCoupon', adminauth.isLogin, couponController.deleteCoupon)

admin_route.get('/bannerManagement', adminauth.isLogin, bannerController.loadBannerManagement)
admin_route.post('/addBanner', adminauth.isLogin, upload.array('image'), bannerController.addBanner)
admin_route.get('/deleteBanner', adminauth.isLogin, bannerController.deleteBanner)




module.exports = admin_route

