const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@(geu\.ac\.in|gehu\.ac\.in)$/  // Only allow geu.ac.in or gehu.ac.in domains
  },
  password: {
    type: String,
    required: true
  },
  collegeID: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  points: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  rideHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  }],
  ratings: [{
    rating: Number,
    comment: String,
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],  averageRating: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
