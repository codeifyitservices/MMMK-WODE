const mongoose = require("mongoose");

const influencerPayoutRequestSchema = new mongoose.Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
      index: true,
    },
    requestedAmount: {
      type: Number,
      required: [true, "Requested withdrawal amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    payoutMethod: {
      type: String,
      enum: ["BankTransfer", "UPI", "PayPal"],
      required: true,
      default: "BankTransfer",
    },
    payoutDetailsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Rejected"],
      default: "Pending",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    transactionReference: {
      type: String,
      trim: true,
      default: "", // E.g., Bank UTR number, wire transaction reference
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

influencerPayoutRequestSchema.index({ influencerId: 1, createdAt: -1 });

const InfluencerPayoutRequest = mongoose.model(
  "InfluencerPayoutRequest",
  influencerPayoutRequestSchema
);

module.exports = InfluencerPayoutRequest;
