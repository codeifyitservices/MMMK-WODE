const crypto = require("crypto");

const percentageValue = (value, percentage) =>
  percentage == 0 ? value : value - ((value * percentage) / 100).toFixed(2);

const getPercentageValueOf = (value, percentage) =>
  value - (value * percentage) / 100;

function generateUniqueOrderId() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp to reduce duplicates
  const uniqueId = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4-character random hex

  return `OD${randomNumber}${timestamp}${uniqueId}`;
}

module.exports = {
  percentageValue,
  getPercentageValueOf,
  generateUniqueOrderId,
};
