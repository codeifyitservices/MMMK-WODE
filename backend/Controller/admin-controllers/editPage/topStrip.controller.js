const TopStrip = require("../../../Models/TopStrip");

const updateTopStrip = async (req, res) => {
  try {
    const { enabled, messages, backgroundColor } = req.body;

    let topStrip = await TopStrip.findOne({});
    if (!topStrip) {
      topStrip = new TopStrip();
    }

    if (typeof enabled !== "undefined") {
      topStrip.enabled = enabled;
    }
    if (messages && Array.isArray(messages)) {
      topStrip.messages = messages.filter((m) => m !== undefined && m !== null);
    }
    if (backgroundColor) {
      topStrip.backgroundColor = backgroundColor;
    }

    await topStrip.save();

    return res.status(200).json({
      success: true,
      message: "Top strip updated successfully",
      data: topStrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

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
  updateTopStrip,
  getTopStrip,
};
