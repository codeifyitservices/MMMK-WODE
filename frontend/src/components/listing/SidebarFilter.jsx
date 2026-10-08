import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getFilters } from '../../apis/nonAuth/filter';
import {
  translate,
  useTranslationContext,
} from '../../context/TranslationContext';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCategoryLabel } from '../../utils/categoryTranslation';

const SidebarFilter = ({ utils, setUtils, categories = [] }) => {
  const { categories: allCategories } = useGlobalContext();
  const {
    content: { common },
    translateLanguage,
  } = useTranslationContext();

  const filterQuery = useQuery({
    queryKey: ['filter', categories],
    queryFn: () => getFilters({ categories }),
  });

  const [filters, setFilters] = useState({});

  const handleTranslateFilters = async (data, language) => {
    const newFilters = {};

    for (const filter of data) {
      const filterKey = filter.filterName.toLowerCase();

      if (filter.filterName === 'Price') {
        newFilters[filterKey] =
          filter.options?.map((list, index) => ({
            label: `$${list.from} - $${list.to} (${filter.counts[index]})`,
            value: `${list.from},${list.to}`,
          })) || [];
      } else if (filter.filterName === 'Discount') {
        const translatedDiscount = await translate(
          filter.options.map((list) => `Up to ${list}%`),
          language
        );
        newFilters[filterKey] =
          filter.options?.map((list, index) => ({
            label: `${translatedDiscount[index]} (${filter.counts[index]})`,
            value: Number(list),
          })) || [];
      } else if (filter.filterName === 'Gender') {
        const translatedGenders = await translate(filter.options, language);
        newFilters[filterKey] = translatedGenders.map((item, index) => ({
          label: `${item} (${filter.counts[index]})`,
          value: filter.options[index],
        }));
      } else if (
        filter.filterName === 'Rating' ||
        filter.filterName === 'rating'
      ) {
        newFilters[filterKey] =
          filter.options?.map((list, index) => ({
            label: `${list} Stars & Up (${filter.counts[index]})`,
            value: Number(list),
          })) || [];
      } else {
        // Handle custom filters and brand
        const translatedOptions = await translate(filter.options, language);
        newFilters[filterKey] =
          filter.options?.map((list, index) => ({
            label: `${translatedOptions[index] || list} (${filter.counts[index]})`,
            value: list,
          })) || [];
      }
    }

    setFilters(newFilters);
  };

  useEffect(() => {
    if (!filterQuery.data?.data) return;
    handleTranslateFilters(filterQuery.data.data, translateLanguage);
  }, [filterQuery.data?.data, translateLanguage]);

  const handleCheckbox = (key, value) => {
    setUtils((prevData) => {
      const updatedValues = prevData[key] || [];
      const newValues = updatedValues.includes(value)
        ? updatedValues.filter((list) => list !== value)
        : [...updatedValues, value];
      return { ...prevData, currentPage: 1, [key]: newValues };
    });
  };

  // Clear all filters function
  const clearAllFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    setUtils((prevData) => ({
      ...prevData,
      currentPage: 1,
      categories: [],
      ...clearedFilters,
    }));
  };

  // Clear specific filter function
  const clearSpecificFilter = (filterType) => {
    setUtils((prevData) => ({
      ...prevData,
      currentPage: 1,
      [filterType]: [],
    }));
  };

  const categoryOptions =
    allCategories?.map((category) => ({
      label: getCategoryLabel(category, translateLanguage),
      value: category?.name?.en,
    })) || [];

  return (
    <div className="flex flex-col w-full bg-black p-4 h-[80vh] md:h-full overflow-y-auto">
      <div className="flex flex-col flex-grow space-y-4">
        {/* Clear All Filters Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {common.filters || 'Filters'}
          </h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            {common.clearAll || 'Clear All'}
          </button>
        </div>

        {categoryOptions.length > 0 && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl mb-3 mt-2">
                {common.collection || 'Categories'}
              </h3>
              {utils?.categories?.length > 0 && (
                <button
                  onClick={() => clearSpecificFilter('categories')}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {categoryOptions.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={utils?.categories?.includes(item.value)}
                    onChange={() => handleCheckbox('categories', item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Filters */}
        {Object.entries(filters).map(
          ([filterKey, filterOptions]) =>
            filterOptions.length > 0 && (
              <div key={filterKey}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl mb-3 mt-6">
                    {common[filterKey] ||
                      filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                  </h3>
                  {utils?.[filterKey]?.length > 0 && (
                    <button
                      onClick={() => clearSpecificFilter(filterKey)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {filterOptions.map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={utils?.[filterKey]?.includes(item.value)}
                        onChange={() => handleCheckbox(filterKey, item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default SidebarFilter;
