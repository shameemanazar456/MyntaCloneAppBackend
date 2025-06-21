//import jsonwebtoken
const jwt=require('jsonwebtoken')
//middleware is used to create to varify jsonwebtoken
const jwtMiddleware = async (req, res, next) => {
  console.log('Inside jwtMiddleware');

  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, 'supersecretKey');
    const userId = decoded.userId;

    // Fetch user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    // Check admin access
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    // Attach user info to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Error:', error);
    res.status(401).json({ error: 'Authorization failed. Please login again.' });
  }
};
module.exports = jwtMiddleware