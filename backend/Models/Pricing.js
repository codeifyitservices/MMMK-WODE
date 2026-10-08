const mognoose = require("mongoose");

const pricingSchema = new mognoose.Schema({
  shippingCost: {
    type: Number,
    required: true,
  },
  taxes: {
    type: Number,
    required: true,
  },
});

module.exports = mognoose.model("Pricing", pricingSchema);
