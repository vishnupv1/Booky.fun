const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Order = require('../models/orderModel')
const express = require('express')
const admin_router = require('../routes/adminRoute')
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer = require('nodemailer')

const securePassword = async (passwrod) => {
    try {
        const passwordHash = bcrypt.hash(passwrod, 10)
        return passwordHash
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadLogin = async (req, res) => {
    try {
        res.render('adminlogin')
    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async (req, res) => {
    try {
        const adminData = await Admin.findOne({ username: req.body.username })
        if (adminData) {
            const keyMatch = await Admin.findOne({ key: req.body.key })
            if (keyMatch) {
                req.session.admin_id = adminData._id
                res.redirect('/admin/adminhome')
            }
            else {
                res.render('adminlogin', { message: 'Password incorrect' })
            }
        }
        else {
            res.render('adminlogin', { message: 'Username incorrect' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadHome = async (req, res) => {
    try {
        const admin = await Admin.findById({ _id: req.session.admin_id })
        const users = await User.find({})
        const orders = await Order.find({})
        const books = await Product.find({})
        
        res.render('adminhome',{user:users,order:orders,book:books})
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadForgot = async (req, res) => {
    try {
        res.render('adminforgot')
    }
    catch (error) {
        console.log(error.message);
    }
}
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
            html: '<p>Hi ' + username + ', Plese click here to <a href = "http://localhost:3000/admin/adminforgotpassword?token=' + token + '">Reset</a>your password</p>'
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
const forgotVerify = async (req, res) => {
    try {
        const email = req.body.email
        const adminData = await Admin.findOne({ email: email })
        if (adminData) {
            const randomString = randomstring.generate()
            const updatedData = await Admin.updateOne({ email: email }, { $set: { token: randomString } })


            sendResetPasswordMail(adminData.username, adminData.email, randomString)
            res.render('adminforgot', { message: 'Please check your mail to reset' })
        } else {
            res.render('adminforgot', { message: 'Enter a valid mail id' })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const resetPassword = async (req, res) => {
    try {
        const key = req.body.key
        const user_id = req.body.user_id
        const updatedData = await Admin.findByIdAndUpdate({ _id: user_id }, { $set: { key: key, token: '' } })
        res.redirect('/admin')
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadForgotPassword = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await Admin.findOne({ token: token })
        if (tokenData) {
            res.render('adminforgotpassword', { user_id: tokenData._id })
        } else {
            res.render('error', { message: 'Token is invalid' })
        }

    }
    catch (error) {
        console.log(error.message);
    }
}
const loadLogout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin')
    }
    catch (error) {
        console.log(error.message);
    }
}
const listUser = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 })
        res.render('userlist', { users: userData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const dashBoard = async (req, res) => {
    try {
        res.redirect('/admin/adminhome')
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
const listProdcut = async (req, res) => {
    try {
        const productData = await Product.find({ listable: 1 })
        res.render('productlist', { products: productData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadaddBook = async (req, res) => {
    try {
        const category = await Category.find({}).lean().exec()
        res.render('addbook', { category: category })
    }
    catch (error) {
        console.log(error.message);
    }
}
const addBook = async (req, res) => {
    try {
        const exist = await Product.findOne({ name: req.body.name })
        if (exist) {
            res.render('addbook', { message: 'Book exists please use edit option' })
        } else {
            var arrayimage = []
            for (let i = 0; i < req.files.length; i++) {
                arrayimage[i] = req.files[i].filename
            }
            const prodcut = new Product({
                name: req.body.name,
                author: req.body.author,
                pages: req.body.pages,
                category: req.body.category,
                language: req.body.language,
                description: req.body.description,
                price: req.body.price,
                stock: req.body.stock,
                image: arrayimage,
            })
            await prodcut.save()

            setTimeout(() => {
                res.redirect('/admin/productlist');
            }, 3000)
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const loaddeleteBook = async (req, res) => {
    try {
        res.render('addbook')
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadeditBook = async (req, res) => {
    try {
        const category = await Category.find({}).lean().exec()
        const productData = await Product.findOne({ _id: req.query.id })
        res.render('editbook', { products: productData, category })
    }
    catch (error) {
        console.log(error.message);
    }
}
const updateBook = async (req, res) => {
    try {
        var arrayimage = []
        for (let i = 0; i < req.files.length; i++) {
            arrayimage[i] = req.files[i].filename
        }
        const productData = await Product.findOne({ _id: req.body.id })
        const img = productData.image
        if (req.files.length > 0) {

            await Product.findByIdAndUpdate({ _id: req.body.id }, {
                $set: {
                    name: req.body.name,
                    author: req.body.author,
                    pages: req.body.pages,
                    category: req.body.category,
                    language: req.body.language,
                    description: req.body.description,
                    price: req.body.price,
                    stock: req.body.stock,
                    image: arrayimage,
                }
            })
        } else {
            await Product.findByIdAndUpdate({ _id: req.body.id }, {
                $set: {
                    name: req.body.name,
                    author: req.body.author,
                    pages: req.body.pages,
                    category: req.body.category,
                    language: req.body.language,
                    description: req.body.description,
                    price: req.body.price,
                    stock: req.body.stock,
                    image: img
                }
            })
        }
        setTimeout(() => {
            res.redirect('/admin/productlist');
        }, 1000)
    }

    catch (error) {
        console.log(error.message);
    }
}
const deletebook = async (req, res) => {
    try {
        const productData = await Product.findOne({ _id: req.query.id })
        console.log(productData);
        if (productData) {
            await Product.deleteOne({ _id: req.query.id })
        }
        res.redirect('/admin/productlist')
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadcategory = async (req, res) => {
    try {
        const category = await Category.find({})
        res.render('category', { category: category })
    }
    catch (error) {
        console.log(error.message);
    }
}
const loadaddcategory = async (req, res) => {
    try {
        res.render('addcategory')
    }
    catch (error) {
        console.log(error.message);
    }
}
const addcategory = async (req, res) => {
    try {
        let cname = req.body.name
        const catData = await Category.findOne({ name: cname })
        if (catData) {
            res.render('addcategory', { message: 'Category duplication found' })
        } else {
            Category.insertMany({ name: req.body.name })
            setTimeout(() => {
                res.redirect('/admin/category')
            }, 2000)

        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const deletecategory = async (req, res) => {
    try {
        const categoryData = await Category.findOne({ _id: req.query.id })
        if (categoryData) {
            await Category.deleteOne({ _id: req.query.id })
        }
        res.redirect('/admin/category')

    }
    catch (error) {
        console.log(error.message);
    }
}
const loadeditCategory = async (req, res) => {
    try {
        const catData = await Category.findOne({ _id: req.query.id })
        res.render('editcategory', { category: catData })
    }
    catch (error) {
        console.log(error.message);
    }
}
const updateCategory = async (req, res) => {
    try {
        await Category.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                name: req.body.name
            }
        })
        setTimeout(() => {
            res.redirect('/admin/category')
        }, 1000)
    }

    catch (error) {
        console.log(error.message);
    }
}
const showorder = async (req, res) => {
    try {
        const order = await Order.find({})
        if (order) {
            res.render('orders', { order })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const viewOrder = async (req, res) => {
    try {
        let id = req.query.id
        let ordersD = await Order.find({ _id: id }).populate('products.product_id');
        if (ordersD) {
            var orderDetails = ordersD.map(order => {
                return {
                    id: order._id,
                    total: order.total,
                    status: order.status,
                    name: order.name,
                    mobile: order.mobile,
                    state: order.state,
                    district: order.district,
                    street: order.street,
                    landmark: order.landmark,
                    address: order.address,
                    city: order.district,
                    zipcode: order.zipcode,
                    payment_method: order.payment_method
                };
            });
        }
        console.log(orderDetails);
        let orders = await Order.findOne({ _id: id }).populate('products.product_id');
        if (orders) {
            let productDetails = orders.products.map(data => {
                return ({
                    image: data.product_id.image[0],
                    productname: data.product_id.name,
                    quantity: data.quantity,
                })
            })
            res.render('vieworder', { title: "Orders", productDetails, orderId: id, orderDetails });
        } else {
            res.render('vieworder', { title: "Orders", message: "No Orders", noOrders: true });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const cancelOrder = async (req, res) => {
    try {
        let id = req.query.id
        await Order.deleteOne({ _id: id });
        res.redirect('/admin/orders')

    } catch (error) {
        console.log(error.message);
    }
};
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        await Order.updateOne({ _id: orderId }, { $set: { status: newStatus } });
        res.redirect('/admin/viewOrder')
        // .then(() => {
        //     res.status(200).json({ message: 'Order status updated successfully' });
        // })
    }
    catch (error) {
        console.error(error.message);
    };
};


module.exports = {
    loadLogin,
    verifyLogin,
    loadHome,
    loadForgot,
    forgotVerify,
    resetPassword,
    loadForgotPassword,
    loadLogout,
    listUser,
    dashBoard,
    blockUser,
    unblockUser,
    listProdcut,
    addBook,
    loadaddBook,
    loadeditBook,
    loaddeleteBook,
    updateBook,
    deletebook,
    loadcategory,
    loadaddcategory,
    addcategory,
    deletecategory,
    loadeditCategory,
    updateCategory,
    showorder,
    viewOrder,
    cancelOrder,
    updateOrderStatus
}