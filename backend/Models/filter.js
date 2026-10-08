const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema({
  filterName: {
    type: String,
    // enum: ["Price", "Discount", "Gender", "Rating"],
    default: null,
    trim: true,
    required: true,
  },
  options: {
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  },
  subFilterName: {
    type: [String],
    trim: true,
    required: true,
    default: [],
  },
});

module.exports = mongoose.model("Filter", filterSchema);
