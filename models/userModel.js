const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: true
    },
    mail: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Number,
        default: 0
    },
    token: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        default: ''
    },
    is_blocked: {
        type: String,
        default: 0
    },
    homeaddress: [
        {
            name: {
                type: String,
            },
            mobile: {
                type: Number,
            },
            state: {
                type: String,
            },
            district: {
                type: String,
            },
            street: {
                type: String,
            },
            landmark: {
                type: String,
            },
            address: {
                type: String,
            },
            city: {
                type: String,
            },
            zipcode: {
                type: Number,
            }
        }
    ]
    ,
    workaddress: [
        {
            name: {
                type: String,
            },
            mobile: {
                type: Number,
            },
            state: {
                type: String,
            },
            district: {
                type: String,
            },
            street: {
                type: String,
            },
            landmark: {
                type: String,
            },
            address: {
                type: String,
            },
            city: {
                type: String,
            },
            zipcode: {
                type: Number,
            }
        }
    ]
    ,
    personaladdress: [
        {
            name: {
                type: String,
            },
            mobile: {
                type: Number,
            },
            state: {
                type: String,
            },
            district: {
                type: String,
            },
            street: {
                type: String,
            },
            landmark: {
                type: String,
            },
            address: {
                type: String,
            },
            city: {
                type: String,
            },
            zipcode: {
                type: Number,
            }
        }
    ],
    wallet: {
        type: Number,
        default: 0
    }


})

module.exports = mongoose.model('User', userSchema)
