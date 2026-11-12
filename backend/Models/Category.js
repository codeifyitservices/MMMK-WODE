const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, default: null },
      ru: { type: String, default: null },
      fr: { type: String, default: null },
      es: { type: String, default: null },
      zh: { type: String, default: null },
      ja: { type: String, default: null },
      pt: { type: String, default: null },
      it: { type: String, default: null },
      de: { type: String, default: null },
    },
    image: {
      type: String,
      required: true,
    },
    subcategories: {
      type: [
        {
          en: { type: String, default: true },
          ar: { type: String, default: null },
          ru: { type: String, default: null },
          fr: { type: String, default: null },
          es: { type: String, default: null },
          zh: { type: String, default: null },
          ja: { type: String, default: null },
          pt: { type: String, default: null },
          it: { type: String, default: null },
          de: { type: String, default: null },
        },
      ],
      default: [],
    },
    filters: {
      type: [
        {
          name: { type: String, required: true },
        },
      ],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    // SEO & Meta Fields
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    metaKeywords: {
      type: String,
      trim: true,
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    seoSchema: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ order: 1, createdAt: 1 });
categorySchema.index({ "name.en": 1 });
categorySchema.index({ slug: 1 });

module.exports = mongoose.model("Category", categorySchema);