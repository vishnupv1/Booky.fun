const express = require('express');
const user_route = express();
const session = require('express-session');
const config = require('../config/config')
const nocache = require('nocache')
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
user_route.get('/viewproduct',auth.isLogin,upload.array('image'),userController.viewproduct)
user_route.get('/showcart',auth.isLogin,userController.showCart)
user_route.get('/addtocart',auth.isLogin,userController.addtocart)
user_route.get('/cart/delete/:id',auth.isLogin,userController.deleteCart)
user_route.post('/cart/updatecart',userController.updateCart)
user_route.post('/updateprofile',userController.updateprofile)
user_route.get('/adress',auth.isLogin,userController.loadadress)
user_route.post('/addaddress',userController.addaddress)
user_route.get('/changepwd',auth.isLogin,userController.loadchangepwd)
user_route.post('/changepwd',userController.changepwd)
user_route.post('/checkout',userController.checkout)
user_route.get('/checkout',auth.isLogin,userController.showCart2)
user_route.post('/payment',userController.placeorder)
user_route.get('/payment',auth.isLogin,userController.loadHome)
user_route.get('/myOrders',auth.isLogin,userController.myOrders)
user_route.get('/orderlist',auth.isLogin,userController.Orderlist)
user_route.get('/contact',userController.contact)
user_route.get('/start',userController.loadStart)
user_route.post('/mailme',userController.mailme)
user_route.get('/search',userController.search)
user_route.get('/filter',userController.filter)
user_route.get('/pricefilter',userController.pricefilter)
user_route.get('/cancelOrder',userController.cancelOrder)




module.exports = user_route

