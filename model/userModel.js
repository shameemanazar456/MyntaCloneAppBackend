const mongoose=require('mongoose')

const addressSchema = new mongoose.Schema({
  fullName: String,
  mobile: String,
  pincode: String,
  locality: String,
  address: String,
  city: String,
  state: String,
  landmark: String,
  alternatePhone: String,
  addressType: { type: String, enum: ['Home', 'Work'], default: 'Home' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true, // Prevent duplicate emails
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  mobile: {
    type: String,
  },

  profile: {
    type: String // Profile image URL (e.g., S3)
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },

  dob: {
    type: Date
  },

  addresses: [addressSchema],

  cart: {
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
      quantity: { type: Number, default: 1 },
      size: String
    }
  ],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  cartTotal: { type: Number, default: 0 }
},

  orders: [
    {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'orders' },
    }
  ],

  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'products'
    }
  ],

  isAdmin: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const users=mongoose.model("users",userSchema)

module.exports = users