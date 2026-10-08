import { translateText } from '../context/TranslationContext';
import { LANGUAGECODES } from './staticData';

export const getTranslatedFields = async (obj) => {
  const fields = LANGUAGECODES.reduce((acc, lang) => {
    acc[lang] = obj[lang] || '';
    return acc;
  }, {});
  const codes = Object.keys(fields);
  const emptyValues = codes.filter((key) => !fields[key]?.trim());

  if (emptyValues.length) {
    if (emptyValues.length === codes.length) {
      return fields;
    }

    const value = emptyValues.includes('en')
      ? fields[codes.find((key) => fields[key]?.trim())]
      : fields.en;

    if (!value) {
      return fields;
    }

    const translations = {
      ...fields,
    };

    for (const lang of emptyValues) {
      const translatedValue = await translateText(value, lang);
      translations[`${lang}`] = translatedValue;
    }

    return translations;
  } else return fields;
};
