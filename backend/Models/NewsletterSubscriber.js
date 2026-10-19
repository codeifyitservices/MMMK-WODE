const mongoose = require("mongoose");

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
      index: true,
    },
    source: {
      type: String,
      enum: ["popup", "footer", "checkout", "manual"],
      default: "popup",
    },
    discountCode: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate index build conflicts
newsletterSubscriberSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema
);
