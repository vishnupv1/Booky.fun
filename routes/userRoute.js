const express = require('express');
const session = require('express-session');
const nocache = require('nocache')
const user_route = express();
const config = require('../config/config')
user_route.use(nocache())

user_route.use(session({
    secret: config.sessionSecret,
    resave: false, 
    saveUninitialized: false 
  }));

const auth = require('../middleware/auth');
const bodyParser = require('body-parser')
user_route.set('view engine', 'ejs')
user_route.set('views', './views/user')
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({ extended: true }))

const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('./public/userImages'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})

const upload = multer({ storage: storage })

const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const productController = require('../controllers/productController')
const wishlistController = require('../controllers/wishlistController')
const { sign } = require('crypto')
const { userInfo } = require('os')


user_route.use(express.static('public'));

user_route.get('/',auth.isLogout,userController.loadLogin)
user_route.get('/login',auth.isLogout, userController.loadLogin)
user_route.get('/signup',userController.loadRegister)
user_route.post('/signup',upload.single('image'), userController.insertUser)
user_route.get('/verify', userController.verifyMail)
user_route.post('/home',userController.verifyLogin)
user_route.get('/home',auth.isLogin,userController.loadHome)
user_route.get('/logout',auth.isLogin,userController.loadLogout)
user_route.get('/forgot',auth.isLogout,userController.loadForgot)
user_route.post('/forgot',userController.forgotVerify)
user_route.get('/forgotpassword',auth.isLogout,userController.loadForgotPassword)
user_route.post('/forgotpassword',userController.resetPassword)
user_route.get('/profile',auth.isLogin,userController.loadProfile)
user_route.get('/otpsend',auth.isLogout,userController.loadOtpLogin)
user_route.post('/otpsend',userController.otpSend)
user_route.post('/verifyotp',userController.verifyotp)
user_route.post('/updateprofile',userController.updateprofile)
user_route.get('/adress',auth.isLogin,userController.loadadress)
user_route.post('/addaddress',userController.addaddress)
user_route.get('/changepwd',auth.isLogin,userController.loadchangepwd)
user_route.post('/changepwd',userController.changepwd)
user_route.get('/payment',auth.isLogin,userController.loadHome)
user_route.get('/contact',userController.contact)
user_route.get('/start',userController.loadStart)
user_route.post('/mailme',userController.mailme)
user_route.get('/loadImageUpdate',userController.loadImageUpdate)

user_route.post('/imageUpdate',upload.single('image'),userController.imageUpdate)

user_route.get('/addtowishlist',auth.isLogin,wishlistController.addtowishlist)
user_route.post('/updatewishlist',wishlistController.updateWishlist)
user_route.get('/showwishlist',auth.isLogin,wishlistController.showWishlist)
user_route.get('/deletewishlist/:id',auth.isLogin,wishlistController.deleteWishlist)

//user side product related functions
user_route.get('/viewproduct',auth.isLogin,upload.array('image'),productController.viewproduct)
user_route.get('/search',productController.search)
user_route.get('/filter',productController.filter)
user_route.get('/pricefilter',productController.pricefilter)

//order related functions
user_route.get('/myOrders',auth.isLogin,orderController.myOrders)
user_route.get('/orderlist',auth.isLogin,orderController.Orderlist)
user_route.post('/checkout',orderController.checkout)
user_route.post('/payment',orderController.placeorder)
user_route.get('/cancelOrder',orderController.cancelOrder)
user_route.get('/pay',orderController.pay)
user_route.get('/success',orderController.success)
user_route.get('/cancel',orderController.cancel)
user_route.get('/paypal',orderController.loadpaypal)
user_route.post('/paypalpost',orderController.paypalpost)

//cart related functions
user_route.get('/checkout',auth.isLogin,cartController.showCart2)
user_route.get('/addtocart',auth.isLogin,cartController.addtocart)
user_route.post('/cart/updatecart',cartController.updateCart)
user_route.get('/showcart',auth.isLogin,cartController.showCart)
user_route.get('/cart/delete/:id',auth.isLogin,cartController.deleteCart)





module.exports = user_route

