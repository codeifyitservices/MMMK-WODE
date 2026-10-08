const express = require("express");
const router = express.Router();

// controller
const {
  addController,
} = require("../../Controller/non-auth-controllers/support.controller");

// routes
router.post("/create", addController);

module.exports = router;
