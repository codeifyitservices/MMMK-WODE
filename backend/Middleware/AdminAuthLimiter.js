const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for admin authentication routes
 * Limits the number of attempts to prevent brute-force attacks
 */
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window (login/forgot password)
  message: {
    success: false,
    message: "Too many attempts from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { adminAuthLimiter };
