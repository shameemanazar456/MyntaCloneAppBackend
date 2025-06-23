const mongoose = require('mongoose');

// Subdocument schema for each variant (color + size)
const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // e.g., TSH-NIKE-RD-M
  color: { type: String, required: true },             // e.g., "Red"
  size: { type: String, required: true },              // e.g., "M", "L"
  price: { type: Number, required: true },             // Price for this variant
  stock: { type: Number, default: 0 },                 // Stock quantity
  images: [String]                                     // Images for this variant (e.g., color-specific)
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },             // Product title (e.g., "Men's T-Shirt")
  brand: { type: String },                             // Brand name
  category: { type: String },                          // Product category
  description: { type: String },                       // Product description
  variants: [variantSchema],                           // Array of all color + size combinations
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, // Optional admin reference
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('products', productSchema);
