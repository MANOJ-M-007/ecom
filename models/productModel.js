const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  sales: {
    type: Number,
    default:0,
  },
  rating: {
    type: Number,
    required: true
  },
  image: {
    type: Array
  },
  is_available: {
    type: Number,
    default: 1
  }
})

module.exports = mongoose.model('Product', productSchema)
