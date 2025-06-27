const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Security middleware configuration for production
 * Add this to your server.js file
 */

const securityMiddleware = (app) => {
  // Set security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        scriptSrc: ['\'self\'', '\'unsafe-inline\'', 'https://maps.googleapis.com'],
        styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
        fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc: ['\'self\'', 'https://api.render.com']
      }
    }
  }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit']
  }));
};

module.exports = securityMiddleware;
