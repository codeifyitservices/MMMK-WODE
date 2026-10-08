const mongoose = require("mongoose");
const User = require("../../Models/User");
const GiftCard = require("../../Models/GiftCard");
const CreditTransaction = require("../../Models/CreditTransaction");
const { createGiftCardCodeAndPassword, isGiftCardExpired } = require("../../services/giftCard");
const { queueGiftCardShareEmail } = require("../../utils/giftCardMailer");
const {
  resolveCurrencyCode,
  resolveCurrencyRate,
  convertToCurrency,
} = require("../../utils/currency");
const {
  safeStartSession,
  safeCommitTransaction,
  safeAbortTransaction,
  safeEndSession,
} = require("../../utils/dbUtils");

const addGiftCard = async (req, res) => {
  const session = await safeStartSession();
  try {
    const { code, password, currency, currencyRate } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).session(session);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const giftCard = await GiftCard.findOne({
      code: code,
      password: password,
    }).session(session);

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: `Gift card not found with code "${code}" and password "${password}"`,
      });
    }
    if (giftCard.status === "Redeemed") {
      return res.status(400).json({
        success: false,
        message: `Gift card "${code}" has already been redeemed`,
      });
    }

    if (giftCard.status === "Shared") {
      return res.status(400).json({
        success: false,
        message: `Gift card "${code}" has been shared and cannot be redeemed by you`,
      });
    }
    const isExpired = await isGiftCardExpired(giftCard);
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: `Gift card "${code}" is expired`,
      });
    }

    const newGiftCard = await GiftCard.findByIdAndUpdate(
      giftCard._id,
      {
        $set: {
          status: "Redeemed",
          redeemedBy: userId,
          redeemedAt: new Date(),
        },
      },
      { session, new: true }
    );

    const newUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          credits: (user.credits || 0) + (giftCard.amount || 0),
        },
      },
      { session, new: true }
    );

    // Calculate redemption value in selected currency for logging
    const activeCurrency = resolveCurrencyCode(currency);
    const rate = resolveCurrencyRate(activeCurrency, currencyRate);
    // converToCurrency uses 1 TARGET = RATE USD, so USD / rate = TARGET
    const redeemedAmountInCurrency = convertToCurrency(giftCard.amount, activeCurrency, rate);

    // Log transaction
    await CreditTransaction.create(
      [
        {
          user: userId,
          amount: giftCard.amount,
          currency: activeCurrency,
          amountInCurrency: redeemedAmountInCurrency,
          type: "Redeem",
          giftCard: giftCard._id,
          description: `Credits added via gift card ${giftCard.code}`,
        },
      ],
      { session }
    );

    await safeCommitTransaction(session);
    res.status(201).json({
      success: true,
      message: "Gift card added successfully",
      data: newUser,
    });
  } catch (err) {
    await safeAbortTransaction(session);
    
    res.status(500).json({
      success: false,
      message: "Failed to add gift card",
    });
  } finally {
    safeEndSession(session);
  }
};

const createGiftCard = async (req, res) => {
  try {
    const { 
      name, 
      amount, // Should be in USD (base)
    } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        message: "Name and amount are required",
      });
    }

    if (amount < 1 || amount > 5000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between $1 and $5000",
      });
    }

    const { code, password } = await createGiftCardCodeAndPassword();

    // Create gift card
    const giftCard = new GiftCard({
      name,
      code,
      password,
      amount,
      createdBy: userId,
    });

    await giftCard.save();

    // Populate the created gift card with user details
    const populatedGiftCard = await GiftCard.findById(giftCard._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: "Gift card created successfully",
      data: populatedGiftCard,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create gift card",
    });
  }
};

const getCreatedGiftCards = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 10000, 
      status,
      searchKey,
      searchValue
    } = req.query;

    // Build filter object
    let filter = { createdBy: userId };
    
    if (status && ['Active', 'Redeemed', 'Expired', 'Shared'].includes(status)) {
      filter.status = status;
    }

    // Apply search filters
    if (searchKey && searchValue) {
      const searchRegex = { $regex: searchValue, $options: 'i' };
      
      if (searchKey === 'code') {
        filter.code = searchRegex;
      } else if (searchKey === 'name') {
        filter.name = searchRegex;
      } else if (searchKey === 'recipientEmail') {
        // Search in share history
        filter['shareHistory.recipientEmail'] = searchRegex;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch gift cards with pagination
    const giftCards = await GiftCard.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('redeemedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await GiftCard.countDocuments(filter);

    const user = await User.findById(userId);

    // Calculate summary statistics
    const stats = await GiftCard.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      active: 0,
      redeemed: 0,
      expired: 0,
      totalValue: 0, // Sum of redeemed cards created by user
      activeValue: 0,
      redeemedValue: 0,
      walletBalance: user?.credits || 0, // Real user credits
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      
      if (stat._id === 'Active' || stat._id === 'Shared') {
        summary.active += stat.count;
        summary.activeValue += stat.totalAmount;
      } else if (stat._id === 'Redeemed') {
        summary.redeemed = stat.count;
        summary.redeemedValue = stat.totalAmount;
        summary.totalValue = stat.totalAmount;
      } else if (stat._id === 'Expired') {
        summary.expired = stat.count;
      }
    });

    res.status(200).json({
      success: true,
      message: "Gift cards fetched successfully",
      data: giftCards,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPreviousPage: parseInt(page) > 1
      },
      summary
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch gift cards",
    });
  }
};

const shareGiftCard = async (req, res) => {
  try {
    const { giftCardId } = req.params;
    const { recipientName, recipientEmail, recipientPhone } = req.body || {};

    if (!recipientName?.trim() || !recipientEmail?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recipient name and email are required",
      });
    }

    const giftCard = await GiftCard.findOne({
      _id: giftCardId,
      createdBy: req.user._id,
    });

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found",
      });
    }

    if (giftCard.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: `Only active gift cards can be shared. Current status: ${giftCard.status}`,
      });
    }

    const shareEntry = {
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim(),
      recipientPhone: recipientPhone?.trim() || "Not Provided",
      sharedBy: req.user._id,
      sharedAt: new Date(),
      emailStatus: "Pending", // Initialize as pending
    };

    // Trigger email sending BEFORE updating status
    const result = await queueGiftCardShareEmail({
      giftCard,
      recipient: shareEntry,
      sharedBy: req.user,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to send gift card email: ${result.error}`,
      });
    }

    // Only update status and history if email was successful
    shareEntry.emailStatus = "Sent";
    giftCard.shareHistory = [...(giftCard.shareHistory || []), shareEntry];
    giftCard.status = "Shared"; // Mark as Shared
    await giftCard.save();

    return res.status(200).json({
      success: true,
      message: "Gift card shared successfully",
      data: shareEntry,
    });
  } catch (err) {
    
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to share gift card",
    });
  }
};


module.exports = {
  addGiftCard,
  createGiftCard,
  getCreatedGiftCards,
  shareGiftCard,
};
