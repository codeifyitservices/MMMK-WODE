export const BASE_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CNY',
  'PHP',
  'AED',
  'RUB',
  'INR',
];

export const DEFAULT_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.24,
  PHP: 57.5,
  AED: 3.67,
  RUB: 92,
  INR: 83,
};

export const CURRENCY_LABELS = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CNY: 'CNY',
  PHP: 'PHP',
  AED: 'AED',
  RUB: 'RUB',
  INR: 'INR',
};

export const normalizeCurrency = (value) => {
  const code = String(value || '')
    .trim()
    .toUpperCase();

  return SUPPORTED_CURRENCIES.includes(code) ? code : BASE_CURRENCY;
};

export const convertPrice = (
  amount,
  selectedCurrency = BASE_CURRENCY,
  rates = DEFAULT_RATES
) => {
  const numericAmount = Number(amount || 0);
  const currency = normalizeCurrency(selectedCurrency);
  const rate = Number(rates?.[currency] || DEFAULT_RATES[currency] || 1);

  return Number((numericAmount * rate).toFixed(2));
};

export const convertStoredPrice = (
  amount,
  sourceCurrency = BASE_CURRENCY,
  selectedCurrency = BASE_CURRENCY,
  rates = DEFAULT_RATES
) => {
  const numericAmount = Number(amount || 0);
  const source = normalizeCurrency(sourceCurrency);
  const target = normalizeCurrency(selectedCurrency);

  if (source === target) return Number(numericAmount.toFixed(2));

  const sourceRate = Number(rates?.[source] || DEFAULT_RATES[source] || 1);
  const targetRate = Number(rates?.[target] || DEFAULT_RATES[target] || 1);
  const baseAmount = sourceRate ? numericAmount / sourceRate : numericAmount;

  return Number((baseAmount * targetRate).toFixed(2));
};

export const formatPrice = (amount, selectedCurrency = BASE_CURRENCY) => {
  const currency = normalizeCurrency(selectedCurrency);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};
