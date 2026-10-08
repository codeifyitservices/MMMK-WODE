const axios = require("axios");

// Tabby Base URLs by region:
// UAE & Kuwait: https://api.tabby.ai
// Saudi Arabia: https://api.tabby.sa
const TABBY_API_URL = process.env.TABBY_API_URL || "https://api.tabby.ai/api/v2/";
const TABBY_PUBLIC_KEY = process.env.TABBY_PUBLIC_KEY;
const TABBY_SECRET_KEY = process.env.TABBY_SECRET_KEY;
const TABBY_MERCHANT_CODE = process.env.TABBY_MERCHANT_CODE;

const tabbyApi = axios.create({
  baseURL: TABBY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Create a Tabby Checkout Session
 * @param {Object} paymentData 
 * @returns {Promise<Object>}
 */
const createCheckoutSession = async (paymentData) => {
  try {
    const response = await tabbyApi.post(
      "checkout",
      {
        payment: paymentData.payment,
        lang: paymentData.lang || "en",
        merchant_code: TABBY_MERCHANT_CODE,
        merchant_urls: paymentData.merchant_urls,
      },
      {
        headers: {
          Authorization: `Bearer ${TABBY_PUBLIC_KEY}`,
          'X-Merchant-Code': TABBY_MERCHANT_CODE
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Tabby Payment Details
 * @param {string} paymentId 
 * @returns {Promise<Object>}
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const response = await tabbyApi.get(`payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${TABBY_SECRET_KEY}`,
        'X-Merchant-Code': TABBY_MERCHANT_CODE
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Capture Tabby Payment
 * @param {string} paymentId 
 * @param {number} amount 
 * @returns {Promise<Object>}
 */
const capturePayment = async (paymentId, amount) => {
  try {
    const response = await tabbyApi.post(
      `payments/${paymentId}/captures`,
      { amount: amount.toString() },
      {
        headers: {
          Authorization: `Bearer ${TABBY_SECRET_KEY}`,
          'X-Merchant-Code': TABBY_MERCHANT_CODE
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createCheckoutSession,
  getPaymentDetails,
  capturePayment,
};

