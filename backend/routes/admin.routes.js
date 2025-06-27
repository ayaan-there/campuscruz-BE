const express = require('express');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { 
  getDashboardStats,
  getAllUsers,
  getAllRides,
  getUserDetails,
  getRideDetails,
  updateUserStatus,
  deleteRide
} = require('../controllers/admin.controller');
const { validateUserStatusUpdate } = require('../middleware/validate');

const router = express.Router();

// Protect all routes and ensure admin only
router.use(protect, adminOnly);

// Get admin dashboard statistics
router.get('/stats', getDashboardStats);

// Get all users
router.get('/users', getAllUsers);

// Get specific user details
router.get('/users/:id', getUserDetails);

// Update user status (active/inactive)
router.patch('/users/:id/status', validateUserStatusUpdate, updateUserStatus);

// Get all rides
router.get('/rides', getAllRides);

// Get specific ride details
router.get('/rides/:id', getRideDetails);

// Delete a ride - Add id validation to ensure it's a valid MongoDB id
router.delete('/rides/:id', (req, res, next) => {
  const id = req.params.id;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ride ID format'
    });
  }
  next();
}, deleteRide);

module.exports = router;
