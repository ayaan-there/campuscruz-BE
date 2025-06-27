const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Check for token in cookies first, then Authorization header
    let token = req.cookies.token;
    
    if (!token) {
      // Fallback to Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Admin middleware error:', error);
    res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }
};

module.exports = {
  protect: auth,
  adminOnly
};
