import { useTranslationContext } from '../../context/TranslationContext';
import { LANGUAGES } from '../../utils/staticData';
import HeaderDropdown from './HeaderDropdown';

const LanguageDropdown = () => {
  const { translateLanguage, updateTranslationContext } = useTranslationContext();

  const changeLanguage = (lng) => {
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    updateTranslationContext({ translateLanguage: lng, isManual: true });
  };

  return (
    <HeaderDropdown
      label="Language"
      value={translateLanguage}
      onChange={changeLanguage}
      options={LANGUAGES.map((language) => ({
        value: language.code,
        label: language.name,
      }))}
    />
  );
};

export default LanguageDropdown;
