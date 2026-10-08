const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const paymentCardsSchema = new mongoose.Schema({
  cardType: { type: String, trim: true },
  cardNumber: { type: String, trim: true },
  expiryDate: { type: String, trim: true },
  cardholderName: { type: String, trim: true },
});

const addressSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  street_address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true },
  company: { type: String, trim: true },
  phone_number: { type: String, trim: true },
  landmark: { type: String, trim: true },
  label: { type: String, trim: true, default: "Home" },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true },
    password: { type: String, trim: true },
    dateOfBirth: { type: Date },
    contactNumber: { type: String },
    isVerified: { type: Boolean },
    gender: { type: String },
    shippingAddresses: { type: [addressSchema], default: [] },
    billingAddresses: { type: [addressSchema], default: [] },
    paymentCards: { type: [paymentCardsSchema] },
    credits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.password) return next();
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
