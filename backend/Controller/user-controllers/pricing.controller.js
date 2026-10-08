const Pricing = require("../../Models/Pricing");

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

module.exports = { getPricing };
