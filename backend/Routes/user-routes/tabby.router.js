const express = require("express");
const router = express.Router();

const {
  createTabbySession,
  refreshTabbyStatus,
} = require("../../Controller/user-controllers/tabby.controller");

router.post("/create-session", createTabbySession);
router.post("/refresh-status/:orderId", refreshTabbyStatus);

module.exports = router;
