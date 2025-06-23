const users = require("../model/userModel");
const products = require("../model/productsModel")
const mongoose = require('mongoose');
const coupon = require("../model/couponModel"); 


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

exports.addToCartController = async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity, size } = req.body;

  try {
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: 'User ID, product ID, and quantity are required' });
    }

    const user = await users.findById(userId).populate('cart.items.productId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prevent adding out-of-stock products
    if (product.stock === 0) {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }
    //  Check stock availability
    const existingIndex = user.cart.items.findIndex(
      item => item.productId._id.toString() === productId && item.size === size
    );

    let newQuantity = quantity;

    if (existingIndex !== -1) {
      const currentCartQty = user.cart.items[existingIndex].quantity;
      const totalRequested = currentCartQty + quantity;

      if (totalRequested > product.stock) {
        return res.status(400).json({
          error: `Only ${product.stock - currentCartQty} more items available in stock`
        });
      }

      user.cart.items[existingIndex].quantity = totalRequested;
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({ error: `Only ${product.stock} items available in stock` });
      }

      user.cart.items.push({
        productId: product._id,
        quantity,
        size
      });
    }

    //  Recalculate subtotal and cartTotal
    let subtotal = user.cart.subtotal;
    let discount = user.cart.discount;
        
      subtotal += product.price *(quantity);
      console.log(subtotal);
      
      discount += 2 * quantity;



    const cartTotal = subtotal - discount;
    console.log(cartTotal);
    

    // Avoid NaN
    user.cart.subtotal = isNaN(subtotal) ? 0 : subtotal;
    user.cart.cartTotal = isNaN(cartTotal) ? 0 : cartTotal;
    user.cart.discount = isNaN(cartTotal) ? 0 : discount;


    await user.save();

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
exports.updateCartItemController = async (req, res) => {
  const { userId, productId, size, newSize, quantity } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock === 0) {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }

    // Find the cart item to update
    const itemIndex = user.cart.items.findIndex(
      item => item.productId._id.toString() === productId && (!size || item.size === size)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = user.cart.items[itemIndex];

    // Update quantity if provided and valid
    if (typeof quantity === 'number') {
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }
      if (quantity > product.stock) {
        return res.status(400).json({ error: `Only ${product.stock} items available in stock` });
      }

      cartItem.quantity = quantity;
    }

    // Update size if provided
    if (newSize) {
      cartItem.size = newSize;
    }

    // Recalculate totals
    let subtotal = 0;
    let discount = 0
    user.cart.items.forEach(item => {
      subtotal += item.productId.price * item.quantity;
      discount += item.productId.discountprice * item.quantity || 0;
    });

    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;
    user.cart.discount = discount;


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
    const { userId, productId, size } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    try {
        const user = await users.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Filter out the product from the cart
        const originalCartLength = user.cart.length;

        user.cart = user.cart.filter(item =>
            !(item.productId.toString() === productId && (!size || item.size === size))
        );

        if (user.cart.length === originalCartLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await user.save();

        res.status(200).json({
            message: 'Product removed from cart',
            cart: user.cart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
}; */

exports.removeFromCartController = async (req, res) => {
  const { userId, productId, size } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ error: 'userId and productId are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const originalCartLength = user.cart.items.length;

    // Filter out the specific item (match by productId and size)
    user.cart.items = user.cart.items.filter(item =>
      !(item.productId._id.toString() === productId && (!size || item.size === size))
    );

    if (user.cart.items.length === originalCartLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Recalculate subtotal after removal
    let subtotal = 0;
    let discount = 0;
    user.cart.items.forEach(item => {
      subtotal += item.productId.price * item.quantity;
      discount += item.productId.discountprice * item.quantity || 0;

    });

    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;

    await user.save();

    res.status(200).json({
      message: 'Product removed from cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Remove multiple items from cart
/* exports.removeMultipleFromCartController = async (req, res) => {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'userId and a non-empty items array are required' });
    }

    try {
        const user = await users.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove each matching item
        user.cart = user.cart.filter(cartItem => {
            return !items.some(item =>
                cartItem.productId.toString() === item.productId &&
                (!item.size || cartItem.size === item.size)
            );
        });

        await user.save();

        res.status(200).json({
            message: 'Selected items removed from cart',
            cart: user.cart
        });
    } catch (error) {
        console.error('Remove multiple from cart error:', error);
        res.status(500).json({ error: 'Failed to remove items from cart' });
    }
}; */


exports.removeMultipleFromCartController = async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'userId and a non-empty items array are required' });
  }

  try {
    const user = await users.findById(userId).populate('cart.items.productId');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const originalCartLength = user.cart.items.length;

    // Remove all items that match any in the `items` array
    user.cart.items = user.cart.items.filter(cartItem =>
      !items.some(toRemove =>
        cartItem.productId._id.toString() === toRemove.productId &&
        (!toRemove.size || cartItem.size === toRemove.size)
      )
    );

    if (user.cart.items.length === originalCartLength) {
      return res.status(404).json({ message: 'No matching items found in cart' });
    }

    // Recalculate totals
    let subtotal = 0;
    user.cart.items.forEach(item => {
      subtotal += item.productId.price * item.quantity;
    });

    const discount = user.cart.discount || 0;
    const cartTotal = subtotal - discount;

    user.cart.subtotal = subtotal;
    user.cart.cartTotal = cartTotal;

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
        const user = await users.findById(userId)
            .populate('cart.productId') // Populate product details
            .select('cart'); // Return only the cart field

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            cart: user.cart
        });

    } catch (error) {
        console.error('Get cart items error:', error);
        res.status(500).json({ error: 'Failed to retrieve cart items' });
    }
}; */

/* exports.getCartItemsController = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await users.findById(userId)
      .populate('cart.productId') // Optional: select fields
      .select('cart');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      cart: user.cart
    });

  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart items' });
  }
};

 */
exports.getCartItemsController = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await users.findById(userId)
      .populate('cart.items.productId') 
      .select('cart');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { items, subtotal, discount, cartTotal } = user.cart;

    res.status(200).json({
      items,
      subtotal,
      discount,
      cartTotal
    });

  } catch (error) {
    console.error('Get cart items error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart items' });
  }
};
