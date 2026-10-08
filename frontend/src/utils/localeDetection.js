import axios from 'axios';
import { COUNTRY_LOCALE_MAP, DEFAULT_LOCALE } from '../countryToCurrencyMap';
import { LANGUAGES } from './staticData';

const DETECTION_API = `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api/v1/locale-detect`;
let cachedPromise = null;

export const detectLocale = async () => {
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    try {
      const response = await axios.get(DETECTION_API);
      const countryCode = response.data?.country;

      if (!countryCode) {
        console.warn('Locale detection: No country code returned from backend');
        return DEFAULT_LOCALE;
      }

      const mapped = COUNTRY_LOCALE_MAP[countryCode.toUpperCase()];
      if (mapped) {
        return mapped;
      }

      console.info(`Locale detection: Country ${countryCode} not mapped, using default.`);
      return DEFAULT_LOCALE;
    } catch (error) {
      console.error('Locale detection failed via backend:', error.message);
      return DEFAULT_LOCALE;
    }
  })();

  return cachedPromise;
};

export const getLanguageCodeFromName = (name) => {
  const lang = LANGUAGES.find((l) => l.name === name);
  return lang ? lang.code : 'en';
};

export const LOCALE_PERSISTENCE_KEYS = {
  LANGUAGE: 'translateLanguage',
  CURRENCY: 'selectedCurrency',
  MANUAL_OVERRIDE: 'manualLocaleOverride',
};
