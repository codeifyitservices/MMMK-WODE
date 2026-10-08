const express = require("express");
const router = express.Router();

const { getDashboardData } = require("../Controller/admin-controllers/dashboard/dashboard.controller");

// routes
router.get("/get", getDashboardData);

module.exports = router;
