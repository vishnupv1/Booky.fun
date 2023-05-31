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
const { sign } = require('crypto')
const { userInfo } = require('os')


admin_route.use(express.static('public'));

admin_route.get('/',adminauth.isLogout,adminController.loadLogin)
admin_route.get('/adminhome',adminauth.isLogin,adminController.loadHome)
admin_route.post('/adminhome',adminController.verifyLogin)

admin_route.get('/adminforgot',adminauth.isLogout,adminController.loadForgot)
admin_route.post('/adminforgot',adminController.forgotVerify)
admin_route.get('/adminforgotpassword',adminauth.isLogout,adminController.loadForgotPassword)
admin_route.post('/adminforgotpassword',adminController.resetPassword)
admin_route.get('/adminlogout',adminauth.isLogin,adminController.loadLogout)
admin_route.get('/userlist',adminauth.isLogin,adminController.listUser)
admin_route.get('/blockuser',adminauth.isLogin,adminController.blockUser)
admin_route.get('/unblockuser',adminauth.isLogin,adminController.unblockUser)
admin_route.get('/productlist',adminauth.isLogin,adminController.listProdcut)
admin_route.get('/addbook',adminauth.isLogin,adminController.loadaddBook)
admin_route.post('/addbook',upload.array('image'),adminController.addBook)
admin_route.get('/editbook',adminauth.isLogin,adminController.loadeditBook)
admin_route.post('/updatebook',upload.array('image'),adminController.updateBook)
admin_route.get('/deletebook',adminauth.isLogin,adminController.deletebook)
admin_route.get('/category',adminauth.isLogin,adminController.loadcategory)
admin_route.get('/addcategory',adminauth.isLogin,adminController.loadaddcategory)
admin_route.post('/addcategory',adminController.addcategory)
admin_route.get('/deletecategory',adminauth.isLogin,adminController.deletecategory)
admin_route.get('/editcategory',adminauth.isLogin,adminController.loadeditCategory)
admin_route.post('/updatecategory',adminController.updateCategory)
admin_route.get('/orders',adminController.showorder)
admin_route.get('/viewOrder',adminController.viewOrder)
admin_route.get('/cancelOrder',adminController.cancelOrder)
admin_route.post('/updateOrderStatus',adminController.updateOrderStatus)












module.exports = admin_route

