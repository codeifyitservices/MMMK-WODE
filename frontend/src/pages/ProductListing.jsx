import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { MdOutlineFilterList } from 'react-icons/md';

import Banner from '../components/global/Banner';
import ProductGrid from '../components/listing/ProductGrid';
import bg from '../assets/bg.png';
import Pagination from '../components/global/Pagination';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAllProducts } from '../apis/nonAuth/products';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalProvider';
import {
  translateText,
  useTranslationContext,
} from '../context/TranslationContext';

import SkeletonCard from '../components/listing/SkeletonCard';
import { getCategoryLabel } from '../utils/categoryTranslation';
import { applyPageSeo, removeJsonLd } from '../utils/seoHelper';
import { resolveAssetUrl } from '../utils/assetUrl';

const SidebarFilter = lazy(() => import('../components/listing/SidebarFilter').catch(() => { window.location.reload(); }));
const NewsLetter = lazy(() => import('../components/global/NewsLetter').catch(() => { window.location.reload(); }));

const knownFilterParams = [
  'categories',
  'gender',
  'brand',
  'price',
  'discount',
  'category',
  'sort',
  'q',
];

const getListingUtilsFromSearchParams = (searchParams) => {
  const customFilters = {};
  for (const [key, value] of searchParams.entries()) {
    if (!knownFilterParams.includes(key)) {
      customFilters[key] = value ? value.split(',') : [];
    }
  }

  const searchedCategories = searchParams.get('categories');

  return {
    currentPage: 1,
    categories: searchedCategories?.split(',').map((item) => item.trim()) || [],
    gender: searchParams.get('gender')?.split(',') || [],
    price: searchParams.get('price')?.split(',') || [],
    discount: searchParams.get('discount')?.split(',') || [],
    category: searchParams.get('category')?.split(',') || [],
    brand: searchParams.get('brand')?.split(',') || [],
    sort: searchParams.get('sort') || '',
    q: searchParams.get('q') || null,
    ...customFilters,
  };
};

const ProductListing = () => {
  const { categories } = useGlobalContext();
  const {
    content: { common },
    translateLanguage,
  } = useTranslationContext();

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [utils, setUtils] = useState(() =>
    getListingUtilsFromSearchParams(searchParams)
  );
  const didLoadProductsRef = useRef(false);

  useEffect(() => {
    setUtils(getListingUtilsFromSearchParams(searchParams));
  }, [searchParams]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [resultsText, setResultsText] = useState(null);

  const onPageChange = (value) => {
    setUtils((prevData) => {
      return { ...prevData, currentPage: value };
    });
    const element = document.getElementById('categories-navbar');
    if (element && window.innerWidth >= 1024) {
      element.scrollIntoView({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // fetching paginated products
  const query = useQuery({
    queryKey: ['products', utils, translateLanguage],
    queryFn: () => getAllProducts(utils, { translateLanguage }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const getResultText = async (length, total, language) => {
    if (!total) return null;
    const text = `${length} of ${total} results`;
    const newText =
      language === 'en' ? text : await translateText(text, language);
    setResultsText(newText);
  };

  useEffect(() => {
    getResultText(
      query.data?.data?.length,
      query.data?.pagination?.total,
      translateLanguage
    );
  }, [query.data, translateLanguage]);

  useEffect(() => {
    const categoryTerms = [
      ...(utils.categories || []),
      ...(utils.category || []),
    ].map((c) => String(c).trim().toLowerCase());

    const matchedCategories =
      categories?.filter((item) => {
        const nameEn = String(item?.name?.en || '').toLowerCase();
        const slug = String(item?.slug || '').toLowerCase();
        const id = String(item?._id || '').toLowerCase();
        return (
          categoryTerms.includes(nameEn) ||
          (slug && categoryTerms.includes(slug)) ||
          categoryTerms.includes(id)
        );
      }) || [];

    if (matchedCategories.length > 0) {
      setSelectedCategory(
        matchedCategories
          .map((item) => getCategoryLabel(item, translateLanguage))
          .join(', ')
      );

      if (matchedCategories.length === 1) {
        const cat = matchedCategories[0];
        const catName = getCategoryLabel(cat, translateLanguage) || cat.name?.en || 'Category';
        const catImg = resolveAssetUrl(cat.ogImage || cat.image);
        const schemaToUse =
          cat.seoSchema ||
          JSON.stringify(
            {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: cat.metaTitle || catName,
              description:
                cat.metaDescription ||
                `Explore luxury collections in ${catName} at MMMK WODE.`,
              url:
                cat.canonicalUrl ||
                (typeof window !== 'undefined'
                  ? `${window.location.origin}/product-listings?categories=${encodeURIComponent(cat.name?.en || catName)}`
                  : ''),
              image: catImg,
            },
            null,
            2
          );

        applyPageSeo({
          title: cat.metaTitle || `${catName} | MMMK WODE`,
          description:
            cat.metaDescription ||
            `Explore our luxury ${catName} collection at MMMK WODE.`,
          keywords: cat.metaKeywords,
          canonicalUrl: cat.canonicalUrl,
          ogImage: catImg,
          schema: schemaToUse,
        });
      } else {
        applyPageSeo({
          title: 'Shop Collections | MMMK WODE',
          description:
            'Browse curated product listings across luxury fragrance, jewelry, and swimwear at MMMK WODE.',
        });
        removeJsonLd('mmmk-page-schema');
      }
    } else {
      setSelectedCategory(utils.q ? `Search: ${utils.q}` : null);
      applyPageSeo({
        title: utils.q
          ? `Search: ${utils.q} | MMMK WODE`
          : 'Shop Collections | MMMK WODE',
        description:
          'Browse curated product listings across luxury fragrance, jewelry, and swimwear at MMMK WODE.',
      });
      removeJsonLd('mmmk-page-schema');
    }

    setSelectedCategoryIds(matchedCategories.map((item) => item._id));

    return () => {
      removeJsonLd('mmmk-page-schema');
    };
  }, [categories, translateLanguage, utils.categories, utils.category, utils.q]);

  const handleSelectCategory = (item) => {
    const categoryName = item?.name?.en;
    if (!categoryName) return;

    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);
      next.set('categories', categoryName);
      next.delete('page');
      return next;
    });

    setUtils((prevData) => ({
      ...prevData,
      categories: [categoryName],
      currentPage: 1,
    }));
  };

  const toggleFilterSidebar = () => {
    setIsFilterSidebarOpen((prevState) => !prevState);
  };

  return (
    <div className="w-full">
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>
      <Banner bg={bg} blurOverlay={false}>
        <div className="w-full mt-20 sm:mt-24 md:mt-28 lg:mt-32">
          {/* Navbar */}
          <div
            id="categories-navbar"
            className="hidden lg:flex items-center z-30 justify-start gap-3 px-6 py-8 border-t border-b lg:px-10 overflow-x-auto whitespace-nowrap no-scrollbar"
          >
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((item) => {
                if (!item || !item.name) return null;
                return (
                  <button
                    key={item._id || item.name?.en}
                    onClick={() => handleSelectCategory(item)}
                    className={`${
                      (utils.categories || []).includes(item.name?.en)
                        ? 'bg-white text-black'
                        : 'text-white'
                    } px-6 py-2 transition duration-300 border-2 border-transparent rounded-md hover:border-white hover:bg-white hover:text-black whitespace-nowrap`}
                  >
                    {getCategoryLabel(item, translateLanguage)}
                  </button>
                );
              })
            ) : (
              <div className="text-white">{common.loadingCategories}</div>
            )}
          </div>

          {/* Sort and breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between w-full gap-3 px-4 py-3 border-t border-b text-2nd md:px-10 lg:px-20 md:py-4">
            <div className="w-full md:w-auto">
              <div className="flex flex-wrap gap-3 mt-2 text-lg md:text-xl md:flex-nowrap md:gap-5">
                <p>
                  {/* {query.data?.pagination.total} {t("productDetails.ofResults")} */}
                  {resultsText}
                </p>
                <p className="text-base font-bold md:text-xl">
                  {common.home}{' '}
                  {selectedCategory ? ` > ${selectedCategory}` : ''}
                </p>
              </div>
            </div>
            
          </div>

          {/* Main Content Section */}
          <main className="grid w-full grid-cols-1 xl:grid-cols-12">
            <div className="w-full xl:col-span-2 xl:border-b-0">
              {/* Desktop Filter */}
              <div className="hidden xl:block">
                <Suspense
                  fallback={
                    <div className="h-[80vh] w-full bg-black p-4 text-white">
                      {common.loading}
                    </div>
                  }
                >
                  <SidebarFilter
                    categories={selectedCategoryIds}
                    utils={utils}
                    setUtils={setUtils}
                  />
                </Suspense>
              </div>

              {/* Mobile and tablet filter button */}
              <div className="flex items-end justify-end mr-2 xl:hidden">
                <button
                  type="button"
                  onClick={toggleFilterSidebar}
                  className="flex items-center justify-center px-3 py-1 space-x-2 text-center text-white bg-transparent text-bold hover:bg-gray-300"
                  aria-label={common.filters}
                >
                  <MdOutlineFilterList className="text-xl" />
                  <span>{common.filters}</span>
                </button>
              </div>
            </div>

            {/* Right (ProductGrid component) */}
            <div className="w-full xl:col-span-10 min-h-[80vh]">
              {query.isLoading && !query.data ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
                  {[...Array(12)].map((_, i) => (
                    <SkeletonCard key={`skeleton-${i}`} />
                  ))}
                </div>
              ) : (
                <>
                  <ProductGrid list={query.data?.data || []} />

                  {query.data?.data?.length > 0 && (
                    <div className="py-20">
                      <Pagination
                        totalItems={query.data?.pagination?.total || 0}
                        itemsPerPage={12}
                        onPageChange={onPageChange}
                        currentPage={utils.currentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Sidebar Filter (Mobile/Tablet) */}
          {isFilterSidebarOpen && (
            <div className="fixed inset-y-0 right-0 z-[30] w-[80%] max-w-sm bg-black border-l border-white p-5 transform transition-transform duration-300 xl:hidden">
              <div className="flex items-center justify-between pb-4 border-b border-gray-600">
                <h3 className="text-xl font-bold text-white">
                  {common.filters}
                </h3>
                <button
                  type="button"
                  onClick={toggleFilterSidebar}
                  className="text-white hover:text-yellow-500"
                  aria-label={common.close}
                >
                  {common.close}
                </button>
              </div>
              <div className="mt-5">
                <Suspense fallback={<div className="text-white">{common.loading}</div>}>
                  <SidebarFilter
                    categories={selectedCategoryIds}
                    utils={utils}
                    setUtils={setUtils}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Overlay for Sidebar (Mobile/Tablet) */}
          {isFilterSidebarOpen && (
            <div
              onClick={toggleFilterSidebar}
              className="fixed inset-0 z-12 bg-black bg-opacity-50 xl:hidden"
            ></div>
          )}

          <div className="py-10">
            <Suspense fallback={null}>
              <NewsLetter />
            </Suspense>
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default ProductListing;
