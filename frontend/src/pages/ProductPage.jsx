/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';

import Banner from '../components/global/Banner';
import Filter from '../components/listing/Filter';
import ProductGrid from '../components/listing/ProductGrid';
import NewsLetter from '../components/global/NewsLetter';
import bg from '../assets/bg.png';
import Pagination from '../components/global/Pagination';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllProducts } from '../apis/nonAuth/products';
import { getAllCategory } from '../apis/nonAuth/category';
import CategoryNavBar from '../components/global/CategoryNavBar';

const ProductPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const queryClient = useQueryClient();
  const [utils, setUtils] = useState({
    currentPage: 1,
    category: '',
  });

  const onPageChange = (value) => {
    setUtils((prevData) => {
      return { ...prevData, currentPage: value };
    });
  };
  const query = useQuery({
    queryKey: ['products', utils],
    queryFn: () => getAllProducts(utils),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!query.data?.pagination?.hasNextPage) return;

    const nextUtils = {
      ...utils,
      currentPage: utils.currentPage + 1,
    };

    queryClient.prefetchQuery({
      queryKey: ['products', nextUtils],
      queryFn: () => getAllProducts(nextUtils),
      staleTime: 30000,
    });
  }, [query.data, queryClient, utils]);

  const categoryQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAllCategory(),
  });

  // const handleSelectCategory = (value) => {
  //   setUtils((prevData) => {
  //     return { ...prevData, category: value };
  //   });
  // };

  useEffect(() => {
    if (categoryQuery.data) {
      setCategories(() => {
        return categoryQuery.data?.data?.map((item) => {
          return {
            label: item?.name,
            value: item?._id,
          };
        });
      });
    }
  }, [categoryQuery.data]);

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="w-full md:mt-24 mt-36">
          {/* navbar */}
          <CategoryNavBar setUtils={setUtils} />

          {/* right (ProductGrid component) */}
          <div className="w-full md:col-span-9 lg:col-span-10 bg-[#80530f]">
            {query.isLoading ? (
              <p>Loading..</p>
            ) : (
              <ProductGrid list={query.data?.data} />
            )}

            <div className="py-20">
              <Pagination
                totalItems={query.data?.pagination?.total || 0}
                itemsPerPage={10}
                onPageChange={onPageChange}
              />
            </div>
          </div>
          {/* </main> */}

          <div className="py-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default ProductPage;
