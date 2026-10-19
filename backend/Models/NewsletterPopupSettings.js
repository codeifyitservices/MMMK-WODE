const mongoose = require("mongoose");

const newsletterPopupSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      trim: true,
      default: "JOIN THE MAISON MMMK WODE",
    },
    subtitle: {
      type: String,
      trim: true,
      default:
        "Enjoy 15% off your first purchase and receive private invitations to exclusive releases.",
    },
    discountCode: {
      type: String,
      trim: true,
      default: "WELCOME15",
    },
    discountText: {
      type: String,
      trim: true,
      default: "Use code at checkout for 15% off",
    },
    delaySeconds: {
      type: Number,
      default: 6,
      min: 1,
      max: 120,
    },
    displayFrequencyDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 90,
    },
    backgroundImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get or create singleton settings
newsletterPopupSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model(
  "NewsletterPopupSettings",
  newsletterPopupSettingsSchema
);
