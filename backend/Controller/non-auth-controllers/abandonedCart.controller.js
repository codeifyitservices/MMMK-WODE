const AbandonedCartRecovery = require("../../Models/AbandonedCartRecovery");
const { claimRecoveryCoupon } = require("../../services/abandonedCartService");

/**
 * Verifies recovery token for preview before claiming.
 */
const verifyRecoveryToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Recovery token is required",
      });
    }

    const recovery = await AbandonedCartRecovery.findOne({ claimToken: token })
      .populate("coupon")
      .select("isClaimed claimTokenExpiresAt coupon couponCode cartSnapshot cartValue currency");

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Invalid recovery link",
      });
    }

    if (recovery.isClaimed) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_CLAIMED",
        message: "This recovery offer has already been claimed",
      });
    }

    if (recovery.claimTokenExpiresAt && new Date() > new Date(recovery.claimTokenExpiresAt)) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "This recovery link has expired",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recovery link is valid",
      data: {
        couponCode: recovery.couponCode,
        discount: recovery.coupon?.discount || 10,
        discountType: recovery.coupon?.discountType || "percentage",
        cartSnapshot: recovery.cartSnapshot,
        cartValue: recovery.cartValue,
        currency: recovery.currency,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to verify recovery token",
      error: err.message,
    });
  }
};

/**
 * Claims the recovery coupon securely server-side.
 */
const claimCoupon = async (req, res) => {
  try {
    const { token } = req.body;
    const currentUserId = req.user?._id || req.user?.id || null;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Recovery token is required",
      });
    }

    const claimResult = await claimRecoveryCoupon(token, currentUserId);

    res.status(200).json({
      success: true,
      message: "Recovery offer claimed successfully!",
      data: claimResult,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      code: err.code || "CLAIM_FAILED",
      message: err.message || "Failed to claim recovery coupon",
    });
  }
};

module.exports = {
  verifyRecoveryToken,
  claimCoupon,
};
