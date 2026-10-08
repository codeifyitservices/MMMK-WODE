const express = require("express");
const router = express.Router();

// controllers
const {
  addReview,
  getEligibility,
} = require("../../Controller/user-controllers/review.controller");

// routes
router.get("/eligibility/:id", getEligibility);
router.post("/add", addReview);

module.exports = router;
