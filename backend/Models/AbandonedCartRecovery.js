const mongoose = require("mongoose");

const cartSnapshotItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    name: {
      type: String,
      default: "Product",
    },
    sku: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const recoveryLogSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    email: {
      type: String,
    },
    messageId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const abandonedCartRecoverySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cartSnapshot: [cartSnapshotItemSchema],
    totalQuantity: {
      type: Number,
      default: 0,
    },
    cartValue: {
      type: Number,
      default: 0, // In base currency (USD / AED standard)
    },
    currency: {
      type: String,
      default: "AED",
    },
    lastActivityAt: {
      type: Date,
      required: true,
      index: true,
    },
    markedIdleAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "IDLE", "ABANDONED", "RECOVERED", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    currentStage: {
      type: String,
      enum: ["ACTIVE", "IDLE", "6H", "12H", "24H", "48H", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },

    // Email Stage Sent Timestamps
    firstReminderSentAt: {
      type: Date,
      default: null,
    },
    secondReminderSentAt: {
      type: Date,
      default: null,
    },
    couponEmailSentAt: {
      type: Date,
      default: null,
    },
    finalReminderSentAt: {
      type: Date,
      default: null,
    },

    // Coupon & Claim Token
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
    },
    claimToken: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    claimTokenExpiresAt: {
      type: Date,
      default: null,
    },
    isClaimed: {
      type: Boolean,
      default: false,
      index: true,
    },
    claimedAt: {
      type: Date,
      default: null,
    },

    // Conversion / Order link
    recoveredOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    recoveredAt: {
      type: Date,
      default: null,
    },

    // Audit logs
    logs: [recoveryLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for scheduler queries
abandonedCartRecoverySchema.index({ status: 1, lastActivityAt: 1 });

module.exports = mongoose.model("AbandonedCartRecovery", abandonedCartRecoverySchema);
