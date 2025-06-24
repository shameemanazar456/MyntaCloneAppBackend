const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  type: { type: String, enum: ['flat', 'percentage'], required: true },
  value: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true }, // 
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [String],
  discount: discountSchema //Add discount at variant level
}, { _id: false });


// Main Product schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: { type: String },
  category: { type: String },
  description: { type: String },
  variants: [variantSchema],
  discount: discountSchema, // Discount added here
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('products', productSchema);