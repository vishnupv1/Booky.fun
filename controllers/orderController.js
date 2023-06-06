const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Cart = require('../models/cartModel')
const paypal = require('paypal-rest-sdk')
const express = require('express')


paypal.configure({
    'mode': 'sandbox',
    'client_id': 'Abe7o5xnXY5TOdVETZnj0cDbHykfaNtQUNePCu7es_xZyKt-C6DJQJGBNYYrxi86oP_rCDyeu8WoWMrE',
    'client_secret': 'EBYLyIjPkmlEm3SIw8nboI7ds1BvRNyDAkhOaf0OqdYdxn14Srl-fsXcAUVscxP6DmfAJn7XuUwE-bmC'
});

const checkout = async (req, res) => {
    try {
        let username = req.session.username
        let session = req.session.loggedIn
        let userData = await User.findOne({ _id: req.session.user_id })
        let home = userData.homeaddress
        let work = userData.workaddress
        let personal = userData.personaladdress
        
        let cart = await Cart.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
        console.log(cart);
        if (cart) {
            const total = cart.products.map(prod => {
                return Number(prod.quantity) * Number(prod.product_id.price)
            })
            const products = cart.products.map(prod => {
                const totals = Number(prod.quantity) * Number(prod.product_id.price)
                return ({
                    _id: prod.product_id._id.toString(),
                    name: prod.product_id.name,
                    price: prod.product_id.price,
                    image: prod.product_id.image,
                    quantity: prod.quantity,
                    total: totals,
                })
            })
            let totalamount = total.reduce((a, b) => {
                return a + b;
            });
            res.render('checkout', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable", totalamount, userData, total, home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)) })
        } else {
            res.render('checkout', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '', totalamount: '', total: '', home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)) })
        }
    } catch (error) {
        console.log(error.message)
    }
}
const placeorder = async (req, res) => {
    try {
        let userId = req.session.user_id
        let userDetails = await User.findOne({ _id: userId })
        let CartDetails = await Cart.findOne({ user_id: userId }).populate('products.product_id')
        let orderData = new Order({
            user_id: userId,
            name: req.body.uname,
            email: userDetails.mail,
            mobile: req.body.mobile,
            products: CartDetails.products,
            total: req.body.total,
            state: req.body.state,
            city: req.body.city,
            street: req.body.street,
            landmark: req.body.landmark,
            address: req.body.address,
            zipcode: req.body.zipcode,
            payment_method: req.body.payment,
            date: new Date()
        })
        let success = await orderData.save()

        if (success) {
            await Cart.findOneAndDelete({ user_id: userId })
        }
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}
const myOrders = async (req, res) => {
    try {
        let id = req.query.id
        let orders = await Order.findOne({ _id: id }).populate('products.product_id');
        if (orders) {
            let productDetails = orders.products.map(data => {
                return ({
                    image: data.product_id.image[0],
                    productname: data.product_id.name,
                    quantity: data.quantity,
                    date: data.date
                })
            })
            res.render('orders', { title: "Orders", productDetails, orderId: id });
        } else {
            res.render('orders', { title: "Orders", message: "No Orders", noOrders: true });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const Orderlist = async (req, res) => {

    try {
        let orders = await Order.find({ user_id: req.session.user_id }).populate('products.product_id');
        if (orders.length > 0) {
            let orderDetails = orders.map(order => {
                return {
                    id: order._id,
                    total: order.total,
                    status: order.status,
                    date: order.date,
                    products: order.products.map(data => {
                        return {
                            image: data.product_id.image[0],
                            productname: data.product_id.name,
                            quantity: data.quantity,
                        };
                    })
                };
            });
            console.log(orderDetails);
            res.render('orderlist', { title: "Orders", orders: orderDetails });
        } else {
            res.render('orderlist', { title: "Orders", orders: [] });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const cancelOrder = async (req, res) => {
    try {
        let id = req.query.id
        await Order.updateOne({ _id: id }, { $set: { status: "Cancelled" } });
        res.redirect('/orderlist')

    } catch (error) {
        console.log(error.message);
    }
};
const pay = async (req, res) => {
    // Create a payment JSON payload
    let price = req.query.price
    const paymentData = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: 'http://localhost:4000/success',
            cancel_url: 'http://localhost:4000/cancel'
        },
        transactions: [{
            amount: {
                total: price,
                currency: 'USD'
            },
            description: 'Sample payment description'
        }]
    };

    // Create a PayPal payment
    paypal.payment.create(paymentData, (error, payment) => {
        if (error) {
            console.error(error);
            res.sendStatus(500);
        } else {
            // If payment created successfully, redirect to PayPal approval URL
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
            res.redirect(approvalUrl);
        }
    });
}
const success = async (req, res) => {
    const paymentId = req.query.paymentId;
    const payerId = req.query.PayerID;

    // Execute the PayPal payment
    paypal.payment.execute(paymentId, { payer_id: payerId }, (error, payment) => {
        if (error) {
            console.error(error);
            res.sendStatus(500);
        } else {
            // Payment successful, display a success page or perform any additional actions
            res.send('Payment successful!');
        }
    });
}
const cancel = async (req, res) => {
    // Payment cancelled, display a cancellation page or redirect back to the cart
    res.send('Payment cancelled!');
}
const loadpaypal = async (req, res) => {
    try {
        let price = req.query.price
        res.render('pay', { price })
    } catch (error) {
        console.log(error.message);
    }
}
const paypalpost = async (req, res) => {
    try {
        const formDataString = req.body.formData;
        let formData = JSON.parse(formDataString)
        console.log(formData.uname);
        let userId = req.session.user_id
        let userDetails = await User.findOne({ _id: userId })
        let CartDetails = await Cart.findOne({ user_id: userId }).populate('products.product_id')
        let orderData = new Order({
            user_id: userId,
            name: formData.uname,
            email: userDetails.mail,
            mobile: formData.mobile,
            products: CartDetails.products,
            total: parseInt(formData.total),
            state: formData.state,
            city: formData.city,
            street: formData.street,
            landmark: formData.landmark,
            address: formData.address,
            zipcode: formData.zipcode,
            payment_method: formData.payment,
            date: new Date()
        })
        let success = await orderData.save()

        if (success) {
            await Cart.findOneAndDelete({ user_id: userId })
        }
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        await Order.updateOne({ _id: orderId }, { $set: { status: newStatus } });
        res.redirect('/admin/viewOrder')
        // .then(() => {
        //     res.status(200).json({ message: 'Order status updated successfully' });
        // })
    }
    catch (error) {
        console.error(error.message);
    };
};
const showorder = async (req, res) => {
    try {
        const order = await Order.find({})
        if (order) {
            res.render('orders', { order })
        }
    }
    catch (error) {
        console.log(error.message);
    }
}
const viewOrder = async (req, res) => {
    try {
        let id = req.query.id
        let ordersD = await Order.find({ _id: id }).populate('products.product_id');
        if (ordersD) {
            var orderDetails = ordersD.map(order => {
                return {
                    id: order._id,
                    total: order.total,
                    status: order.status,
                    name: order.name,
                    mobile: order.mobile,
                    state: order.state,
                    city: order.city,
                    street: order.street,
                    landmark: order.landmark,
                    address: order.address,
                    city: order.district,
                    zipcode: order.zipcode,
                    payment_method: order.payment_method
                };
            });
        }
        console.log(orderDetails);
        let orders = await Order.findOne({ _id: id }).populate('products.product_id');
        if (orders) {
            let productDetails = orders.products.map(data => {
                return ({
                    image: data.product_id.image[0],
                    productname: data.product_id.name,
                    quantity: data.quantity,
                })
            })
            res.render('vieworder', { title: "Orders", productDetails, orderId: id, orderDetails });
        } else {
            res.render('vieworder', { title: "Orders", message: "No Orders", noOrders: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    checkout,
    placeorder,
    myOrders,
    Orderlist,
    cancelOrder,
    pay,
    success,
    cancel,
    loadpaypal,
    paypalpost,
    updateOrderStatus,
    showorder,
    viewOrder

}