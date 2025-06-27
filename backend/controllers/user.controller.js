const User = require('../models/User');
const Ride = require('../models/Ride');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    // User is already available in req.user from the auth middleware
    // We just need to remove sensitive info
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phoneNumber, profilePicture } = req.body;
    
    // eslint-disable-next-line no-console
    console.log('Profile update request:', req.body); // Debug log
    
    // Build update object
    const updateFields = {};
    if (name !== undefined && name.trim() !== '') updateFields.name = name.trim();
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber.trim();
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture.trim();
    
    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Get user's rides
// @route   GET /api/users/me/rides
// @access  Private
exports.getUserRides = async (req, res) => {
  try {
    // Find rides where the user is the driver
    const driverRides = await Ride.find({ driver: req.user._id })
      .populate('driver', 'name email profilePicture')
      .populate('passengers.user', 'name email profilePicture')
      .sort({ departureTime: -1 });
    
    // Find rides where the user is a passenger
    const passengerRides = await Ride.find({ 
      'passengers.user': req.user._id 
    })
      .populate('driver', 'name email profilePicture')
      .populate('passengers.user', 'name email profilePicture')
      .sort({ departureTime: -1 });
    
    // Process rides to add a flag indicating user's role
    const processedDriverRides = driverRides.map(ride => {
      const rideObj = ride.toObject();
      rideObj.isDriver = true;
      return rideObj;
    });
    
    const processedPassengerRides = passengerRides.map(ride => {
      const rideObj = ride.toObject();
      rideObj.isDriver = false;
      // Find user as passenger to check if they've rated
      const userAsPassenger = rideObj.passengers.find(
        p => p.user._id.toString() === req.user._id.toString()
      );
      rideObj.hasRated = userAsPassenger ? userAsPassenger.hasRated : false;
      return rideObj;
    });
    
    // Combine and sort all rides by departure time
    const allRides = [...processedDriverRides, ...processedPassengerRides]
      .sort((a, b) => new Date(b.departureTime) - new Date(a.departureTime));
    
    res.json({
      success: true,
      rides: allRides
    });
  } catch (error) {
    console.error('Error in getUserRides:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's ride statistics
// @route   GET /api/users/me/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    // Count rides where the user is the driver
    const offeredRides = await Ride.countDocuments({ driver: req.user._id });
    
    // Count rides where the user is a passenger
    const joinedRides = await Ride.countDocuments({ 
      'passengers.user': req.user._id,
      'passengers.status': { $in: ['accepted', 'completed'] }
    });
    
    // Total rides
    const totalRides = offeredRides + joinedRides;
    
    res.json({
      success: true,
      stats: {
        totalRides,
        offeredRides,
        joinedRides
      }
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's notifications (pending ride requests for driver)
// @route   GET /api/users/me/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    // Find rides where the user is the driver and has pending passenger requests
    const ridesWithPendingRequests = await Ride.find({ 
      driver: req.user._id,
      status: { $ne: 'cancelled' }, // Not cancelled rides
      'passengers.status': 'pending' // Has pending passengers
    })
      .populate('passengers.user', 'name profilePicture')
      .sort({ departureTime: 1 });
    
    // Format notifications
    const notifications = [];
    
    ridesWithPendingRequests.forEach(ride => {
      const pendingPassengers = ride.passengers.filter(p => p.status === 'pending');
      
      if (pendingPassengers.length > 0) {
        notifications.push({
          id: `ride-${ride._id}-requests`,
          rideId: ride._id,
          title: `${pendingPassengers.length} Pending Request${pendingPassengers.length !== 1 ? 's' : ''}`,
          message: `You have ${pendingPassengers.length} pending request${pendingPassengers.length !== 1 ? 's' : ''} for your ride from ${ride.startLocation} to ${ride.endLocation} on ${new Date(ride.departureTime).toLocaleDateString()}`,
          read: false,
          timestamp: pendingPassengers[0].requestedAt,
          type: 'ride-request'
        });
      }
    });
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
