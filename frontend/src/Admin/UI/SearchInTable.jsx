import { Input, Select, Space } from 'antd';
import { useEffect, useState } from 'react';
import { CommonButton } from './Buttons';
import { LuSearch } from 'react-icons/lu';

export default function SearchInTable({
  searchBy,
  onSearch,
  onClear,
  isLoading,
  defaultSearchType = 'includes',
  defaultSearchKeyIndex = 0,
  defaultSearchKey = null,
  defaultSearchValue = null,
  size = 'middle',
  showSearchType = false,
  showSearchBy = true,
  addonBefore = '',
  className = '',
}) {
  const [utils, setUtils] = useState({
    searchValue: null,
    searchType: defaultSearchType, // exact, includes
    ...(searchBy && {
      searchKey: searchBy[defaultSearchKeyIndex]?.value,
    }),
  });

  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  useEffect(() => {
    const toUpdate = { searchValue: defaultSearchValue };
    if (defaultSearchKey) toUpdate.searchKey = defaultSearchKey;
    if (defaultSearchType)
      toUpdate.searchType =
        defaultSearchType === 'exact' ? 'exact' : 'includes';

    updateUtils(toUpdate);
  }, [defaultSearchKey, defaultSearchValue, defaultSearchType]);

  return (
    <>
      <div className={`flex items-center justify-end gap-2 ${className}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(utils.searchValue, utils.searchKey);
          }}
          className="transition-all origin-right duration-500 ease-in-out overflow-hidden"
        >
          <Space.Compact className="flex items-end">
            {showSearchType && (
              <Select
                size={size}
                options={[
                  {
                    label: 'Search Type',
                    options: [
                      {
                        label: 'Exact Match Search',
                        value: 'exact',
                      },
                      {
                        label: 'Include in Text Search',
                        value: 'includes',
                      },
                    ],
                  },
                ]}
                labelRender={(item) => item.label.split(' ')[0]}
                popupClassName="min-w-[200px]"
                className="w-[100px]"
                value={utils.searchType}
                onChange={(value) => {
                  updateUtils({ searchType: value });
                }}
                disabled={isLoading}
              />
            )}
            {showSearchBy && (
              <Select
                size={size}
                options={[
                  {
                    label: 'Search By',
                    options: searchBy,
                  },
                ]}
                popupClassName="min-w-[200px]"
                className="w-[150px]"
                value={utils.searchKey}
                onChange={(value) => {
                  updateUtils({ searchKey: value });
                }}
                disabled={isLoading}
              />
            )}
            <Input
              addonBefore={addonBefore}
              // prefix={"Document"}
              size={size}
              value={utils.searchValue}
              onChange={(e) => {
                updateUtils({ searchValue: e.target.value });
              }}
              onSearch={(value) =>
                onSearch(utils.searchType, utils.searchKey, value)
              }
              allowClear
              onClear={onClear}
              placeholder="Search here ..."
              className="max-w-[200px]"
              disabled={isLoading}
            />
            <CommonButton
              htmlType="submit"
              loading={isLoading}
              icon={<LuSearch />}
            />
          </Space.Compact>
        </form>
      </div>
    </>
  );
}
