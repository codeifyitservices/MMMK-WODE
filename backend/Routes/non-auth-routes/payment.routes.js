const express = require("express");
const router = express.Router();

const {
  orderCreation,
} = require("../../Controller/user-controllers/payment.controller");
const {
  handleTabbyWebhook,
} = require("../../Controller/user-controllers/tabby.controller");

router.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  orderCreation
);

router.post("/tabby/webhook", handleTabbyWebhook);

module.exports = router;

