/* eslint-disable compat/compat */
import { useState } from 'react';
import { Select } from 'antd';
import { searchProducts } from '../../apis/nonAuth/products';
import { useNavigate } from 'react-router-dom';
import { BsSearch } from 'react-icons/bs';
let timeout;
let currentValue;
const fetchData = (value, callback) => {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
  currentValue = value;
  const fake = async () => {
    const results = await searchProducts(value, 10);

    if (currentValue === value) {
      const resultData =
        results?.reduce((acc, item) => {
          if (!acc[item.type]) acc[item.type] = [];
          acc[item.type].push({
            value: item.value,
            label: item.label,
            key: `${item.type}-${item.value}`,
          });
          return acc;
        }, {}) || {};
      const data = Object.keys(resultData).map((key) => ({
        label: key,
        options: resultData[key],
      }));
      callback(data);
    }
  };
  if (value) {
    timeout = setTimeout(fake, 800);
  } else {
    callback([]);
  }
};
export default function SearchBox(props) {
  const [data, setData] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const navigateToListingSearch = () => {
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) return;
    navigate(`/product-listings?q=${encodeURIComponent(trimmedValue)}`);
    setSearchValue('');
    setData([]);
    if (props.onResultClick) props.onResultClick();
  };

  const handleSearch = (newValue) => {
    setSearchValue(newValue);
    fetchData(newValue, setData);
  };
  const handleChange = (newValue) => {
    setSearchValue(newValue || '');
  };
  const handleNavigate = (option) => {
    const [type, label] = option.key.split('-');
    if (type === 'Category') {
      navigate(`/product-listings?categories=${encodeURIComponent(option.label)}`);
    } else if (type === 'Product') {
      navigate(`/product-details/${option.value}`);
    }
    setSearchValue('');
    setData([]);
    if (props.onResultClick) props.onResultClick();
  };
  return (
    <Select
      showSearch
      value={searchValue}
      searchValue={searchValue}
      placeholder={props.placeholder || 'Search...'}
      aria-label={props['aria-label'] || 'Search products'}
      style={props.style}
      defaultActiveFirstOption={false}
      suffixIcon={<BsSearch className="text-gray-900" size={20} />}
      size="large"
      variant="borderless"
      className="border-b-2 border-b-gray-900 block text-lg w-[90vw] mx-auto max-w-[800px] text-left"
      popupClassName="text-2xl"
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      onSelect={(v, option) => handleNavigate(option)}
      onClear={() => {
        setSearchValue('');
        setData([]);
      }}
      onInputKeyDown={(event) => {
        if (event.key === 'Escape') {
          setSearchValue('');
          setData([]);
        }
        if (event.key === 'Enter') {
          navigateToListingSearch();
        }
      }}
      notFoundContent={null}
      options={data}
    />
  );
}
