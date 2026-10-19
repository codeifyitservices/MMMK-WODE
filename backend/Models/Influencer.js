const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const influencerSchema = new mongoose.Schema(
  {
    // Credentials & Authentication
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Influencer email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },

    // Unique Affiliate Referral Code
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
      index: true,
    },

    // Social Media & Audience Details
    socialMedia: {
      instagram: { type: String, trim: true, default: "" },
      tiktok: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
      facebook: { type: String, trim: true, default: "" },
      other: { type: String, trim: true, default: "" },
    },
    niche: {
      type: String,
      trim: true,
      default: "",
    },
    followerCount: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },

    // Lifecycle Status
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Suspended"],
      default: "Pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    // Financial Configuration
    commissionRate: {
      type: Number,
      default: 10, // Default 10% affiliate commission for influencer
      min: 0,
      max: 100,
    },
    discountRate: {
      type: Number,
      default: 20, // Default 20% discount for shoppers coming via influencer
      min: 0,
      max: 100,
    },

    // Wallet & Earnings Overview
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaidOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Banking & Payout Settings
    payoutDetails: {
      payoutMethod: {
        type: String,
        enum: ["BankTransfer", "UPI", "PayPal"],
        default: "BankTransfer",
      },
      accountHolderName: { type: String, trim: true, default: "" },
      accountNumber: { type: String, trim: true, default: "" },
      bankName: { type: String, trim: true, default: "" },
      ifscOrSwift: { type: String, trim: true, default: "" },
      upiId: { type: String, trim: true, default: "" },
      paypalEmail: { type: String, trim: true, default: "" },
    },

    // Audit Metadata
    lastLogin: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
influencerSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password helper
influencerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON serialization helper (strips password)
influencerSchema.methods.toSafeObject = function () {
  const obj = this.toObject ? this.toObject() : { ...this };
  delete obj.password;
  return obj;
};

const Influencer = mongoose.model("Influencer", influencerSchema);

module.exports = Influencer;
