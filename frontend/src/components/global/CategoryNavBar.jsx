import { useLocation, useNavigate } from 'react-router-dom';
import { getUrl } from '../../utils/globalMethods';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTranslationContext } from '../../context/TranslationContext';
import { getCategoryLabel } from '../../utils/categoryTranslation';

const CategoryNavBar = ({ setUtils }) => {
  const { translateLanguage } = useTranslationContext();
  const navigate = useNavigate();
  const { categories } = useGlobalContext();
  const location = useLocation();

  const handleSelectCategory = (value) => {
    const newPath = `/product-listings?categories=${getUrl(value)}`;
    if (location.pathname !== '/product-listings') {
      return navigate(newPath);
    }
    setUtils((prevData) => {
      return { ...prevData, category: value };
    });
  };

  return (
    <div
      className={
        'flex justify-start gap-3 px-6 py-8 border-t border-b lg:px-10 overflow-x-auto whitespace-nowrap no-scrollbar'
      }
    >
      {categories.map((item, index) => {
        return (
          <button
            key={item._id || index}
            type="button"
            onClick={() => handleSelectCategory(item.name.en)}
            className="px-6 py-2 text-white transition duration-300 border-2 border-transparent rounded-md hover:border-white hover:bg-white hover:text-black whitespace-nowrap"
          >
            {getCategoryLabel(item, translateLanguage)}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryNavBar;
