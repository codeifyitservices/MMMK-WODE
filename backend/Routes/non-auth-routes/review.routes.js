const express = require("express");
const router = express.Router();

// controller
const {
  getByProduct,
} = require("../../Controller/user-controllers/review.controller");

// routes
router.get("/get-by-product/:id", getByProduct);

module.exports = router;
