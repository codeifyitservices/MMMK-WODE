const mongoose = require("mongoose");

const seoSettingsSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      default: "MMMK WODE",
      trim: true,
    },
    websiteUrl: {
      type: String,
      default: "https://mmmk-wode.com",
      trim: true,
    },
    organizationName: {
      type: String,
      default: "MMMK WODE",
      trim: true,
    },
    organizationDescription: {
      type: String,
      default:
        "Luxury jewelry, fragrance, swimwear, and curated fashion collections.",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "contact@mmmk-wode.com",
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
    socialMediaLinks: [
      {
        platform: { type: String, trim: true },
        url: { type: String, trim: true },
      },
    ],
    seoSchema: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const SeoSettings =
  mongoose.models.SeoSettings ||
  mongoose.model("SeoSettings", seoSettingsSchema);

module.exports = SeoSettings;

