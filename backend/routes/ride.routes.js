const express = require('express');
const { 
  createRide,
  getAllRides,
  getRideById,
  requestToJoinRide,
  updatePassengerStatus,
  completeRide,
  rateRide
} = require('../controllers/ride.controller');
const { protect } = require('../middleware/auth.middleware');
const { 
  validateRideCreation, 
  validateJoinRide, 
  validatePassengerUpdate,
  validateRideRating
} = require('../middleware/validate');

const router = express.Router();

// Protect all routes
router.use(protect);

// Create a new ride
router.post('/', validateRideCreation, createRide);

// Get all rides
router.get('/', getAllRides);

// Get single ride by ID
router.get('/:id', getRideById);

// Request to join a ride
router.post('/:id/join', validateJoinRide, requestToJoinRide);

// Accept or reject passenger request
router.put('/:id/passengers/:passengerId', validatePassengerUpdate, updatePassengerStatus);

// Complete a ride
router.put('/:id/complete', completeRide);

// Rate a ride
router.post('/:id/rate', validateRideRating, rateRide);

module.exports = router;
