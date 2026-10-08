import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Import icons
import { getFilters } from '../../apis/nonAuth/filter';

const Filter = ({ utils, setUtils }) => {
  const [activeSection, setActiveSection] = useState(null);
  const { t, i18n } = useTranslation();

  const filterQuery = useQuery({
    queryKey: ['filter'],
    queryFn: () => getFilters(),
  });

  const [filters, setFilters] = useState({
    gender: [
      { label: t('filter.male'), value: 'Male' },
      { label: t('filter.female'), value: 'Female' },
      { label: t('filter.unisex'), value: 'Unisex' },
    ],
    price: [],
    discount: [],
  });

  useEffect(() => {
    if (!filterQuery.data?.data) return;

    const priceFilter = filterQuery.data.data.find(
      (list) => list?.filterName === 'Price'
    );
    const discountFilter = filterQuery.data.data.find(
      (list) => list?.filterName === 'Discount'
    );

    setFilters((prevData) => ({
      ...prevData,
      price:
        priceFilter?.subFilterName?.map((list) => ({
          label: `$0 - $${list}`,
          value: Number(list),
        })) || [],
      discount:
        discountFilter?.subFilterName?.map((list) => ({
          label: `Up to ${list}%`,
          value: Number(list),
        })) || [],
    }));
  }, [filterQuery.data?.data]);

  const handleCheckbox = (key, value) => {
    setUtils((prevData) => {
      const updatedValues = prevData[key];
      const newValues = updatedValues.includes(value)
        ? updatedValues.filter((list) => list !== value)
        : [...updatedValues, value];
      return { ...prevData, [key]: newValues };
    });
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="flex flex-col w-full bg-black p-4 h-[80vh] md:h-full overflow-y-auto">
      <div className="flex flex-col flex-grow space-y-4 z-30">
        {Object.keys(filters).map((filterKey) => (
          <div key={filterKey} className="md:pl-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection(filterKey)}
            >
              <h3 className="text-xl font-semibold text-white">
                {t(`filter.${filterKey}`)}
              </h3>
              {activeSection === filterKey ? (
                <ChevronUp className="text-white" />
              ) : (
                <ChevronDown className="text-white" />
              )}
            </div>
            {activeSection === filterKey && (
              <div className="flex flex-col mt-3 space-y-3 text-lg text-orange-200">
                {filters[filterKey]?.map((list, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={utils?.[filterKey]?.includes(list?.value)}
                      onClick={() => handleCheckbox(filterKey, list?.value)}
                    />
                    {list.label[i18n.language] || list.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Filter;
