const express = require("express");
const router = express.Router();
const {
  checkoutOtpSendLimiter,
  checkoutOtpVerifyLimiter,
  sendCheckoutOtp,
  verifyCheckoutOtp,
  verifyCheckoutEmail,
  getSavedCheckoutAddresses,
  saveCheckoutAddresses,
  attachVerifiedCheckoutUser,
  createVerifiedGuestOrder,
  createVerifiedGuestPaymentIntent,
  getDeliveryFee,
  confirmApplePayPayment,
} = require("../../Controller/non-auth-controllers/checkout.controller");
const { applyCoupon } = require("../../Controller/admin-controllers/coupon/coupon.controller");
const { getOrderByIdPublic } = require("../../Controller/user-controllers/order.controller");
const { refreshPaymentStatusPublic } = require("../../Controller/user-controllers/payment.controller");
const { refreshTabbyStatusPublic } = require("../../Controller/user-controllers/tabby.controller");

router.post("/send-otp", checkoutOtpSendLimiter, sendCheckoutOtp);
router.post("/verify-otp", checkoutOtpVerifyLimiter, verifyCheckoutOtp);
router.get("/addresses", verifyCheckoutEmail, getSavedCheckoutAddresses);
router.put("/addresses", verifyCheckoutEmail, saveCheckoutAddresses);
router.post(
  "/create-guest",
  verifyCheckoutEmail,
  attachVerifiedCheckoutUser,
  createVerifiedGuestOrder
);
router.post(
  "/create-payment-intent",
  verifyCheckoutEmail,
  attachVerifiedCheckoutUser,
  createVerifiedGuestPaymentIntent
);
router.post("/delivery-fee", getDeliveryFee);
router.post("/apple-pay-checkout", confirmApplePayPayment);

// No auth required — guests can apply coupons after verifying their email.
// The applyCoupon controller already handles req.user?.id as optional.
router.post("/apply-coupon", applyCoupon);

// Public status lookups for OrderSuccess page (guests)
router.get("/order/:orderId", getOrderByIdPublic);
router.post("/refresh-payment/:orderId", refreshPaymentStatusPublic);
router.post("/refresh-tabby/:orderId", refreshTabbyStatusPublic);

// Abandoned Cart Recovery Token Verification & Claiming
const {
  verifyRecoveryToken,
  claimCoupon,
} = require("../../Controller/non-auth-controllers/abandonedCart.controller");
router.get("/verify-recovery-token", verifyRecoveryToken);
router.post("/claim-recovery-coupon", claimCoupon);

module.exports = router;
