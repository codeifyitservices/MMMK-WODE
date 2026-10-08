const mongoose = require("mongoose");

const languageSchema = {
  en: { type: String, trim: true },
  ar: { type: String, trim: true },
  fr: { type: String, trim: true },
  ru: { type: String, trim: true },
  zh: { type: String, trim: true },
  es: { type: String, trim: true },
  ja: { type: String, trim: true },
  pt: { type: String, trim: true },
  it: { type: String, trim: true },
  de: { type: String, trim: true },
};

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subCategory: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
      required: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    images: {
      type: [String],
      default: null,
    },
    // sku: {
    //   type: String,
    //   default: null,
    //   unique: true,
    // },
    quantity: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0.5,
    },
    brand: {
      type: String,
      default: "",
    },
    homePageBottomSection: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      default: 0,
      max: 100,
      min: 0,
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
    },
    status: {
      type: String,
      enum: ["Active", "Out of stock", "Inactive"],
      default: "Active",
    },
    productName: languageSchema,
    productDescription: languageSchema,
    uses: languageSchema,
    benefits: languageSchema,
    price: {
      type: Number,
      default: 0,
    },
    websitePrice: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "reviewModel",
    },
    filters: {
      type: [String],
      default: [],
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, strict: false }
);

productSchema.index({ showOnHomepage: 1, order: 1 });
productSchema.index({ homePageBottomSection: 1, order: 1 });

module.exports = mongoose.model("Product", productSchema);
