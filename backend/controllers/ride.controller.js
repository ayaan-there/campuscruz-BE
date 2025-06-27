const Ride = require('../models/Ride');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private
exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { startLocation, endLocation, route, departureTime, totalSeats, price, additionalNotes } = req.body;

    const newRide = new Ride({
      driver: req.user._id,
      startLocation,
      endLocation,
      route,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      price,
      additionalNotes
    });

    const savedRide = await newRide.save();
    
    // Add ride to user's ride history
    await User.findByIdAndUpdate(
      req.user._id, 
      { $push: { rideHistory: savedRide._id } }
    );

    res.status(201).json({
      success: true,
      ride: savedRide
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all available rides
// @route   GET /api/rides
// @access  Private
exports.getAllRides = async (req, res) => {
  try {
    let query = { status: 'scheduled', availableSeats: { $gt: 0 } };
    
    // Filter rides by location if provided
    if (req.query.startLocation) {
      query.startLocation = { $regex: req.query.startLocation, $options: 'i' };
    }
    if (req.query.endLocation) {
      query.endLocation = { $regex: req.query.endLocation, $options: 'i' };
    }
    
    // Filter by date if provided
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      query.departureTime = {
        $gte: date,
        $lt: nextDay
      };
    }

    const rides = await Ride.find(query)
      .populate('driver', 'name email profilePicture averageRating')
      .sort({ departureTime: 1 });

    res.json({
      success: true,
      count: rides.length,
      rides
    });
  } catch (error) {
    console.error('Error getting rides:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single ride by ID
// @route   GET /api/rides/:id
// @access  Private
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email profilePicture averageRating')
      .populate('passengers.user', 'name email profilePicture');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      ride
    });
  } catch (error) {
    console.error('Error getting ride by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Request to join a ride
// @route   POST /api/rides/:id/join
// @access  Private
exports.requestToJoinRide = async (req, res) => {
  try {
    const { pickupLocation } = req.body;
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email'); // Make sure we populate driver info
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if ride is available
    if (ride.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'This ride is no longer available'
      });
    }
    
    // Check if seats are available
    if (ride.availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No seats available for this ride'
      });
    }
    
    // Check if user is the driver
    if (ride.driver._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot join your own ride'
      });
    }
    
    // Check if user has already requested to join
    const alreadyRequested = ride.passengers.some(
      passenger => passenger.user.toString() === req.user._id.toString()
    );
    
    if (alreadyRequested) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join this ride'
      });
    }
    
    // Get current user information for the notification
    const requestingUser = await User.findById(req.user._id)
      .select('name profilePicture');
    
    // Add user to passengers with current timestamp
    ride.passengers.push({
      user: req.user._id,
      pickupLocation,
      requestedAt: new Date(),
      status: 'pending'
    });
    
    // Save the updated ride
    await ride.save();
    
    // Create a notification for the driver
    // In a production app, you might want to use a notification service or WebSockets
    // eslint-disable-next-line no-console
    console.log(`New ride request notification for driver ${ride.driver.name} from ${requestingUser.name}`);
    
    // Return the updated ride with populated fields
    const updatedRide = await Ride.findById(req.params.id)
      .populate('driver', 'name email profilePicture')
      .populate('passengers.user', 'name email profilePicture');
    
    res.json({
      success: true,
      message: 'Request to join ride sent successfully',
      ride: updatedRide
    });
  } catch (error) {
    console.error('Error requesting to join ride:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept or reject passenger request
// @route   PUT /api/rides/:id/passengers/:passengerId
// @access  Private
exports.updatePassengerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id, passengerId } = req.params;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "accepted" or "rejected"'
      });
    }
    
    const ride = await Ride.findById(id);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if user is the driver
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update passenger status'
      });
    }
    
    // Find passenger in the ride
    const passengerIndex = ride.passengers.findIndex(
      p => p.user.toString() === passengerId
    );
    
    if (passengerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Passenger not found in this ride'
      });
    }
    
    // Update passenger status
    ride.passengers[passengerIndex].status = status;
    
    // Update available seats if passenger is accepted
    if (status === 'accepted' && ride.availableSeats > 0) {
      ride.availableSeats -= 1;
    }
    
    await ride.save();
    
    res.json({
      success: true,
      message: `Passenger request ${status}`,
      ride
    });
  } catch (error) {
    console.error('Error updating passenger status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete a ride
// @route   PUT /api/rides/:id/complete
// @access  Private
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if user is the driver
    if (ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this ride'
      });
    }
    
    // Mark ride as completed
    ride.status = 'completed';
    
    // Update all accepted passengers to completed
    ride.passengers.forEach(passenger => {
      if (passenger.status === 'accepted') {
        passenger.status = 'completed';
      }
    });
    
    // Calculate points for driver (1 point per passenger)
    const completedPassengers = ride.passengers.filter(p => p.status === 'completed').length;
    
    // Award points to driver
    await User.findByIdAndUpdate(
      ride.driver,
      { $inc: { points: completedPassengers * 5 } }
    );
    
    await ride.save();
    
    res.json({
      success: true,
      message: 'Ride completed successfully',
      pointsEarned: completedPassengers * 5,
      ride
    });
  } catch (error) {
    console.error('Error completing ride:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Rate a ride
// @route   POST /api/rides/:id/rate
// @access  Private
exports.rateRide = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    // Check if ride is completed
    if (ride.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate a ride that is not completed'
      });
    }
    
    // Check if user is a passenger in this ride
    const passengerIndex = ride.passengers.findIndex(
      p => p.user.toString() === req.user._id.toString() && p.status === 'completed'
    );
    
    if (passengerIndex === -1 && ride.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You were not part of this ride'
      });
    }
    
    // If passenger rating driver
    if (ride.driver.toString() !== req.user._id.toString()) {
      // Check if passenger has already rated
      if (ride.passengers[passengerIndex].hasRated) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this ride'
        });
      }
      
      // Add rating to driver
      const driver = await User.findById(ride.driver);
      
      driver.ratings.push({
        rating,
        comment,
        from: req.user._id
      });
      
      // Calculate average rating
      const totalRatings = driver.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      driver.averageRating = totalRatings / driver.ratings.length;
      
      // Mark passenger as having rated
      ride.passengers[passengerIndex].hasRated = true;
      
      await Promise.all([driver.save(), ride.save()]);
      
      res.json({
        success: true,
        message: 'Rating submitted successfully'
      });
    } else {
      // Driver rating passengers (not implemented in this example)
      res.status(400).json({
        success: false,
        message: 'Driver rating passengers feature not implemented'
      });
    }
  } catch (error) {
    console.error('Error rating ride:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
