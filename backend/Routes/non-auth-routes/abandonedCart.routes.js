const express = require("express");
const router = express.Router();
const {
  verifyRecoveryToken,
  claimCoupon,
} = require("../../Controller/non-auth-controllers/abandonedCart.controller");

router.get("/verify-recovery-token", verifyRecoveryToken);
router.post("/claim-recovery-coupon", claimCoupon);

module.exports = router;
