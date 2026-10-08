import { useEffect, useState, useMemo } from 'react';

import Banner from '../components/global/Banner';
import ProductGrid from '../components/listing/ProductGrid';
import NewsLetter from '../components/global/NewsLetter';
import Accordion from '../components/details/Accordion';
import Slider from '../components/details/Slider';
import ProductDetailsSkeleton from '../components/details/ProductDetailsSkeleton';
import bg from '../assets/bg.png';
import { useQuery } from '@tanstack/react-query';
import Section10 from '../components/home/Section10';
import { useNavigate, useParams } from 'react-router-dom';
import { message, notification } from 'antd';
import {
  getProductSkus,
  getRelatedProducts,
  getSingleProduct,
  recordProductView,
} from '../apis/nonAuth/products';
import { getOrCreateVisitorSessionId } from '../utils/visitorSession';
import { useCart } from '../context/CartProvider';
import CategoryNavBar from '../components/global/CategoryNavBar';
import {
  isUserSignedIn,
} from '../utils/globalMethods';
import ProductReview from '../components/details/ProductReview';
import {
  translateText,
  useTranslationContext,
} from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';
import { convertPrice, formatPrice } from '../utils/currency';
import { useCurrency } from '../context/CurrencyContext';

const ProductDetails = () => {
  const {
    content: { common, productDetails },
    translateLanguage,
  } = useTranslationContext();
  const [count, setCount] = useState(1);
  const params = useParams();
  const { addProductToCart, data: cartItems } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState({});
  const [selectedSku, setSelectedSku] = useState(null);
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  const query = useQuery({
    queryKey: ['product-details', params.id],
    queryFn: () => getSingleProduct(params.id),
    enabled: Boolean(params.id),
    staleTime: 60000, // Cache for 1 minute
  });
  
  useEffect(() => {
    if (params.id) {
      const sessionId = getOrCreateVisitorSessionId();
      recordProductView(params.id, sessionId);
    }
  }, [params.id]);

  const productData = useMemo(() => query.data?.data || {}, [query.data]);

  const SkuQuery = useQuery({
    queryKey: ['product-skus', params.id],
    queryFn: () => getProductSkus(params.id),
    enabled: Boolean(params.id),
    staleTime: 60000,
  });

  // fetching paginated products
  const list = useQuery({
    queryKey: ['getRelatedProducts', params.id, translateLanguage],
    queryFn: () => getRelatedProducts(params.id, translateLanguage),
    enabled: Boolean(params.id) && Boolean(productData?.category),
    staleTime: 300000, // Related products change less frequently, cache for 5 min
  });

  const skuList = useMemo(() => {
    return SkuQuery.data?.length
      ? SkuQuery.data
      : Array.isArray(productData?.skus)
        ? productData.skus
        : [];
  }, [SkuQuery.data, productData.skus]);

  const selectedSkuDetails = skuList.find((sku) => sku.sku === selectedSku);
  const totalAvailableStock = skuList.reduce(
    (sum, sku) => sum + Number(sku?.quantity || 0),
    0
  );
  const usesProductLevelStock =
    Array.isArray(productData?.filters) && productData.filters.length === 0;
  const selectedAvailableQuantity = usesProductLevelStock
    ? Number(productData?.quantity || 0)
    : skuList.length > 0
      ? Number(selectedSkuDetails?.quantity || 0)
      : Number(productData?.quantity || 0);
  const quantityAlreadyInCart = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => {
        if (
          String(item?.product?._id) === String(params.id) &&
          String(item?.sku || '') === String(selectedSku || '')
        ) {
          return sum + Number(item?.quantity || 0);
        }
        return sum;
      }, 0)
    : 0;
  const remainingSelectableQuantity = Math.max(
    selectedAvailableQuantity - quantityAlreadyInCart,
    0
  );
  const isOutOfStock =
    skuList.length > 0 && !usesProductLevelStock
      ? totalAvailableStock <= 0 || remainingSelectableQuantity <= 0
      : remainingSelectableQuantity <= 0;
  const productImages = useMemo(() => {
    return [
      ...(productData?.image ? [productData.image] : []),
      ...(Array.isArray(productData?.images)
        ? productData.images.filter((img) => img !== productData.image)
        : []),
    ].filter(Boolean);
  }, [productData.image, productData.images]);

  const handleTranslateProductData = async (data, language) => {
    const allFieldsToTranslate = {
      productName: data.productName,
      category: data.category?.name,
      subCategory: data.subCategory,
      productDescription: data.productDescription,
      uses: data.uses,
      benefits: data.benefits,
    };

    const keys = Object.keys(allFieldsToTranslate);

    const translated = {};

    for (const key of keys) {
      if (key === 'subCategory') {
        translated[key] = await translateText(
          allFieldsToTranslate[key] || '',
          language
        );
        continue;
      }
      translated[key] = allFieldsToTranslate[key]?.[language];
      if (!translated[key] && allFieldsToTranslate[key]?.en) {
        translated[key] = await translateText(
          allFieldsToTranslate[key].en,
          language
        );
      }
    }

    setProduct({
      ...data,
      translated,
    });

    let oldList = [];
    try {
      const raw = sessionStorage.getItem('recentlyViewed');
      oldList = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(oldList)) oldList = [];
    } catch {
      oldList = [];
    }

    // Filter out the current product if it's already in the list to avoid duplicates
    // and to move it to the start (most recent)
    const filteredList = oldList.filter((item) => item?._id !== data?._id);
    const newList = [data, ...filteredList].slice(0, 20);

    sessionStorage.setItem('recentlyViewed', JSON.stringify(newList));
  };

  useEffect(() => {
    if (query.data?.data) {
      handleTranslateProductData(query.data.data, translateLanguage);
    } else {
      setProduct({});
      setSelectedSku(null);
    }
  }, [query.data, translateLanguage]);

  useEffect(() => {
    if (skuList.length > 0 && !selectedSku) {
      const firstInStockSku = skuList.find((sku) => Number(sku?.quantity) > 0);
      setSelectedSku(firstInStockSku?.sku || null);
    }
  }, [skuList, selectedSku]);

  useEffect(() => {
    if (
      remainingSelectableQuantity > 0 &&
      count > remainingSelectableQuantity
    ) {
      setCount(remainingSelectableQuantity);
      return;
    }

    if (remainingSelectableQuantity <= 0 && count !== 1) {
      setCount(1);
    }
  }, [remainingSelectableQuantity, count]);

  if (query.isLoading) {
    return <ProductDetailsSkeleton />;
  }

  const handleAddToCart = async (e) => {
    try {
      if (isOutOfStock) {
        message.warning(common.outOfStock || 'Sold out');
        return;
      }

      if (!selectedSku) {
        notification.warning({
          message: `${common.chooseOption} ${productData?.filters?.join(' / ')}`,
        });
        return;
      }

      // Find the selected SKU details
      const skuDetails = skuList?.find((sku) => sku.sku === selectedSku);

      if (!skuDetails) {
        message.error(common.selectedOptionNotFound);
        return;
      }

      if (
        Number(skuDetails.quantity || 0) <= 0 ||
        remainingSelectableQuantity <= 0
      ) {
        message.warning(common.outOfStock || 'Sold out');
        return;
      }

      if (count > remainingSelectableQuantity) {
        message.warning(
          `Only ${remainingSelectableQuantity} item(s) available for selected option`
        );
        return;
      }

      const added = await addProductToCart({
        productId: params.id,
        sku: selectedSku,
        quantity: count,
        showMessage: true,
      });

      if (added && e.target?.name === 'buyNow') {
        navigate('/shopping-cart');
      }
    } catch (err) {
      
      message.error(err?.response?.data?.message || common.addToCartFailed);
    }
  };

  const handleSelectSku = (skuId) => {
    const selected = skuList.find((sku) => sku._id === skuId);
    if (selected && selected.quantity > 0) {
      setSelectedSku(selected.sku);
      setCount(1);
    }
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
      <Banner bg={bg}>
        <div className="w-full md:mt-24 mt-36">
          {/* navbar */}
          <CategoryNavBar />

          {/* sort and bread crumbs tab */}

          <div className="flex flex-wrap items-center justify-between w-full gap-5 px-6 py-6 border-t border-b text-2nd md:px-10 lg:px-20">
            <div className="w-full md:w-auto">
              <div className="flex flex-wrap gap-3 mt-2 text-lg md:text-xl md:flex-nowrap md:gap-5">
                <p className="text-base font-bold md:text-xl">
                  {common.home} {'>'}{' '}
                  {product?.translated?.category ||
                    productData?.category?.name?.en}
                </p>
              </div>
            </div>
          </div>

          {/* main section */}
          <main className="w-full px-4 md:px-6 lg:px-4">
            {/* left */}
            <div className="grid w-full grid-cols-1 lg:grid-cols-12">
              <div className="col-span-1 p-6 border lg:col-span-3 md:p-10">
                <div className="flex flex-col justify-between">
                  <h1 className="text-base font-bold md:text-xl">
                    {product?.translated?.productName ||
                      productData?.productName?.en}
                  </h1>
                  {/* <p
                  className="my-4 text-sm md:text-base"
                  dangerouslySetInnerHTML={{
                    __html: product?.translated?.productDescription,
                  }}
                ></p> */}
                  {productData?.price && productData?.websitePrice ? (
                    <>
                      <h2 className="text-base font-semibold md:text-lg flex gap-3">
                        {productData?.price && (
                          <span className="line-through text-gray-400 text-sm md:text-base">
                            {formatConvertedPrice(productData?.price)}
                          </span>
                        )}

                        <span className="font-semibold text-lg md:text-xl">
                          {formatConvertedPrice(productData?.websitePrice)}
                        </span>
                      </h2>
                    </>
                  ) : (
                    <>{common.itemUnavailable}</>
                  )}

                  {productData?.filters?.length > 0 && skuList?.length > 0 && (
                    <div className="mt-4">
                      {common.chooseOption} {productData?.filters?.join(' / ')}
                      <div className="flex flex-wrap gap-x-2">
                        {skuList.map((sku) => (
                          <CommonButton
                            key={sku._id}
                            onClick={() => handleSelectSku(sku._id)}
                            variant={selectedSku === sku.sku ? 7 : 1}
                            size="sm"
                            className="!px-2"
                            disabled={sku.quantity <= 0}
                            title={sku.quantity <= 0 ? common.outOfStock : ''}
                          >
                            <span>
                              {productData?.filters
                                ?.map((filter) => sku.filters[filter])
                                .join(' / ')}
                            </span>
                            {sku.quantity <= 0 ? (
                              <span className="block text-[8px]">
                                {common.outOfStock}
                              </span>
                            ) : (
                              ''
                            )}
                          </CommonButton>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mt-5">
                      <div className="flex items-center border border-white">
                        <button
                          className="px-3 text-2nd"
                          type="button"
                          aria-label={common.decreaseQuantity || 'Decrease quantity'}
                          onClick={() =>
                            setCount((prevData) =>
                              prevData === 1 ? 1 : prevData - 1
                            )
                          }
                          disabled={isOutOfStock}
                        >
                          -
                        </button>
                        <span className="px-3 font-semibold text-3rd">
                          {count}
                        </span>
                        <button
                          className="px-3 text-2nd"
                          type="button"
                          aria-label={common.increaseQuantity || 'Increase quantity'}
                          onClick={() => {
                            if (selectedAvailableQuantity <= 0) {
                              message.warning(common.outOfStock || 'Sold out');
                              return;
                            }
                            if (remainingSelectableQuantity <= 0) {
                              message.warning(common.outOfStock || 'Sold out');
                              return;
                            }
                            if (count >= remainingSelectableQuantity) {
                              message.warning(
                                `Maximum available quantity is ${remainingSelectableQuantity}`
                              );
                              return;
                            }
                            setCount((prev) => prev + 1);
                          }}
                          disabled={isOutOfStock}
                        >
                          +
                        </button>
                      </div>
                      {productData?.price &&
                        productData?.websitePrice &&
                        !isOutOfStock && (
                          <button
                            name="buyNow"
                            onClick={handleAddToCart}
                            className="w-full px-3 py-1 font-semibold text-black bg-white md:px-4 md:py-2"
                          >
                            {common.buyNow}
                          </button>
                        )}
                    </div>

                    {!isOutOfStock && (
                      <button
                        name="wishList"
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full py-2 mt-3 font-semibold text-black bg-white"
                      >
                        {common.addToCart}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1 p-6 border lg:col-span-5 md:p-8">
                <Slider images={productImages} />
                {/* <div className="absolute top-[%] right-[487px] z-10 hidden md:block ">
                  <div className="flex items-center justify-center w-16 h-16 text-white bg-red-700 rounded-full">
                    30% {t("productDetails.off")}
                  </div>
                </div> */}
              </div>

              <div className="col-span-1 p-6 border lg:col-span-4 md:p-10">
                <Accordion data={product} />
              </div>
            </div>

            {/* product review section */}
            <ProductReview product={params.id} />

            {/* right */}
            <div className="w-full mt-6">
              <div className="flex flex-col items-center justify-between w-full gap-4 px-4 py-6 border border-b md:flex-row md:py-8 lg:py-6 md:gap-5 text-2nd sm:px-10 lg:px-20">
                <div className="text-center md:text-left">
                <h3 className="text-lg font-bold md:text-xl">
                  {productDetails.relatedProducts}
                </h3>
                </div>
                <CommonButton
                  variant={4}
                  size="sm"
                  isLink
                  to={`/product-listings?categories=${encodeURIComponent(
                    productData?.category?.name?.en || ''
                  )}`}
                >
                  {common.showAll}
                </CommonButton>
              </div>

              <div className="w-full md:col-span-9 lg:col-span-10">
                <ProductGrid list={list.data || []} />
                {/* <div className="py-20">
                  <Pagination
                    totalItems={500}
                    itemsPerPage={50}
                    onPageChange={onPageChange}
                  />
                </div> */}
              </div>
            </div>
          </main>

          <div className="w-full text-black bg-white">
            <Section10></Section10>
          </div>

          <div className="py-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default ProductDetails;
