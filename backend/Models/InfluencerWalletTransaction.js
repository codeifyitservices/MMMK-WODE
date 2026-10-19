const mongoose = require("mongoose");

const influencerWalletTransactionSchema = new mongoose.Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "Commission_Credit",
        "Payout_Debit",
        "Refund_Reversal",
        "Manual_Adjustment",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    payoutRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluencerPayoutRequest",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

influencerWalletTransactionSchema.index({ influencerId: 1, createdAt: -1 });

const InfluencerWalletTransaction = mongoose.model(
  "InfluencerWalletTransaction",
  influencerWalletTransactionSchema
);

module.exports = InfluencerWalletTransaction;
