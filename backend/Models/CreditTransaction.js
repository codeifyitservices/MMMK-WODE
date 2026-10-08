const mongoose = require("mongoose");

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
    },
    amountInCurrency: {
      type: Number,
    },
    balanceBefore: {
      type: Number,
    },
    balanceAfter: {
      type: Number,
    },
    amountMinor: {
      type: Number,
    },
    amountInCurrencyMinor: {
      type: Number,
    },
    type: {
      type: String,
      enum: ["Deduction", "Restore", "Redeem"],
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    giftCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftCard",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditTransaction", creditTransactionSchema);
