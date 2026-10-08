const express = require("express");
const router = express.Router();

// controllers
const {
  createPaymentIntent,
  refreshPaymentStatus,
} = require("../../Controller/user-controllers/payment.controller");

// routes
router.post("/create-payment-intent", createPaymentIntent);
router.post("/refresh-status/:orderId", refreshPaymentStatus);

module.exports = router;
