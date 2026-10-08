import { createContext, useContext, useEffect, useState } from 'react';
import {
  BASE_CURRENCY,
  DEFAULT_RATES,
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
} from '../utils/currency';
import { detectLocale, LOCALE_PERSISTENCE_KEYS, getLanguageCodeFromName } from '../utils/localeDetection';
import i18n from '../i18n';

const CurrencyContext = createContext(null);

const STORAGE_KEY = LOCALE_PERSISTENCE_KEYS.CURRENCY;
const OVERRIDE_KEY = LOCALE_PERSISTENCE_KEYS.MANUAL_OVERRIDE;
const EXCHANGE_RATE_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window === 'undefined') return BASE_CURRENCY;

    return normalizeCurrency(window.localStorage.getItem(STORAGE_KEY));
  });
  const [rates, setRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    let isMounted = true;

    const initLocale = async () => {
      try {
        const isManualOverride = localStorage.getItem(OVERRIDE_KEY) === 'true';
        const hasDetected = localStorage.getItem('localeAutoDetected') === 'true';
        const currentSavedCurrency = localStorage.getItem(STORAGE_KEY);

        // If not manually overridden and either not detected yet OR currency is missing/defaulted to USD
        // Note: We check if it's 'USD' because USD is the default, and we want to try re-detecting
        // if it hasn't been definitively marked as "auto detected" yet.
        if (!isManualOverride && (!hasDetected || !currentSavedCurrency || currentSavedCurrency === BASE_CURRENCY)) {
          const detected = await detectLocale();
          if (isMounted && detected?.currency) {
            const normalized = normalizeCurrency(detected.currency);
            
            // Only update if it's different from current state
            if (normalized !== currency) {
              setCurrencyState(normalized);
              localStorage.setItem(STORAGE_KEY, normalized);
            }
          }
        }
      } catch (error) {
        console.error('Currency auto-detection failed:', error);
      }
    };

    initLocale();

    const fetchRates = async () => {
      try {
        const response = await fetch(EXCHANGE_RATE_URL);
        const data = await response.json();

        if (!isMounted || !data?.rates) return;

        const nextRates = SUPPORTED_CURRENCIES.reduce((acc, code) => {
          acc[code] = Number(data.rates?.[code] || DEFAULT_RATES[code] || 1);
          return acc;
        }, {});

        setRates({
          ...DEFAULT_RATES,
          ...nextRates,
          USD: 1,
        });
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };

    fetchRates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = (nextCurrency) => {
    setCurrencyState(normalizeCurrency(nextCurrency));
    localStorage.setItem(OVERRIDE_KEY, 'true');
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

const useCurrency = () => {
  return useContext(CurrencyContext);
};

export { CurrencyProvider, useCurrency };
