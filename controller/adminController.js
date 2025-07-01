
const users = require("../model/userModel");
const Order = require('../model/orderModel');
const Product = require('../model/productModel');
const Coupon = require('../model/couponModel');
const mongoose = require('mongoose');
const moment = require('moment');



exports.getAllUsersForAdminController = async (req, res) => {
    

    try {
        const user = await users.find().select('-password'); // exclude password

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
exports.getNonAdminUsersCountController = async (req, res) => {
  try {
    const nonAdminUserCount = await users.countDocuments({ isAdmin: false });

    res.status(200).json({ totalNonAdminUsers: nonAdminUserCount });
  } catch (error) {
    console.error('Fetch non-admin user count error:', error);
    res.status(500).json({ error: 'Failed to fetch non-admin user count' });
  }
};



exports.viewOrderHistoryByAdminController = async (req, res) => {
  

  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.productId',
        select: 'title brand category variants reviews'  // populate only basic info
      }).populate({
        path: 'userId',
        select: 'name email phone' // Replace or add more fields as per your user schema
      });;

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
          image: variantDetails?.images?.[0] || null,
              };
      });

      return {
        _id: order._id,
        user:order.userId,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod:order.paymentMethod,
        items: updatedItems,
        shippingAddress: order.shippingAddress,
        subtotalAmount: order.subtotalAmount,
        discountAmount: order.discountAmount,
        statusTimestamps:order.statusTimestamps,
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

//get all products
exports.getAllProductController = async (req, res) => {
  try {
    const allProducts = await Product.find();

    if (allProducts && allProducts.length > 0) {
      res.status(200).json(allProducts);
    } else {
      res.status(404).json({ message: ' No products found' });
    }

  } catch (error) {
    console.error('Get All Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getTopSellingCategories = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      {
        $project: {
          _id: 0,
          name: "$_id", // category name
          unitsSold: "$totalSold"
        }
      }
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching top selling categories:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMonthlyRevenue = async (req, res) => {
  try {
    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid" // Include only paid orders
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$orderedAt" },
            month: { $month: "$orderedAt" }
          },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              { $arrayElemAt: [
                  [ "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
                  "$_id.month"
              ]},
              " ",
              { $toString: "$_id.year" }
            ]
          },
          revenue: "$totalRevenue"
        }
      }
    ]);

    res.json(revenueData);
  } catch (err) {
    console.error("Error fetching monthly revenue:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWeeklyRevenue = async (req, res) => {
    try {
    const today = moment().endOf('day');
    const lastTuesday = moment().subtract(6, 'days').startOf('day');

    const data = await Order.aggregate([
      {
        $match: {
          paymentStatus: "Paid",
          orderedAt: {
            $gte: lastTuesday.toDate(),
            $lte: today.toDate()
          }
        }
      },
      {
        $project: {
          totalAmount: 1,
          weekday: { $isoDayOfWeek: "$orderedAt" } // 1 (Mon) to 7 (Sun)
        }
      },
      {
        $group: {
          _id: "$weekday",
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map ISO weekday (1-7) to weekday name
    const weekdayMap = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      7: "Sunday"
    };

    // Build result array for the last 7 days with missing days filled as 0
    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = moment().subtract(6 - i, 'days');
      const weekday = date.isoWeekday(); // 1 (Mon) - 7 (Sun)
      const label = date.format('dddd'); // e.g., "Tuesday"
      const match = data.find(d => d._id === weekday);
      result.push({
        name: label,
        revenue: match ? match.totalRevenue : 0
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching last 7 days revenue:", err);
    res.status(500).json({ message: "Server error" });
  }

};


