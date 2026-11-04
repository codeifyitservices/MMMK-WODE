const mongoose = require("mongoose");

const influencerPayoutScheduleSchema = new mongoose.Schema(
  {
    cycleType: {
      type: String,
      enum: ["Monthly", "BiWeekly", "Weekly", "Custom"],
      default: "Monthly",
    },
    // Used when cycleType is 'Custom' or 'BiWeekly' (15 days)
    cycleDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    // How many days the withdrawal window remains open once unlocked
    payoutWindowDurationDays: {
      type: Number,
      default: 5,
      min: 1,
      max: 31,
    },
    // Admin manual override
    manualOverride: {
      type: String,
      enum: ["Auto", "ForceUnlocked", "ForceLocked"],
      default: "Auto",
    },
    // Minimum threshold for withdrawal requests
    minWithdrawalAmount: {
      type: Number,
      default: 200,
      min: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InfluencerPayoutSchedule",
  influencerPayoutScheduleSchema
);

