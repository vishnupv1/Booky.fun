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
admin_route.get('/adminhome', adminController.loadHome)
admin_route.post('/adminhome', adminController.verifyLogin)
admin_route.get('/adminforgot', adminauth.isLogout, adminController.loadForgot)
admin_route.post('/adminforgot', adminController.forgotVerify)
admin_route.get('/adminforgotpassword', adminauth.isLogout, adminController.loadForgotPassword)
admin_route.post('/adminforgotpassword', adminController.resetPassword)
admin_route.get('/adminlogout', adminController.loadLogout)
admin_route.get('/userlist', userController.listUser)
admin_route.get('/blockuser', userController.blockUser)
admin_route.get('/unblockuser', userController.unblockUser)


admin_route.get('/productlist', productController.listProdcut)
admin_route.get('/addbook', productController.loadaddBook)
admin_route.post('/addbook', upload.array('image'), productController.addBook)
admin_route.get('/editbook', productController.loadeditBook)
admin_route.post('/updatebook', upload.array('image'), productController.updateBook)
admin_route.get('/deletebook', productController.deletebook)
admin_route.get('/undodelete', productController.undodelete)
admin_route.get('/stockManagement', productController.stockManagement)

admin_route.get('/orders', orderController.showorder)
admin_route.get('/viewOrder', orderController.viewOrder)
admin_route.get('/cancelOrder', orderController.cancelOrder)
admin_route.post('/updateOrderStatus', orderController.updateOrderStatus)
admin_route.post('/reportExport', adminController.reportExport)
admin_route.get('/salesreport', adminController.getSalesPage)
admin_route.get('/getTodaySales', adminController.getTodaySales)
admin_route.get('/getWeekSales', adminController.getWeekSales)
admin_route.get('/getMonthSales', adminController.getMonthSales)
admin_route.get('/GetYearSales', adminController.GetYearSales)
admin_route.post('/salesWithDate', adminController.salesWithDate)
admin_route.get('/printReport', adminController.downloadSalesReport)

admin_route.get('/category', categoryController.loadcategory)
admin_route.get('/addcategory', categoryController.loadaddcategory)
admin_route.post('/addcategory', categoryController.addcategory)
admin_route.get('/deletecategory', categoryController.deletecategory)
admin_route.get('/editcategory', categoryController.loadeditCategory)
admin_route.post('/updatecategory', categoryController.updateCategory)

admin_route.get('/couponManagement', couponController.loadedcouponManagement)
admin_route.post('/addCoupon', couponController.addCoupon)
admin_route.post('/editcoupon', couponController.editCoupon)
admin_route.get('/deleteCoupon', couponController.deleteCoupon)

admin_route.get('/bannerManagement', bannerController.loadBannerManagement)
admin_route.post('/addBanner', upload.array('image'), bannerController.addBanner)
admin_route.get('/deleteBanner', bannerController.deleteBanner)

module.exports = admin_route

