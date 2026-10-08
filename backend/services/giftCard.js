const GiftCard = require("../Models/GiftCard.js");

const generateCode = () => {
  return `MMMK-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 6)
    .toUpperCase()}`;
};

const generatePassword = () => {
  return Math.random().toString(36).substr(2, 20);
};

const createGiftCardCodeAndPassword = async () => {
  const code = generateCode();
  const existingCard = await GiftCard.exists({ code });
  if (existingCard) {
    return await createGiftCardCodeAndPassword();
  }
  const password = generatePassword();
  return { code, password };
};

const isGiftCardExpired = async (giftCard) => {
  if (!giftCard || !giftCard.expiryDate) return false;
  const now = new Date();
  if (giftCard.status === "Expired") return true;
  const isExpired = giftCard.expiryDate < now;
  if (isExpired)
    await GiftCard.findByIdAndUpdate(giftCard._id, {
      status: "Expired",
    });
  return isExpired;
};

module.exports = {
  createGiftCardCodeAndPassword,
  isGiftCardExpired
};