const express = require("express");
const router = express.Router();

// controller
const {
  getPricing,
} = require("../../Controller/user-controllers/pricing.controller");

// routes

router.get("/get", getPricing);

module.exports = router;
