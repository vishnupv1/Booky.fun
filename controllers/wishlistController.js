const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Wishlist = require('../models/wishlistModel')
const express = require('express')
const user_router = require('../routes/userRoute')

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
        console.log(item[0].price);
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
    }
}
//show user's cart
const showWishlist = async (req, res) => {
    let success_message = req.query.smessage
    let cancel_message = req.query.cmessage
    let error_message = req.query.emessage
    try {
        let username = req.session.username
        let session = req.session.loggedIn
        let wishlist = await Wishlist.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
        if (wishlist) {
            cartData = wishlist.products
            const products = wishlist.products.map(prod => {
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
            res.render('wishlist', { title: "User Wislist", cartData: products, username, session, message: '', total: "Total amount payable", cancel_message, error_message, success_message })
        } else {
            res.render('wishlist', { title: 'User Wishlist', message: "Wishlist is empty", cartData: '', total: '' })
        }
    } catch (error) {
        console.log(error.message)
    }
}
//delete product from cart
const deleteWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.id;
        let wishlist = await Wishlist.findOne({ user_id: userId })
        if (wishlist.products.length > 1) {
            const deletedItem = await Cart.findOneAndUpdate(
                { user_id: userId },
                { $pull: { products: { product_id: productId } } },
                { new: true }
            );
            res.redirect('/showwishlist');
        } else {
            await Wishlist.deleteOne({ user_id: userId });
            res.redirect('/showwishlist')
        }

    } catch (error) {
        console.error(error.message);
    }
};
//update the count of product
const updateWishlist = async (req, res) => {
    try {
        let userId = req.session.user_id
        let updateValues = req.body.products
        for (let data of updateValues) {
            const { prod_id, quantity, finalAmount } = data;
            const updateWishlist = await Wishlist.updateOne({ $and: [{ user_id: userId }, { 'products.product_id': prod_id }] }, { $set: { 'products.$.quantity': quantity, total: finalAmount } })
        }
        res.send({ isOk: true })
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    showWishlist,
    deleteWishlist,
    updateWishlist,
    addtowishlist
}