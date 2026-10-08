const mongoose = require("mongoose");

const topStripSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  messages: {
    type: [String],
    default: ["Welcome to MMMK WODE!"],
  },
  backgroundColor: {
    type: String,
    default: "#28120b",
  },
}, { timestamps: true });

module.exports = mongoose.model("TopStrip", topStripSchema);
