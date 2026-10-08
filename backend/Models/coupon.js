const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
    },
    showToUsers: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    applyToProducts: {
      type: Boolean,
      default: true,
    },
    applyToDelivery: {
      type: Boolean,
      default: false,
    },
    deliveryDiscount: {
      type: Number,
      default: 0,
    },
    deliveryDiscountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    scope: {
      type: String,
      enum: ["All", "Category", "Product"],
      default: "All",
    },
    scopeCategory: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category",
      default: [],
    },
    scopeProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isRecoveryCoupon: {
      type: Boolean,
      default: false,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    maxUsage: {
      type: Number,
      default: null, // null means unlimited
    },
    currentUsage: {
      type: Number,
      default: 0,
    },
    usageHistory: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          default: null
        },
        saved: {
          type: Number,
          default: 0
        },
        dateTime: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
