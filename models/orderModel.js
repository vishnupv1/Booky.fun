const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    products: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            price: {
                type: Number,
                ref: 'Product'
            }
        }
    ],
    total: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "Pending"
    },
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
    },
    payment_method: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Order", orderSchema)