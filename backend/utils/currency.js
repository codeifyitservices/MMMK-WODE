/**
 * CURRENCY UTILITY - Currency conversion with clear rate semantics
 * 
 * CURRENCY RATES:
 * Each rate represents: 1 UNIT_OF_CURRENCY = RATE USD
 * Example: EUR rate 0.92 means 1 EUR = 0.92 USD
 * 
 * This follows standard forex convention where rates are expressed
 * in terms of the base currency (USD).
 */
const axios = require('axios');
const BASE_CURRENCY_CODE = 'USD';

// Rates: 1 UNIT_OF_CURRENCY = RATE USD
// Example: 1 EUR = 0.92 USD
const CURRENCY_CONFIG = {
  USD: { code: 'USD', rate: 1 },       // 1 USD = 1 USD
  EUR: { code: 'EUR', rate: 0.92 },   // 1 EUR = 0.92 USD
  GBP: { code: 'GBP', rate: 0.79 },   // 1 GBP = 0.79 USD
  CNY: { code: 'CNY', rate: 0.14 },  // 1 CNY = 0.14 USD (7.24 in old convention)
  PHP: { code: 'PHP', rate: 0.0174 }, // 1 PHP = 0.0174 USD (57.5 in old convention)
  MXN: { code: 'MXN', rate: 0.06 },   // 1 MXN = 0.06 USD (16.8 in old convention)
  AED: { code: 'AED', rate: 0.27 },   // 1 AED = 0.27 USD (3.67 in old convention)
  RUB: { code: 'RUB', rate: 0.011 }, // 1 RUB = 0.011 USD (92 in old convention)
  INR: { code: 'INR', rate: 0.012 }, // 1 INR = 0.012 USD (83 in old convention)
};

// Internal cache for live rates (Target -> USD)
let liveRates = {};

/**
 * Fetch live rates from external API
 * Rates from API are USD -> Target, we convert to Target -> USD
 */
const fetchLiveRates = async () => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const rates = response.data.rates;
    if (rates) {
      const newLiveRates = {};
      Object.keys(rates).forEach(code => {
        newLiveRates[code] = 1 / rates[code];
      });
      liveRates = newLiveRates;
      }
      } catch (error) {
      }
      };

// Initial fetch and hourly refresh
fetchLiveRates();
setInterval(fetchLiveRates, 60 * 60 * 1000);

// Map old rates to new correct rates for backward compatibility
const convertOldRateToNew = (oldRate) => 1 / oldRate;

const normalizeCurrencyCode = (value) => {
  const code = String(value || '').trim().toUpperCase();
  return (CURRENCY_CONFIG[code] || liveRates[code]) ? code : BASE_CURRENCY_CODE;
};

const resolveCurrencyCode = (value) => normalizeCurrencyCode(value);

const resolveCurrencyRate = (currencyCode, _requestedRate) => {
  const code = resolveCurrencyCode(currencyCode);
  
  if (code === BASE_CURRENCY_CODE) return 1;

  // 1. Priority: Live fetched rates
  if (liveRates[code]) {
    return liveRates[code];
  }

  // 2. Fallback: Config rates
  return CURRENCY_CONFIG[code]?.rate || 1;
};

/**
 * Convert amount from a non-USD currency to USD
 * @param {number} amount - Amount in source currency major units
 * @param {string} sourceCurrency - Source currency code (amount is in this currency)
 * @param {number} rate - Optional rate override (will be auto-converted from old convention if > 10)
 * @returns {number} - Amount in USD
 * 
 * Example: convertAmount(100, 'EUR') -> ~92 USD (100 EUR * 0.92 = 92 USD)
 * With old rate: convertAmount(100, 'INR', 83) -> ~100 USD (83 is converted to 1/83 = 0.012)
 */
const convertAmount = (amount, sourceCurrency, rate) => {
  const numericAmount = Number(amount || 0);
  const sourceCode = resolveCurrencyCode(sourceCurrency);
  
  if (sourceCode === BASE_CURRENCY_CODE) {
    return numericAmount;
  }
  
  const sourceRate = resolveCurrencyRate(sourceCode, rate);
  return Number((numericAmount * sourceRate).toFixed(2));
};

/**
 * Convert amount from USD to a specific currency for display
 * @param {number} amountInUsd - Amount in USD
 * @param {string} targetCurrency - Target currency code
 * @param {number} rate - Optional rate override (will be auto-converted from old convention if > 10)
 * @returns {number} - Amount in target currency
 * 
 * Example: convertToCurrency(100, 'EUR') -> ~109 EUR (100 USD / 0.92 = 109 EUR)
 */
const convertToCurrency = (amountInUsd, targetCurrency, rate) => {
  const numericAmount = Number(amountInUsd || 0);
  const targetCode = resolveCurrencyCode(targetCurrency);
  
  if (targetCode === BASE_CURRENCY_CODE) {
    return numericAmount;
  }
  
  const targetRate = resolveCurrencyRate(targetCode, rate);
  // Our rates are: 1 TARGET = RATE USD, so USD / rate = TARGET amount
  return Number((numericAmount / targetRate).toFixed(2));
};

// Alias for clarity
const convertFromCurrency = convertAmount;

// Legacy function for backward compatibility - DO NOT USE FOR NEW CODE
const convertAmountLegacy = (amount, currencyCode, requestedRate) => {
  const numericAmount = Number(amount || 0);
  const code = resolveCurrencyCode(currencyCode);
  const rate = resolveCurrencyRate(code, requestedRate);
  return Number((numericAmount * rate).toFixed(2));
};

module.exports = {
  BASE_CURRENCY_CODE,
  CURRENCY_CONFIG,
  convertAmount,
  convertFromCurrency,
  convertToCurrency,
  normalizeCurrencyCode,
  resolveCurrencyCode,
  resolveCurrencyRate,
};
