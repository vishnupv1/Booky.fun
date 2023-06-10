const mongoose = require('mongoose')
const bannerSchema = mongoose.Schema({
    image: {
        type: Array,
        required: true
    },
    name: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Banner', bannerSchema)