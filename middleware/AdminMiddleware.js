// middlewares/adminMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../model/userModel'); // adjust path

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'supersecretKey');

    const user = await User.findById(decoded.userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(401).json({ error: 'Authorization failed. Please login again.' });
  }
};


module.exports = adminMiddleware;
