const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
  variantSKU: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  color: { type: String },
  size: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },

  items: [orderItemSchema],

  shippingAddress: {
    fullName: String,
    mobile: String,
    pincode: String,
    locality: String,
    address: String,
    city: String,
    state: String,
    landmark: String,
    alternatePhone: String,
    addressType: {
      type: String,
      enum: ['Home', 'Work'],
      default: 'Home'
    }
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'Card', 'UPI'],
    required: true
  },

  //  Financial Details
  subtotalAmount: {  //totalBeforeCoupen
    type: Number,
    required: true
  },
  discountAmount: { //amount after applying coupen
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  totalAmount: {
    type: Number,
    required: true
  },

  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },

  isDelivered: {
    type: Boolean,
    default: false
  },

  statusTimestamps: {
    placedAt: { type: Date, default: Date.now },
    processingAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },

  orderedAt: {
    type: Date,
    default: Date.now
  }
});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
