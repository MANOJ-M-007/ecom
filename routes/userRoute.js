const express = require('express')
const userRoute = express()
const userController = require('../controllers/userController')
const userMiddleware = require('../middleware/userMiddleware')
// const Product = require('../models/productModel')
// const User = require('../models/userModel')

userRoute.use(express.json())
userRoute.use(express.urlencoded({ extended: true }))

let isLoggedin
isLoggedin = false
const userSession = false || {}

userRoute.get('/register', userMiddleware.isLogout, userController.loadRegister)
userRoute.post('/register', userController.insertuser)

userRoute.get('/', userController.loadHome)
userRoute.get('/login', userMiddleware.isLogout, userController.loginLoad)
userRoute.post('/login', userController.verifyLogin)

userRoute.get('/verifyOtp', userController.loadOtp)
userRoute.post('/verifyOtp', userController.verifyOtp)

userRoute.get('/forgotPassword',userController.forgotPassword)
userRoute.post('/forgotPassword',userController.forgotPasswordEmail)
userRoute.post('/forgotPasswordOtp',userController.forgotPasswordOtp)
userRoute.post('/forgotChangePassword',userController.changePassword)

userRoute.get('/dashboard', userMiddleware.isLogin, userController.userDashboard)
userRoute.get('/viewOrder', userMiddleware.isLogin, userController.viewOrder)
userRoute.get('/cancelOrder', userMiddleware.isLogin, userController.cancelOrder)
userRoute.get('/cancelProduct', userMiddleware.isLogin, userController.returnProduct)
userRoute.post('/editUser',  userController.editUser);

userRoute.post('/addAddress',  userController.addAddress)
userRoute.get('/deleteAddress', userMiddleware.isLogin, userController.deleteAddress)

userRoute.get('/shop',  userController.loadShop)
userRoute.get('/viewProduct', userController.viewProduct)

userRoute.get('/logout', userMiddleware.isLogin, userController.userLogout)

userRoute.get('/loadCart', userController.loadCart)
userRoute.get('/addToCart',  userMiddleware.isLogin, userController.addToCart)
userRoute.get('/deleteCart',  userController.deleteCart)
userRoute.post('/editQuantity', userController.editqty)

userRoute.get('/loadWishlist', userController.loadWishlist)
userRoute.post('/addToWishlist', userController.addToWishlist)
userRoute.get('/deleteWishlist', userMiddleware.isLogin, userController.deleteWishlist)
userRoute.get('/addToCartDeleteWishlist', userMiddleware.isLogin, userController.addCartDeleteWishlist)

userRoute.get('/checkout', userMiddleware.isLogin, userController.loadCheckout)
userRoute.post('/checkout',  userController.storeOrder)
userRoute.post('/razorpay', userController.razorpayCheckout)
userRoute.get('/orderSuccess', userMiddleware.isLogin, userController.loadSuccess)

userRoute.post('/addCoupon', userMiddleware.isLogin, userController.addCoupon)
userRoute.use((req, res, next) => {
    res.render('404')
  })


module.exports = userRoute
