// Create this file: c:\Users\ASUS\Desktop\ALL-PROJECTS\Campuscruz\backend\middleware\validate.js

const { validationResult, check } = require('express-validator');

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User route validations - Modified to be less strict
exports.validateProfileUpdate = [
  check('name')
    .optional()
    .notEmpty().withMessage('Name cannot be empty if provided')
    .trim(),
  check('phoneNumber')
    .optional()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Invalid phone number format')
    .trim(),
  check('profilePicture')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty value
      
      // Basic URL validation that's more permissive than isURL
      try {
        new URL(value);
        return true;
      } catch (e) {
        throw new Error('Profile picture must be a valid URL');
      }
    })
    .trim(),
  exports.handleValidationErrors
];

// Auth route validations
exports.validateRegistration = [
  check('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .escape(),
  check('email')
    .isEmail().withMessage('Please include a valid email')
    .matches(/^[a-zA-Z0-9._%+-]+@(geu\.ac\.in|gehu\.ac\.in)$/).withMessage('Email must be from geu.ac.in or gehu.ac.in domain')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  check('collegeID')
    .notEmpty().withMessage('College ID is required')
    .trim()
    .escape(),
  exports.handleValidationErrors
];

exports.validateLogin = [
  check('email')
    .isEmail().withMessage('Please include a valid email')
    .normalizeEmail(),
  check('password')
    .exists().withMessage('Password is required'),
  exports.handleValidationErrors
];

// Admin route validations
exports.validateUserStatusUpdate = [
  check('status')
    .isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
  exports.handleValidationErrors
];

// Ride route validations
exports.validateRideCreation = [
  check('startLocation', 'Start location is required').notEmpty(),
  check('endLocation', 'End location is required').notEmpty(),
  check('route', 'Route description is required').notEmpty(),
  check('departureTime', 'Valid departure time is required')
    .isISO8601()
    .custom(value => {
      const departureTime = new Date(value);
      const now = new Date();
      if (departureTime <= now) {
        throw new Error('Departure time must be in the future');
      }
      return true;
    }),
  check('totalSeats', 'Total seats must be between 1 and 10')
    .isInt({ min: 1, max: 10 }),
  exports.handleValidationErrors
];

exports.validateJoinRide = [
  check('pickupLocation', 'Pickup location is required')
    .notEmpty()
    .trim()
    .escape(),
  exports.handleValidationErrors
];

exports.validatePassengerUpdate = [
  check('status', 'Status must be either accepted or rejected')
    .isIn(['accepted', 'rejected']),
  exports.handleValidationErrors
];

exports.validateRideRating = [
  check('rating', 'Rating must be between 1 and 5')
    .isFloat({ min: 1, max: 5 }),
  check('comment')
    .optional()
    .trim()
    .escape(),
  exports.handleValidationErrors
];
