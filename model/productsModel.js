const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: String,
  price: { type: Number, required: true },
  category: String,
  image: String, // S3 image URL
  size: [String], // e.g. ["S", "M", "L", "XL"]
  description: String,
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

const product=mongoose.model("product",productSchema)

module.exports = product
