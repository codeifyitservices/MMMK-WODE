import { Drawer } from 'antd';
import BannerSlider from './BannerSlider';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Link } from 'react-router-dom';
import { getUrl } from '../../utils/globalMethods';
import SearchBox from './SearchBox';
import { useTranslationContext } from '../../context/TranslationContext';
import { getCategoryLabel } from '../../utils/categoryTranslation';

export default function SearchDrawer({ isOpen, onClose }) {
  const {
    translateLanguage,
    content: { common },
  } = useTranslationContext();
  const { categories } = useGlobalContext();
  return (
    <Drawer
      placement="top"
      onClose={onClose}
      open={isOpen}
      height="100vh"
      styles={{ height: '100%' }}
      style={{ padding: 0 }}
    >
      {/* Search Bar */}
      <SearchBox onResultClick={onClose} />
      {/* BannerSlider */}
      <div className="flex flex-col justify-between w-full gap-5 mt-10 lg:flex-row">
        <div className="w-full lg:w-[60%] mt-6">
          <BannerSlider />
        </div>
        {/* Right - Trending Searches */}
        <div className="w-full lg:w-[40%]">
          <div className="p-4">
            <h2 className="mb-4 font-semibold text-3rd">
              {common.trendingSearches}
            </h2>
            <ul className="space-y-4">
              {categories.map((item) => (
                <Link
                  key={item._id}
                  to={`/product-listings?categories=${getUrl(item.name.en)}`}
                  onClick={onClose}
                  className="flex items-center justify-between pb-2 border-b border-gray-300"
                >
                  <span className="text-base text-2nd">
                    {getCategoryLabel(item, translateLanguage)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
