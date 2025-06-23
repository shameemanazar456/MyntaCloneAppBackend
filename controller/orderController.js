const Order = require('../model/orderModel');
const users = require('../model/userModel');
const Product = require('../model/productModel'); 
const Coupon = require('../model/couponModel');

// controller for handling order placement
/* exports.placeOrderController = async (req, res) => {
    const {userId} = req.params
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!userId || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  try {
    // Check user exists
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let totalAmount = 0;
    const validatedItems = [];

    // Validate stock and calculate total
    for (const item of items) {
      const { productId, quantity, size, price } = item;

      if (!productId || !quantity || !price) {
        return res.status(400).json({ error: 'Each item must have productId, quantity, and price' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${productId}` });
      }

      // Check stock availability (assume flat stock)
      if (product.stock < quantity) {
        return res.status(400).json({
          error: `Only ${product.stock} unit(s) available for ${product.name}`
        });
      }

      // Deduct stock immediately
      product.stock -= quantity;
      await product.save();

      totalAmount += price * quantity;

      validatedItems.push({ productId, quantity, size, price });
    }

    // Create order
    const newOrder = new Order({
      userId,
      items: validatedItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      orderStatus: 'Pending',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      isDelivered: false,
      statusTimestamps: {
        placedAt: new Date()
      }
    });

    await newOrder.save();

    // Add order ID to user’s `orders` array
    user.orders.push(newOrder._id);


    // Clear user's cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
}; */


exports.placeOrderController = async (req, res) => {
  const { userId, items, cartTotal, couponCode, shippingAddress, paymentMethod } = req.body;

  if (!userId || !items || items.length === 0 || !cartTotal || !paymentMethod) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    let discountAmount = 0;
    let finalAmount = cartTotal;

    //  Apply coupon if provided
    if (couponCode) {
      const couponApplied = await coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

      if (!couponApplied) {
        return res.status(400).json({ error: 'Invalid or inactive coupon' });
      }

      if (new Date() > couponApplied.expiresAt) {
        return res.status(400).json({ error: 'Coupon has expired' });
      }

      if (cartTotal < couponApplied.minOrderAmount) {
        return res.status(400).json({ error: `Minimum order of ₹${couponApplied.minOrderAmount} required` });
      }

      const usage = couponApplied.usedBy.find(u => u.userId.toString() === userId);
      if (usage && usage.usedCount >= couponApplied.usageLimit) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      }

      //  Calculate discount
      if (couponApplied.discountType === 'percentage') {
        discountAmount = (cartTotal * couponApplied.discountValue) / 100;
        if (couponApplied.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, couponApplied.maxDiscountAmount);
        }
      } else if (couponApplied.discountType === 'flat') {
        discountAmount = couponApplied.discountValue;
      }

      finalAmount = cartTotal - discountAmount;

      //  Save coupon usage
      if (usage) {
        usage.usedCount += 1;
      } else {
        couponApplied.usedBy.push({ userId, usedCount: 1 });
      }

      await couponApplied.save();
    }

    //  Optional stock validation
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product?.name || 'a product'}` });
      }
    }

    // Create and save order
    const newOrder = new Order({
      userId,
      items,
      shippingAddress,
      paymentMethod,
      subtotalAmount: cartTotal,
      discountAmount,
      couponCode: couponCode || null,
      totalAmount: finalAmount,
      orderStatus: 'Pending',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      statusTimestamps: {
        placedAt: new Date()
      }
    });

    await newOrder.save();

    //  Update user document: push order and clear cart
    const user = await User.findById(userId);
    user.orders.push(newOrder._id);
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

//controller to view the order history of a customer

exports.viewOrderHistoryController = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId })
      .sort({ orderedAt: -1 })
      .populate('items.productId', 'name price image stock description'); // fields to populate from Product

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    res.status(200).json({
      message: 'Order history fetched successfully',
      orders
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
};


