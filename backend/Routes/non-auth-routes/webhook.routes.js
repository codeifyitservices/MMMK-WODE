const router = require("express").Router();

// controller
const {
    handleJuraWebhook,
    handleInventoryUpdate,
    handleDeliveryStatusUpdate,
} = require("../../Controller/non-auth-controllers/webhook.controller");

// Unified webhook endpoint (recommended)
router.post("/jura", handleJuraWebhook);
router.post("/juraa", handleJuraWebhook);

// Legacy endpoints (for backward compatibility)
router.post("/inventory-update", handleInventoryUpdate);

module.exports = router;
