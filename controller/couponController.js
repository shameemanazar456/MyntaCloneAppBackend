const coupon = require('../model/couponModel');


//admin add products

exports.createCouponController = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      validity,
      usageLimit
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !validity) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Check if coupon already exists
    const existing = await coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ error: 'Coupon code already exists' });
    }

     // Calculate expiry date (10 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validity);

    const newCoupon = new coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount || null : null,
      minOrderAmount: minOrderAmount || 0,
      expiresAt,
      usageLimit: usageLimit || 1,
      isActive: true
    });

    await newCoupon.save();

    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: newCoupon
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};


