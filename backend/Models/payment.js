const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    payType: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, collection: "payments" }
);

module.exports = mongoose.model("Payment", paymentSchema);
