const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. "order_confirmation"
    },
    subject: {
      type: String,
      default: "Your MMMK Wode Order Has Been Confirmed! 🎉",
      trim: true,
    },
    customMessage: {
      type: String,
      default:
        "Thank you for your order! We are thrilled to have you as part of the MMMK Wode family. Your order is now being processed and we will notify you once it ships.",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
