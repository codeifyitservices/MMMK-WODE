/**
 * MONEY UTILITY - Strict integer-based monetary calculations
 * 
 * All monetary values MUST be handled in minor currency units (cents) to avoid
 * floating-point precision errors. This module provides utilities for:
 * - Converting between major and minor units
 * - Performing arithmetic on monetary values
 * - Rounding correctly for financial calculations
 */

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'MXN', 'AED', 'RUB', 'INR'];

// Currency units per major unit (how many "cents" in each currency)
// For most currencies: 100 minor units = 1 major unit
// For currencies like JPY, KRW: 1 major unit = 1 minor unit (no subunits)
const CURRENCY_MINOR_UNITS = {
  USD: 100, // cents
  EUR: 100, // cents
  GBP: 100, // pence
  CNY: 100, // fen
  MXN: 100, // centavos
  AED: 100, // fils
  RUB: 100, // kopeks
  INR: 100, // paise
};

/**
 * Convert a decimal amount to integer minor units (cents)
 * @param {number|string} amount - The decimal amount (e.g., 10.50 for $10.50)
 * @param {string} currencyCode - The currency code (e.g., 'USD')
 * @returns {number} - The amount in minor units (e.g., 1050 for $10.50)
 */
const toMinorUnits = (amount, currencyCode = 'USD') => {
  const numericAmount = Number(amount || 0);
  const minorUnits = CURRENCY_MINOR_UNITS[currencyCode] || 100;
  // Round to nearest minor unit to avoid precision issues
  return Math.round(numericAmount * minorUnits);
};

/**
 * Convert integer minor units to decimal major units
 * @param {number} minorAmount - The amount in minor units
 * @param {string} currencyCode - The currency code
 * @returns {number} - The amount in decimal form
 */
const toMajorUnits = (minorAmount, currencyCode = 'USD') => {
  const minorUnits = CURRENCY_MINOR_UNITS[currencyCode] || 100;
  const majorAmount = minorAmount / minorUnits;
  // Round to 2 decimal places for display
  return Math.round(majorAmount * 100) / 100;
};

/**
 * Add multiple monetary amounts in minor units
 * @param {number[]} amounts - Array of amounts in minor units
 * @returns {number} - Sum in minor units
 */
const sumMinor = (...amounts) => amounts.reduce((sum, a) => sum + (Number(a) || 0), 0);

/**
 * Subtract monetary amounts in minor units
 * @param {number} minuend - Amount to subtract from (minor units)
 * @param {number} subtrahend - Amount to subtract (minor units)
 * @returns {number} - Difference in minor units (non-negative)
 */
const subtractMinor = (minuend, subtrahend) => Math.max(0, (Number(minuend) || 0) - (Number(subtrahend) || 0));

/**
 * Calculate percentage of an amount in minor units
 * @param {number} amount - Amount in minor units
 * @param {number} percentage - Percentage (e.g., 10 for 10%)
 * @returns {number} - Percentage amount in minor units
 */
const percentageMinor = (amount, percentage) => {
  const numericAmount = Number(amount) || 0;
  const numericPercentage = Number(percentage) || 0;
  return Math.round((numericAmount * numericPercentage) / 100);
};

/**
 * Normalize a decimal amount to ensure 2 decimal places
 * Used for backward compatibility with existing decimal-based code
 * @param {number|string} value - The value to normalize
 * @returns {number} - Value with exactly 2 decimal places
 */
const normalizeAmount = (value) => {
  const numericValue = Number(value || 0);
  return Math.round(numericValue * 100) / 100;
};

/**
 * Validate that two amounts match within acceptable tolerance
 * @param {number} expected - Expected amount
 * @param {number} actual - Actual amount
 * @param {number} tolerance - Tolerance in minor units (default 1 = 0.01 in major units)
 * @returns {boolean} - Whether amounts match
 */
const amountsMatch = (expected, actual, tolerance = 1) => {
  return Math.abs((Number(expected) || 0) - (Number(actual) || 0)) <= tolerance;
};

/**
 * Convert amount from one currency to minor units in another currency
 * @param {number} amountInMinorUnits - Amount in source currency minor units
 * @param {string} sourceCurrency - Source currency code
 * @param {string} targetCurrency - Target currency code
 * @param {number} exchangeRate - Rate: targetCurrencyUnitsPerSourceCurrencyUnit
 * @returns {number} - Amount in target currency minor units
 */
const convertMinorUnits = (amountInMinorUnits, sourceCurrency, targetCurrency, exchangeRate) => {
  const sourceMinorUnits = CURRENCY_MINOR_UNITS[sourceCurrency] || 100;
  const targetMinorUnits = CURRENCY_MINOR_UNITS[targetCurrency] || 100;
  
  // Convert to major units
  const majorUnits = amountInMinorUnits / sourceMinorUnits;
  
  // Apply exchange rate
  const convertedMajor = majorUnits * (Number(exchangeRate) || 1);
  
  // Convert to target minor units
  return Math.round(convertedMajor * targetMinorUnits);
};

module.exports = {
  VALID_CURRENCIES,
  CURRENCY_MINOR_UNITS,
  toMinorUnits,
  toMajorUnits,
  sumMinor,
  subtractMinor,
  percentageMinor,
  normalizeAmount,
  amountsMatch,
  convertMinorUnits,
};
