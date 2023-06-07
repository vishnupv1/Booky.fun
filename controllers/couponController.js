const Coupon = require('../models/couponModel')
const express = require('express')
const user_router = require('../routes/userRoute')

const loadedcouponManagement = async (req, res) => {
    try {
        const coupon = await Coupon.find({})
        res.render('coupon', { coupon })
    } catch (error) {
        console.log(error.message)
    }
}
const addCoupon = async (req, res) => {
    try {
        let code = req.body.code
        let offer = req.body.offer
        const catData = await Coupon.findOne({ code: code })
        if (catData) {
            res.render('coupon', { message: 'Coupon duplication found' })
        } else {
            Coupon.insertMany({
                code: code,
                offer: offer
            })
            setTimeout(() => {
                res.redirect('/admin/couponManagement')
            }, 2000)

        }
    }
    catch (error) {
        console.log(error.message);
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
    }
}
module.exports = {
    loadedcouponManagement,
    addCoupon,
    editCoupon,
    deleteCoupon
}

