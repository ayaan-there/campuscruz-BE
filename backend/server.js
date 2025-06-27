const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const rideRoutes = require('./routes/ride.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const cookieParser = require('cookie-parser');
const securityMiddleware = require('./middleware/security');

// Load env variables
dotenv.config();

// Updated: 2025-06-24 - CORS fix deployed

const app = express();

// Trust proxy for deployment on Render/Heroku
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Add cookie parser

// Apply security middleware in production
if (process.env.NODE_ENV === 'production') {
  securityMiddleware(app);
}

// Rate limiting middleware
// This is a simple rate limiting middleware to prevent abuse of the API
const rateLimit = require('express-rate-limit');

// Apply rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

// Configure CORS with dynamic origin based on environment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://campus-cruz.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This must be true to allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Database connection with better error handling
// eslint-disable-next-line no-console
console.log('Environment MONGO_URI exists:', !!process.env.MONGO_URI);
// eslint-disable-next-line no-console
console.log('Attempting to connect to:', process.env.MONGO_URI ? 'MongoDB Atlas' : 'localhost (fallback)');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscruz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // eslint-disable-next-line no-console
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Apply rate limiting to specific auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route to verify CORS is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'CampusCruz API is running!',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/rides',
      '/api/users',
      '/api/admin'
    ]
  });
});
app.get('/api/debug/auth', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    // eslint-disable-next-line no-console
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
