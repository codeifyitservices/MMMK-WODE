const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for admin-created reviews
    },
    reviewerName: {
      type: String,
      trim: true,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      required: true,
    },
    isAdminReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure real users can only submit 1 review per product, while allowing multiple admin reviews
reviewSchema.index(
  { user: 1, product: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("Review", reviewSchema);

