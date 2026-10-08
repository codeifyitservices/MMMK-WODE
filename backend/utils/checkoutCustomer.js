const User = require("../Models/User");

const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();

const normalizeAddress = (address = {}) => ({
  firstName: String(address.firstName || "").trim(),
  lastName: String(address.lastName || "").trim(),
  street_address: String(address.street_address || address.streetAddress || "").trim(),
  city: String(address.city || "").trim(),
  state: String(address.state || "").trim(),
  postalCode: String(address.postalCode || "").trim(),
  country: String(address.country || "").trim(),
  company: String(address.company || "").trim(),
  phone_number: String(address.phone_number || address.phoneNumber || "").trim(),
  landmark: String(address.landmark || "").trim(),
  label: String(address.label || "Checkout").trim(),
  isDefault: address.isDefault !== false,
});

const isMeaningfulAddress = (address = {}) =>
  Boolean(
    address.firstName ||
      address.lastName ||
      address.street_address ||
      address.streetAddress ||
      address.city ||
      address.country ||
      address.phone_number ||
      address.phoneNumber
  );

const upsertDefaultAddress = (addresses = [], nextAddress = {}) => {
  const normalized = normalizeAddress(nextAddress);
  if (!isMeaningfulAddress(normalized)) return addresses;

  const existing = Array.isArray(addresses) ? [...addresses] : [];
  const defaultIndex = existing.findIndex((address) => address?.isDefault);
  normalized.isDefault = true;

  if (defaultIndex >= 0) {
    existing[defaultIndex] = {
      ...existing[defaultIndex].toObject?.() || existing[defaultIndex],
      ...normalized,
      _id: existing[defaultIndex]._id,
    };
    return existing.map((address, index) => ({
      ...address,
      isDefault: index === defaultIndex,
    }));
  }

  return [
    normalized,
    ...existing.map((address) => ({
      ...address.toObject?.() || address,
      isDefault: false,
    })),
  ];
};

const getOrCreateCheckoutCustomer = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  let user = await User.findOne({ email: normalizedEmail });
  if (user) return user;

  user = new User({
    email: normalizedEmail,
    isVerified: true,
    shippingAddresses: [],
    billingAddresses: [],
  });
  await user.save();
  return user;
};

const saveCheckoutCustomerAddresses = async ({
  email,
  shippingAddress,
  billingAddress,
}) => {
  const user = await getOrCreateCheckoutCustomer(email);
  if (!user) return null;

  if (isMeaningfulAddress(shippingAddress)) {
    user.shippingAddresses = upsertDefaultAddress(
      user.shippingAddresses,
      shippingAddress
    );
  }

  if (isMeaningfulAddress(billingAddress)) {
    user.billingAddresses = upsertDefaultAddress(
      user.billingAddresses,
      billingAddress
    );
  }

  user.isVerified = true;
  await user.save();
  return user;
};

const getCheckoutCustomerAddresses = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const user = await User.findOne({ email: normalizedEmail })
    .select("email shippingAddresses billingAddresses")
    .lean();

  return {
    email: normalizedEmail,
    shippingAddresses: user?.shippingAddresses || [],
    billingAddresses: user?.billingAddresses || [],
  };
};

module.exports = {
  normalizeEmail,
  normalizeAddress,
  getOrCreateCheckoutCustomer,
  saveCheckoutCustomerAddresses,
  getCheckoutCustomerAddresses,
  upsertDefaultAddress,
};
