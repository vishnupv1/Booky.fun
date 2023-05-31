const mongoose = require('mongoose')
const adminSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    token: {
        type: String,
        default: ""
    },
})

module.exports = mongoose.model('Admin', adminSchema)
