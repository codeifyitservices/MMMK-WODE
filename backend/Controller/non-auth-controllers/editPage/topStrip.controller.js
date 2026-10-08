const TopStrip = require("../../../Models/TopStrip");

const getTopStrip = async (req, res) => {
  try {
    let topStrip = await TopStrip.findOne({});
    if (!topStrip) {
      topStrip = await TopStrip.create({
        enabled: false,
        messages: ["Welcome to MMMK WODE!"],
        backgroundColor: "#28120b",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Top strip fetched successfully",
      data: topStrip,
    });
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
