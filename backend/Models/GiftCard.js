const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    code: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    amountInCurrency: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Active", "Redeemed", "Expired", "Shared"],
      default: "Active",
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    expiryDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now  
    },
    shareHistory: {
      type: [
        new mongoose.Schema(
          {
            recipientName: {
              type: String,
              trim: true,
              required: true,
            },
            recipientEmail: {
              type: String,
              trim: true,
              required: true,
            },
            recipientPhone: {
              type: String,
              trim: true,
              required: true,
            },
            sharedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            sharedAt: {
              type: Date,
              default: Date.now,
            },
            emailStatus: {
              type: String,
              enum: ["Pending", "Sent", "Failed"],
              default: "Pending",
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiftCard", giftCardSchema);
