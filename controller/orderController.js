const Order = require('../model/orderModel');
const users = require('../model/userModel');
/* const referralRewards = require("../model/referralRewardModel")
 */
const Product = require('../model/productModel');
const Coupon = require('../model/couponModel');
/* const { handleReferralAfterFirstOrder } = require('../utils/referralUtils');
 */

// controller for handling order placement

// Utility to calculate final price after checking variant/product discount
const getDiscountedPrice = (variant, product) => {
  const now = new Date();
  let price = variant.price;
  let discount = null;

  if (variant.discount?.isActive && now >= variant.discount.startDate && now <= variant.discount.endDate) {
    discount = variant.discount;
  } else if (product.discount?.isActive && now >= product.discount.startDate && now <= product.discount.endDate) {
    discount = product.discount;
  }

  if (discount) {
    if (discount.type === 'flat') {
      price -= discount.value;
    } else if (discount.type === 'percentage') {
      price -= (price * discount.value) / 100;
    }
  }
  price = Math.round(price)
  return Math.max(price, 0);
};

exports.placeOrderController = async (req, res) => {
  const { userId, items, couponCode, shippingAddress, paymentMethod } = req.body;

  if (!userId || !items || items.length === 0 || !paymentMethod || !shippingAddress) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    let subtotal = 0;
    let discountAmount = 0;
    let totalPrice = 0
    const finalItems = [];

    for (const item of items) {
      const { productId, variantSKU, quantity } = item;

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const variant = product.variants.find(v => v.sku === variantSKU);
      if (!variant) return res.status(404).json({ error: `Variant ${variantSKU} not found` });

      if (variant.stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.title} (${variant.color} - ${variant.size})` });
      }

      const originalUnitPrice = variant.price;
      const discountedUnitPrice = getDiscountedPrice(variant, product);


      const totalItemPrice = discountedUnitPrice * quantity;
       const totalPricePerProduct = originalUnitPrice*quantity
      totalPrice += totalPricePerProduct
      subtotal += totalItemPrice;

      // Add product/variant level discount to discountAmount
      const itemDiscount = (originalUnitPrice - discountedUnitPrice) * quantity;
      discountAmount += itemDiscount;

      // Deduct stock
      variant.stock -= quantity;

      finalItems.push({
        productId,
        variantSKU,
        quantity,
        priceAtPurchase: discountedUnitPrice,
        color: variant.color,
        size: variant.size
      });

      await product.save();
    }


    // Apply coupon (if any)
    let finalAmount = subtotal;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) return res.status(400).json({ error: 'Invalid or inactive coupon' });
      if (new Date() > coupon.expiresAt) return res.status(400).json({ error: 'Coupon expired' });
      if (subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ error: `Minimum ₹${coupon.minOrderAmount} required for this coupon` });
      }

      const usage = coupon.usedBy.find(u => u.userId.toString() === userId);
      if (usage && usage.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
      }

      const couponDiscount = (coupon.discountType === 'percentage')
        ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
        : coupon.discountValue;

      discountAmount += couponDiscount;
      finalAmount -= couponDiscount;


      // Save coupon usage
      if (usage) {
        usage.usedCount += 1;
      } else {
        coupon.usedBy.push({ userId, usedCount: 1 });
      }
      await coupon.save();
    }

    // Create order
    const order = new Order({
      userId,
      items: finalItems,
      shippingAddress,
      paymentMethod,
      subtotalAmount: totalPrice,
      discountAmount,
      couponCode: couponCode || null,
      totalAmount: finalAmount,
      orderStatus: 'Pending',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      statusTimestamps: {
        placedAt: new Date()
      }
    });

    await order.save();

    const user = await users.findById(userId);
user.orders.push(order._id);

// Create a set of ordered variantSKUs for fast lookup
const orderedItemsMap = new Map();
for (const item of finalItems) {
  orderedItemsMap.set(`${item.productId}_${item.variantSKU}`, item.quantity);
}

// Filter out ordered items from the user's cart
const remainingCartItems = user.cart.items.filter(cartItem => {
  const key = `${cartItem.productId}_${cartItem.variantSKU}`;
  return !orderedItemsMap.has(key);
});

// Recalculate cart totals
let newSubtotal = 0;
let newDiscount = 0;

for (const item of remainingCartItems) {
  const product = await Product.findById(item.productId);
  if (!product) continue;
  const variant = product.variants.find(v => v.sku === item.variantSKU);
  if (!variant) continue;

  const originalPrice = variant.price;
  const discountedPrice = getDiscountedPrice(variant, product);
  const itemQty = item.quantity;

  newSubtotal += discountedPrice * itemQty;
  newDiscount += (originalPrice - discountedPrice) * itemQty;
}

user.cart.items = remainingCartItems;
user.cart.subtotal = newSubtotal;
user.cart.discount = newDiscount;
user.cart.cartTotal = Math.max(newSubtotal, 0);

await user.save();

/* //function to handle referral logic
await handleReferralAfterFirstOrder(userId); */

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

//controller to view the order history of a customer
exports.viewOrderHistoryController = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.productId',
        select: 'title brand category variants'  // populate only basic info
      });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user' });
    }

    const formattedOrders = orders.map(order => {
      const updatedItems = order.items.map(item => {
        const product = item.productId;
        const variantDetails = product?.variants?.find(v => v.sku === item.variantSKU);

        return {
          productId: product?._id,
          title: product?.title,
          brand: product?.brand,
          variantSKU: item.variantSKU,
          color: item.color || variantDetails?.color,
          size: item.size || variantDetails?.size,
          priceAtPurchase: item.priceAtPurchase,
          quantity: item.quantity,
          image: variantDetails?.images?.[0] || null
        };
      });

      return {
        _id: order._id,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        items: updatedItems,
        shippingAddress: order.shippingAddress,
        subtotalAmount: order.subtotalAmount,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        totalAmount: order.totalAmount,
        placedAt: order.statusTimestamps.placedAt,
        createdAt: order.createdAt
      };
    });

    res.status(200).json({
      message: 'Order history fetched successfully',
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
};

//to view a particular order in detail

exports.getOrderDetailsByIdController = async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const order = await Order.findById(orderId)
      .populate({
        path: 'items.productId',
        select: 'title brand category variants'
      });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const enrichedItems = order.items.map(item => {
      const product = item.productId;
      const variant = product?.variants?.find(v => v.sku === item.variantSKU);

      return {
        productId: product?._id,
        title: product?.title,
        brand: product?.brand,
        variantSKU: item.variantSKU,
        color: item.color || variant?.color,
        size: item.size || variant?.size,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        image: variant?.images?.[0] || null
      };
    });

    const response = {
      _id: order._id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      couponCode: order.couponCode,
      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      placedAt: order.statusTimestamps?.placedAt,
      createdAt: order.createdAt,
      items: enrichedItems
    };

    res.status(200).json({
      message: 'Order details fetched successfully',
      order: response
    });

  } catch (error) {
    console.error('Fetch order details error:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
};

// to cancel an order
exports.cancelOrderController = async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.body; // optional: ensure only owner/admin cancels

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Order cannot be cancelled after shipping' });
    }

    // Set order status
    order.orderStatus = 'Cancelled';
    order.statusTimestamps.cancelledAt = new Date();


    await order.save();

    // Optional: Restock items
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSKU },
        { $inc: { "variants.$.stock": item.quantity } }
      );
    }

    res.status(200).json({ message: 'Order cancelled successfully', order });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};


//update order status controller

exports.updateOrderStatusController = async (req, res) => {
  const { orderId } = req.params;
  const { newStatus } = req.body;

  const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent backward status change (e.g., Delivered → Pending)
    const currentStatus = order.orderStatus;
    const statusOrder = { Pending: 1, Shipped: 2, Delivered: 3, Cancelled: 4 };

    if (statusOrder[newStatus] < statusOrder[currentStatus] && newStatus !== 'Cancelled') {
      return res.status(400).json({ error: 'Cannot update to an earlier status' });
    }

    // Cancelled must follow separate logic
    if (newStatus === 'Cancelled' && ['Shipped', 'Delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Cannot cancel after shipment' });
    }

    order.orderStatus = newStatus;

    if (newStatus === 'Shipped') {
      order.statusTimestamps.shippedAt = new Date();
    } else if (newStatus === 'Delivered') {
      order.statusTimestamps.deliveredAt = new Date();
    } else if (newStatus === 'Cancelled') {
      order.statusTimestamps.cancelledAt = new Date();
    }

    await order.save();

    res.status(200).json({
      message: `Order status updated to ${newStatus}`,
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};


