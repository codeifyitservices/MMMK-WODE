const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  requestReturnExchange,
  cancelUserOrder,
} = require("../../Controller/user-controllers/order.controller");

router.post("/create", createOrder);
router.get("/get-user-orders", getOrders);
router.post("/request-return-exchange/:orderId", requestReturnExchange);
router.post("/cancel/:orderId", cancelUserOrder);

module.exports = router;
