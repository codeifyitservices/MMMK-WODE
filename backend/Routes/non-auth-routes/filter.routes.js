const express = require("express");
const router = express.Router();

// controller
const {
  getAllFiltersForUser,
} = require("../../Controller/admin-controllers/filter/filter.controller");

// router
router.get("/get-all", getAllFiltersForUser);

module.exports = router;
