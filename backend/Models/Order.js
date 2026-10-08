const mongoose = require("mongoose");

const orderProductsSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  amount: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  sku: {
    type: String,
  },
  name: {
    type: String,
  },
});

const returnExchangeItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    sku: String,
    name: String,
    quantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const returnExchangeRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true },
    type: { type: String, enum: ["return", "exchange"], required: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "SyncedToJura",
        "JuraSyncFailed",
      ],
      default: "Pending",
    },
    reason: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    items: { type: [returnExchangeItemSchema], default: [] },
    exchangeDetails: {
      requestedItems: { type: [returnExchangeItemSchema], default: [] },
      notes: { type: String, trim: true, default: "" },
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: Date,
    reviewNote: { type: String, trim: true, default: "" },
    juraSyncStatus: {
      type: String,
      enum: ["Pending", "Synced", "Failed"],
      default: "Pending",
    },
    juraSyncError: { type: String, trim: true, default: "" },
    juraActionId: { type: String, trim: true, default: "" },
    juraSyncedAt: Date,
    juraResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensure userId is always present
    },
    depoter_order_id: {
      type: String,
    },
    depoterSyncStatus: {
      type: String,
      enum: ["Pending", "Synced", "Failed"],
      default: "Pending",
    },
    depoterSyncError: {
      type: String,
    },
    depoterSyncedAt: {
      type: Date,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Complete", "Cancelled"],
      default: "Pending",
    },
    mode: {
      type: String,
      enum: ["cod", "card", "upi", "credits", "tabby"],
    },
    paymentMethod: {
      type: String, // e.g., "credits", "cod", "stripe", "credits+cod", "credits+stripe", "tabby", "credits+tabby"
    },
    totalAmount: {
      type: Number,
    },
    amountPaidOnline: {
      type: Number,
      default: 0,
    },
    amountDueCOD: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
    },
    amountUSD: {
      type: Number,
    },
    currencyRate: {
      type: Number,
    },
    price: {
      subtotal: { type: Number, required: true },
      shippingCharges: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      extraCharges: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      creditApplied: { type: Number, default: 0 },
      total: { type: Number, required: true },
      payableTotal: { type: Number, default: 0 },
    },
    currency: {
      type: String,
    },
    totalQuantity: {
      type: Number,
    },
    stripeSessionId: {
      type: String,
    },
    tabbySessionId: {
      type: String,
    },
    tabbyPaymentId: {
      type: String,
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    products: [orderProductsSchema],
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    paymentIntentId: {
      type: String, // Stores Stripe payment intent ID
    },
    stockAdjusted: {
      type: Boolean,
      default: false,
    },
    creditsUsed: {
      type: Number,
      default: 0,
    },
    creditsDeducted: {
      type: Boolean,
      default: false,
    },
    creditsRestored: {
      type: Boolean,
      default: false,
    },
    temp: {
      type: mongoose.Schema.Types.Mixed,
    },
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
    },
    billingAddress: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Delivery tracking fields
    deliveryStatus: {
      type: String,
      enum: ["Pending", "Processing", "In Transit", "Out for Delivery", "Delivered", "Failed", "Returned"],
      default: "Pending",
    },
    shipperName: String,
    awb: String, // Air Waybill number
    trackingUrl: String,
    deliveryDate: String,
    notifyCustomer: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSentAt: {
      type: Date,
    },
    trackingHistory: [{
      status: String,
      timestamp: Date,
      location: String,
      remarks: String,
    }],
    returnExchangeRequests: {
      type: [returnExchangeRequestSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.virtual("jura_order_id")
  .get(function getJuraOrderId() {
    return this.depoter_order_id || null;
  })
  .set(function setJuraOrderId(value) {
    this.depoter_order_id = value;
  });

orderSchema.virtual("juraSyncStatus")
  .get(function getJuraSyncStatus() {
    return this.depoterSyncStatus || "Pending";
  })
  .set(function setJuraSyncStatus(value) {
    this.depoterSyncStatus = value;
  });

orderSchema.virtual("juraSyncError")
  .get(function getJuraSyncError() {
    return this.depoterSyncError || null;
  })
  .set(function setJuraSyncError(value) {
    this.depoterSyncError = value;
  });

orderSchema.virtual("juraSyncedAt")
  .get(function getJuraSyncedAt() {
    return this.depoterSyncedAt || null;
  })
  .set(function setJuraSyncedAt(value) {
    this.depoterSyncedAt = value;
  });

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "products.id": 1, status: 1, paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
