const express = require("express");
const router = express.Router();

// controller
const {
  updatePricing,
  getPricing,
} = require("../Controller/admin-controllers/pricing/pricing.controller");

// routes
router.post("/update", updatePricing);
router.get("/get", getPricing);

module.exports = router;
