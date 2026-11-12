const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Page slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    metaTitle: {
      type: String,
      trim: true,
      default: "",
    },
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
    metaKeywords: {
      type: String,
      trim: true,
      default: "",
    },
    canonicalUrl: {
      type: String,
      trim: true,
      default: "",
    },
    ogTitle: {
      type: String,
      trim: true,
      default: "",
    },
    ogDescription: {
      type: String,
      trim: true,
      default: "",
    },
    ogImage: {
      type: String,
      trim: true,
      default: "",
    },
    seoSchema: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Draft",
      index: true,
    },
    footerPlacement: {
      type: String,
      enum: ["none", "footer_column_1", "footer_column_2", "footer_column_3"],
      default: "none",
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

pageSchema.index({ title: "text", slug: "text" });

const Page = mongoose.models.Page || mongoose.model("Page", pageSchema);

module.exports = Page;

