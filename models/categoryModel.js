const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    // trim: true,
    required: true
  },
  is_active:{
    type:Number,
    default: 1
},
num: {
  type: Number,
  default:0,

}
})

module.exports = mongoose.model('Category', categorySchema)
