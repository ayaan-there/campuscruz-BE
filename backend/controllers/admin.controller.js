const User = require('../models/User');
const Ride = require('../models/Ride');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const scheduledRides = await Ride.countDocuments({ status: 'scheduled' });
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email profilePicture joinedDate');
    
    // Get recent rides
    const recentRides = await Ride.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('driver', 'name email')
      .select('startLocation endLocation departureTime status');
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalRides,
        completedRides,
        scheduledRides,
        recentUsers,
        recentRides
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search and filter
    const searchQuery = {};
    if (req.query.search) {
      searchQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { collegeID: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Count total users for pagination info
    const total = await User.countDocuments(searchQuery);
    
    // Get users
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's rides
    const userRides = await Ride.find({
      $or: [
        { driver: req.params.id },
        { 'passengers.user': req.params.id }
      ]
    })
      .populate('driver', 'name email')
      .sort({ departureTime: -1 });
    
    res.json({
      success: true,
      user,
      rides: userRides
    });
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all rides
// @route   GET /api/admin/rides
// @access  Private/Admin
exports.getAllRides = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.departureTime = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Count total rides for pagination info
    const total = await Ride.countDocuments(filter);
    
    // Get rides
    const rides = await Ride.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('driver', 'name email profilePicture')
      .sort({ departureTime: -1 });
    
    res.json({
      success: true,
      rides,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllRides:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get ride details
// @route   GET /api/admin/rides/:id
// @access  Private/Admin
exports.getRideDetails = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email profilePicture')
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
    console.error('Error in getRideDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a ride
// @route   DELETE /api/admin/rides/:id
// @access  Private/Admin
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }
    
    await ride.deleteOne();
    
    res.json({
      success: true,
      message: 'Ride deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteRide:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
