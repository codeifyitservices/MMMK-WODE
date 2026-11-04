const express = require("express");
const router = express.Router();
const { isInfluencer } = require("../Middleware/InfluencerAuth");
const {
  applyInfluencer,
  loginInfluencer,
  trackInfluencerClick,
  validateReferralCode,
  getInfluencerProfile,
  updateInfluencerProfile,
  changeInfluencerPassword,
  getInfluencerDashboardStats,
  getInfluencerOrders,
  getInfluencerProducts,
  requestPayout,
  getPayoutHistory,
  getInfluencerPayoutSchedule,
} = require("../Controller/influencer.controller");

// ==========================================
// Public Endpoints
// ==========================================
router.post("/apply", applyInfluencer);
router.post("/login", loginInfluencer);
router.post("/track-click", trackInfluencerClick);
router.get("/validate-code/:code", validateReferralCode);

// ==========================================
// Influencer Portal Protected Endpoints
// ==========================================
router.get("/profile", isInfluencer, getInfluencerProfile);
router.put("/profile", isInfluencer, updateInfluencerProfile);
router.put("/change-password", isInfluencer, changeInfluencerPassword);
router.get("/dashboard", isInfluencer, getInfluencerDashboardStats);
router.get("/orders", isInfluencer, getInfluencerOrders);
router.get("/products", isInfluencer, getInfluencerProducts);
router.post("/payout/request", isInfluencer, requestPayout);
router.get("/payout/history", isInfluencer, getPayoutHistory);
router.get("/payout-schedule", isInfluencer, getInfluencerPayoutSchedule);

module.exports = router;
