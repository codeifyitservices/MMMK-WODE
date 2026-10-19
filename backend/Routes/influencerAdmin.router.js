const express = require("express");
const router = express.Router();
const {
  getApplications,
  approveApplication,
  rejectApplication,
  getAllInfluencers,
  getInfluencerDetail,
  updateInfluencer,
  getPayoutRequests,
  updatePayoutStatus,
  getAggregatedAffiliateStats,
  getAttributedOrdersAdmin,
} = require("../Controller/admin-controllers/influencerAdmin.controller");

// ==========================================
// Admin Influencer Management Endpoints
// ==========================================
router.get("/applications", getApplications);
router.post("/applications/:id/approve", approveApplication);
router.post("/applications/:id/reject", rejectApplication);

router.get("/list", getAllInfluencers);
router.get("/orders", getAttributedOrdersAdmin);
router.get("/analytics", getAggregatedAffiliateStats);
router.get("/payouts", getPayoutRequests);
router.put("/payouts/:id/status", updatePayoutStatus);

router.get("/:id", getInfluencerDetail);
router.put("/:id", updateInfluencer);

module.exports = router;
