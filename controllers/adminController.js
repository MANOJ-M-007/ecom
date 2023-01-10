const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')
const Banner = require('../models/bannerModel')
const Orders = require('../models/ordersModel')

let isAdminLoggedin
isAdminLoggedin = false
let adminSession = false || {}
let orderType = 'all';

const path = require('path')
const { CLIENT_RENEG_LIMIT } = require('tls')

const adminloadLogin = async (req, res) => {
  try {
    res.render('Login')
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
        if (userData.is_admin === 0) {
          res.render('Login', { message: 'Email and password is incorrect.' })
        } else {
          adminSession = req.session
          isAdminLoggedin = true
          adminSession.adminId = userData._id
          res.redirect('/admin')
          console.log('Admin logged in')
        }
      } else {
        res.render('Login', { message: 'Email and password is incorrect.' })
      }
    } else {
      res.render('Login', { message: 'Email and password is incorrect.' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const adminHome = async (req, res) => {
  try {
    adminSession = req.session
    if (isAdminLoggedin) {
      const productData = await Product.find()
      const userData = await User.find({ is_admin: 0 })
      const categoryData = await Category.find()

      const categoryArray = [];
      const orderCount = [];
      for(let key of categoryData){
        categoryArray.push(key.name)
        orderCount.push(0)
    }
    const completeorder = []
    const orderData =await Orders.find()
    for(let key of orderData){
      const uppend = await key.populate('products.item.productId')
      completeorder.push(uppend)
  }

  const productName =[];
  const salesCount = [];
  const productNames = await Product.find();
  for(let key of productNames){
    productName.push(key.name);
    salesCount.push(key.sales)
  }
  for(let i=0;i<completeorder.length;i++){
    for(let j = 0;j<completeorder[i].products.item.length;j++){
       const cataData = completeorder[i].products.item[j].productId.category
       const isExisting = categoryArray.findIndex(category => {
        return category === cataData
       })
       orderCount[isExisting]++
}}

  const showCount = await Orders.find().count()
  const productCount = await Product.count()
  const usersCount = await User.count({is_admin:0})
  const totalCategory = await Category.count({is_available:1})

console.log(categoryArray);
console.log(orderCount);

    res.render('home', {
      users: userData,
      product: productData,
      category: categoryArray,
      count: orderCount,
      pname:productName,
      pcount:salesCount,
      showCount,
      productCount,
      usersCount,
      totalCategory
      
    });
      
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const viewUser = async (req, res) => {
  try {
    const userData = await User.find({ is_admin: 0 })
    res.render('adminUser', { users: userData })
  } catch (error) {
    console.log(error.message)
  }
}

const blockUser = async (req, res) => {
  try {
    const id = req.query.id
    const userData = await User.findById({ _id: id })
    if (userData.is_verified) {
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 0 } })
    } else {
      await User.findByIdAndUpdate({ _id: id }, { $set: { is_verified: 1 } })
    }
    res.redirect('/admin/adminUser')
  } catch (error) {
    console.log(error.message)
  }
}

const viewProduct = async (req, res) => {
  const productData = await Product.find()
  res.render('adminProduct', { products: productData })
}

const addProductLoad = async (req, res) => {
  const categoryData = await Category.find()
  console.log(categoryData)
  res.render('addProduct', { category: categoryData })
}

const editProduct = async (req, res) => {
  try {
    const id = req.query.id
    const productData = await Product.findById({ _id: id })
    const categoryData = await Category.find({is_active:1})
    if (productData) {
      res.render('editProduct', { product: productData, category: categoryData })
    } else {
      res.redirect('/admin/viewProduct')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateAddProduct = async (req, res) => {
  try {
    const files=req.files
    const categoryData = await Category.find()
    const product = Product({
      name: req.body.pName,
      category: req.body.pCategory,
      price: req.body.pPrice,
      quantity: req.body.pQuantity,
      rating: req.body.pRating,
      image: files.map((x)=>x.filename),
    })
    const productData = await product.save()
    if (productData) {
      res.render('addProduct', {
        message: 'Your registration was successfull.',
        category: categoryData
      })
    } else {
      res.render('addProduct', { message: 'Your registration was a failure' })
    }
  } catch (error) {
    console.log(error.message)
  }
}

const updateEditProduct = async (req, res) => {
  try {
    const id = req.body.id
    const name = req.body.pName
    const category = req.body.pCategory
    const price = req.body.pPrice
    const quantity = req.body.pQuantity
    const rating = req.body.pRating
    const files=req.files
    const image = files.map((x)=>x.filename)

    if (image.length==0) {
      await Product.updateOne(
        { _id:req.body.id },
        { 
          $set: {
            name,
            category,
            price,
            quantity,
            rating,
          }
        }
      )
    } else {
       await Product.updateOne(
        { _id:req.body.id },
        {
          $set: {
            name,
            category,
            price,
            quantity,
            rating,
            image,
          }
        }
      )
    }
   
    res.redirect('/admin/adminProduct')
  } catch (error) {
    console.log(error.message)
  }
}
     
const blockProduct = async (req, res) => {
  try {
    const id = req.query.id
    const productData = await Product.updateOne(
      { _id: id },
      { $set: { is_available: 0 } }
    )
    res.redirect('/admin/viewProduct')
  } catch (error) {
    console.log(error.message)
  }
}

const unblockProduct = async (req, res) => {
  try {
    const id = req.query.id
    const productData = await Product.updateOne(
      { _id: id },
      { $set: { is_available: 1 } }
    )
    res.redirect('/admin/viewProduct')
  } catch (error) {
    console.log(error.message)
  }
}

const adminLogout = async (req, res) => {
  try {
    adminSession = req.session
    adminSession.adminId = null
    isAdminLoggedin = false
    console.log('admin logged out')
    res.redirect('/admin')
  } catch (error) {
    console.log(error.message)
  }
}

const loadCategory = async (req, res) => {
  try {
    const categoryData = await Category.find()
    res.render('adminCategory', {
      category: categoryData
    })
  } catch (error) {
    console.log(error.message)
  }
}

const insertCategory = async (req, res) => {
  try {
    const reqcategory = req.body.category
    const allCategory = await Category.find()
    const categoryat = await Category.findOne({ name: {$regex: new RegExp ("^" + reqcategory.toLowerCase(),"i")} })
    if (categoryat) {
      res.render('adminCategory', { category: allCategory, message: 'category already exists..' })
    } else {
      const category = new Category({
        name: req.body.category
      })
      const categoryData = await category.save()
      res.redirect('/admin/loadCategory')
    }
  } catch (error) {
    console.log(error.message)
  }
}


const manageCategory = async (req, res) => {
  try {
    const id = req.query.id
    const categoryData = await Category.findById({_id:id})
    if(categoryData.is_active){
      await Category.findByIdAndUpdate({ _id: id }, { $set: { is_active: 0 } })
    } else {
    await Category.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } })
  }
    // await Category.deleteOne({ _id: id })
     res.redirect('/admin/loadCategory')
  } catch (error) {
    console.log(error.message)
  }
}



const offer = async (req, res) => {
  try {
    const offerData = await Offer.find()
    const productData = await Product.find()
    const userData = await User.find({ isAdmin: 0 })
    res.render('adminOffer', {
      offer: offerData,
      users: userData,
      product: productData,
      
    })
  } catch (error) {
    console.log(error.message)
  }
}

const loadOffer = async (req, res) => {
  try {
    const offer = Offer({
      name: req.body.name,
      type: req.body.type,
      discount: req.body.discount,
      minimumBill:req.body.minimumBill
    })
    await offer.save()
    res.redirect('/admin/loadOffer')
  } catch (error) {
    console.log(error.message)
  }
}

const deleteOffer = async (req, res) => {
  try {
    const id = req.query.id
    await Offer.deleteOne({ _id: id })
    res.redirect('/admin/loadOffer')
  } catch (error) {
    console.log(error.message)
  }
}

const loadBanners = async (req, res) => {
  try {
    const bannerData = await Banner.find()
    res.render('banners', {
      banners: bannerData
    })
  } catch (error) {
    console.log(error.message)
  }
}

const addBanner = async (req, res) => {
  try {
    const newBanner = req.body.banner
    const a = req.files
    const banner = new Banner({
      banner: newBanner,
      bannerImage: a.map((x) => x.filename)
    })
    const bannerData = await banner.save()
    if (bannerData) {
      res.redirect('/admin/loadBanners')
    }
  } catch (error) {
    console.log(error.message)
  }
}

const currentBanner = async (req, res) => {
  try {
    const id = req.query.id
    await Banner.findOneAndUpdate({ is_active: 1 }, { $set: { is_active: 0 } })
    await Banner.findByIdAndUpdate({ _id: id }, { $set: { is_active: 1 } })
    res.redirect('/admin/loadBanners')
  } catch (error) {
    console.log(error.message)
  }
}

const viewOrder = async(req,res)=>{
  try {
    const productData = await Product.find()
    const userData = await User.find({is_admin: 0})
    const orderData = await Orders.find().sort({createdAt :-1})
    for(let key of orderData){
      await key.populate('products.item.productId');
      await key.populate('userId');
    }
    if (orderType == undefined) {
      res.render('adminOrder', {
        users: userData,
        product: productData,
        order: orderData,
        
      });
    }else{
        id = req.query.id;
        res.render('adminOrder', {
          users: userData,
          product: productData,
          order: orderData,
          id: id,
        });
    }
  } catch (error) {
    console.log(error.message)
  }
}

const adminCancelOrder = async(req,res)=>{
  try {
    const id = req.query.id;
    await Orders.deleteOne({ _id: id });
    res.redirect('/admin/adminOrder');
  } catch (error) {
    console.log(error.message)
  }
}

const adminConfirmOrder = async(req,res)=>{
  try {
    const id = req.query.id;
    await Orders.updateOne({ _id: id }, { $set: { status: 'Confirmed' } });
    res.redirect('/admin/adminOrder');
  } catch (error) {
    console.log(error.message)
  }
}

const adminDeliveredOrder = async(req,res)=>{
  try {
    const id = req.query.id;
    await Orders.updateOne({ _id: id }, { $set: { status: 'Delivered' } });
    res.redirect('/admin/adminOrder');
  } catch (error) {
    console.log(error.message)
  }
}

const adminOrderDetails = async(req,res)=>{
  try {
      const id = req.query.id
      const orderData = await Orders.findById({_id:id});
      await orderData.populate('products.item.productId');
      await orderData.populate('userId')
 res.render('adminViewOrder',{
  order:orderData,
 })
  } catch (error) {
    console.log(error.message);
  }
}

const salesReport = async(req,res)=>{
  try {
    const productData = await Product.find()
    res.render('salesReport',{
      product:productData,
      admin:true})
  } catch (error) {
    console.log(error.message);
  } 
}


module.exports = {
  adminloadLogin,
  verifyLogin,
  adminHome,
  viewUser,
  blockUser,
  viewProduct,
  addProductLoad,
  updateAddProduct,
  editProduct,
  updateEditProduct,
  blockProduct,
  unblockProduct,
  adminLogout,
  loadCategory,
  insertCategory,
  manageCategory,
  offer,
  loadOffer,
  deleteOffer,
  loadBanners,
  addBanner,
  currentBanner,
  viewOrder,
  adminCancelOrder,
  adminConfirmOrder,
  adminDeliveredOrder,
  adminOrderDetails,
  salesReport
}
