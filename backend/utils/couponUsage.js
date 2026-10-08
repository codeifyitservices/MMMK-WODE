const Coupon = require("../Models/coupon");

/**
 * Asserts that a coupon is usable by a specific user.
 * Throws an error if the coupon is not usable.
 * @param {Object} coupon - The coupon document
 * @param {String} userId - The ID of the user trying to use the coupon
 */
const assertCouponUsableByUser = async (coupon, userId) => {
  if (!coupon) {
    const error = new Error("Coupon not found or expired");
    error.statusCode = 404;
    throw error;
  }

  // 1. Check assigned user restriction
  if (coupon.assignedUser) {
    if (!userId || String(coupon.assignedUser) !== String(userId)) {
      const error = new Error("This exclusive recovery coupon is not valid for your account.");
      error.statusCode = 403;
      throw error;
    }
  }

  // 2. Check total usage limit
  if (coupon.maxUsage !== null && coupon.currentUsage >= coupon.maxUsage) {
    const error = new Error("This coupon has reached its maximum usage limit.");
    error.statusCode = 400;
    throw error;
  }

  // 3. Check per user usage limit
  if (userId) {
    const Order = require("../Models/Order");
    const usageCount = await Order.countDocuments({
      userId,
      couponCode: coupon.couponCode,
      paymentStatus: "Paid",
    });

    const limit = coupon.perUserLimit || 1;
    if (usageCount >= limit) {
      const error = new Error(
        limit === 1 
          ? "You have already used this coupon code." 
          : `You have reached the usage limit for this coupon (${limit} times).`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return true;
};

const recordCouponUsageForOrder = async (order) => {
  if (!order?.couponCode || !order?._id) {
    return null;
  }

  const savedAmount = Number(order?.price?.couponDiscount || 0);

  return Coupon.findOneAndUpdate(
    {
      couponCode: order.couponCode,
      "usageHistory.orderId": { $ne: order._id },
    },
    {
      $inc: { currentUsage: 1 },
      $push: {
        usageHistory: {
          orderId: order._id,
          saved: savedAmount,
          dateTime: new Date(),
        },
      },
    },
    { new: true }
  );
};

module.exports = {
  assertCouponUsableByUser,
  recordCouponUsageForOrder,
};
