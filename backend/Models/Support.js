const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneCountryCode: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    locale: {
      type: String,
      trim: true,
      default: "en",
    },
    source: {
      type: String,
      trim: true,
      default: "contact-us",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Support", supportSchema);
