const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Cart = require('../models/cartModel')
const paypal = require('paypal-rest-sdk')
const express = require('express')
const easyinvoice = require('easyinvoice')
const fs = require('fs')
const { stringify } = require('querystring')


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
        let balance = encodeURIComponent(JSON.stringify(userData.wallet))

        let cart = await Cart.findOne({ user_id: req.session.user_id }).populate("products.product_id").lean().exec()
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
            res.render('checkout', { title: "User Cart", cartData: products, username, session, message: '', total: "Total amount payable", totalamount, userData, total, home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)), balance })
        } else {
            res.render('checkout', { title: 'User Cart', message: "Cart is empty", cartData: '', total: '', totalamount: '', total: '', home: encodeURIComponent(JSON.stringify(home)), work: encodeURIComponent(JSON.stringify(work)), personal: encodeURIComponent(JSON.stringify(personal)), balance })
        }
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')
    }
}
const placeorder = async (req, res) => {
    try {
        let userId = req.session.user_id
        let userDetails = await User.findOne({ _id: userId })
        if (req.body.payment == 'wallet') {
            let amount = userDetails.wallet
            let walletUpdate = amount - parseFloat(req.body.total)
            await User.updateOne({ _id: userId }, { $set: { wallet: walletUpdate } })
        }
        let CartDetails = await Cart.findOne({ user_id: userId }).populate('products.product_id')
        let orderData = new Order({
            user_id: userId,
            name: req.body.uname,
            email: userDetails.mail,
            mobile: req.body.mobile,
            products: CartDetails.products,
            total: parseFloat(req.body.total),
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
        res.render('errorPage')
    }
}
const myOrders = async (req, res) => {
    try {
        let id = req.query.id
        let orders = await Order.findOne({ _id: id }).populate('products.product_id');

        if (orders) {
            var orderDetails = {
                id: orders._id,
                total: orders.total,
                status: orders.status,
                name: orders.name,
                mobile: orders.mobile,
                state: orders.state,
                city: orders.city,
                street: orders.street,
                landmark: orders.landmark,
                address: orders.address,
                city: orders.district,
                zipcode: orders.zipcode,
                payment_method: orders.payment_method
            };
        }

        let status = orders.status
        if (status == 'Delivered') {
            let delivery = orders.delivery_date
            const dateOnly = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());
            const year = dateOnly.getFullYear();
            const month = (dateOnly.getMonth() + 1).toString().padStart(2, '0');
            const day = dateOnly.getDate().toString().padStart(2, '0');
            var formattedDate = `${year}/${month}/${day}`;
            let today = new Date()
            const timeDiff = delivery.getTime() - today.getTime();
            var daysDiff = Math.abs(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
        }

        if (orders) {
            let productDetails = orders.products.map(data => {
                return ({
                    image: data.product_id.image[0],
                    productname: data.product_id.name,
                    quantity: data.quantity,
                    date: data.date,
                    price: data.price
                })
            })
            let array = encodeURIComponent(JSON.stringify(productDetails))
            let ordersD = encodeURIComponent(JSON.stringify(orderDetails))
            let arrays = [orders.name, orders.address, orders.city, orders.state, orders.zipcode]
            res.render('orders', { title: "Orders", productDetails, orderId: id, status, daysDiff, formattedDate, array, ordersD, arrays });
        } else {
            res.render('orders', { title: "Orders", message: "No Orders", noOrders: true, status: '', formattedDate: '', array: '', ordersD: '' });
        }
    } catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
};
const Orderlist = async (req, res) => {

    try {

        let orders = await Order.find({ user_id: req.session.user_id }).populate('products.product_id');
        if (orders.length > 0) {
            const order = await Order.find({})
            if (order.length > 0) {
                orderDetailss = order.map(ord => {
                    const orderDate = new Date(ord.date); // Convert date to a Date object
                    const year = orderDate.getFullYear();
                    const month = orderDate.getMonth() + 1;
                    const date = orderDate.getDate();
                    return {
                        date: `${date}/${month}/${year}`,
                    }
                })
            }
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
            res.render('orderlist', { title: "Orders", orders: orderDetails, date: orderDetailss });
        } else {
            res.render('orderlist', { title: "Orders", orders: [] });
        }
    } catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
};
const cancelOrder = async (req, res) => {
    try {
        let user = req.session.user_id
        let userDetails = await User.find({ _id: user })
        let walletAmount = userDetails[0].wallet
        let id = req.query.id
        let order = await Order.find({ _id: id })
        await Order.updateOne({ _id: id }, { $set: { status: "Cancelled" } });
        if (order[0].payment_method === 'internet' || order[0].payment_method === 'wallet') {
            var amount = order[0].total + walletAmount
            await User.updateOne({ _id: user }, { $set: { wallet: amount } })

        }

        res.redirect('/orderlist')

    } catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
};
const pay = async (req, res) => {
    // Create a payment JSON payload
    try {

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
                    currency: 'INR'
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
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')
    }
}
const success = async (req, res) => {
    try {
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
    } catch (error) {
        console.log(error.message)
        res.render('errorPage')
    }
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
        res.render('errorPage')
    }
}
const paypalpost = async (req, res) => {
    try {
        const formDataString = req.body.formData;
        let formData = JSON.parse(formDataString)
        let userId = req.session.user_id
        let userDetails = await User.findOne({ _id: userId })
        let CartDetails = await Cart.findOne({ user_id: userId }).populate('products.product_id')
        let orderData = new Order({
            user_id: userId,
            name: formData.uname,
            email: userDetails.mail,
            mobile: formData.mobile,
            products: CartDetails.products,
            total: parseFloat(formData.total),
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
        res.render('errorPage')
    }
}
const updateOrderStatus = async (req, res) => {
    try {

        const { orderId, newStatus } = req.body;
        let orders = await Order.findOne({ _id: orderId })
        var userID = orders.user_id
        let user = await User.findOne({ _id: userID })
        var wallet = user.wallet

        await Order.updateOne({ _id: orderId }, { $set: { status: newStatus, status_date: new Date() } });
        if (newStatus === 'Delivered') {
            await Order.updateOne({ _id: orderId }, { $set: { status: newStatus, delivery_date: new Date() } });
        }
        if (newStatus === 'Returned') {
            var amount = orders.total + wallet
            await User.updateOne({ _id: userID }, { $set: { wallet: amount } })
        }
        let order = await Order.findOne({ _id: orderId });
        res.redirect(`/admin/viewOrder?id=${orderId}&status=${order.status}`)

    }
    catch (error) {
        console.error(error.message);
        res.render('errorPage')
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
        res.render('errorPage')
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
        res.render('errorPage')
    }
}
const returnOrder = async (req, res) => {
    try {
        let id = req.query.id
        await Order.updateOne({ _id: id }, { $set: { status: "Return requested" } });
        res.redirect('/orderlist')

    } catch (error) {
        console.log(error.message);
        res.render('errorPage')
    }
};
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
    viewOrder,
    returnOrder,
}