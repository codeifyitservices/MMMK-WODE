const mongoose = require("mongoose");

const trafficVisitSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    channel: {
      type: String,
      enum: ["Direct", "Search", "Social", "Referral", "Other"],
      default: "Direct",
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: "direct",
    },
    medium: {
      type: String,
      trim: true,
      default: "none",
    },
    campaign: {
      type: String,
      trim: true,
      default: "",
    },
    referrer: {
      type: String,
      trim: true,
      default: "",
    },
    landingPage: {
      type: String,
      trim: true,
      default: "/",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

trafficVisitSchema.index({ timestamp: -1 });
trafficVisitSchema.index({ channel: 1, timestamp: -1 });
trafficVisitSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model("TrafficVisit", trafficVisitSchema);
