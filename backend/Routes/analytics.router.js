const express = require("express");
const router = express.Router();

const {
  getSalesPerformance,
  getViewPerformance,
  getAnalyticsSummary,
  getTrafficSources,
} = require("../Controller/admin-controllers/analytics/productPerformance.controller");

// Admin routes for Product Performance & View Analytics
router.get("/sales-performance", getSalesPerformance);
router.get("/product-performance", getSalesPerformance); // alias for backwards compatibility
router.get("/view-performance", getViewPerformance);
router.get("/product-views", getViewPerformance); // alias
router.get("/summary", getAnalyticsSummary);
router.get("/traffic-sources", getTrafficSources);

module.exports = router;
