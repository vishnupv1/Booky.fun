const Coupon = require('../models/couponModel')
const Banner = require('../models/bannerModel')
const express = require('express')
const user_router = require('../routes/userRoute')

const loadBannerManagement = async (req, res) => {
    try {
        const banner = await Banner.find({})
        res.render('banner', { banner })
    } catch (error) {
        console.log(error.message)
        res.render('user/errorPage')

    }
}
const addBanner = async (req, res) => {
    try {
        var arrayimage = []
        for (let i = 0; i < req.files.length; i++) {
            arrayimage[i] = req.files[i].filename
        }
        let name = req.body.name
        await Banner.insertMany({
            name: name,
            image: arrayimage,
        })
        setTimeout(() => {
            res.redirect('/admin/bannerManagement')
        }, 2000)
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')

    }
}
const deleteBanner = async (req, res) => {
    try {
        const bannerData = await Banner.findOne({ _id: req.query.id })
        if (bannerData) {
            await Banner.deleteOne({ _id: req.query.id })
        }
        res.redirect('/admin/bannerManagement')

    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')

    }
}

module.exports = {
    loadBannerManagement,
    addBanner,
    deleteBanner
}

