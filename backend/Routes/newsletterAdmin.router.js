const express = require("express");
const router = express.Router();
const {
  getSubscribers,
  exportSubscribersCsv,
  deleteSubscriber,
  updateSubscriberStatus,
  getPopupSettings,
  updatePopupSettings,
} = require("../Controller/admin-controllers/newsletterAdmin.controller");

// Subscribers endpoints
router.get("/subscribers", getSubscribers);
router.get("/subscribers/export", exportSubscribersCsv);
router.delete("/subscribers/:id", deleteSubscriber);
router.patch("/subscribers/:id/status", updateSubscriberStatus);

// Popup settings endpoints
router.get("/popup-settings", getPopupSettings);
router.put("/popup-settings", updatePopupSettings);

module.exports = router;
