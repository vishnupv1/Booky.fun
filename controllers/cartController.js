const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
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
    let success_message = req.query.smessage
    let cancel_message = req.query.cmessage
    let error_message = req.query.emessage
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
            res.render('cart', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable", cancel_message, error_message, success_message })
        } else {
            res.render('cart', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '' })
        }
    } catch (error) {
        console.log(error.message)
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
    }
};
//update the count of product
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
//show cart after checkout
const showCart2 = async (req, res) => {
    try {
        res.redirect('/showcart')
    } catch (error) {
        console.log(error.message);
    }
};
module.exports = {
    addtocart,
    showCart,
    deleteCart,
    updateCart,
    showCart2
}