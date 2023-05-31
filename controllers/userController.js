const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const Cart = require('../models/cartModel')
const express = require('express')
const user_router = require('../routes/userRoute')
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer = require('nodemailer')

//hashing password function
const securePassword = async (passwrod) => {
    try {
        const passwordHash = bcrypt.hash(passwrod, 10)
        return passwordHash
    }
    catch (error) {
        console.log(error.message);
    }
}
//for send verify mail
const sendVerifyMail = async (username, email, id) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.passwordUser
            }
        })
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For verification mail',
            html: '<p>Hi' + username + ', Plese click here to verify your Booky.com account <a href = "http://localhost:3000/verify?id=' + id + '">Verify</a>your mail</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('email has been sent:-', info.response);
            }
        })
    }
    catch (error) {
        console.log(error.message);
    }
}
//loading signup page
const loadRegister = async (req, res) => {
    try {
        res.render('signup')
    }
    catch {
        console.log(error.message);
    }
}
//loading login page
const loadLogin = async (req, res) => {
    try {
        res.render('login')
    }
    catch {
        console.log(error.message);
    }
}
//loading home page
const loadHome = async (req, res) => {
    try {
        const category = await Category.find({})
        const productD = await Product.find({})
        const userD = await User.findById({ _id: req.session.user_id })
        res.render('start', { user: userD, products: productD, category: category })
    }
    catch (error) {
        console.log(error.message);
    }
}
//loading User Profile
const loadProfile = async (req, res) => {
    try {
        const userD = await User.findById({ _id: req.session.user_id })
        res.render('profile', { user: userD })
    }
    catch (error) {
        console.log(error.message);
    }
}
//loading otp login
const loadOtpLogin = async (req, res) => {
    try {
        res.render('otpsend')
    }
    catch (error) {
        console.log(error.message);
    }
}
//mailing function
const otpVerifyMail = async (username, email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.passwordUser
            }
        })
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For otp login',
            html: '<p>Dear' + username + 'Your OTP is' + otp + '</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('email has been sent:-', info.response);
            }
        })
    }
    catch (error) {
        console.log(error.message);
    }
}
//sending otp
const otpSend = async (req, res) => {
    try {
        const userMail = await User.findOne({ mail: req.body.email })
        if (userMail) {
            let OTP = ""
            let digits = '0123456789'
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)]
            }
            const updatedUser = await User.updateOne({ mail: req.body.email }, { $set: { otp: OTP } })
            otpVerifyMail(userMail.username, userMail.mail, OTP)
            res.render('otp')
        }
        else {
            res.render('otpsend', { message: 'invalid mail id' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//verifying otp
const verifyotp = async (req, res) => {
    try {
        let OTP = req.body.otp
        let userData = await User.findOne({ otp: OTP })
        if (userData) {
            req.session.user_id = userData._id
            res.redirect('/home')
        }
        else {
            res.render('otp', { message: 'invalid otp' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//add user using signup
const insertUser = async (req, res) => {
    try {
        const exist = await User.findOne({ mail: req.body.email })
        if (exist) {
            res.render('signup', { message: 'e mail exists' })
        } else {
            const sPassword = await securePassword(req.body.password)
            const user = new User({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                username: req.body.username,
                mail: req.body.email,
                password: sPassword,
                image: req.file.filename,
                is_admin: 0
            })
            const userData = await user.save()

            if (userData) {

                sendVerifyMail(req.body.username, req.body.email, userData._id)
                res.render('signup', { message: 'You registration is successfull, Please verify your mail' })
            }
            else {
                res.render('signup', { message: 'registration failed' })
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//verifying user email
const verifyMail = async (req, res) => {
    try {
        await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })
        res.render('signup', { verification: 'Verified your mail id' })
    }
    catch (error) {
        console.log(error);
    }
}
//verifying login credntials
const verifyLogin = async (req, res) => {
    try {
        const userData = await User.findOne({ username: req.body.username })

        if (userData) {
            const passwordMatch = await bcrypt.compare(req.body.password, userData.password)
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    // res.redirect('/')
                    res.render('login', { message: 'Verify your mail id' })

                } else {
                    if (userData.is_blocked === '0') {
                        req.session.user_id = userData._id
                        res.redirect('/home')
                    } else {
                        res.render('login', { message: 'User Blocked' })
                    }
                }
            } else {

                // res.redirect('/')
                res.render('login', { message: 'Password incorrect' })
            }
        }
        else {
            // res.redirect('/')
            res.render('login', { message: 'Username  and Password incorrect' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//loading logout
const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    }
    catch (error) {
        console.log(error.message);
    }
}
//load forgot password page
const loadForgot = async (req, res) => {
    try {

        res.render('forgot')
    }
    catch {
        console.log(error.message);
    }
}
//for send password reset mail
const sendResetPasswordMail = async (username, email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: config.emailUser,
                pass: config.passwordUser
            }
        })
        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For Reset password',
            html: '<p>Hi ' + username + ', Plese click here to <a href = "http://localhost:3000/forgotpassword?token=' + token + '">Reset</a>your password</p>'
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('email has been sent:-', info.response);
            }
        })
    }
    catch (error) {
        console.log(error.message);
    }
}
//verify mail
const forgotVerify = async (req, res) => {
    try {
        const email = req.body.email
        const userData = await User.findOne({ mail: email })
        if (userData) {
            if (userData.is_verified === 0) {
                res.render('forgot', { message: 'Please verify your mail id' })
            } else {
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({ mail: email }, { $set: { token: randomString } })
                sendResetPasswordMail(userData.username, userData.mail, randomString)
                res.render('forgot', { message: 'Please check your mail to reset' })
            }
        } else {
            res.render('forgot', { message: 'Enter a valid mail id' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//load password reset page
const loadForgotPassword = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token })
        if (tokenData) {
            res.render('forgotpassword', { user_id: tokenData._id })
        } else {
            res.render('error', { message: 'Token is invalid' })
        }

    }
    catch {
        console.log(error.message);
    }
}
//reset password
const resetPassword = async (req, res) => {
    try {
        const password = req.body.password
        const user_id = req.body.user_id
        const secure_password = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } })
        res.redirect('/')
    }
    catch {
        console.log(error.message);
    }
}
//load product view page
const viewproduct = async (req, res) => {
    try {
        const product_id = req.query.id
        const productD = await Product.find({ _id: product_id })
        res.render('product', { product: productD[0] })
    }
    catch (error) {
        console.log(error.message);
    }
}
//add product to cart
const addtocart = async (req, res) => {
    try {
        let prodId = req.query.id
        let userId = req.session.user_id
        let userCart = await Cart.findOne({ user_id: userId })
        if (!userCart) {
            const newCart = new Cart({ user_id: userId, products: [] })
            await newCart.save()
            userCart = newCart
        }
        const productIndex = userCart?.products.findIndex((product) => product.product_id == prodId)
        const item = await Product.find({ _id: prodId })
        console.log(item[0].price);
        if (productIndex == -1) {
            userCart.products.push({ product_id: prodId, quantity: 1, price: item[0].price })

        } else {
            userCart.products[productIndex].quantity += 1


        }
        await userCart.save()
        setTimeout(() => {
            res.redirect('/home')
        }, 1000)
    } catch (error) {
        console.log(error.message)
    }
}
//show user's cart
const showCart = async (req, res) => {
    try {
        let username = req.session.username
        let session = req.session.loggedIn
        let cart = await Cart.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
        if (cart) {
            cartData = cart.products
            const products = cart.products.map(prod => {
                const totalS = Number(prod.quantity) * Number(prod.product_id.price)

                return ({
                    _id: prod.product_id._id.toString(),
                    name: prod.product_id.name,
                    price: prod.product_id.price,
                    image: prod.product_id.image,
                    quantity: prod.quantity,
                    total: totalS,
                })
            })
            res.render('cart', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable" })
        } else {
            res.render('cart', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '' })
        }
    } catch (error) {
        console.log(error.message)
    }
}
const deleteCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.id;
        let userCart = await Cart.findOne({ user_id: userId })
        if (userCart.products.length > 1) {
            const deletedItem = await Cart.findOneAndUpdate(
                { user_id: userId },
                { $pull: { products: { product_id: productId } } },
                { new: true }
            );
            res.redirect('/showcart');
        } else {
            await Cart.deleteOne({ user_id: userId });
            res.redirect('/showcart')
        }

    } catch (error) {
        console.error(error.message);
    }
};
const updateCart = async (req, res) => {
    try {
        let userId = req.session.user_id
        let updateValues = req.body.products
        for (let data of updateValues) {
            const { prod_id, quantity, finalAmount } = data;
            const changeCart = await Cart.updateOne({ $and: [{ user_id: userId }, { 'products.product_id': prod_id }] }, { $set: { 'products.$.quantity': quantity, total: finalAmount } })
        }
        res.send({ isOk: true })
    } catch (error) {
        console.log(error.message);
    }
}
const updateprofile = async (req, res) => {
    try {
        const mail = await User.findOneAndUpdate({ _id: req.body.id }, {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                username: req.body.username,
            }
        })
        res.redirect('/profile')
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadadress = async (req, res) => {
    try {
        let userid = req.session.user_id
        const userData = await User.findOne({ _id: userid }).lean().exec()
        res.render('adress', { user: userData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const addaddress = async (req, res) => {
    try {
        let userid = req.body.id
        let user = req.body
        let userD = await User.findOne({ _id: userid })
        let home = userD.homeaddress
        let work = userD.workaddress
        let personal = userD.personaladdress

        if (req.body.type == 'Home') {
            await User.updateOne({ _id: userid }, {
                $push: {
                    homeaddress: {
                        name: user.name,
                        mobile: user.mobile,
                        street: user.street,
                        landmark: user.landmark,
                        address: user.address,
                        city: user.city,
                        state: user.state,
                        zipcode: user.zipcode
                    }
                }
            })
        }

        else if (user.type === 'Work') {
            await User.updateOne({ _id: userid }, {
                $push: {
                    workaddress: {
                        street: user.street,
                        landmark: user.landmark,
                        address: user.address,
                        city: user.city,
                        state: user.state,
                        zipcode: user.zipcode
                    }
                }
            })
        }
        else {
            await User.updateOne({ _id: userid }, {
                $push: {
                    personaladdress: {
                        street: user.street,
                        landmark: user.landmark,
                        address: user.address,
                        city: user.city,
                        state: user.state,
                        zipcode: user.zipcode
                    }
                }
            })
        }

        res.redirect('/adress' + '?id=' + userid)
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadchangepwd = async (req, res) => {
    try {
        let userid = req.session.user_id
        const userData = await User.updateOne({ _id: userid })
        res.render('changepwd', { user: userData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const changepwd = async (req, res) => {
    try {
        let user = req.body
        let userid = req.session.user_id
        const userData = await User.findOne({ _id: userid })
        if (userData) {
            const passwordMatch = await bcrypt.compare(user.current, userData.password)
            if (passwordMatch) {
                const sPassword = await securePassword(user.password)
                await User.updateOne({ _id: userid }, {
                    $set:
                        { password: sPassword }
                })
                res.render('changepwd', { message: 'Password changed successfully' })
                req.session.destroy()
            } else {
                res.render('changepwd', { message: 'Current password is wrong' })
            }
        }



    }
    catch (error) {
        console.log(error.message);
    }
}
const checkout = async (req, res) => {
    try {
        let username = req.session.username
        let session = req.session.loggedIn
        let userData = await User.findOne({ _id: req.session.user_id })
        let home = userData.homeaddress
        let work = userData.workaddress
        let personal = userData.personaladdress
        let cart = await Cart.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
        if (cart) {
            const total = cart.products.map(prod => {
                return Number(prod.quantity) * Number(prod.product_id.price)
            })
            const products = cart.products.map(prod => {
                const totals = Number(prod.quantity) * Number(prod.product_id.price)
                return ({
                    _id: prod.product_id._id.toString(),
                    name: prod.product_id.name,
                    price: prod.product_id.price,
                    image: prod.product_id.image,
                    quantity: prod.quantity,
                    total: totals,
                })
            })
            let totalamount = total.reduce((a, b) => {
                return a + b;
            });
            res.render('checkout', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable", totalamount, userData, total, home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)) })
        } else {
            res.render('checkout', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '', totalamount: '', total: '', home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)) })
        }
    } catch (error) {
        console.log(error.message)
    }
}
const showCart2 = async (req, res) => {
    try {
        res.redirect('/showcart')
    } catch (error) {
        console.log(error.message);
    }
};
const placeorder = async (req, res) => {
    try {
        let userId = req.session.user_id
        let userDetails = await User.findOne({ _id: userId })
        let CartDetails = await Cart.findOne({ user_id: userId }).populate('products.product_id')
        console.log(req.body);

        let orderData = new Order({
            user_id: userId,
            name: req.body.uname,
            email: userDetails.mail,
            mobile: req.body.mobile,
            products: CartDetails.products,
            total: req.body.total,
            state: req.body.state,
            city: req.body.city,
            street: req.body.street,
            landmark: req.body.landmark,
            address: req.body.address,
            zipcode: req.body.zipcode,
            payment_method: req.body.payment
        })
        let success = await orderData.save()

        if (success) {
            await Cart.findOneAndDelete({ user_id: userId })
        }
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}
const myOrders = async (req, res) => {
    try {
        let id = req.query.id
        let orders = await Order.findOne({ _id: id }).populate('products.product_id');
        if (orders) {
            let productDetails = orders.products.map(data => {
                return ({
                    image: data.product_id.image[0],
                    productname: data.product_id.name,
                    quantity: data.quantity,
                })
            })
            res.render('orders', { title: "Orders", productDetails,orderId : id });
        } else {
            res.render('orders', { title: "Orders", message: "No Orders", noOrders: true });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const Orderlist = async (req, res) => {
    try {
        let orders = await Order.find({ user_id: req.session.user_id }).populate('products.product_id');
        if (orders.length > 0) {
            let orderDetails = orders.map(order => {
                return {
                    id: order._id,
                    total: order.total,
                    status: order.status,
                    products: order.products.map(data => {
                        return {
                            image: data.product_id.image[0],
                            productname: data.product_id.name,
                            quantity: data.quantity,
                        };
                    })
                };
            });
            console.log(orderDetails);
            res.render('orderlist', { title: "Orders", orders: orderDetails });
        } else {
            res.render('orderlist', { title: "Orders", orders: [] });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const contact = async (req, res) => {
    try {
        res.render('contacts')
    } catch (error) {
        console.log(error.message);
    }
};
const loadStart = async (req, res) => {
    try {
        res.render('start')
    } catch (error) {
        console.log(error.message);
    }
};
const mailme = async (req, res) => {
    try {
        let name = req.body.name
        let mail = req.body.email
        let message = req.body.message
        let subject = req.body.subject
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: config.emailUser,
                pass: config.passwordUser
            }
        });
        const mailOptions = {
            from: mail,
            to: config.emailUser,
            subject: subject,
            text: `Name: ${name}\nEmail: ${mail}\n\n${message}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error: Something went wrong. Please try again later.');
            } else {
                console.log('Email sent: ' + info.response);
                res.render('contacts', { messages: 'Thank you for contacting us!' })
            }
        });
    }
    catch (error) {
        console.log(error.message);
    }
};
const search = async (req, res) => {
    try {
        const productD = await Product.find({})
        const searchQuery = req.query.query;

        const searchResults = productD.filter((product) => {
            const regex = new RegExp(searchQuery, 'i');
            return regex.test(product.name) || regex.test(product.description);
        });

        res.json(searchResults);
    }
    catch (error) {
        console.log(error.message);
    }
};
const filter = async (req, res) => {
    try {
        const productD = await Product.find({})
        const filterQuery = req.query.category;
        const filterResults = productD.filter((product) => {
            const regex = new RegExp(filterQuery, 'i');
            return regex.test(product.category);
        });

        res.json(filterResults);
    }
    catch (error) {
        console.log(error.message);
    }
};
const pricefilter = async (req, res) => {
    try {
        const productD = await Product.find({})
        const price = req.query.price;
        console.log(price);

        const maxPrice = parseInt(price);
        filteredProducts = productD.filter(product => product.price <= maxPrice);

    }
    catch (error) {
        console.log(error.message);
    }
    res.json(filteredProducts);
};
const cancelOrder = async (req, res) => {
    try {
        let id = req.query.id
        await Order.updateOne({ _id: id },{$set:{status:"Cancelled"}});
        res.redirect('/showcart')
   
    } catch (error) {
        console.log(error.message);
    }
};


module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loadLogin,
    verifyLogin,
    loadHome,
    loadLogout,
    loadForgot,
    forgotVerify,
    loadForgotPassword,
    resetPassword,
    loadProfile,
    loadOtpLogin,
    otpSend,
    verifyotp,
    viewproduct,
    addtocart,
    showCart,
    deleteCart,
    updateCart,
    updateprofile,
    loadadress,
    addaddress,
    loadchangepwd,
    changepwd,
    checkout,
    placeorder,
    myOrders,
    Orderlist,
    contact,
    loadStart,
    mailme,
    search,
    filter,
    pricefilter,
    showCart2,
    cancelOrder

}