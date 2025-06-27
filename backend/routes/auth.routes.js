const express = require('express');
const { register, login, getMe, logout, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Apply rate limiting to auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// Register route with validation
router.post('/register', validateRegistration, register);

// Login route with validation and rate limiting
router.post('/login', authLimiter, validateLogin, login);

// Get current user route (protected)
router.get('/me', protect, getMe);

// Logout route
router.get('/logout', logout);

// Forgot password route
router.post('/forgot-password', forgotPassword);

// Reset password route  
router.put('/reset-password/:resettoken', resetPassword);

module.exports = router;
