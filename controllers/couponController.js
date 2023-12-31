const Coupon = require('../models/couponModel')
const express = require('express')
const user_router = require('../routes/userRoute')
const moment = require('moment')

const loadedcouponManagement = async (req, res) => {
    try {

        const coupon = await Coupon.find({})
        if (coupon.length > 0) {
            couponDetails = coupon.map(coup => {
                const couponDate = new Date(coup.expiry); // Convert date to a Date object
                const year = couponDate.getFullYear();
                const month = couponDate.getMonth() + 1;
                const date = couponDate.getDate();
                return {
                    date: `${date}/${month}/${year}`,
                }
            })
        }
        res.render('coupon', { coupon, date: couponDetails })
    } catch (error) {
        console.log(error.message)
        res.render('user/errorPage')
    }
}
const addCoupon = async (req, res) => {
    try {
        let code = req.body.code
        let offer = req.body.offer
        let description = req.body.description
        var expiry = req.body.expiry
        var minamount = req.body.minamount

        const pattern = new RegExp(code, "i")
        const catData = await Coupon.findOne({ code: pattern })
        if (catData) {

            res.render('coupon', { message: 'Coupon duplication found' })
        } else {
            Coupon.insertMany({
                code: code,
                offer: offer,
                description: description,
                expiry: expiry,
                minamount: minamount

            })
            setTimeout(() => {
                res.redirect('/admin/couponManagement')
            }, 2000)

        }
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
const deleteCoupon = async (req, res) => {
    try {
        const categoryData = await Coupon.findOne({ _id: req.query.id })
        if (categoryData) {
            await Coupon.deleteOne({ _id: req.query.id })
        }
        res.redirect('/admin/couponManagement')

    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
const editCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                code: req.body.codes,
                offer: req.body.offers
            }
        })
        setTimeout(() => {
            res.redirect('/admin/couponManagement')
        }, 1000)
    }

    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
const applycoupon = async (req, res) => {
    try {

        const couponCode = req.query.code;
        const totalamount = req.query.amount;
        const coupon = await Coupon.findOne({ code: couponCode })
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        let currentDate = Date.now()
        if (coupon.expiry < currentDate) {
            return res.json('expired')
        }
        if (totalamount > coupon.minamount) {

            const discountPercentage = parseInt(coupon.offer)
            const discountAmount = totalamount * (discountPercentage / 100);

            // Calculate the new total
            const newTotal = totalamount - discountAmount;
            return res.json({ newTotal });
        } else {
            return res.json('Not applicable')
        }
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}

module.exports = {
    loadedcouponManagement,
    addCoupon,
    editCoupon,
    deleteCoupon,
    applycoupon
}

