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
        "Enjoy exclusive privileges and receive private invitations to new releases.",
    },
    offerCoupon: {
      type: Boolean,
      default: true,
    },
    discountCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "WELCOME15",
    },
    discountValue: {
      type: Number,
      default: 15,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    discountText: {
      type: String,
      trim: true,
      default: "Use code at checkout for 15% off",
    },
    buttonText: {
      type: String,
      trim: true,
      default: "CLAIM MY PRIVILEGE",
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
