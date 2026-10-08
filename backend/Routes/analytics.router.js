const express = require("express");
const router = express.Router();

const {
  getSalesPerformance,
  getViewPerformance,
  getAnalyticsSummary,
} = require("../Controller/admin-controllers/analytics/productPerformance.controller");

// Admin routes for Product Performance & View Analytics
router.get("/sales-performance", getSalesPerformance);
router.get("/product-performance", getSalesPerformance); // alias for backwards compatibility
router.get("/view-performance", getViewPerformance);
router.get("/product-views", getViewPerformance); // alias
router.get("/summary", getAnalyticsSummary);

module.exports = router;
