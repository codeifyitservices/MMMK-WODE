const mongoose = require("mongoose");

const productViewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productViewSchema.index({ productId: 1, timestamp: -1 });
productViewSchema.index({ productId: 1, userId: 1, timestamp: -1 });
productViewSchema.index({ productId: 1, sessionId: 1, timestamp: -1 });

module.exports = mongoose.model("ProductView", productViewSchema);
