const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Influencer = require("../Models/Influencer");
const InfluencerClick = require("../Models/InfluencerClick");
const InfluencerPayoutRequest = require("../Models/InfluencerPayoutRequest");
const InfluencerWalletTransaction = require("../Models/InfluencerWalletTransaction");
const Order = require("../Models/Order");
const Product = require("../Models/Product");
const Category = require("../Models/Category");

const JWT_SECRET = process.env.SECRET_KEY || process.env.JWT_SECRET;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  "https://mmmk-wode.com";

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// ==========================================
// PUBLIC INFLUENCER ENDPOINTS
// ==========================================

/**
 * Public endpoint: Submit application to join influencer community
 */
exports.applyInfluencer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      socialMedia,
      niche,
      followerCount,
      bio,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email address are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if an application or account with this email already exists
    const existing = await Influencer.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.status === "Pending") {
        return res.status(400).json({
          success: false,
          message:
            "An application with this email is already under review. Our team will contact you once approved.",
        });
      }
      if (existing.status === "Approved") {
        return res.status(400).json({
          success: false,
          message:
            "An approved influencer account already exists for this email. Please log in directly.",
        });
      }
      if (existing.status === "Suspended") {
        return res.status(403).json({
          success: false,
          message:
            "This account has been suspended. Please reach out to partnerships support.",
        });
      }
    }

    const application = new Influencer({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : "",
      socialMedia: {
        instagram: socialMedia?.instagram?.trim() || "",
        tiktok: socialMedia?.tiktok?.trim() || "",
        youtube: socialMedia?.youtube?.trim() || "",
        facebook: socialMedia?.facebook?.trim() || "",
        other: socialMedia?.other?.trim() || "",
      },
      niche: niche?.trim() || "",
      followerCount: followerCount?.trim() || "",
      bio: bio?.trim() || "",
      status: "Pending",
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message:
        "Thank you for applying to the MMMK WODE Influencer Community! Your application has been submitted and is under review. You will receive your login details via email upon approval.",
      data: {
        id: application._id,
        email: application.email,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Application error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit influencer application. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * Public endpoint: Influencer Portal Login
 */
exports.loginInfluencer = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required.",
      });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    // Support logging in via either email or username
    const influencer = await Influencer.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    if (!influencer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please verify your login details.",
      });
    }

    if (influencer.status === "Pending") {
      return res.status(403).json({
        success: false,
        message:
          "Your influencer application is currently under review. You will receive an email once approved.",
      });
    }

    if (influencer.status === "Rejected") {
      return res.status(403).json({
        success: false,
        message:
          influencer.rejectionReason ||
          "Your application was not approved. Please contact partnerships support.",
      });
    }

    if (influencer.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your influencer account has been suspended. Please contact support.",
      });
    }

    const isMatch = await influencer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please verify your login details.",
      });
    }

    // Generate JWT Token valid for 30 days
    const token = jwt.sign(
      {
        id: influencer._id,
        username: influencer.username,
        email: influencer.email,
        referralCode: influencer.referralCode,
        role: "influencer",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    influencer.lastLogin = new Date();
    await influencer.save();

    // Set secure cookie
    res.cookie("influencerToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful. Welcome back!",
      token,
      influencer: influencer.toSafeObject(),
    });
  } catch (error) {
    console.error("[InfluencerController] Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
      error: error.message,
    });
  }
};

/**
 * Public endpoint: Log click / visit from a referral link (?ref=CODE)
 */
exports.trackInfluencerClick = async (req, res) => {
  try {
    const { referralCode, landingUrl, productId, visitorSessionId } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required.",
      });
    }

    const code = String(referralCode).trim().toUpperCase();

    const influencer = await Influencer.findOne({
      referralCode: code,
      status: "Approved",
    });

    if (!influencer) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Referral code is not valid or active.",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers["referer"] || "";

    const clickRecord = new InfluencerClick({
      influencerId: influencer._id,
      referralCode: code,
      visitorSessionId: visitorSessionId || "",
      ipAddress,
      userAgent,
      referrer,
      landingUrl: landingUrl || "",
      productId: mongoose.isValidObjectId(productId) ? productId : undefined,
    });

    await clickRecord.save();

    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        referralCode: code,
        influencerName: influencer.fullName,
        discountRate: influencer.discountRate || 20,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Click tracking error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record referral click.",
      error: error.message,
    });
  }
};

/**
 * Public endpoint: Validate referral code for cart/checkout discount
 */
exports.validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Code parameter is required.",
      });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const influencer = await Influencer.findOne({
      referralCode: normalizedCode,
      status: "Approved",
    });

    if (!influencer) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Influencer referral code is invalid or inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      data: {
        referralCode: normalizedCode,
        influencerId: influencer._id,
        influencerName: influencer.fullName,
        discountRate: influencer.discountRate || 20,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Validate code error:", error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: "Error verifying referral code.",
      error: error.message,
    });
  }
};

// ==========================================
// INFLUENCER PORTAL PROTECTED ENDPOINTS
// ==========================================

/**
 * Protected: Retrieve logged-in influencer profile & links
 */
exports.getInfluencerProfile = async (req, res) => {
  try {
    const influencer = req.influencer;
    const baseStoreUrl = FRONTEND_URL.replace(/\/$/, "");

    return res.status(200).json({
      success: true,
      data: {
        ...influencer.toSafeObject(),
        storefrontReferralLink: `${baseStoreUrl}?ref=${influencer.referralCode}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
};

/**
 * Protected: Update profile details & banking info
 */
exports.updateInfluencerProfile = async (req, res) => {
  try {
    const influencer = req.influencer;
    const { fullName, phoneNumber, socialMedia, niche, bio, payoutDetails } =
      req.body;

    if (fullName) influencer.fullName = String(fullName).trim();
    if (phoneNumber !== undefined) influencer.phoneNumber = String(phoneNumber).trim();
    if (niche !== undefined) influencer.niche = String(niche).trim();
    if (bio !== undefined) influencer.bio = String(bio).trim();

    if (socialMedia) {
      influencer.socialMedia = {
        ...influencer.socialMedia,
        ...socialMedia,
      };
    }

    if (payoutDetails) {
      influencer.payoutDetails = {
        ...influencer.payoutDetails,
        ...payoutDetails,
      };
    }

    await influencer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: influencer.toSafeObject(),
    });
  } catch (error) {
    console.error("[InfluencerController] Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

/**
 * Protected: Change password
 */
exports.changeInfluencerPassword = async (req, res) => {
  try {
    const influencer = req.influencer;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const isMatch = await influencer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    influencer.password = newPassword;
    await influencer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("[InfluencerController] Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
      error: error.message,
    });
  }
};

/**
 * Protected: KPI Dashboard Overview
 */
exports.getInfluencerDashboardStats = async (req, res) => {
  try {
    const influencer = req.influencer;
    const influencerId = influencer._id;

    // 1. Total Clicks
    const totalClicks = await InfluencerClick.countDocuments({ influencerId });

    // 2. Unique Visitors (distinct visitorSessionId or ipAddress)
    const uniqueVisitorsResult = await InfluencerClick.distinct("visitorSessionId", {
      influencerId,
      visitorSessionId: { $ne: "" },
    });
    const uniqueVisitors = uniqueVisitorsResult.length || totalClicks;

    // 3. Attributed Orders & Sales
    const attributedOrders = await Order.find({
      influencerId,
    })
      .select("orderId totalAmount amount price status createdAt influencerCommissionAmount influencerDiscountAmount")
      .sort({ createdAt: -1 });

    const totalOrders = attributedOrders.length;
    const completedOrders = attributedOrders.filter(
      (o) => o.status === "Complete" || o.status === "Processing"
    );

    const totalSalesVolume = completedOrders.reduce((sum, order) => {
      const orderVal = order.price?.total || order.amount || order.totalAmount || 0;
      return sum + Number(orderVal);
    }, 0);

    // 4. Recent Transactions
    const recentTransactions = await InfluencerWalletTransaction.find({
      influencerId,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Orders (last 5)
    const recentOrders = attributedOrders.slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalClicks,
          uniqueVisitors,
          totalOrders,
          completedOrdersCount: completedOrders.length,
          totalSalesVolume: Number(totalSalesVolume.toFixed(2)),
          totalCommissionEarned: Number((influencer.totalCommissionEarned || 0).toFixed(2)),
          walletBalance: Number((influencer.walletBalance || 0).toFixed(2)),
          pendingPayoutAmount: Number((influencer.pendingPayoutAmount || 0).toFixed(2)),
          totalPaidOut: Number((influencer.totalPaidOut || 0).toFixed(2)),
          commissionRate: influencer.commissionRate || 10,
          discountRate: influencer.discountRate || 20,
          referralCode: influencer.referralCode,
        },
        recentOrders,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load influencer dashboard stats.",
      error: error.message,
    });
  }
};

/**
 * Protected: Attributed Orders Feed
 */
exports.getInfluencerOrders = async (req, res) => {
  try {
    const influencerId = req.influencer._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { influencerId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("products.id", "title images image price")
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
    console.error("[InfluencerController] Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load orders.",
      error: error.message,
    });
  }
};

/**
 * Protected: Product Catalog with auto-generated Referral Links
 */
exports.getInfluencerProducts = async (req, res) => {
  try {
    const { referralCode } = req.influencer;
    const baseStoreUrl = FRONTEND_URL.replace(/\/$/, "");
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const category = req.query.category ? String(req.query.category).trim() : "";
    const skip = (page - 1) * limit;

    const filter = { status: { $ne: "Inactive" } };
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { "productName.en": { $regex: safeSearch, $options: "i" } },
        { "productName.ar": { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "categoryName title name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const productsWithLinks = products.map((prod) => {
      return {
        ...prod,
        referralLink: `${baseStoreUrl}/product-details/${prod._id}?ref=${referralCode}`,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        products: productsWithLinks,
        storefrontReferralLink: `${baseStoreUrl}?ref=${referralCode}`,
        referralCode,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products with referral links.",
      error: error.message,
    });
  }
};

/**
 * Protected: Submit Payout / Withdrawal Request
 */
exports.requestPayout = async (req, res) => {
  try {
    const influencer = req.influencer;
    const { amount, payoutMethod, notes } = req.body;

    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid withdrawal amount greater than zero.",
      });
    }

    const MIN_PAYOUT_THRESHOLD = 10; // AED 10
    if (requestedAmount < MIN_PAYOUT_THRESHOLD) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is AED ${MIN_PAYOUT_THRESHOLD}.`,
      });
    }

    if (requestedAmount > influencer.walletBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: AED ${influencer.walletBalance}.`,
      });
    }

    // Check if there is already a Pending request
    const existingPending = await InfluencerPayoutRequest.findOne({
      influencerId: influencer._id,
      status: "Pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a withdrawal request pending approval. Please wait for it to be processed before submitting another.",
      });
    }

    const selectedMethod = payoutMethod || influencer.payoutDetails?.payoutMethod || "BankTransfer";

    // Validate payout details presence
    const details = influencer.payoutDetails || {};
    if (
      selectedMethod === "BankTransfer" &&
      (!details.accountNumber || !details.accountHolderName)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please update your bank account details in your profile settings before requesting a withdrawal.",
      });
    }

    const balanceBefore = influencer.walletBalance;
    const balanceAfter = balanceBefore - requestedAmount;

    // Deduct available balance and hold in pendingPayoutAmount
    influencer.walletBalance = balanceAfter;
    influencer.pendingPayoutAmount = (influencer.pendingPayoutAmount || 0) + requestedAmount;
    await influencer.save();

    const payoutRequest = new InfluencerPayoutRequest({
      influencerId: influencer._id,
      requestedAmount,
      payoutMethod: selectedMethod,
      payoutDetailsSnapshot: details,
      adminNote: notes || "",
      status: "Pending",
    });

    await payoutRequest.save();

    // Record ledger transaction
    const transaction = new InfluencerWalletTransaction({
      influencerId: influencer._id,
      type: "Payout_Debit",
      amount: -requestedAmount,
      balanceBefore,
      balanceAfter,
      payoutRequestId: payoutRequest._id,
      description: `Withdrawal request for AED ${requestedAmount} submitted (${selectedMethod}).`,
    });
    await transaction.save();

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully. Admin will review and process your payout.",
      data: {
        payoutRequest,
        newBalance: balanceAfter,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Request payout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit payout request.",
      error: error.message,
    });
  }
};

/**
 * Protected: Payout Requests History
 */
exports.getPayoutHistory = async (req, res) => {
  try {
    const influencerId = req.influencer._id;
    const requests = await InfluencerPayoutRequest.find({ influencerId }).sort({
      createdAt: -1,
    });

    const transactions = await InfluencerWalletTransaction.find({
      influencerId,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: {
        payoutRequests: requests,
        transactions,
        walletBalance: req.influencer.walletBalance,
        pendingPayoutAmount: req.influencer.pendingPayoutAmount,
      },
    });
  } catch (error) {
    console.error("[InfluencerController] Get payout history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payout history.",
      error: error.message,
    });
  }
};
