const express = require("express");
const router = express.Router();

// controller
const {
  getValidToken,
  applyCoupon,
} = require("../../Controller/admin-controllers/coupon/coupon.controller");

// routes
router.get("/get-valid-token", getValidToken);

router.post("/apply-coupon", applyCoupon);

module.exports = router;
