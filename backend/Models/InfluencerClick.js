const mongoose = require("mongoose");

const influencerClickSchema = new mongoose.Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Influencer",
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    visitorSessionId: {
      type: String,
      trim: true,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
      default: "",
    },
    landingUrl: {
      type: String,
      trim: true,
      default: "",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    convertedToOrder: {
      type: Boolean,
      default: false,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
influencerClickSchema.index({ influencerId: 1, createdAt: -1 });
influencerClickSchema.index({ referralCode: 1, createdAt: -1 });

const InfluencerClick = mongoose.model("InfluencerClick", influencerClickSchema);

module.exports = InfluencerClick;
