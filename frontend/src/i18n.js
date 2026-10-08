import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translationEN.json';
import translationAR from './locales/ar/translationAR.json';
import translationRU from './locales/ru/translationRU.json';
import translationFR from './locales/fr/translationFR.json';
import translationES from './locales/es/translationES.json';
import translationDE from './locales/de/translationDE.json';
import translationJA from './locales/ja/translationJA.json';
import translationPT from './locales/pt/translationPT.json';
import translationIT from './locales/it/translationIT.json';
import translationZH from './locales/zh/translationZH.json';

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
  ru: {
    translation: translationRU,
  },
  fr: {
    translation: translationFR,
  },
  es: {
    translation: translationES,
  },
  de: {
    translation: translationDE,
  },
  ja: {
    translation: translationJA,
  },
  zh: {
    translation: translationZH,
  },
  pt: {
    translation: translationPT,
  },
  it: {
    translation: translationIT,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
