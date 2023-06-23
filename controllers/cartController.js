const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const express = require('express')
const user_router = require('../routes/userRoute')

//add to cart
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
        res.render('errorPage')

    }
}
//add to wishlist
const addtowishlist = async (req, res) => {
    try {
        let prodId = req.query.id
        let userId = req.session.user_id
        let wishlist = await Wishlist.findOne({ user_id: userId })
        if (!wishlist) {
            const newWishlist = new Wishlist({ user_id: userId, products: [] })
            await newWishlist.save()
            wishlist = newWishlist
        }
        const productIndex = wishlist?.products.findIndex((product) => product.product_id == prodId)
        const item = await Product.find({ _id: prodId })
        if (productIndex == -1) {
            wishlist.products.push({ product_id: prodId, quantity: 1, price: item[0].price })

        } else {
            wishlist.products[productIndex].quantity += 1


        }
        await wishlist.save()
        setTimeout(() => {
            res.redirect('/wishlist')
        }, 1000)
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')

    }
}
//show user's cart
const showCart = async (req, res) => {
    let success_message = req.query.smessage
    let cancel_message = req.query.cmessage
    let error_message = req.query.emessage
    try {
        let username = req.session.username
        let session = req.session.loggedIn
        let cart = await Cart.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
        console.log(cart);
        if (cart) {
            cartData = cart.products
            const products = cart.products.map(prod => {
                const totalS = Number(prod.quantity) * Number(prod.product_id.price)

                return ({
                    _id: prod.product_id._id.toString(),
                    name: prod.product_id.name,
                    stock: prod.product_id.stock,
                    price: prod.product_id.price,
                    image: prod.product_id.image,
                    quantity: prod.quantity,
                    total: totalS,
                })
            })
            res.render('cart', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable", cancel_message, error_message, success_message })
        } else {
            res.render('cart', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '' })
        }
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')
    }
}
//delete product from cart
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
        res.render('errorPage')
    }
};
//update the count of product
const updateCart = async (req, res) => {
    try {
        let userId = req.session.user_id
        let updateValues = req.body.products
        let idx = req.body.iddd
        console.log(idx);

        id = updateValues[0].prod_id
        let product = await Product.findOne({ _id: id })
        let Stock = product.stock
        let quant = updateValues[0].quantity

        if (quant <= Stock) {
            for (let data of updateValues) {
                const { prod_id, quantity, finalAmount } = data;
                const changeCart = await Cart.updateOne({ $and: [{ user_id: userId }, { 'products.product_id': prod_id }] }, { $set: { 'products.$.quantity': quantity, total: finalAmount } })
            }
            res.send({ isOk: true })
        }
    } catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
}
//show cart after checkout
const showCart2 = async (req, res) => {
    try {
        res.redirect('/showcart')
    } catch (error) {
        console.log(error.message);
        res.render('errorPage')

    }
};
const addtocartFromWishlist = async (req, res) => {
    try {
        let prodId = req.query.id
        let userId = req.session.user_id
        let quan = req.query.quantity
        let userCart = await Cart.findOne({ user_id: userId })
        if (!userCart) {
            const newCart = new Cart({ user_id: userId, products: [] })
            await newCart.save()
            userCart = newCart
        }
        const productIndex = userCart?.products.findIndex((product) => product.product_id == prodId)
        const item = await Product.find({ _id: prodId })
        if (productIndex == -1) {
            userCart.products.push({ product_id: prodId, quantity: quan, price: item[0].price })

        } else {
            userCart.products[productIndex].quantity += parseInt(quan)


        }
        await userCart.save()
        setTimeout(() => {
            res.redirect('/showwishlist')
        }, 1000)
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')

    }
}
module.exports = {
    addtocart,
    showCart,
    deleteCart,
    updateCart,
    showCart2,
    addtowishlist,
    addtocartFromWishlist
}