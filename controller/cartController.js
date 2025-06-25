const users = require("../model/userModel");
const products = require("../model/productModel")
const mongoose = require('mongoose');
const coupon = require("../model/couponModel"); 

function getDiscountedPrice(price, discount) {
  if (!discount || !discount.isActive) return price;

  const now = new Date();
  if (now < discount.startDate || now > discount.endDate) return price;

  if (discount.type === 'percentage') {
    return Math.max(price - (price * discount.value / 100), 0);
  } else if (discount.type === 'flat') {
    return Math.max(price - discount.value, 0);
  }

  return price;
}


/* exports.addToCartController = async (req, res) => {
    const {userId} = req.params
    const { productId, quantity, size} = req.body

    try {
        if (!userId || !productId)  {
            return res.status(400).json({ error: 'User ID is required' });
        }


         const user = await users.findById(userId);
        // console.log(user)

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

       // Check if product already in cart
        const existingItemIndex = user.cart.findIndex(item =>
            item.productId.toString() === productId && item.size === size
        );

        if (existingItemIndex !== -1) {
            // If item with same productId and size exists, update quantity
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            // Else, push new item to cart
            user.cart.push({
                productId: new mongoose.Types.ObjectId(productId),
                quantity,
                size
            });
        }

        await user.save();

        res.status(200).json({
            message: 'Item Added successfully',
            cart: user.cart
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update Cart' });
    }
}; */

/* exports.addToCartController = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity, variantSKU } = req.body;

  if (!userId || !productId || !variantSKU ) {
    return res.status(400).json({ error: 'User ID, product ID, variant SKU, and quantity are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await products.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = product.variants.find(v => v.sku === variantSKU);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    if (variant.stock < quantity) {
      return res.status(400).json({ error: `Only ${variant.stock} items available in stock` });
    }

    // Check if item already in cart
    const existingItemIndex = user.cart.items.findIndex(item =>
      item.productId.toString() === productId && item.variantSKU === variantSKU
    );

    if (existingItemIndex !== -1) {
      const currentQty = user.cart.items[existingItemIndex].quantity;
      const totalQty = currentQty + quantity;

      if (totalQty > variant.stock) {
        return res.status(400).json({ error: `Only ${variant.stock - currentQty} more items in stock` });
      }

      user.cart.items[existingItemIndex].quantity = totalQty;
    } else {
      user.cart.items.push({
        productId: product._id,
        variantSKU,
        quantity
      });
    }

    // Recalculate cart subtotal
    let subtotal = 0;
    let discount = 0;

    for (const item of user.cart.items) {
      let discountAmount = 0
      const cartProduct = await products.findById(item.productId);
      const cartVariant = cartProduct.variants.find(v => v.sku === item.variantSKU);
      if (cartVariant) {
        subtotal += cartVariant.price * item.quantity;
      }
    }

    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;
    user.cart.discount = discount;

    await user.save();

    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: user.cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
}; */

exports.addToCartController = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity, variantSKU } = req.body;

  if (!userId || !productId || !variantSKU) {
    return res.status(400).json({ error: 'User ID, product ID, variant SKU, and quantity are required' });
  }

  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await products.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = product.variants.find(v => v.sku === variantSKU);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    if (variant.stock < quantity) {
      return res.status(400).json({ error: `Only ${variant.stock} items available in stock` });
    }

    // Check if item already in cart
    const existingItemIndex = user.cart.items.findIndex(item =>
      item.productId.toString() === productId && item.variantSKU === variantSKU
    );

    if (existingItemIndex !== -1) {
      const currentQty = user.cart.items[existingItemIndex].quantity;
      const totalQty = currentQty + 1;

      if (totalQty > variant.stock) {
        return res.status(400).json({ error: `Only ${variant.stock - currentQty} more items in stock` });
      }

      user.cart.items[existingItemIndex].quantity = totalQty;
    } else {
      user.cart.items.push({
        productId: product._id,
        variantSKU,
        quantity
      });
    }

    // Recalculate cart totals
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of user.cart.items) {
      const cartProduct = await products.findById(item.productId);
      const cartVariant = cartProduct.variants.find(v => v.sku === item.variantSKU);

      if (cartVariant) {
        const originalPrice = cartVariant.price;
        

        // Check variant discount first, then fallback to product discount
        let effectivePrice = getDiscountedPrice(originalPrice, cartVariant.discount);
        if (effectivePrice === originalPrice) {
          
          effectivePrice = getDiscountedPrice(originalPrice, cartProduct.discount);
        }
        

        subtotal += originalPrice * item.quantity;
        totalDiscount += (originalPrice - effectivePrice) * item.quantity;
        console.log(totalDiscount, subtotal);
        
      }
    }
        console.log(totalDiscount, subtotal);

    const cartTotal = subtotal - totalDiscount;

    
    user.cart.subtotal = subtotal;
    user.cart.discount = totalDiscount;
    user.cart.cartTotal = cartTotal;

    await user.save();
    console.log(user.cart);


    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: user.cart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

// Update quantity or size of a cart item
/* exports.updateCartItemController = async (req, res) => {
  const { userId, productId, variantSKU, quantity } = req.body;

  if (!userId || !productId || !variantSKU) {
    return res.status(400).json({ error: 'userId, productId, and variantSKU are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await products.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = product.variants.find(v => v.sku === variantSKU);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    const cartItem = user.cart.items.find(
      item => item.productId._id.toString() === productId && item.variantSKU === variantSKU
    );
    

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity < 1 || quantity > variant.stock) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${variant.stock}` });
    }

    cartItem.quantity = quantity;

    // Recalculate cart totals
    let subtotal = 0;
    user.cart.items.forEach(item => {
      const prod = item.productId;
      const varData = prod.variants.find(v => v.sku === item.variantSKU);
      if (varData) subtotal += varData.price * item.quantity;
    });

    const discount = 0;
    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;
    user.cart.discount = discount;

    await user.save();

    res.status(200).json({ message: 'Cart item updated successfully', cart: user.cart });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
}; */

exports.updateCartItemController = async (req, res) => {
  const { userId, productId, variantSKU, quantity } = req.body;

  if (!userId || !productId || !variantSKU) {
    return res.status(400).json({ error: 'userId, productId, and variantSKU are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await products.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = product.variants.find(v => v.sku === variantSKU);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    const cartItem = user.cart.items.find(
      item => item.productId._id.toString() === productId && item.variantSKU === variantSKU
    );

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity < 1 || quantity > variant.stock) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${variant.stock}` });
    }

    cartItem.quantity = quantity;

    // Recalculate totals using helper
    let subtotal = 0;
    let discount = 0;

    for (const item of user.cart.items) {
      const prod = await products.findById(item.productId);
      const varData = prod.variants.find(v => v.sku === item.variantSKU);

      if (!varData) continue;

      const originalPrice = varData.price;
      const discountedPrice = getDiscountedPrice(originalPrice, varData.discount);
      if (discountedPrice === originalPrice) {
          discountedPrice = getDiscountedPrice(originalPrice, cartProduct.discount);
        }
      subtotal += originalPrice * item.quantity;
      discount += (originalPrice - discountedPrice) * item.quantity;
    }

    user.cart.subtotal = subtotal;
    user.cart.discount = discount;
    user.cart.cartTotal = subtotal - discount;

    await user.save();

    res.status(200).json({
      message: 'Cart item updated successfully',
      cart: user.cart
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};


//remove an item from cart

/* exports.removeFromCartController = async (req, res) => {
  const { userId, productId, variantSKU } = req.body;

  if (!userId || !productId || !variantSKU) {
    return res.status(400).json({ error: 'userId, productId, and variantSKU are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const initialLength = user.cart.items.length;

    user.cart.items = user.cart.items.filter(item =>
      !(item.productId.toString() === productId && item.variantSKU === variantSKU)
    );

    if (user.cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Recalculate totals
    let subtotal = 0;
    user.cart.items.forEach(item => {
      const prod = item.productId;
      const varData = prod.variants.find(v => v.sku === item.variantSKU);
      if (varData) subtotal += varData.price * item.quantity;
    });

    const discount = 0;
    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;
    user.cart.discount = discount;

    await user.save();

    res.status(200).json({
      message: 'Item removed from cart',
      cart: user.cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
}; */

exports.removeFromCartController = async (req, res) => {
  const { userId, productId, variantSKU } = req.body;

  if (!userId || !productId || !variantSKU) {
    return res.status(400).json({ error: 'userId, productId, and variantSKU are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const initialLength = user.cart.items.length;

    // Remove item
    user.cart.items = user.cart.items.filter(
      item => !(item.productId.toString() === productId && item.variantSKU === variantSKU)
    );

    if (user.cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Recalculate totals
    let subtotal = 0;
    let discount = 0;

    for (const item of user.cart.items) {
      const prod = await products.findById(item.productId);
      const variant = prod.variants.find(v => v.sku === item.variantSKU);

      if (!variant) continue;

      const originalPrice = variant.price;
      const discountedPrice = getDiscountedPrice(originalPrice, variant.discount);
      if (discountedPrice === originalPrice) {
          discountedPrice = getDiscountedPrice(originalPrice, cartProduct.discount);
        }
      subtotal += originalPrice * item.quantity;
      discount += (originalPrice - discountedPrice) * item.quantity;
    }

    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.discount = discount;
    user.cart.cartTotal = cartTotal;

    await user.save();

    res.status(200).json({
      message: 'Item removed from cart',
      cart: user.cart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};


// Remove multiple items from cart
exports.removeMultipleFromCartController = async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'userId and a non-empty items array are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const initialLength = user.cart.items.length;

    user.cart.items = user.cart.items.filter(cartItem =>
      !items.some(toRemove =>
        cartItem.productId.toString() === toRemove.productId &&
        cartItem.variantSKU === toRemove.variantSKU
      )
    );

    if (user.cart.items.length === initialLength) {
      return res.status(404).json({ message: 'No matching items found in cart' });
    }

    // Recalculate totals
let subtotal = 0;
    let discount = 0;

    for (const item of user.cart.items) {
      const prod = await products.findById(item.productId);
      const variant = prod.variants.find(v => v.sku === item.variantSKU);

      if (!variant) continue;

      const originalPrice = variant.price;
      const discountedPrice = getDiscountedPrice(originalPrice, variant.discount);
      if (discountedPrice === originalPrice) {
          discountedPrice = getDiscountedPrice(originalPrice, cartProduct.discount);
        }
      subtotal += originalPrice * item.quantity;
      discount += (originalPrice - discountedPrice) * item.quantity;
    }

    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;
    user.cart.discount = discount;

    await user.save();

    res.status(200).json({
      message: 'Selected items removed from cart',
      cart: user.cart
    });

  } catch (error) {
    console.error('Remove multiple from cart error:', error);
    res.status(500).json({ error: 'Failed to remove items from cart' });
  }
};


//Apply coupen code

exports.applyCouponController = async (req, res) => {
  const { userId, couponCode, cartTotal } = req.body;  

  if (!userId || !couponCode || !cartTotal) {
    return res.status(400).json({ error: 'User ID, coupon code, and cart total are required' });
  }

  try {
    const couponApplied = await coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

    if (!couponApplied) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    // Check if expired
    if (new Date() > new Date(couponApplied.expiresAt)) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    // Check min order amount
    if (cartTotal < couponApplied.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${couponApplied.minOrderAmount} required to use this coupon`
      });
    }

    // Check if user already used the coupon
    const usageRecord = couponApplied.usedBy.find((entry) => entry.userId.toString() === userId);
    if (usageRecord && usageRecord.usedCount >= couponApplied.usageLimit) {
      return res.status(400).json({ error: 'You have already used this coupon' });
    }

    // Calculate discount
    let discount = 0;
    if (couponApplied.discountType === 'percentage') {
      discount = (cartTotal * couponApplied.discountValue) / 100;
      if (couponApplied.maxDiscountAmount) {
        discount = Math.min(discount, couponApplied.maxDiscountAmount);
      }
    } else if (couponApplied.discountType === 'flat') {
      discount = couponApplied.discountValue;
    }

    const finalAmount = Math.max(cartTotal - discount, 0);

    // Track usage (in-memory; update DB during order placement)
    if (usageRecord) {
      usageRecord.usedCount += 1;
    } else {
      couponApplied.usedBy.push({ userId, usedCount: 1 });
    }

    await couponApplied.save();

    return res.status(200).json({
      message: 'Coupon applied successfully',
      discount,
      finalAmount,DiscountType: couponApplied.discountType, discountValue: couponApplied.discountValue
    });


  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};


// Get cart items for a user
/* exports.getCartItemsController = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId').select('cart');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build a detailed cart response
    const items = user.cart.items.map(item => {
      const variant = item.productId.variants.find(v => v.sku === item.variantSKU);
      return {
        productId: item.productId._id,
        variantSKU: item.variantSKU,
        productTitle: item.productId.title,
        brand: item.productId.brand,
        color: variant?.color,
        size: variant?.size,
        price: variant?.price,
        quantity: item.quantity,
        image: variant?.images?.[0] || null
      };
    });

    res.status(200).json({
      items,
      subtotal: user.cart.subtotal,
      discount: user.cart.discount,
      cartTotal: user.cart.cartTotal
    });

  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart items' });
  }
}; */

const applyDiscount = (price, discount) => {
  if (!discount || !discount.isActive) return price;

  const now = new Date();
  if (now < discount.startDate || now > discount.endDate) return price;

  let discountedPrice = price;

  if (discount.type === 'flat') {
    discountedPrice = Math.max(0, price - discount.value);
  } else if (discount.type === 'percentage') {
    discountedPrice = Math.max(0, price - (price * discount.value / 100));
  }

  return Math.round(discountedPrice);
};


exports.getCartItemsController = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await users.findById(userId)
      .populate('cart.items.productId')
      .select('cart');
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const items = user.cart.items.map(item => {
      const product = item.productId;
      const variant = product.variants.find(v => v.sku === item.variantSKU);

      if (!variant) return null;

      const originalPrice = variant.price;

      // Check for variant discount first, fallback to product discount
      const applicableDiscount = variant.discount?.isActive ? variant.discount : product.discount;
      const finalPrice = applyDiscount(originalPrice, applicableDiscount);

      return {
        productId: product._id,
        variantSKU: item.variantSKU,
        productTitle: product.title,
        brand: product.brand,
        color: variant.color,
        size: variant.size,
        originalPrice,
        finalPrice,
        applicableDiscount,
        quantity: item.quantity,
        image: variant.images?.[0] || null
      };
    }).filter(Boolean); // Remove null entries if any

    res.status(200).json({
      items,
      subtotal: user.cart.subtotal,
      discount: user.cart.discount,
      cartTotal: user.cart.cartTotal
    });

  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart items' });
  }
};
