const mongoose = require('mongoose');
// Discount schema remains the same
const discountSchema = new mongoose.Schema({
  type: { type: String, enum: ['flat', 'percentage'], required: true },
  value: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { _id: false });

// Variant schema remains the same
const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [String],
  discount: discountSchema
}, { _id: false });


// Customer review schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });


// Main Product schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: {
    name: { type: String },
    image: { type: String } // URL of brand logo/image
  },
  category: { type: String },
  description: { type: String },
  variants: [variantSchema],
  discount: discountSchema,
  reviews: [reviewSchema], // Add customer reviews here
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('products', productSchema);