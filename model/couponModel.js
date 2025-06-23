
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },

  discountValue: {
    type: Number,
    required: true
  },

  maxDiscountAmount: {
    type: Number,
    default: null // Only for percentage-based discounts
  },

  minOrderAmount: {
    type: Number,
    default: 0 // Minimum cart value to apply coupon
  },

  isActive: {
    type: Boolean,
    default: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  usageLimit: {
    type: Number,
    default: 1 // how many times one user can use this coupon
  },

  usedBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
      },
      usedCount: {
        type: Number,
        default: 1
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('coupon', couponSchema);
