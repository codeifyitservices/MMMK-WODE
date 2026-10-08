import { getUrl } from '../../utils/globalMethods';
import { Divider, Drawer } from 'antd';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTranslationContext } from '../../context/TranslationContext';
import { getCategoryLabel } from '../../utils/categoryTranslation';

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
      <div className="text-base leading-10 text-center cursor-pointer md:text-xl">
        {categories.map((item, index) => (
          <div
            key={index}
            className="text-left px-4 py-2 cursor-pointer hover:text-primary relative"
          >
            <Link to={`/product-listings?categories=${getUrl(item.name.en)}`}>
              {getCategoryLabel(item, translateLanguage)}
            </Link>
          </div>
        ))}
      </div>
      <Divider />
      <div className="text-base leading-10 text-center md:text-xl flex flex-col gap-4 text-black hover:text-black">
        <Link to={'/about-us'}>{common.aboutUs}</Link>
        <Link to={'/gift-cards'}>{common.giftCards}</Link>
        <Link to={'/'}>{common.mmmk}</Link>
        <Link to={'/contact-us'}>{common.contactUs}</Link>
      </div>
    </Drawer>
  );
}
