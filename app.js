const mongoose = require('mongoose')
const express = require('express')
const user_route=require('./routes/userRoute')
const path = require('path')
const admin_route = require('./routes/adminRoute')
mongoose.connect('mongodb://127.0.0.1:27017/booky')
const app=express()

//for user route
app.use('/',user_route)
app.use('/admin',admin_route)

app.use('/public',express.static(path.join(__dirname,'public')));


app.listen(3000,()=>{
    console.log('Server running');
})