const mongoose = require('mongoose')
const couponSchema = mongoose.Schema({
    code: {
        type: String
    },
    offer: {
        type: Number
    },
    expiry: {
        type: Date
    },
    description: {
        type: String
    }
})

module.exports = mongoose.model('Coupon', couponSchema)
