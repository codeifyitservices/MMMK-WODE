import { getUrl } from '../../utils/globalMethods';
import { Divider, Drawer } from 'antd';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTranslationContext } from '../../context/TranslationContext';
import { getCategoryLabel } from '../../utils/categoryTranslation';
import LanguageDropdown from './LanguageDropdown';
import CurrencyDropdown from './CurrencyDropdown';

export default function MenuDrawer({ isOpen, onClose }) {
  const {
    translateLanguage,
    content: { common },
  } = useTranslationContext();
  const { categories } = useGlobalContext();

  return (
    <Drawer
      placement={'left'}
      width={350}
      onClose={onClose}
      open={isOpen}
      styles={{ body: { height: '100%' } }}
    >
      {/* Language & Currency Preferences - visible only on Mobile & Tablet (< lg), hidden on Desktop */}
      <div className="block lg:hidden">
        <div className="px-2 pt-1 pb-2">
          <p className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2.5">
            {translateLanguage === 'ar' ? 'التفضيلات' : 'Preferences'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1 font-medium">
                Language
              </span>
              <LanguageDropdown theme="light" />
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-1 font-medium">
                Currency
              </span>
              <CurrencyDropdown theme="light" />
            </div>
          </div>
        </div>

        <Divider className="my-3" />
      </div>

      {/* Categories */}
      <div className="text-base leading-10 text-center cursor-pointer md:text-xl">
        {categories.map((item, index) => (
          <div
            key={index}
            className="text-left px-4 py-2 cursor-pointer hover:text-primary relative"
          >
            <Link
              to={`/product-listings?categories=${getUrl(item.name.en)}`}
              onClick={onClose}
            >
              {getCategoryLabel(item, translateLanguage)}
            </Link>
          </div>
        ))}
      </div>

      <Divider className="my-3" />

      {/* Navigation Links */}
      <div className="text-base leading-10 text-center md:text-xl flex flex-col gap-4 text-black hover:text-black">
        <Link to={'/about-us'} onClick={onClose}>{common.aboutUs}</Link>
        <Link to={'/gift-cards'} onClick={onClose}>{common.giftCards}</Link>
        <Link to={'/'} onClick={onClose}>{common.mmmk}</Link>
        <Link to={'/contact-us'} onClick={onClose}>{common.contactUs}</Link>
      </div>
    </Drawer>
  );
}
