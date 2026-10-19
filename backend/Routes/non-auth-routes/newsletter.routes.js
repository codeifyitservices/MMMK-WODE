const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getPublicPopupConfig,
  subscribeNewsletter,
} = require("../../Controller/non-auth-controllers/newsletter.controller");

// Anti-spam rate limiter for public subscriptions
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 subscription attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many subscription attempts. Please try again later.",
  },
});

router.get("/popup-config", getPublicPopupConfig);
router.post("/subscribe", subscribeLimiter, subscribeNewsletter);

module.exports = router;
