const mongoose = require('mongoose')
const couponSchema = mongoose.Schema({
    code: {
        type: String
    },
    offer: {
        type: Number
    }
})

module.exports = mongoose.model('Coupon', couponSchema)
