const express = require('express')
const Admin = require('../models/adminModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Order = require('../models/orderModel')
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer = require('nodemailer')
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs');

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
            console.log(req.body.key);
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
        const admin = await Admin.findById({ _id: req.session.admin_id });
        const users = await User.find({});
        const orders = await Order.find({});
        const orderStatusCounts = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);


        const result = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: null, totalAmount: { $sum: '$total' } } }
        ]);

        const totalSum = result.length > 0 ? result[0].totalAmount : 0;

        const paypal = await Order.aggregate([
            { $match: { payment_method: 'internet' } },
            { $group: { _id: null, totalCount: { $sum: 1 } } }
        ]);

        const count = paypal.length > 0 ? paypal[0].totalCount : 0;

        const books = await Product.find({});

        const stockSumResult = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: { $sum: "$stock" }
                }
            }
        ]);

        const orderStatusCountsObj = {};
        orderStatusCounts.forEach((statusCount) => {
            orderStatusCountsObj[statusCount._id] = statusCount.count;
        });

        res.render('adminhome', {
            user: users,
            order: orders,
            book: books,
            stock: stockSumResult[0].totalStock,
            orderStatusCounts: orderStatusCountsObj,
            sales: totalSum,
            paypal: count
        });
    } catch (error) {
        console.log(error.message);
    }
};
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
            html: '<p>Hi ' + username + ', Plese click here to <a href = "http://localhost:4000/admin/adminforgotpassword?token=' + token + '">Reset</a>your password</p>'
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
const dashBoard = async (req, res) => {
    try {
        res.redirect('/admin/adminhome')
    }
    catch (error) {
        console.log(error.message);
    }
}
const reportExport = async (req, res) => {


    const sales = [
        { product: 'Product A', quantity: 10, price: 100 },
        { product: 'Product B', quantity: 5, price: 50 },
        // ... more sales data
    ];

    // Generate PDF Report
    const generatePDFReport = () => {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream('sales_report.pdf'));

        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Product', { continued: true });
        doc.text('Quantity', { continued: true });
        doc.text('Price', { continued: true });
        doc.text('Total', { align: 'right' });

        doc.font('Helvetica').fontSize(12);
        sales.forEach((sale) => {
            doc.text(sale.product, { continued: true });
            doc.text(sale.quantity.toString(), { continued: true });
            doc.text(sale.price.toString(), { continued: true });
            doc.text((sale.quantity * sale.price).toString(), { align: 'right' });
        });

        doc.end();
    };

    // Generate Excel Report
    const generateExcelReport = () => {
        const excelData = sales.map((sale) => ({
            Product: sale.product,
            Quantity: sale.quantity,
            Price: sale.price,
            Total: sale.quantity * sale.price,
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');

        XLSX.writeFile(workbook, 'sales_report.xlsx');
    };

    // Generate PDF and Excel Reports
    generatePDFReport();
    generateExcelReport();

    res.redirect('/admin/stockManagement')
}


module.exports = {
    loadLogin,
    verifyLogin,
    loadHome,
    loadForgot,
    forgotVerify,
    resetPassword,
    loadForgotPassword,
    loadLogout,
    dashBoard,
    reportExport
}