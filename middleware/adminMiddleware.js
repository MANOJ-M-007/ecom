const session = require('express-session')

let isAdminLoggedin = false
let adminSession = false || {}

const isLogin = async (req, res, next) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      return next()
    } else {
      res.redirect('/admin/login')
    }
    
  } catch (error) {
    console.log(error.message)
  }
}
const isLogout = async (req, res, next) => {
  try {
    adminSession = req.session
    if (adminSession.adminId) {
      isAdminLoggedin = true
      res.redirect('/admin')
    }
    next()
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = {
  isLogin,
  isLogout
}
