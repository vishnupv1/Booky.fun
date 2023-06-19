const express = require('express')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Coupon = require('../models/couponModel')
const Category = require('../models/categoryModel')
const Banner = require('../models/bannerModel')
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
//for sending signup verification mail
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
            html: '<p>Hi' + username + ', Plese click here to verify your Booky.com account <a href = "http://localhost:4000/verify?id=' + id + '">Verify</a>your mail</p>'
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
        const banner = await Banner.find({})
        const category = await Category.find({});
        const totalProducts = await Product.countDocuments({});
        const perPage = 8; // Number of products per page
        const currentPage = req.query.page || 1; // Current page number

        // Retrieve filter values from request query parameters
        const selectedCategory = req.query.category;
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;

        // Create filter object based on selected category and price range
        const filter = {};
        if (selectedCategory) {
            filter.category = selectedCategory;
        }
        if (minPrice && maxPrice) {
            filter.price = { $gte: minPrice, $lte: maxPrice };
        }


        // Query products with applied filters
        const products = await Product.find(filter)
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        const userD = await User.findById({ _id: req.session.user_id });
        res.render('start', {
            user: userD,
            products: products,
            category: category,
            currentPage: currentPage,
            totalPages: Math.ceil(totalProducts / perPage),
            selectedCategory: selectedCategory,
            minPrice: minPrice,
            maxPrice: maxPrice,
            banner: banner
        });
    } catch (error) {
        console.log(error.message);
    }
};
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
//sending otp for login
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
//adding user using signup
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
            html: '<p>Hi ' + username + ', Plese click here to <a href = "http://localhost:4000/forgotpassword?token=' + token + '">Reset</a>your password</p>'
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
        let username = req.session.username
        let session = req.session.loggedIn
        let userData = await User.findOne({ _id: req.session.user_id })
        let home = userData.homeaddress
        let work = userData.workaddress
        let personal = userData.personaladdress
        let userid = req.session.user_id
        const userDatas = await User.findOne({ _id: userid }).lean().exec()
        res.render('adress', { user: userDatas, home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)) })
    }
    catch (error) {
        console.log(error.message);
    }
}
const addaddress = async (req, res) => {
    try {
        let userid = req.session.user_id
        let user = req.body
        let userD = await User.findOne({ _id: userid })
        let home = userD.homeaddress
        let work = userD.workaddress
        let personal = userD.personaladdress

        if (req.body.type == 'Home') {
            await User.updateOne({ _id: userid }, {

                homeaddress: {
                    name: user.name,
                    mobile: user.mobile,
                    street: user.street,
                    landmark: user.landmark,
                    address: user.address,
                    city: user.city,
                    district: user.district,
                    state: user.state,
                    zipcode: user.zipcode
                }

            })
        }

        else if (user.type === 'Work') {
            await User.updateOne({ _id: userid }, {

                workaddress: {
                    name: user.name,
                    mobile: user.mobile,
                    street: user.street,
                    landmark: user.landmark,
                    address: user.address,
                    city: user.city,
                    district: user.district,
                    state: user.state,
                    zipcode: user.zipcode

                }
            })
        }
        else if (user.type === 'Personal') {
            await User.updateOne({ _id: userid }, {
                personaladdress: {
                    name: user.name,
                    mobile: user.mobile,
                    street: user.street,
                    landmark: user.landmark,
                    address: user.address,
                    city: user.city,
                    district: user.district,
                    state: user.state,
                    zipcode: user.zipcode

                }
            })
        }
        else {
            redirect('/profile')
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
const listUser = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 })
        res.render('userlist', { users: userData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const blockUser = async (req, res) => {
    try {
        const user_id = req.query.id
        const userData = await User.updateOne({ _id: user_id }, { $set: { is_blocked: 1 } })
        res.redirect('/admin/userlist')
    }
    catch (error) {
        console.log(error.message);
    }
}
const unblockUser = async (req, res) => {
    try {
        const user_id = req.query.id
        const userData = await User.updateOne({ _id: user_id }, { $set: { is_blocked: 0 } })
        res.redirect('/admin/userlist')
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadImageUpdate = async (req, res) => {
    try {
        const userD = await User.findById({ _id: req.session.user_id })
        res.render('imageUpdate', { user: userD })
    }
    catch (error) {
        console.log(error.message);
    }
}
const imageUpdate = async (req, res) => {
    try {
        const userD = await User.findById({ _id: req.session.user_id })

        await User.updateOne({ _id: req.session.user_id }, { $set: { image: req.file.filename } })
        res.redirect('/profile')

    }
    catch (error) {
        console.log(error.message);
    }
}
const wallet = async (req, res) => {
    try {
        const userD = await User.findById({ _id: req.session.user_id })
        res.render('wallet', { user: userD })
    }
    catch (error) {
        console.log(error.message);
    }
}
const shopcategory = async (req, res) => {
    try {
        const category = await Category.find({});
        const totalProducts = await Product.countDocuments({});
        const perPage = 8; // Number of products per page
        const currentPage = req.query.page || 1; // Current page number

        // Retrieve filter values from request query parameters
        const selectedCategory = req.query.category;
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;

        // Create filter object based on selected category and price range
        const filter = {};
        if (selectedCategory) {
            filter.category = selectedCategory;
        }
        if (minPrice && maxPrice) {
            filter.price = { $gte: minPrice, $lte: maxPrice };
        }


        // Query products with applied filters
        const products = await Product.find(filter)
            .skip((currentPage - 1) * perPage)
        const userD = await User.findById({ _id: req.session.user_id });
        res.render('shopcategory', {
            user: userD,
            products: products,
            category: category,
            currentPage: currentPage,
            totalPages: Math.ceil(totalProducts / perPage),
            selectedCategory: selectedCategory,
            minPrice: minPrice,
            maxPrice: maxPrice,
        });
    } catch (error) {
        console.log(error.message);
    }
};
const deleteAccount = async (req, res) => {
    let id = req.session.user_id


    await User.deleteOne({ _id: id })
    res.redirect('/logout')



}
const mycoupon = async (req, res) => {
    try {
        const userD = await User.findById({ _id: req.session.user_id })
        const coupon = await Coupon.find({})
        couponDetails = coupon.map(cpn => {
            const expiryDate = new Date(cpn.expiry); // Convert date to a Date object
            const year = expiryDate.getFullYear();
            const month = expiryDate.getMonth() + 1;
            const date = expiryDate.getDate();
            return {
                date: `${date}/${month}/${year}`,
            }
        })
        res.render('coupon', { coupon: coupon, date: couponDetails })
    }
    catch (error) {
        console.log(error.message);
    }
}



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
    updateprofile,
    loadadress,
    addaddress,
    loadchangepwd,
    changepwd,
    contact,
    loadStart,
    mailme,
    listUser,
    blockUser,
    unblockUser,
    loadImageUpdate,
    imageUpdate,
    wallet,
    shopcategory,
    deleteAccount,
    mycoupon
}