const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getPublicPopupConfig,
  checkSubscriberStatus,
  subscribeNewsletter,
} = require("../../Controller/non-auth-controllers/newsletter.controller");

// Anti-spam rate limiter for public subscriptions (relaxed for testing)
const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // allow up to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many subscription attempts. Please try again later.",
  },
});

router.get("/popup-config", getPublicPopupConfig);
router.get("/check-status", checkSubscriberStatus);
router.post("/subscribe", subscribeLimiter, subscribeNewsletter);

module.exports = router;
