// server/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Capped at 5 generations per minute per user
  keyGenerator: (req) => {
    // Limit by authenticated user ID if available, otherwise fallback to standard IP address
    return req.user?.id || req.ip;
  },
  message: {
    error: 'Too many requests. You can only generate up to 5 videos per minute. Please try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
