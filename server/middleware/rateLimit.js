// server/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Capped at 5 generations per minute per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many requests. You can only generate up to 5 videos per minute. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 payment initiations per 15 minutes
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many checkout attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generationLimiter,
  paymentLimiter
};
