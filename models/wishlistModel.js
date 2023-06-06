const mongoose = require('mongoose')
const wishlistSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    total: {
        type: Number
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number
        }
    }]
})

module.exports = mongoose.model('Wishlist', wishlistSchema)
