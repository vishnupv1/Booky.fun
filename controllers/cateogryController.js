const Admin = require('../models/adminModel')
const Category = require('../models/categoryModel')
const express = require('express')
const admin_router = require('../routes/adminRoute')
//load category view
const loadcategory = async (req, res) => {
    try {
        if (req.session.message) {
            var message = 'Category duplication found'
            req.session.message = ''
        }

        const category = await Category.find({})
        res.render('category', { category: category, message })
    }
    catch (error) {
        console.log(error.message);
    }
}
//load add category view
const loadaddcategory = async (req, res) => {
    try {
        res.render('addcategory')
    }
    catch (error) {
        console.log(error.message);
    }
}
//add new category
const addcategory = async (req, res) => {
    try {

        let cname = req.body.name
        const pattern = new RegExp(cname, "i"); // "i" flag for case-insensitive matching

        const catData = await Category.findOne({ name: pattern });
        if (catData) {
            req.session.message = 'Category duplication found'
            res.redirect('/admin/category')
        } else {
            Category.insertMany({ name: req.body.name })
            res.redirect('/admin/category')

        }
    }
    catch (error) {
        console.log(error.message);
    }
}
//delete an existing category
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
//load edit category view
const loadeditCategory = async (req, res) => {
    try {
        const catData = await Category.findOne({ _id: req.query.id })
        res.render('editcategory', { category: catData })
    }
    catch (error) {
        console.log(error.message);
    }
}
//Update category view
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


module.exports = {
    loadcategory,
    loadaddcategory,
    addcategory,
    deletecategory,
    loadeditCategory,
    updateCategory
}