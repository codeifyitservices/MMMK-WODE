const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    filters: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

productSchema.index({ product: 1 });

module.exports = mongoose.model("SKU", productSchema);
