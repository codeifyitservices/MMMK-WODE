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

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

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
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phoneNumber: { $regex: safeSearch, $options: "i" } },
        { niche: { $regex: safeSearch, $options: "i" } },
        { referralCode: { $regex: safeSearch, $options: "i" } },
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
    let emailResult = { success: false, error: "Not dispatched" };
    try {
      emailResult = await sendInfluencerWelcomeEmail({
        email: influencer.email,
        fullName: influencer.fullName,
        username,
        rawPassword,
        referralCode,
        commissionRate: influencer.commissionRate,
        discountRate: influencer.discountRate,
        portalUrl: `${baseStoreUrl}/influencer/login`,
        referralLink: `${baseStoreUrl}?ref=${referralCode}`,
      });
    } catch (emailErr) {
      console.warn("[InfluencerAdmin] Email dispatch non-fatal failure:", emailErr?.message);
      emailResult = { success: false, error: emailErr?.message || "Email dispatch failed" };
    }

    const isEmailSent = emailResult?.success === true;

    return res.status(200).json({
      success: true,
      emailSent: isEmailSent,
      emailError: isEmailSent ? null : (emailResult?.error || "Email delivery failed"),
      message: isEmailSent
        ? `Influencer ${influencer.fullName} approved successfully! Login credentials dispatched to ${influencer.email}.`
        : `Influencer ${influencer.fullName} approved! (Email not sent: ${emailResult?.error || "Check BREVO_API_KEY in server environment"}).`,
      data: {
        id: influencer._id,
        username,
        referralCode,
        email: influencer.email,
        commissionRate: influencer.commissionRate,
        discountRate: influencer.discountRate,
        rawPassword, // returned to admin in response for immediate confirmation
        emailSent: isEmailSent,
        emailError: isEmailSent ? null : (emailResult?.error || "Email delivery failed"),
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
 * DELETE: Permanently delete an application / approval record
 */
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer record not found.",
      });
    }

    const applicantName = influencer.fullName || influencer.username || "Influencer";

    // Clean up tracking clicks if any
    await InfluencerClick.deleteMany({ influencerId: id }).catch(() => {});

    // Delete the influencer record
    await Influencer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Influencer "${applicantName}" has been successfully deleted from the dashboard.`,
      data: { id },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Delete application error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete influencer record.",
      error: error.message,
    });
  }
};

/**
 * POST: Directly create and onboard a new influencer from the Admin Panel
 */
exports.createInfluencerAdmin = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      customUsername,
      customReferralCode,
      customPassword,
      commissionRate,
      discountRate,
      socialMedia,
      niche,
      bio,
      sendEmail = true,
    } = req.body;

    // 1. Validate mandatory fields
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Check if email already in use
    const existingEmail = await Influencer.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `An influencer account with email "${normalizedEmail}" already exists.`,
      });
    }

    // 2. Resolve Username
    let username = customUsername ? String(customUsername).trim().toLowerCase() : "";
    if (username) {
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be 3-30 characters long and can contain letters, numbers, and underscores.",
        });
      }
      const existingUser = await Influencer.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `The username "${username}" is already in use. Please choose another.`,
        });
      }
    } else {
      username = await generateUniqueUsername(fullName, normalizedEmail);
    }

    // 3. Resolve Referral Code
    let referralCode = customReferralCode
      ? String(customReferralCode).trim().toUpperCase()
      : "";
    if (referralCode) {
      if (!/^[A-Z0-9_-]{3,20}$/.test(referralCode)) {
        return res.status(400).json({
          success: false,
          message: "Referral code must be 3-20 alphanumeric characters.",
        });
      }
      const existingCode = await Influencer.findOne({ referralCode });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: `The referral code "${referralCode}" is already in use.`,
        });
      }
    } else {
      referralCode = await generateUniqueReferralCode(fullName);
    }

    // 4. Resolve Password
    let rawPassword =
      customPassword && String(customPassword).trim().length >= 6
        ? String(customPassword).trim()
        : generateTemporaryPassword();

    // 5. Rates
    const finalCommission =
      commissionRate !== undefined && !isNaN(commissionRate)
        ? Math.min(100, Math.max(0, Number(commissionRate)))
        : 10;
    const finalDiscount =
      discountRate !== undefined && !isNaN(discountRate)
        ? Math.min(100, Math.max(0, Number(discountRate)))
        : 20;

    // 6. Create Influencer
    const newInfluencer = new Influencer({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : "",
      username,
      referralCode,
      password: rawPassword, // Pre-save hook hashes with bcrypt
      commissionRate: finalCommission,
      discountRate: finalDiscount,
      socialMedia: {
        instagram: socialMedia?.instagram?.trim() || "",
        tiktok: socialMedia?.tiktok?.trim() || "",
        youtube: socialMedia?.youtube?.trim() || "",
        facebook: socialMedia?.facebook?.trim() || "",
        other: socialMedia?.other?.trim() || "",
      },
      niche: niche ? String(niche).trim() : "",
      bio: bio ? String(bio).trim() : "",
      status: "Approved",
      approvedAt: new Date(),
      approvedBy: req.admin?._id,
    });

    await newInfluencer.save();

    // 7. Dispatch welcome credentials email if requested
    const baseStoreUrl = FRONTEND_URL.replace(/\/$/, "");
    let isEmailSent = false;
    let emailErrorMsg = null;

    if (sendEmail) {
      try {
        const emailResult = await sendInfluencerWelcomeEmail({
          email: newInfluencer.email,
          fullName: newInfluencer.fullName,
          username,
          rawPassword,
          referralCode,
          commissionRate: newInfluencer.commissionRate,
          discountRate: newInfluencer.discountRate,
          portalUrl: `${baseStoreUrl}/influencer/login`,
          referralLink: `${baseStoreUrl}?ref=${referralCode}`,
        });
        isEmailSent = emailResult?.success === true;
        if (!isEmailSent) {
          emailErrorMsg = emailResult?.error || "Brevo email dispatch failed";
        }
      } catch (emailErr) {
        console.warn(
          "[InfluencerAdmin] Email dispatch non-fatal error:",
          emailErr?.message
        );
        emailErrorMsg = emailErr?.message || "Email dispatch failed";
      }
    }

    return res.status(201).json({
      success: true,
      emailSent: isEmailSent,
      emailError: emailErrorMsg,
      message: isEmailSent
        ? `Influencer ${newInfluencer.fullName} created successfully! Welcome credentials dispatched to ${newInfluencer.email}.`
        : `Influencer ${newInfluencer.fullName} created successfully.`,
      data: {
        id: newInfluencer._id,
        fullName: newInfluencer.fullName,
        email: newInfluencer.email,
        username,
        referralCode,
        commissionRate: newInfluencer.commissionRate,
        discountRate: newInfluencer.discountRate,
        rawPassword, // returned to the admin on screen so they can copy/paste it immediately
        referralLink: `${baseStoreUrl}?ref=${referralCode}`,
        status: newInfluencer.status,
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Create influencer error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create influencer.",
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
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { username: { $regex: safeSearch, $options: "i" } },
        { referralCode: { $regex: safeSearch, $options: "i" } },
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

    if (["Paid", "Rejected"].includes(payoutRequest.status)) {
      return res.status(400).json({
        success: false,
        message: `This payout request is already finalized as "${payoutRequest.status}" and cannot be modified again.`,
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

/**
 * GET: Retrieve all customer orders attributed to influencers
 */
exports.getAttributedOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { influencerId: { $exists: true, $ne: null } },
        { influencerCode: { $exists: true, $ne: "" } },
      ],
    };

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { orderId: { $regex: search, $options: "i" } },
            { influencerCode: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("influencerId", "fullName username email referralCode")
      .populate("userId", "fullName email")
      .populate("products.id", "title image images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("[InfluencerAdmin] Get attributed orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load attributed orders.",
      error: error.message,
    });
  }
};

