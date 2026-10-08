const Pricing = require("../../../Models/Pricing");

// Get Pricing
const getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.findOne();
    if (!pricing) {
      return res
        .status(404)
        .json({ message: "Pricing configuration not found" });
    }
    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update Pricing
const updatePricing = async (req, res) => {
  try {
    const { shippingCost, taxes } = req.body;

    // Validation
    if (shippingCost == null || taxes == null) {
      return res
        .status(400)
        .json({ message: "Shipping cost and taxes are required" });
    }

    let pricing = await Pricing.findOne();
    if (!pricing) {
      pricing = new Pricing({ shippingCost, taxes });
    } else {
      pricing.shippingCost = shippingCost;
      pricing.taxes = taxes;
    }

    await pricing.save();
    res.status(200).json({ message: "Pricing updated successfully", pricing });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { updatePricing, getPricing };
