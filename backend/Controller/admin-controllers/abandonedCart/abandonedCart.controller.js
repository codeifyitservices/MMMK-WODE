const AbandonedCartRecovery = require("../../../Models/AbandonedCartRecovery");
const Cart = require("../../../Models/Cart");
const User = require("../../../Models/User");

/**
 * Get paginated list of abandoned carts with filters and search
 */
const getAllAbandonedCarts = async (req, res) => {
  try {
    const {
      searchKey,
      searchValue,
      status,
      stage,
      startDate,
      endDate,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Stage filter
    if (stage && stage !== "ALL") {
      query.currentStage = stage;
    }

    // Date range filter
    if (startDate || endDate) {
      query.lastActivityAt = {};
      if (startDate) query.lastActivityAt.$gte = new Date(startDate);
      if (endDate) query.lastActivityAt.$lte = new Date(endDate);
    }

    // Search filter
    if (searchValue && typeof searchValue === "string" && searchValue.trim()) {
      const term = searchValue.trim();
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: term, $options: "i" } },
          { lastName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { email: { $regex: term, $options: "i" } },
        { couponCode: { $regex: term, $options: "i" } },
        { user: { $in: userIds } },
      ];
    }

    const page = Math.max(1, Number(currentPage) || 1);
    const limit = Math.max(1, Number(pageSize) || 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      AbandonedCartRecovery.find(query)
        .populate("user", "firstName lastName email contactNumber")
        .populate("coupon", "couponCode discount discountType expiryDate isRecoveryCoupon")
        .populate("recoveredOrderId", "orderId totalAmount price createdAt")
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AbandonedCartRecovery.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Abandoned carts fetched successfully",
      data,
      total,
      currentPage: page,
      pageSize: limit,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch abandoned carts",
      error: err.message,
    });
  }
};

/**
 * Get statistical metrics for admin dashboard
 */
const getAbandonedCartStats = async (req, res) => {
  try {
    const [
      totalCarts,
      activeCarts,
      idleCarts,
      recoveredCarts,
      cancelledCarts,
      couponsClaimed,
      revenueAggregation,
      stageCounts,
    ] = await Promise.all([
      AbandonedCartRecovery.countDocuments(),
      AbandonedCartRecovery.countDocuments({ status: "ACTIVE" }),
      AbandonedCartRecovery.countDocuments({ status: { $in: ["IDLE", "ABANDONED"] } }),
      AbandonedCartRecovery.countDocuments({ status: "RECOVERED" }),
      AbandonedCartRecovery.countDocuments({ status: "CANCELLED" }),
      AbandonedCartRecovery.countDocuments({ isClaimed: true }),
      AbandonedCartRecovery.aggregate([
        { $match: { status: "RECOVERED" } },
        { $group: { _id: null, totalRevenue: { $sum: "$cartValue" } } },
      ]),
      AbandonedCartRecovery.aggregate([
        {
          $group: {
            _id: null,
            stage6h: { $sum: { $cond: [{ $ifNull: ["$firstReminderSentAt", false] }, 1, 0] } },
            stage12h: { $sum: { $cond: [{ $ifNull: ["$secondReminderSentAt", false] }, 1, 0] } },
            stage24h: { $sum: { $cond: [{ $ifNull: ["$couponEmailSentAt", false] }, 1, 0] } },
            stage48h: { $sum: { $cond: [{ $ifNull: ["$finalReminderSentAt", false] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const recoveredRevenue = revenueAggregation[0]?.totalRevenue || 0;
    const recoveryRate = totalCarts > 0 ? Number(((recoveredCarts / totalCarts) * 100).toFixed(1)) : 0;
    const stages = stageCounts[0] || { stage6h: 0, stage12h: 0, stage24h: 0, stage48h: 0 };

    res.status(200).json({
      success: true,
      message: "Abandoned cart stats fetched successfully",
      data: {
        totalCarts,
        activeCarts,
        idleCarts,
        recoveredCarts,
        cancelledCarts,
        recoveryRate,
        recoveredRevenue: Number(recoveredRevenue.toFixed(2)),
        couponsClaimed,
        emailsSent: stages,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: err.message,
    });
  }
};

/**
 * Get detailed information for a single abandoned cart record
 */
const getAbandonedCartDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const recovery = await AbandonedCartRecovery.findById(id)
      .populate("user", "firstName lastName email contactNumber shippingAddresses billingAddresses")
      .populate("coupon")
      .populate("recoveredOrderId")
      .lean();

    if (!recovery) {
      return res.status(404).json({
        success: false,
        message: "Abandoned cart record not found",
      });
    }

    // Check live cart items
    const liveCartItems = await Cart.find({ user: recovery.user?._id || recovery.user, type: "Active" })
      .populate("product")
      .lean();

    res.status(200).json({
      success: true,
      message: "Detail fetched successfully",
      data: {
        ...recovery,
        liveCartItems,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch detail",
      error: err.message,
    });
  }
};

module.exports = {
  getAllAbandonedCarts,
  getAbandonedCartStats,
  getAbandonedCartDetail,
};
