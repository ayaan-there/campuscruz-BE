const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { 
  getUserProfile,
  updateUserProfile,
  getUserRides,
  getUserStats,
  getUserNotifications
} = require('../controllers/user.controller');
const { validateProfileUpdate } = require('../middleware/validate');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get current user profile
router.get('/me', getUserProfile);

// Update user profile
router.put('/me', validateProfileUpdate, updateUserProfile);

// Get user's rides (both as driver and passenger)
router.get('/me/rides', getUserRides);

// Get user's ride statistics
router.get('/me/stats', getUserStats);

// Get user's notifications (pending ride requests)
router.get('/me/notifications', getUserNotifications);

module.exports = router;
// Get user's ride statistics
router.get('/me/stats', getUserStats);

// Get user's notifications (pending ride requests)
router.get('/me/notifications', getUserNotifications);

module.exports = router;
