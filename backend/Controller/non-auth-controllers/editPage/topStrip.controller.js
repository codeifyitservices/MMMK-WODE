const TopStrip = require("../../../Models/TopStrip");
const cache = require("../../../utils/cache");

const getTopStrip = async (req, res) => {
  try {
    const cached = cache.get("top_strip");
    if (cached) {
      return res.status(200).json(cached);
    }

    let topStrip = await TopStrip.findOne({}).lean();
    if (!topStrip) {
      topStrip = await TopStrip.create({
        enabled: false,
        messages: ["Welcome to MMMK WODE!"],
        backgroundColor: "#28120b",
      });
    }

    const payload = {
      success: true,
      message: "Top strip fetched successfully",
      data: topStrip,
    };

    cache.set("top_strip", payload, 600);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = {
  getTopStrip,
};
