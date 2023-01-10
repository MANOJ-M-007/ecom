require('dotenv').config()
const express = require('express')
const app = express()
const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')
const mongoose = require('mongoose')
const dbpath = require('./config/connections')
const session = require('express-session')
const config = require('./config/config')
const cors = require('cors')


mongoose.connect(dbpath.dbpath, () => {
  console.log('Database Connected.')
})

app.use(session({ secret: config.sessionSecret }))

app.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')
userRoute.set('views', './views/users')

app.use('/', express.static('public'))
app.use('/', express.static('public/assets'))
app.use('/admin', express.static('public/admin'))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/admin', adminRoute)
app.use('/', userRoute)

app.use(cors())

app.listen(3000, function () {
  console.log('server is running...')
})

// app.use((req,res)=>{
//   res.status(404).render('404')
// })