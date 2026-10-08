const User = require("../../Models/User");
const CreditTransaction = require("../../Models/CreditTransaction");

const normalizeAddress = (address = {}) => ({
  firstName: address.firstName || "",
  lastName: address.lastName || "",
  street_address: address.street_address || address.streetAddress || "",
  city: address.city || "",
  state: address.state || "",
  postalCode: address.postalCode || "",
  country: address.country || "",
  company: address.company || "",
  phone_number: address.phone_number || address.phoneNumber || "",
  landmark: address.landmark || "",
  label: address.label || "Home",
  isDefault: address.isDefault || false,
});

const addressField = (type) =>
  type === "shipping" ? "shippingAddresses" : "billingAddresses";

// ─── My Account ──────────────────────────────────────────────────────────────

const updateMyAccount = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, contactNumber, gender, email } =
      req.body;
    const toUpdate = {};
    if (firstName) toUpdate.firstName = firstName;
    if (lastName) toUpdate.lastName = lastName;
    if (dateOfBirth) toUpdate.dateOfBirth = dateOfBirth;
    if (contactNumber) toUpdate.contactNumber = contactNumber;
    if (gender) toUpdate.gender = gender;
    if (email) toUpdate.email = email;

    const data = await User.findByIdAndUpdate(
      req.user._id,
      { $set: toUpdate },
      { new: true }
    ).select("-password");

    res.status(200).json({ success: true, message: "My Account updated successfully", data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update my Account" });
  }
};

const getMyAccount = async (req, res) => {
  try {
    const data = await User.findById(req.user._id, {
      firstName: 1, lastName: 1, dateOfBirth: 1,
      contactNumber: 1, email: 1, gender: 1, _id: 0,
    });
    res.status(200).json({ success: true, message: "My Account fetched successfully", data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch my Account" });
  }
};

// ─── Address Book ─────────────────────────────────────────────────────────────

const getAddressBook = async (req, res) => {
  try {
    const data = await User.findById(req.user._id, {
      shippingAddresses: 1,
      billingAddresses: 1,
    });
    res.status(200).json({ success: true, message: "Address book fetched successfully", data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch address book" });
  }
};

const addAddress = async (req, res) => {
  try {
    const { type } = req.params;
    const field = addressField(type);
    const user = await User.findById(req.user._id);

    const newAddress = normalizeAddress(req.body);
    if (user[field].length === 0) newAddress.isDefault = true;

    user[field].push(newAddress);
    await user.save();

    res.status(201).json({ success: true, message: "Address added", data: user[field] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { type, id } = req.params;
    const field = addressField(type);
    const user = await User.findById(req.user._id);

    const addr = user[field].id(id);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found" });

    const wasDefault = addr.isDefault;
    Object.assign(addr, normalizeAddress({ ...addr.toObject(), ...req.body }));
    addr.isDefault = wasDefault;

    await user.save();
    res.status(200).json({ success: true, message: "Address updated", data: user[field] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { type, id } = req.params;
    const field = addressField(type);
    const user = await User.findById(req.user._id);

    const addr = user[field].id(id);
    if (!addr) return res.status(404).json({ success: false, message: "Address not found" });

    const wasDefault = addr.isDefault;
    user[field].pull(id);

    // Assign default to first remaining if deleted address was default
    if (wasDefault && user[field].length > 0) {
      user[field][0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Address deleted", data: user[field] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete address" });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { type, id } = req.params;
    const field = addressField(type);
    const user = await User.findById(req.user._id);

    user[field].forEach((addr) => {
      addr.isDefault = addr._id.toString() === id;
    });

    await user.save();
    res.status(200).json({ success: true, message: "Default address updated", data: user[field] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to set default address" });
  }
};

// ─── Credits ──────────────────────────────────────────────────────────────────

const getUserCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("credits");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User credits fetched successfully", data: user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch user credits" });
  }
};

const getCreditTransactions = async (req, res) => {
  try {
    const { days } = req.query;
    let filter = { user: req.user._id };

    if (days && days !== "all") {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      filter.createdAt = { $gte: date };
    }

    const transactions = await CreditTransaction.find(filter)
      .populate("order", "orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Credit transactions fetched successfully",
      data: transactions,
    });
  } catch (err) {
    
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
};

// ─── Payment Methods ──────────────────────────────────────────────────────────

const addPaymentCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.paymentCards.push(req.body);
    await user.save();
    res.status(201).json({ success: true, message: "Payment card added successfully", data: user });
  } catch {
    res.status(500).json({ success: false, message: "Failed to add payment card" });
  }
};

const getPaymentCard = async (req, res) => {
  try {
    const data = await User.findById(req.user._id).select("paymentCards");
    res.status(200).json({ success: true, message: "Payment cards fetched successfully", data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to get payment cards" });
  }
};

const deletePaymentCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("paymentCards");
    user.paymentCards = user.paymentCards.filter(
      (card) => card._id.toString() !== req.params.id
    );
    await user.save();
    res.status(200).json({ success: true, message: "Payment card deleted successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to delete payment card" });
  }
};

module.exports = {
  updateMyAccount,
  getMyAccount,
  getAddressBook,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserCredits,
  getCreditTransactions,
  addPaymentCard,
  getPaymentCard,
  deletePaymentCard,
};