const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  sku: {
    type: String,
    default: '',
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  quantity: {
    type: Number,
    default: 1,
  },
  bags: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    enum: ["Active", "Inactive", "Wishlist"],
    default: "Active",
  },
});

module.exports = mongoose.model("Cart", cartSchema);
