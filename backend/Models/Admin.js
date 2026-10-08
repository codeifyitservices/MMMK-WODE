const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // Optional for now to not break existing admins, but should be added
  },
  password: {
    type: String,
    required: true,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
});

adminSchema.pre("save", async function (next) {
  const admin = this;
  if (!admin.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Admin", adminSchema);
