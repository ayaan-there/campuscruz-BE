# CampusCruz Backend 🚗

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18.2-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-orange?style=flat-square&logo=jsonwebtokens)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Deployment](https://img.shields.io/badge/Deployed-Render-purple?style=flat-square&logo=render)](https://render.com/)

[![Security](https://img.shields.io/badge/Security-Helmet%20%7C%20CORS%20%7C%20XSS-red?style=flat-square&logo=security)](https://github.com/)
[![API](https://img.shields.io/badge/API-REST-blue?style=flat-square&logo=api)](https://restfulapi.net/)
[![Code Style](https://img.shields.io/badge/Code%20Style-ESLint-brightgreen?style=flat-square&logo=eslint)](https://eslint.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square)](https://github.com/)

A sophisticated backend API for CampusCruz, a college ride-sharing platform designed specifically for GEU/GEHU students. Built with Node.js, Express, and MongoDB, featuring JWT authentication, comprehensive ride management, and notification systems.

## 🌟 Overview

CampusCruz enables college students to share rides efficiently within their campus community. The platform provides a secure, scalable backend solution with features like user authentication, ride creation and management, passenger requests, rating systems, and administrative controls.

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT-based Authentication** with HTTP-only cookies
- **Email Domain Validation** (geu.ac.in, gehu.ac.in only)
- **Password Reset** via email with secure token generation
- **Rate Limiting** on authentication endpoints
- **Production Security** with Helmet, XSS protection, and CORS
- **Data Sanitization** against NoSQL injection attacks

### 🚙 Ride Management
- **Create Rides** with detailed route information
- **Join Ride Requests** with pickup location specification
- **Real-time Passenger Management** (accept/reject requests)
- **Ride Status Tracking** (scheduled, in-progress, completed, cancelled)
- **Seat Availability Management** with automatic updates
- **Ride Completion** with points reward system

### ⭐ Rating & Feedback System
- **5-Star Rating System** for drivers
- **Comment-based Feedback** on completed rides
- **Average Rating Calculation** with real-time updates
- **Rating Validation** (completed rides only)

### 👤 User Management
- **Profile Management** with photo uploads
- **Ride History** tracking for drivers and passengers
- **Points System** with automatic calculations
- **User Statistics** and activity tracking
- **Notification System** for pending requests (basic implementation)

### 🛡️ Admin Dashboard
- **Comprehensive Statistics** and analytics
- **User Management** with basic controls
- **Ride Oversight** and management tools
- **Content Moderation** capabilities
- **System Health Monitoring**

## 🏗️ Architecture

### Project Structure
```
backend/
├── 📂controllers/          # Business logic layer
│   ├──📄 auth.controller.js    # Authentication operations
│   ├──📄 ride.controller.js    # Ride management
│   ├──📄 user.controller.js    # User operations
│   └──📄 admin.controller.js   # Admin functions
├── 📂middleware/           # Custom middleware
│   ├──📄 auth.middleware.js    # JWT verification
│   ├──📄 security.js          # Security headers
│   └──📄 validate.js          # Input validation
├── 📂models/              # Database schemas
│   ├──📄 User.js              # User model
│   └──📄 Ride.js              # Ride model
├── 📂routes/              # API endpoints
│   ├──📄 auth.routes.js       # Authentication routes
│   ├──📄 ride.routes.js       # Ride routes
│   ├──📄 user.routes.js       # User routes
│   └──📄 admin.routes.js      # Admin routes
├──📄 server.js            # Application entry point
├──📄 package.json         # Dependencies and scripts
└──📄 render.yaml          # Deployment configuration
```

### Data Models

#### User Schema
```javascript
{
  name: String,
  email: String (validated domain),
  password: String (bcrypt hashed),
  collegeID: String,
  role: ['admin', 'student'],
  points: Number,
  profilePicture: String,
  phoneNumber: String,
  joinedDate: Date,
  ratings: [{ rating, comment, from, date }],
  averageRating: Number,
  rideHistory: [ObjectId],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

#### Ride Schema
```javascript
{
  driver: ObjectId,
  startLocation: String,
  endLocation: String,
  route: String,
  departureTime: Date,
  totalSeats: Number,
  availableSeats: Number,
  passengers: [{
    user: ObjectId,
    status: ['pending', 'accepted', 'rejected', 'completed'],
    pickupLocation: String,
    requestedAt: Date,
    hasRated: Boolean
  }],
  status: ['scheduled', 'in-progress', 'completed', 'cancelled'],
  price: Number,
  additionalNotes: String
}
```

## 🚀 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | User registration | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Private |
| GET | `/logout` | User logout | Private |
| POST | `/forgot-password` | Password reset request | Public |
| PUT | `/reset-password/:token` | Reset password | Public |

### Rides (`/api/rides`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Create new ride | Private |
| GET | `/` | Get available rides | Private |
| GET | `/:id` | Get ride details | Private |
| POST | `/:id/join` | Request to join ride | Private |
| PUT | `/:id/passengers/:passengerId` | Accept/reject passenger | Private |
| PUT | `/:id/complete` | Mark ride as completed | Private |
| POST | `/:id/rate` | Rate completed ride | Private |

### Users (`/api/users`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/me` | Get user profile | Private |
| PUT | `/me` | Update user profile | Private |
| GET | `/me/rides` | Get user's rides | Private |
| GET | `/me/stats` | Get user statistics | Private |
| GET | `/me/notifications` | Get notifications | Private |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/stats` | Dashboard statistics | Admin |
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get user details | Admin |
| PATCH | `/users/:id/status` | Update user status | Admin |
| GET | `/rides` | Get all rides | Admin |
| GET | `/rides/:id` | Get ride details | Admin |
| DELETE | `/rides/:id` | Delete ride | Admin |

## 🛠️ Technology Stack

### Core Technologies
- **Node.js** (≥16.0.0) - Runtime environment
- **Express.js** (4.18.2) - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens

### Security & Middleware
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - API rate limiting
- **express-validator** - Input validation
- **express-mongo-sanitize** - NoSQL injection prevention
- **xss-clean** - XSS attack prevention
- **hpp** - HTTP parameter pollution prevention

### Development Tools
- **nodemon** - Development server
- **eslint** - Code linting
- **dotenv** - Environment variables

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (≥16.0.0)
- npm (≥8.0.0)
- MongoDB instance
- SMTP email service (for password reset)

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd campuscruz-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database
MONGO_URI=mongodb://localhost:27017/campuscruz

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret

# Environment
NODE_ENV=development

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

4. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Deployment

The application is configured for deployment on Render.com with the following setup:

#### Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: campuscruz-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        fromDatabase: campuscruz-db
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://campus-cruz.vercel.app
      - key: RATE_LIMIT_WINDOW_MS
        value: 900000
      - key: RATE_LIMIT_MAX_REQUESTS
        value: 100
    healthCheckPath: /health

databases:
  - name: campuscruz-db
    databaseName: campuscruz
    user: campuscruz
    plan: free
```

## 📊 Health Monitoring

### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Debug Endpoints
- `GET /api/test` - CORS and connectivity test
- `GET /api/debug/auth` - Authentication debug info (development only)

## 🔒 Security Features

### Authentication Security
- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (salt rounds: 10)
- Email domain validation for college authentication
- Secure password reset with time-limited tokens

### API Security
- Rate limiting on authentication endpoints (5 requests per 15 minutes)
- CORS configuration with whitelisted origins
- Request sanitization against NoSQL injection
- XSS protection middleware
- HTTP parameter pollution prevention
- Security headers with Helmet.js

### Data Validation
- Comprehensive input validation using express-validator
- Email format and domain validation
- Password strength requirements
- Date and numeric field validation

## 📈 Performance & Scaling

### Database Optimization
- Mongoose connection pooling
- Indexed fields for faster queries
- Pagination support for large datasets
- Efficient aggregation pipelines

### Error Handling
- Centralized error handling middleware
- Graceful database connection handling
- Detailed error logging in development
- User-friendly error messages in production

### Monitoring
- Application uptime tracking
- Request logging and monitoring
- Database connection health checks
- Memory and performance metrics

## 🤝 Contributing

### Development Guidelines
1. Follow ESLint configuration for code style
2. Add comprehensive validation for new endpoints
3. Include error handling for all async operations
4. Update API documentation for new features
5. Test all endpoints before submitting PRs

### Code Style
- Use ES6+ features consistently
- Follow RESTful API conventions
- Implement proper HTTP status codes
- Add JSDoc comments for complex functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ayaan Usmani**
- GitHub: [@ayaan-there](https://github.com/ayaan-there)
- Email: [ayaanusmani2005@gmail.com](mailto:ayaanusmani2005@gmail.com)

## 🙏 Acknowledgments

- Built for the GEU/GEHU student community
- Inspired by modern ride-sharing platforms
- Uses best practices for Node.js backend development

---

## 📞 Support

create an issue in the repository.

## 🗺️ Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app API optimization
- [ ] Advanced route planning integration
- [ ] Payment gateway integration
- [ ] Machine learning for ride recommendations
- [ ] Chat system for riders
- [ ] Multi-college support
- [ ] Carbon footprint tracking

---

*Last Updated: July 8, 2025*
