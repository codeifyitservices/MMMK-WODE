const mongoose = require("mongoose");

const sanitizeImageFilename = (val) => {
  if (!val || typeof val !== "string") return val;
  if (val.includes("/uploads/")) return val.split("/uploads/").pop().replace(/^\/+/, "");
  if (/^https?:\/\//i.test(val)) return val.split("/").pop().replace(/^\/+/, "");
  return val.replace(/^\/+/, "");
};

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
      set: sanitizeImageFilename,
    },
    thumbnail: {
      type: String,
      default: null,
      set: sanitizeImageFilename,
    },
    images: {
      type: [
        {
          type: String,
          set: sanitizeImageFilename,
        },
      ],
      default: null,
      set: (val) => {
        if (Array.isArray(val)) {
          return val.map(sanitizeImageFilename).filter(Boolean);
        }
        return val;
      },
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
  { timestamps: true, strict: false }
);

productSchema.index({ showOnHomepage: 1, order: 1 });
productSchema.index({ homePageBottomSection: 1, order: 1 });
productSchema.index({ status: 1, order: 1, createdAt: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ gender: 1, status: 1 });
productSchema.index({ slug: 1 });

const Product = mongoose.model("Product", productSchema);
Product.sanitizeImageFilename = sanitizeImageFilename;

module.exports = Product;
