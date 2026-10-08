const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "onModel" },
  onModel: {
    type: String,
    required: true,
    enum: ["User", "Admin"],
    default: "User"
  },
  createdAt: { type: Date, default: Date.now, expires: 900 },
});

const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

module.exports = { ResetToken };
