const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/productModel')
const mongoose = require('mongoose')
const { findOne } = require('../models/userModel')
const Orders = require('../models/ordersModel')
const Category = require('../models/categoryModel')
const Banner = require('../models/bannerModel')
const Address = require('../models/addressModel')
const Offer = require('../models/offerModel')
const fast2sms = require('fast-two-sms')
const Razorpay = require('razorpay')
const cors = require('cors')

// const session = require('express-session')
const { ObjectID } = require('bson')

let isLoggedin
isLoggedin = false
// let userSession = false || {}

const offer = {
  name: 'None',
  type: 'None',
  discount: 0,
  usedBy: false
}
const couponTotal = 0
let nocoupon
let nocouponPrice

let newOtp


const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    console.log(error.message)
  }
}

const loadRegister = async (req, res) => {
  try {
    res.render('registration')
  } catch (error) {
    console.log(error.message)
  }
}

const loadOtp = async(req,res)=>{
  const userData = await User.findById({_id:newUser})
  const otp = sendMessage(userData.mobile,res)
  newOtp = otp
  console.log('otp:',otp);
  res.render('otp',{otp:otp,user:newUser})
}

const verifyOtp = async(req,res)=>{
  try{
      const otp = newOtp
      const userData = await User.findById({_id:req.body.user})
      if(otp == req.body.otp){
          userData.is_verified = 1
          const user = await userData.save()
          if(user){
              res.redirect('/login')
          }
      }else{
          res.render('otp',{message:"Invalid OTP"})
       }
  
      } catch(error){
          console.log(error.message)
    }
}

const sendMessage = function(mobile,res){
  let randomOTP = Math.floor(Math.random()*10000)
  var options = {
      authorization:"MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq",
      message:`your OTP verification code is ${randomOTP}`,
      numbers:[mobile]
  }
  //send this message
  fast2sms.sendMessage(options)
  .then((response)=>{
      console.log("otp sent successfully")
  }).catch((error)=>{
      console.log(error)
  })
  return randomOTP;
}

const insertuser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password)
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
      // is_verified: 1
    })
    const userData = await user.save()
    newUser = userData._id

    if (userData) {
      res.redirect('/verifyOtp')
    } else {
      res.render('registration', { message: 'Your registration was a failure' })
    }
  } catch (error) {
    console.log('error1')
  }
}

const loginLoad = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    console.log(error.message)
  }
}

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password
    const userData = await User.findOne({ email })
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render('login', { message: 'Admin blocked your account' })
        } else {
          if (userData.is_admin === 1) {
            res.render('login', { message: 'Not user' })
          } else {
            userSession = req.session
            userSession.userId = userData._id
            isLoggedin = true
            res.redirect('/')
            console.log('logged in')
          }
        }
      } else {
        res.render('login', { message: 'email and password are incorrect' })
      }
    } else {
      res.render('login', { message: 'user not found' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const editUser = async (req, res) => {
  try {
    userSession = req.session;
    const password1 = req.body.password1
    const password2 = req.body.password2
    const password3 = req.body.password3
    const userData = await User.findById({_id : userSession.userId})
    if (userData) {
      const passwordMatch = await bcrypt.compare(password1, userData.password)
      if (passwordMatch) {
        if(password2 === password3){
        const spassword = await securePassword(req.body.password2)
      await User.findByIdAndUpdate(
        { _id: userSession.userId },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: spassword
          },
        }
      );
      res.redirect('/dashboard');
    }}}
  } catch (error) {
    console.log(error.message);
  }
};

const userDashboard = async (req, res) => {
  try {
    userSession = req.session
    const orderData = await Orders.find({ userId: userSession.userId })
    const userData = await User.findById({ _id: userSession.userId })
    const addressData = await Address.find({ userId: userSession.userId })
    res.render('dashboard', {
      isLoggedin,
      user: userData,
      userAddress: addressData,
      userOrders: orderData,
      id: userSession.userId
    })
  } catch (error) {
    console.log(error.message)
  }
}

const viewOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id
      userSession.currentOrder = id
      const orderData = await Orders.findById({ _id: id })
      const userData = await User.find({ id: userSession.userId })
      await orderData.populate('products.item.productId')
      res.render('viewOrder', {
        isLoggedin,
        order: orderData,
        user: userData
      })
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const cancelOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.id
      await Orders.deleteOne({ _id: id })
      res.redirect('/dashboard')
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const returnProduct = async (req, res) => {
  try {
    userSession = req.session
    if(userSession = req.session){
    const id = req.query.id
   
    const productOrderData = await Orders.findById({
      _id: ObjectID(userSession.currentOrder),
    });
    const productData = await Product.findById({ _id: id })
    if (productOrderData) {
      for (let i = 0; i < productOrderData.products.item.length; i++) {
        if (
          new String(productOrderData.products.item[i].productId).trim() ===
          new String(id).trim()
        ) {
          productData.quantity += productOrderData.products.item[i].qty
          productOrderData.productReturned[i] = 1
          await productData.save().then(() => {
            console.log('productData saved')
          })
          
          await productOrderData.save().then(() => {
            console.log('productOrderData saved')
          })
        } else {
        }
      }
      res.redirect('/dashboard')
    }
  }else{
    res.redirect('/login')
}
  } catch (error) {
    console.log(error.message)
  }
}

const addAddress = async (req, res) => {
  try {
    userSession = req.session
    const addressData = Address({
      userId: userSession.userId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      address: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.mno
    })
    await addressData.save()
    res.redirect('/dashboard')
  } catch (error) {
    console.log(error.message)
  }
}

const deleteAddress = async (req, res) => {
  try {
    userSession = req.session
    const id = req.query.id
    await Address.findByIdAndDelete({ _id: id })
    res.redirect('/dashboard')
  } catch (error) {
    console.log(error.message)
  }
}


const loadHome = async (req, res) => {
  try {
    const banners = await Banner.find({ is_active: 1 })
    userSession = req.session
    userSession.couponTotal = couponTotal
    userSession.nocoupon = nocoupon
    userSession.nocouponPrice = nocouponPrice
    userSession.offer = offer
    
    const productData = await Product.find()
    
    res.render('home', {
      isLoggedin,
      banners,
      // product,
      products: productData,
      id: userSession.userId

    })
  } catch (error) {
    console.log(error.message)
  }
}

// view shop, all products
const loadShop = async (req, res) => {
  try {
    userSession = req.session
    let search = ''
    if (req.query.search) {
      search = req.query.search
    }
    let page = 1
    if (req.query.page) {
      page = req.query.page
    }
    const limit = 6
    const productData = await Product.find({
      is_available: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    const count = await Product.find({
      is_available: 1,is_active: 1,
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }
      ]
    }).countDocuments()

    const categoryData = await Category.find({is_active: 1})
    const ID = req.query.id
    // console.log(categoryData)
    const data = await Category.findOne({ _id: ID })

    if (data) {
      const productData = await Product.find({ category: data.name })
      console.log(productData)
      res.render('shop', {
        products: productData,
        isLoggedin,
        cat: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1
      })
    } else {
      // const productData = await Product.find()
      res.render('shop', {
        isLoggedin,
        cat: categoryData,
        products: productData,
        id: userSession.userId,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1
      })
    }
  } catch (error) {
    console.log(error.message)
  }
}

// to see individual products
const viewProduct = async (req, res) => {
  try {
    const id = req.query.id
    const products = await Product.find()
    const productData = await Product.findById({ _id: id })
    if (productData) {
      res.render('products', {
        isLoggedin,
        product: productData,
        products,
        userSession: userSession.userId
      })
    } else {
      res.redirect('/shop')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const userLogout = async (req, res) => {
  userSession = req.session
  userSession.userId = null
  isLoggedin = false
  console.log('logged out')
  res.redirect('/')
}

const loadCart = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      if (userData.cart.item.length === 0) {
      res.render('cart', {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        empty: true,
      });
    } else {
      res.render('cart', {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        empty: false,
      });
    }
    } else {
      res.render('cart', {
        isLoggedin,
        id: userSession.userId,
      })
    }
  } catch (error) {
    console.log(error)
  }
}

const addToCart = async (req, res, next) => {
  try {
    userSession = req.session
    const productId = req.query.id
    console.log(userSession.userId)
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const productData = await Product.findById({ _id: productId })
      userData.addToCart(productData)
      res.json({status:true});
    } 
  } catch (error) {
    console.log(error.message)
  }
}

const deleteCart = async (req, res, next) => {
  try {
    const productId = req.query.id
    userSession = req.session
    const userData = await User.findById({ _id: userSession.userId })
    await userData.removefromCart(productId)
    res.redirect('/loadCart')
  } catch (error) {
    console.log(error.message)
  }
}

const editqty = async(req,res)=>{
  try {
   const id = req.query.id
   const userData =await User.findById({_id: req.session.userId})
   const foundProduct = userData.cart.item.findIndex(x => x.productId == id)
   const qty = {a: parseInt(req.body.qty)}
   userData.cart.item[foundProduct].qty = qty.a
   const price =userData.cart.item[foundProduct].price
   userData.cart.totalPrice = 0
   const totalPrice = userData.cart.item.reduce((acc,curr)=>{
       return acc+(curr.price * curr.qty)
   },0)
   userData.cart.totalPrice = totalPrice
   await userData.save()
   res.json({totalPrice,price})
  } catch (error) {
   console.log(error.message);
  }
}

const loadWishlist = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('wishlist.item.productId')
      if (userData.wishlist.item.length === 0) {
      res.render('wishlist', {
        isLoggedin,
        id: userSession.userId,
        wishlistProducts: completeUser.wishlist,
        wempty: true,
      });
    }else{
      res.render('wishlist', {
        isLoggedin,
        id: userSession.userId,
        wishlistProducts: completeUser.wishlist,
        wempty: false,
      });}
    } else {
      res.render('wishlist', { isLoggedin, id: userSession.userId })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const addToWishlist = async (req, res) => {

  try {
    userSession = req.session
    const productId = req.query.id

    // console.log(userSession.userId)
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const productData = await Product.findById({ _id: productId })
      userData.addToWishlist(productData)
      res.json({status:true});
    } 
  } 
  catch (error) {
    console.log(error.messsage)
  }
}

const addCartDeleteWishlist = async (req, res) => {
  try {
    userSession = req.session
    const productId = req.query.id
    const userData = await User.findById({ _id: userSession.userId })
    const productData = await Product.findById({ _id: productId })
    const add = await userData.addToCart(productData)
    if (add) {
      userData.removefromWishlist(productId)
    }
    res.redirect('/loadCart')
  } catch (error) {
    console.log(error.message)
  }
}

const deleteWishlist = async (req, res) => {
  try {
    const productId = req.query.id
    userSession = req.session
    const userData = await User.findById({ _id: userSession.userId })
    await userData.removefromWishlist(productId)
    res.redirect('/loadWishlist')
  } catch (error) {
    console.log(error.message)
  }
}

const addCoupon = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const offerData = await Offer.findOne({ name: req.body.offer })
      if (offerData) {
        if (offerData.usedBy.includes(userSession.userId)) {
          nocoupon = true
          res.redirect('/checkout')
        } else if(userData.cart.totalPrice>offerData.minimumBill){
          userSession.offer.name = offerData.name
          userSession.offer.type = offerData.type
          userSession.offer.discount = offerData.discount
          // userSession.offer.minimumBill = offerData.minimumBill
          const updatedTotal =
            userData.cart.totalPrice -
            (userData.cart.totalPrice * userSession.offer.discount) / 100
          userSession.couponTotal = updatedTotal
          res.redirect('/checkout')
        }else{
          nocouponPrice = true
          res.redirect('/checkout')
        }
      } else {
        res.redirect('/checkout')
      }
    } else {
      res.redirect('/loadCart')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadCheckout = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const id = req.query.addressid
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      const addressData = await Address.find({ userId: userSession.userId })
      const selectAddress = await Address.findOne({ _id: id })
      // const offerData = await Offer.findOne({_id:userSession.userId})

      console.log(userSession.offer)
      if (userSession.couponTotal == 0) {
        // update coupon
        userSession.couponTotal = userData.cart.totalPrice
      }
      res.render('checkout', {
        isLoggedin,
        id: userSession.userId,
        cartProducts: completeUser.cart,
        offer: userSession.offer,
        couponTotal: userSession.couponTotal,
        nocoupon,
        nocouponPrice,
        addSelect: selectAddress,
        userAddress: addressData
      })
      nocoupon = false
      nocouponPrice = false
    } else {
      res.render('checkout', {
        isLoggedin,
        id: userSession.userId
      })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const razorpayCheckout = async(req,res)=>{
  userSession = req.session
  const userData =await User.findById({ _id:userSession.userId })
  const completeUser = await userData.populate('cart.item.productId')
  var instance = new Razorpay({ key_id: 'rzp_test_nhZT0aLVAPIz2Z', key_secret: '2CCXNVQMLr9VQxflDpbokaaa' })
  console.log(req.body);
  console.log(completeUser.cart.totalPrice);
              let order = await instance.orders.create({
                amount: completeUser.cart.totalPrice*100,
                currency: "INR",
                receipt: "receipt#1",
              })
              res.status(201).json({
                  success: true,
                  order
              })
}

const storeOrder = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const completeUser = await userData.populate('cart.item.productId')
      // console.log('CompleteUser: ', completeUser)
      userData.cart.totalPrice = userSession.couponTotal
      const updatedTotal = await userData.save()

      if (completeUser.cart.totalPrice > 0) {
        const order = Orders({
          userId: userSession.userId,
          payment: req.body.payment,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          phone: req.body.phone,
          products: completeUser.cart,
          offer: userSession.offer,
          discount: userSession.offer.discount
        })
        const orderProductStatus = []
        for (const key of order.products.item) {
          orderProductStatus.push(0)
        }
        order.productReturned = orderProductStatus

        const orderData = await order.save()
        // console.log(orderData)
        userSession.currentOrder = orderData._id
        req.session.currentOrder = order._id

          const ordern = await Orders.findById({_id:userSession.currentOrder})
           const productDetails = await Product.find({is_available:1})
        for(let i=0;i<productDetails.length;i++){
            for(let j=0;j<ordern.products.item.length;j++){
             if(productDetails[i]._id.equals(ordern.products.item[j].productId)){
                 productDetails[i].sales+=ordern.products.item[j].qty;
             }    
            }productDetails[i].save()
         }
        const offerUpdate = await Offer.updateOne(
          { name: userSession.offer.name },
          { $push: { usedBy: userSession.userId } }
        )

        if (req.body.payment == 'Cash-on-Dilevery') {
          res.redirect('/orderSuccess')
        }else if(req.body.payment == 'RazorPay'){
          res.render('razorpay',{
            isLoggedin,
            userId:userSession.userId,
            total:completeUser.cart.totalPrice})
        } else {
          res.redirect('/checkout')
        }
      } else {
        res.redirect('/shop')
      }
    } else {
      res.redirect('/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const loadSuccess = async (req, res) => {
  try {
    userSession = req.session
    if (userSession.userId) {
      const userData = await User.findById({ _id: userSession.userId })
      const productData = await Product.find()
      for (const key of userData.cart.item) {
        // console.log(key.productId, ' + ', key.qty)
        for (const prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.quantity = prod.quantity - key.qty
            await prod.save()
          }
        }
      }
      await Orders.find({
        userId: userSession.userId
      })
      await Orders.updateOne(
        { userId: userSession.userId, _id: userSession.currentOrder },
        { $set: { status: 'Build' } }
      )
      await User.updateOne(
        { _id: userSession.userId },
        {
          $set: {
            'cart.item': [],
            'cart.totalPrice': '0'
          }
        },
        { multi: true }
      )
      console.log('Order Built and Cart is Empty.')
    }
    userSession.couponTotal = 0
    res.render('orderSuccess', {
      orderId: userSession.currentOrder
    })
  } catch (error) {
    console.log(error.message)
  }
}

const forgotPassword = async (req, res) => {
  try {
    res.render("forgotPassword", {
      email: true,
      enterOtp: false,
      changePassword: false,
      success: false,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const forgotPasswordEmail = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    const otp = sendMessage(userData.mobile, res);
    newOtp = otp;
    console.log("otp:", otp);
    res.render("forgotPassword", {
      email: false,
      enterOtp: true,
      changePassword: false,
      otp: newOtp,
      user: email,
      success: false,
    });
  } catch {}
};

const forgotPasswordOtp = async (req, res) => {
  try {
    const otp = newOtp;
    console.log("OTP: " + otp);
    const userData = req.body.user;
    const otpBody = req.body.otp;
    console.log("otpBody:" + otpBody);
    if (otp == req.body.otp) {
      res.render("forgotPassword", {
        email: false,
        enterOtp: false,
        changePassword: true,
        user: userData,
        success: false,
      });
    } else {
      res.render("forgotPassword", { message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const password1 = req.body.password1;
    const password2 = req.body.password2;
    const user = req.body.user;
    console.log("user id:" + user);
    const userData = await User.find({ email: user });

    if (userData) {
      if (password1 == password2) {
        const spassword = await securePassword(req.body.password2);

        await User.findOneAndUpdate(
          { email: user },
          {
            $set: {
              password: spassword,
            },
          }
        );
        res.render("forgotPassword", {
          email: false,
          enterOtp: false,
          changePassword: false,
          user: userData,
          success: true,
        });
      }
    }
  } catch(error){}
};



module.exports = {
  loginLoad,
  insertuser,
  loadRegister,
  verifyLogin,
  loadHome,
  loadShop,
  viewProduct,
  userLogout,
  loadCart,
  addToCart,
  deleteCart,
  editqty,
  loadWishlist,
  addToWishlist,
  loadCheckout,
  userDashboard,
  addAddress,
  storeOrder,
  editUser,
  deleteWishlist,
  addCartDeleteWishlist,
  loadSuccess,
  addCoupon,
  deleteAddress,
  viewOrder,
  cancelOrder,
  returnProduct,
  loadOtp,
  verifyOtp,
  razorpayCheckout,
  forgotPassword,
  forgotPasswordEmail,
  forgotPasswordOtp,
  changePassword
}
