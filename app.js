const mongoose = require('mongoose')
const express = require('express')
const user_route = require('./routes/userRoute')
const path = require('path')
const admin_route = require('./routes/adminRoute')
mongoose.connect('mongodb://127.0.0.1:27017/booky')
const app = express()
const myEnv = require('dotenv').config()

//for user route
app.use('/', user_route)
app.use('/admin', admin_route)

app.use('/public', express.static(path.join(__dirname, 'public')));

PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log('Server running');
})