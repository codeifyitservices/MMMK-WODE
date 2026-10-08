const mongoose = require("mongoose");

const checkoutOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

checkoutOtpSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("CheckoutOtp", checkoutOtpSchema);
