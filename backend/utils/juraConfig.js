const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const getJuraConfig = () => {
  const baseUrl =
    process.env.JURA_URL?.trim() || process.env.JURAA_URL?.trim() || process.env.DEPOTER_URL?.trim();
  const orderUrl =
    process.env.JURA_ORDER_URL?.trim() ||
    process.env.JURAA_ORDER_URL?.trim() ||
    "";
  const apiKey =
    process.env.JURA_API_KEY?.trim() ||
    process.env.JURAA_API_KEY?.trim() ||
    process.env.DEPOTER_API_KEY?.trim();

  if (!baseUrl) {
    throw new Error("Jura base URL is missing");
  }

  if (!apiKey) {
    throw new Error("Jura API key is missing");
  }

  return {
    baseUrl,
    orderUrl,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Key: apiKey,
    },
  };
};

module.exports = { getJuraConfig };
