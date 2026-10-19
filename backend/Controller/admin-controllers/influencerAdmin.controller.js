const crypto = require("crypto");
const mongoose = require("mongoose");
const Influencer = require("../../Models/Influencer");
const InfluencerClick = require("../../Models/InfluencerClick");
const InfluencerPayoutRequest = require("../../Models/InfluencerPayoutRequest");
const InfluencerWalletTransaction = require("../../Models/InfluencerWalletTransaction");
const Order = require("../../Models/Order");
const {
  sendInfluencerWelcomeEmail,
  sendInfluencerPayoutStatusEmail,
} = require("../../services/mailService");

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "https://mmmk-wode.com";

/**
 * Helper to generate a unique referral code (e.g. JATIN20)
 */
async function generateUniqueReferralCode(fullName) {
  let baseCode = String(fullName || "INFLUENCER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 6);

  if (!baseCode || baseCode.length < 3) {
    baseCode = "WODE";
  }

  let codeCandidate = `${baseCode}20`;
  let exists = await Influencer.findOne({ referralCode: codeCandidate });
  let counter = 1;

  while (exists) {
    codeCandidate = `${baseCode}${20 + counter}`;
    exists = await Influencer.findOne({ referralCode: codeCandidate });
    counter++;
  }

  return codeCandidate;
}

/**
 * Helper to generate a unique username (e.g. jatin_v)
 */
async function generateUniqueUsername(fullName, email) {
  let baseUser = "";
  if (fullName) {
    baseUser = String(fullName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 12);
  } else if (email) {
    baseUser = String(email).split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  if (!baseUser || baseUser.length < 3) {
    baseUser = "partner";
  }

  let usernameCandidate = baseUser;
  let exists = await Influencer.findOne({ username: usernameCandidate });
  let counter = 1;

  while (exists) {
    usernameCandidate = `${baseUser}${counter}`;
    exists = await Influencer.findOne({ username: usernameCandidate });
    counter++;
  }

  return usernameCandidate;
}

/**
 * Helper to generate a secure random temporary password
 */
function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let randomStr = "";
  for (let i = 0; i < 8; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Wode@${randomStr}`;
}

// ==========================================
// ADMIN INFLUENCER MANAGEMENT CONTROLLER
// ==========================================

/**
 * GET: Retrieve list of pending (or all) influencer applications
 */
exports.getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status || "Pending";
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { niche: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Influencer.countDocuments(filter);
    const applications = await Influencer.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Get applications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve influencer applications.",
      error: error.message,
    });
  }
};

/**
 * POST: Approve an application, auto-generate credentials & referral code, and send welcome email
 */
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customUsername,
      customPassword,
      customReferralCode,
      commissionRate,
      discountRate,
    } = req.body;

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer record not found.",
      });
    }

    if (influencer.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "This influencer application is already approved.",
      });
    }

    // 1. Determine Username
    let username = customUsername ? String(customUsername).trim().toLowerCase() : "";
    if (username) {
      const existingUser = await Influencer.findOne({
        username,
        _id: { $ne: influencer._id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "The requested username is already taken. Please choose another.",
        });
      }
    } else {
      username = await generateUniqueUsername(influencer.fullName, influencer.email);
    }

    // 2. Determine Referral Code
    let referralCode = customReferralCode ? String(customReferralCode).trim().toUpperCase() : "";
    if (referralCode) {
      const existingCode = await Influencer.findOne({
        referralCode,
        _id: { $ne: influencer._id },
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "The requested referral code is already in use.",
        });
      }
    } else {
      referralCode = await generateUniqueReferralCode(influencer.fullName);
    }

    // 3. Generate Temporary Password
    const rawPassword = customPassword && String(customPassword).trim().length >= 6
      ? String(customPassword).trim()
      : generateTemporaryPassword();

    // 4. Update Influencer Record
    influencer.username = username;
    influencer.referralCode = referralCode;
    influencer.password = rawPassword; // pre-save will bcrypt hash it
    influencer.status = "Approved";
    influencer.approvedAt = new Date();
    influencer.approvedBy = req.admin?._id;

    if (commissionRate !== undefined && !isNaN(commissionRate)) {
      influencer.commissionRate = Number(commissionRate);
    }
    if (discountRate !== undefined && !isNaN(discountRate)) {
      influencer.discountRate = Number(discountRate);
    }

    await influencer.save();

    // 5. Send Credentials Email via Brevo
    const baseStoreUrl = FRONTEND_URL.replace(/\/$/, "");
    await sendInfluencerWelcomeEmail({
      email: influencer.email,
      fullName: influencer.fullName,
      username,
      rawPassword,
      referralCode,
      commissionRate: influencer.commissionRate,
      discountRate: influencer.discountRate,
      portalUrl: `${baseStoreUrl}/influencer/login`,
      referralLink: `${baseStoreUrl}?ref=${referralCode}`,
    }).catch((emailErr) => {
      console.warn("[InfluencerAdmin] Email dispatch non-fatal failure:", emailErr?.message);
    });

    return res.status(200).json({
      success: true,
      message: `Influencer ${influencer.fullName} approved successfully! Login credentials and referral code dispatched to ${influencer.email}.`,
      data: {
        id: influencer._id,
        username,
        referralCode,
        email: influencer.email,
        commissionRate: influencer.commissionRate,
        discountRate: influencer.discountRate,
        rawPassword, // returned to admin in response for immediate confirmation
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Approve application error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve influencer application.",
      error: error.message,
    });
  }
};

/**
 * POST: Reject an application
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer record not found.",
      });
    }

    influencer.status = "Rejected";
    influencer.rejectionReason = reason ? String(reason).trim() : "Application did not meet current partnership criteria.";
    await influencer.save();

    return res.status(200).json({
      success: true,
      message: "Application rejected.",
      data: {
        id: influencer._id,
        status: influencer.status,
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Reject application error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject application.",
      error: error.message,
    });
  }
};

/**
 * GET: Retrieve list of all approved / active influencers with lifetime stats
 */
exports.getAllInfluencers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    } else if (!status) {
      filter.status = { $in: ["Approved", "Suspended"] };
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Influencer.countDocuments(filter);
    const influencers = await Influencer.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enrich with click and order counts
    const enriched = await Promise.all(
      influencers.map(async (inf) => {
        const infObj = inf.toObject ? inf.toObject() : inf;
        const clicks = await InfluencerClick.countDocuments({ influencerId: inf._id });
        const ordersCount = await Order.countDocuments({ influencerId: inf._id });
        return {
          ...infObj,
          totalClicks: clicks,
          totalOrders: ordersCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        influencers: enriched,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Get all influencers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load influencers list.",
      error: error.message,
    });
  }
};

/**
 * GET: Detailed influencer profile, order ledger & click metrics
 */
exports.getInfluencerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const influencer = await Influencer.findById(id).select("-password");
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    const totalClicks = await InfluencerClick.countDocuments({ influencerId: id });
    const attributedOrders = await Order.find({ influencerId: id })
      .select("orderId totalAmount amount price status createdAt influencerCommissionAmount influencerDiscountAmount")
      .sort({ createdAt: -1 });

    const totalSalesVolume = attributedOrders
      .filter((o) => o.status === "Complete" || o.status === "Processing")
      .reduce((sum, o) => sum + (o.price?.total || o.amount || o.totalAmount || 0), 0);

    const payoutRequests = await InfluencerPayoutRequest.find({ influencerId: id }).sort({
      createdAt: -1,
    });

    const walletTransactions = await InfluencerWalletTransaction.find({ influencerId: id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: {
        influencer,
        metrics: {
          totalClicks,
          totalOrders: attributedOrders.length,
          totalSalesVolume: Number(totalSalesVolume.toFixed(2)),
          totalCommissionEarned: influencer.totalCommissionEarned,
          walletBalance: influencer.walletBalance,
          pendingPayoutAmount: influencer.pendingPayoutAmount,
          totalPaidOut: influencer.totalPaidOut,
        },
        attributedOrders,
        payoutRequests,
        walletTransactions,
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Get detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load influencer details.",
      error: error.message,
    });
  }
};

/**
 * PUT: Update influencer configuration (status, commission %, discount %, or reset password)
 */
exports.updateInfluencer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      commissionRate,
      discountRate,
      fullName,
      phoneNumber,
      newPassword,
      payoutDetails,
    } = req.body;

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    if (status && ["Approved", "Suspended", "Rejected"].includes(status)) {
      influencer.status = status;
    }

    if (commissionRate !== undefined && !isNaN(commissionRate)) {
      influencer.commissionRate = Number(commissionRate);
    }

    if (discountRate !== undefined && !isNaN(discountRate)) {
      influencer.discountRate = Number(discountRate);
    }

    if (fullName) influencer.fullName = String(fullName).trim();
    if (phoneNumber !== undefined) influencer.phoneNumber = String(phoneNumber).trim();

    if (payoutDetails) {
      influencer.payoutDetails = {
        ...influencer.payoutDetails,
        ...payoutDetails,
      };
    }

    if (newPassword && String(newPassword).trim().length >= 6) {
      influencer.password = String(newPassword).trim();
    }

    await influencer.save();

    return res.status(200).json({
      success: true,
      message: "Influencer configuration updated successfully.",
      data: influencer.toSafeObject(),
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Update influencer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update influencer.",
      error: error.message,
    });
  }
};

/**
 * GET: Retrieve all withdrawal / payout requests across all influencers
 */
exports.getPayoutRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "All") {
      filter.status = status;
    }

    const total = await InfluencerPayoutRequest.countDocuments(filter);
    const requests = await InfluencerPayoutRequest.find(filter)
      .populate("influencerId", "fullName email username referralCode payoutDetails walletBalance")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        payoutRequests: requests,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Get payouts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payout requests.",
      error: error.message,
    });
  }
};

/**
 * PUT: Update payout status (Approve, Mark as Paid with UTR/reference, or Reject)
 */
exports.updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionReference, adminNote } = req.body;

    if (!["Approved", "Paid", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved', 'Paid', or 'Rejected'.",
      });
    }

    const payoutRequest = await InfluencerPayoutRequest.findById(id);
    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        message: "Payout request not found.",
      });
    }

    if (payoutRequest.status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "This payout request is already marked as Paid and finalized.",
      });
    }

    const influencer = await Influencer.findById(payoutRequest.influencerId);
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Associated influencer not found.",
      });
    }

    payoutRequest.status = status;
    payoutRequest.adminNote = adminNote || payoutRequest.adminNote;
    payoutRequest.processedAt = new Date();
    payoutRequest.processedBy = req.admin?._id;

    if (transactionReference) {
      payoutRequest.transactionReference = String(transactionReference).trim();
    }

    if (status === "Paid") {
      // Deduct from pending payout and add to total paid out
      influencer.pendingPayoutAmount = Math.max(
        0,
        (influencer.pendingPayoutAmount || 0) - payoutRequest.requestedAmount
      );
      influencer.totalPaidOut = (influencer.totalPaidOut || 0) + payoutRequest.requestedAmount;
      await influencer.save();

      // Log transaction
      const transaction = new InfluencerWalletTransaction({
        influencerId: influencer._id,
        type: "Payout_Debit",
        amount: -payoutRequest.requestedAmount,
        balanceBefore: influencer.walletBalance,
        balanceAfter: influencer.walletBalance,
        payoutRequestId: payoutRequest._id,
        description: `Payout completed by Admin. Reference: ${payoutRequest.transactionReference || "N/A"}`,
      });
      await transaction.save();

      // Notify influencer via email
      await sendInfluencerPayoutStatusEmail(influencer, payoutRequest).catch(() => {});
    } else if (status === "Rejected") {
      // Refund the held amount back to the influencer's wallet
      const balanceBefore = influencer.walletBalance;
      const balanceAfter = balanceBefore + payoutRequest.requestedAmount;

      influencer.walletBalance = balanceAfter;
      influencer.pendingPayoutAmount = Math.max(
        0,
        (influencer.pendingPayoutAmount || 0) - payoutRequest.requestedAmount
      );
      await influencer.save();

      // Log transaction
      const transaction = new InfluencerWalletTransaction({
        influencerId: influencer._id,
        type: "Refund_Reversal",
        amount: payoutRequest.requestedAmount,
        balanceBefore,
        balanceAfter,
        payoutRequestId: payoutRequest._id,
        description: `Payout request rejected by Admin. Reason: ${adminNote || "N/A"}. Funds returned to wallet.`,
      });
      await transaction.save();

      // Notify influencer via email
      await sendInfluencerPayoutStatusEmail(influencer, payoutRequest).catch(() => {});
    }

    await payoutRequest.save();

    return res.status(200).json({
      success: true,
      message: `Payout request marked as ${status}.`,
      data: payoutRequest,
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Update payout status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payout status.",
      error: error.message,
    });
  }
};

/**
 * GET: Aggregated affiliate performance metrics
 */
exports.getAggregatedAffiliateStats = async (req, res) => {
  try {
    const totalInfluencers = await Influencer.countDocuments({ status: "Approved" });
    const pendingApplications = await Influencer.countDocuments({ status: "Pending" });
    const totalClicks = await InfluencerClick.countDocuments({});

    const attributedOrders = await Order.find({
      influencerId: { $exists: true, $ne: null },
    }).select("price amount totalAmount status influencerCommissionAmount influencerDiscountAmount");

    const totalOrdersCount = attributedOrders.length;
    const completedOrders = attributedOrders.filter(
      (o) => o.status === "Complete" || o.status === "Processing"
    );

    const totalSalesVolume = completedOrders.reduce(
      (sum, o) => sum + (o.price?.total || o.amount || o.totalAmount || 0),
      0
    );

    const totalCommissionsEarned = completedOrders.reduce(
      (sum, o) => sum + (o.influencerCommissionAmount || 0),
      0
    );

    const pendingPayoutsResult = await InfluencerPayoutRequest.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]);
    const pendingPayoutTotal = pendingPayoutsResult[0]?.total || 0;

    const completedPayoutsResult = await InfluencerPayoutRequest.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]);
    const completedPayoutTotal = completedPayoutsResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalInfluencers,
        pendingApplications,
        totalClicks,
        totalOrdersCount,
        completedOrdersCount: completedOrders.length,
        totalSalesVolume: Number(totalSalesVolume.toFixed(2)),
        totalCommissionsEarned: Number(totalCommissionsEarned.toFixed(2)),
        pendingPayoutTotal: Number(pendingPayoutTotal.toFixed(2)),
        completedPayoutTotal: Number(completedPayoutTotal.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Aggregate stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load affiliate analytics.",
      error: error.message,
    });
  }
};
