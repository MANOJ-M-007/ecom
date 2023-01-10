const express = require('express')
const adminRoute = express()
// const Product = require('../models/productModel')
const adminController = require('../controllers/adminController')
const adminMiddleware = require('../middleware/adminMiddleware')
const multer = require('../util/multer')

adminRoute.use(express.json())
adminRoute.use(express.urlencoded({ extended: true }))

// const isAdminLoggedin = false

adminRoute.get('/', adminMiddleware.isLogin,adminController.adminHome)
adminRoute.get('/adminproduct', adminMiddleware.isLogin, adminController.viewProduct)

adminRoute.get('/login', adminMiddleware.isLogout, adminController.adminloadLogin)
adminRoute.post('/login', adminController.verifyLogin)

adminRoute.get('/addProduct', adminMiddleware.isLogin, adminController.addProductLoad)
adminRoute.post('/addProduct', multer.upload.array('pImage', 4), adminController.updateAddProduct)
adminRoute.get('/viewProduct', adminMiddleware.isLogin, adminController.viewProduct)

adminRoute.get('/block-user', adminMiddleware.isLogin, adminController.blockUser)
adminRoute.get('/adminUser', adminMiddleware.isLogin, adminController.viewUser)

adminRoute.get('/editProduct', adminMiddleware.isLogin, adminController.editProduct)
adminRoute.post('/editProduct', multer.upload.array('pImage', 4), adminController.updateEditProduct)
adminRoute.get('/blockProduct', adminMiddleware.isLogin, adminController.blockProduct)
adminRoute.get('/unblockProduct',adminMiddleware.isLogin,adminController.unblockProduct)

adminRoute.get('/adminLogout', adminMiddleware.isLogin, adminController.adminLogout)

adminRoute.get('/loadCategory', adminMiddleware.isLogin, adminController.loadCategory)
adminRoute.post('/adminCategory', adminMiddleware.isLogin, adminController.insertCategory)
adminRoute.get('/manageCategory', adminMiddleware.isLogin, adminController.manageCategory)


adminRoute.get('/loadOffer', adminMiddleware.isLogin, adminController.offer)
adminRoute.post('/loadOffers',adminMiddleware.isLogin, adminController.loadOffer)
adminRoute.get('/deleteOffer', adminMiddleware.isLogin, adminController.deleteOffer)

adminRoute.get('/loadBanners', adminMiddleware.isLogin, adminController.loadBanners)
adminRoute.post('/loadBanners', multer.upload.array('bannerImage', 3), adminController.addBanner)
adminRoute.get('/currentBanner', adminMiddleware.isLogin, adminController.currentBanner)

adminRoute.get('/adminOrder',adminMiddleware.isLogin,adminController.viewOrder);
adminRoute.get('/adminCancelOrder',adminMiddleware.isLogin, adminController.adminCancelOrder);
adminRoute.get('/adminConfirmOrder',adminMiddleware.isLogin, adminController.adminConfirmOrder);
adminRoute.get('/adminDeliveredOrder',adminMiddleware.isLogin,adminController.adminDeliveredOrder);
adminRoute.get('/adminOrderView',adminMiddleware.isLogin, adminController.adminOrderDetails);

adminRoute.get('/salesReport',adminController.salesReport)
adminRoute.use((req, res, next) => {
    res.render('admin404')
  })

module.exports = adminRoute
