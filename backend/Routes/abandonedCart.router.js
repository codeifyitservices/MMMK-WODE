const express = require("express");
const router = express.Router();
const {
  getAllAbandonedCarts,
  getAbandonedCartStats,
  getAbandonedCartDetail,
} = require("../Controller/admin-controllers/abandonedCart/abandonedCart.controller");

router.get("/stats", getAbandonedCartStats);
router.get("/:id", getAbandonedCartDetail);
router.get("/", getAllAbandonedCarts);

module.exports = router;
