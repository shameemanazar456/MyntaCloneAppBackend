//import jsonwebtoken
const jwt=require('jsonwebtoken')
const User = require('../model/userModel'); // ✅ Make sure this path is correct
//middleware is used to create to varify jsonwebtoken
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 'supersecretKey');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Authorization failed. Please login again.' });
  }
};
module.exports = authMiddleware