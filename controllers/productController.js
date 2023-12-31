const express = require('express')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')

//load product view page
const viewproduct = async (req, res) => {
    try {
        const product_id = req.query.id
        const productD = await Product.find({ _id: product_id })
        res.render('product', { product: productD[0] })
    }
    catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
}
//product search in user side
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
        res.render('errorPage')
    }
};
//product category filter in user side
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
        res.render('errorPage')
    }
};
//product price filter in user side
const pricefilter = async (req, res) => {
    try {
        const productD = await Product.find({})
        const price = req.query.price;
        const maxPrice = parseInt(price);
        filteredProducts = productD.filter(product => product.price <= maxPrice);

    }
    catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
    res.json(filteredProducts);
};
//list products in admin side
const listProdcut = async (req, res) => {
    try {
        const productData = await Product.find({})
        res.render('productlist', { products: productData })
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
//load add book view in admin side
const loadaddBook = async (req, res) => {
    try {
        const category = await Category.find({}).lean().exec()
        res.render('addbook', { category: category })
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
//add book in admin side
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
            res.redirect('/admin/productlist');

        }
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
//load delete book view in admin side
const loaddeleteBook = async (req, res) => {
    try {
        res.render('addbook')
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
//load edit book view in admin side
const loadeditBook = async (req, res) => {
    try {
        const category = await Category.find({}).lean().exec()
        const productData = await Product.findOne({ _id: req.query.id })
        res.render('editbook', { products: productData, category })
    }
    catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
}
//edit book details in admin side
const updateBook = async (req, res) => {
    try {
        var arrayimage = []
        for (let i = 0; i < req.files.length; i++) {
            arrayimage[i] = req.files[i].filename
        }
        console.log(arrayimage);
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
        res.render('user/errorPage')
    }
}
//delete book in admin side
const deletebook = async (req, res) => {
    try {
        const productData = await Product.findOne({ _id: req.query.id })
        if (productData) {
            await Product.updateOne({ _id: req.query.id }, { $set: { listable: 0 } })
        }
        res.redirect('/admin/productlist')
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
const undodelete = async (req, res) => {
    try {
        const productData = await Product.findOne({ _id: req.query.id })
        if (productData) {
            await Product.updateOne({ _id: req.query.id }, { $set: { listable: 1 } })
        }
        res.redirect('/admin/productlist')
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
//managemnt of stock and its chart
const stockManagement = async (req, res) => {
    try {
        res.render('stock')
    }
    catch (error) {
        console.log(error.message);
        res.render('user/errorPage')
    }
}
module.exports = {
    viewproduct,
    search,
    filter,
    pricefilter,
    listProdcut,
    addBook,
    loadaddBook,
    loadeditBook,
    loaddeleteBook,
    updateBook,
    deletebook,
    stockManagement,
    undodelete
}