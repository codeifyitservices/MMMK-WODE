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
import { resolveAssetUrl } from '../utils/assetUrl';
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
  const [selectedOptionLabel, setSelectedOptionLabel] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const sizeOptions = useMemo(() => {
    if (!productData?.filters?.length || !skuList?.length) return [];

    const items = [];
    skuList.forEach((sku) => {
      const filterValue = productData.filters
        .map((filter) => sku.filters?.[filter])
        .filter(Boolean)
        .join(' / ');

      if (!filterValue) return;

      // Split compound sizes like "S/M" or "L/XL" into individual selectable sizes "S", "M", "L", "XL"
      const parts = filterValue.split('/').map((s) => s.trim()).filter(Boolean);
      const isSizeCompound =
        parts.length > 1 && parts.every((p) => p.length <= 4);

      if (isSizeCompound) {
        parts.forEach((part) => {
          items.push({
            id: `${sku._id}-${part}`,
            skuId: sku._id,
            skuCode: sku.sku,
            label: part,
            fullLabel: filterValue,
            quantity: Number(sku.quantity || 0),
            isOutOfStock: Number(sku.quantity || 0) <= 0,
          });
        });
      } else {
        items.push({
          id: sku._id,
          skuId: sku._id,
          skuCode: sku.sku,
          label: filterValue,
          fullLabel: filterValue,
          quantity: Number(sku.quantity || 0),
          isOutOfStock: Number(sku.quantity || 0) <= 0,
        });
      }
    });

    return items;
  }, [productData?.filters, skuList]);

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

  const hasAccordionContent = useMemo(() => {
    const desc =
      product?.translated?.productDescription ||
      (typeof productData?.productDescription === 'string'
        ? productData.productDescription
        : productData?.productDescription?.en) ||
      '';
    const uses =
      product?.translated?.uses ||
      (typeof productData?.uses === 'string'
        ? productData.uses
        : productData?.uses?.en) ||
      '';
    const benefits =
      product?.translated?.benefits ||
      (typeof productData?.benefits === 'string'
        ? productData.benefits
        : productData?.benefits?.en) ||
      '';

    const check = (str) => {
      if (!str || typeof str !== 'string') return false;
      return (
        str.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, '').trim().length > 0
      );
    };

    return check(desc) || check(uses) || check(benefits);
  }, [product, productData]);

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
    if (sizeOptions.length > 0 && !selectedSku) {
      const firstInStock =
        sizeOptions.find((opt) => !opt.isOutOfStock) || sizeOptions[0];
      if (firstInStock) {
        setSelectedSku(firstInStock.skuCode);
        setSelectedOptionLabel(firstInStock.label);
      }
    } else if (skuList.length > 0 && !selectedSku) {
      const firstInStockSku = skuList.find((sku) => Number(sku?.quantity) > 0);
      setSelectedSku(firstInStockSku?.sku || null);
    }
  }, [sizeOptions, skuList, selectedSku]);

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

      const isBuyNow =
        e?.currentTarget?.name === 'buyNow' ||
        e?.target?.name === 'buyNow' ||
        e?.currentTarget?.getAttribute?.('name') === 'buyNow';

      if (added && isBuyNow) {
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

  const handleSelectOption = (opt) => {
    if (opt.isOutOfStock) {
      message.warning(common.outOfStock || 'Sold out');
      return;
    }
    handleSelectSku(opt.skuId);
    setSelectedOptionLabel(opt.label);
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
        <div className="w-full mt-[44px] lg:mt-32">
          {/* navbar */}
          <CategoryNavBar />

          {/* sort and bread crumbs tab - hidden on mobile/tablet */}
          <div className="hidden lg:flex flex-wrap items-center justify-between w-full gap-3 px-4 py-3 border-t border-b text-2nd md:px-10 lg:px-20 md:py-4">
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
          <main className="w-full px-0 lg:px-4">
            {/* main product layout */}
            <div className="grid w-full grid-cols-1 lg:grid-cols-12">
              {/* Mobile / Tablet Single Featured Image Gallery with Bottom Thumbnails (< lg) */}
              <div className="order-1 col-span-1 block lg:hidden w-full p-3 sm:p-5">
                <Slider images={productImages} />
              </div>

              {/* Product Info Box: Name, Price, Options, Buy Now / Add to Cart */}
              <div
                className={`order-2 lg:order-1 col-span-1 px-3 py-2 sm:px-4 sm:py-3 md:p-6 lg:p-8 border border-white/10 bg-black/30 backdrop-blur-sm rounded-md lg:rounded-none mx-2 sm:mx-4 lg:mx-0 my-1 lg:my-0 shadow-md ${
                  hasAccordionContent ? 'lg:col-span-3' : 'lg:col-span-5'
                }`}
              >
                <div className="flex flex-col justify-between">
                  {/* Category Tag */}
                  {(product?.translated?.category || productData?.category?.name?.en) && (
                    <p className="text-[9px] sm:text-[10px] font-semibold tracking-widest text-[#dfba73] uppercase mb-0.5">
                      {product?.translated?.category || productData?.category?.name?.en}
                    </p>
                  )}

                  {/* Product Title */}
                  <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-wide text-white uppercase leading-snug mb-1.5">
                    {product?.translated?.productName ||
                      productData?.productName?.en}
                  </h1>

                  {/* Price Block */}
                  {productData?.price && productData?.websitePrice ? (
                    <div className="flex flex-col gap-0.5 pb-1.5 border-b border-white/10">
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Current Selling Price */}
                        <span className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                          {formatConvertedPrice(productData?.websitePrice)}
                        </span>

                        {/* Original MRP (Strike-through) */}
                        {productData?.price > productData?.websitePrice && (
                          <span className="text-[11px] sm:text-xs text-neutral-400 line-through font-normal">
                            {formatConvertedPrice(productData?.price)}
                          </span>
                        )}

                        {/* Luxury Discount Badge */}
                        {productData?.price > productData?.websitePrice && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#dfba73]/15 text-[#dfba73] border border-[#dfba73]/40 tracking-wider">
                            -{Math.round(((productData.price - productData.websitePrice) / productData.price) * 100)}% OFF
                          </span>
                        )}
                      </div>

                      {/* Tax Inclusive Note */}
                      <p className="text-[9px] text-neutral-400 tracking-wider uppercase font-medium">
                        Inclusive of all taxes
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic py-1">{common.itemUnavailable}</p>
                  )}

                  {sizeOptions?.length > 0 && (
                    <div className="mt-3 sm:mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-widest text-gray-300 font-semibold">
                          {common.chooseOption || 'SELECT'} {productData?.filters?.join(' / ')}
                        </p>
                        {selectedOptionLabel && (
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                            Selected: <span className="text-white font-bold">{selectedOptionLabel}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                        {sizeOptions.map((opt) => {
                          const isActive = selectedOptionLabel
                            ? selectedOptionLabel === opt.label && selectedSku === opt.skuCode
                            : selectedSku === opt.skuCode;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(opt)}
                              disabled={opt.isOutOfStock}
                              title={
                                opt.isOutOfStock
                                  ? (common.outOfStock || 'Sold out')
                                  : `Select size ${opt.label}`
                              }
                              className={`relative min-w-[36px] h-9 px-2.5 sm:min-w-[40px] sm:h-10 sm:px-3 flex items-center justify-center text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-200 select-none ${
                                opt.isOutOfStock
                                  ? 'border border-neutral-700/60 bg-neutral-900/40 text-neutral-500/50 cursor-not-allowed line-through opacity-50'
                                  : isActive
                                  ? 'border-2 border-white bg-white text-black font-bold shadow-sm'
                                  : 'border border-white/40 bg-black/40 text-white hover:border-white hover:bg-white/10 active:scale-95'
                              }`}
                            >
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions & Quantity: Hidden on mobile/tablet (< lg) to match Zara layout (handled by sticky bottom bar), visible on desktop (>= lg) */}
                  <div className="hidden lg:block">
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

              {/* Desktop Product Image Gallery: Center column on desktop (lg:order-2), hidden on mobile/tablet */}
              <div
                className={`hidden lg:block lg:order-2 col-span-1 ${
                  hasAccordionContent ? 'lg:col-span-5' : 'lg:col-span-7'
                } p-4 sm:p-6 md:p-8 border`}
              >
                <Slider images={productImages} />
                {/* <div className="absolute top-[%] right-[487px] z-10 hidden md:block ">
                  <div className="flex items-center justify-center w-16 h-16 text-white bg-red-700 rounded-full">
                    30% {t("productDetails.off")}
                  </div>
                </div> */}
              </div>

              {/* Accordion: Description, Directions, Benefits */}
              {hasAccordionContent && (
                <div className="order-3 lg:order-3 col-span-1 p-4 sm:p-6 border-0 lg:border lg:col-span-4 md:p-8 lg:p-10">
                  <Accordion data={product} />
                </div>
              )}
            </div>

            {/* product review section */}
            <div className="mt-3 sm:mt-5 lg:mt-8">
              <ProductReview product={params.id} />
            </div>

            {/* related products */}
            <div className="w-full mt-4 sm:mt-6 px-4 lg:px-0">
              <div className="flex flex-col items-center justify-between w-full gap-3 px-4 py-4 border-0 lg:border md:flex-row md:py-6 lg:py-4 md:gap-5 text-2nd sm:px-10 lg:px-20">
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

          <div className="py-6 sm:py-10 pb-28 lg:pb-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>

      {/* Zara-Style Sticky Floating Bottom Bar on Mobile/Tablet (< lg) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out px-4"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          paddingTop: isScrolled ? '10px' : '12px',
        }}
      >
        {/* Collapsible Info Header (visible before scroll, matching Zara Screenshot 2) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isScrolled
              ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none mb-0'
              : 'max-h-24 opacity-100 translate-y-0 mb-2.5'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[11px] font-semibold tracking-wider text-black uppercase truncate">
                {product?.translated?.productName || productData?.productName?.en}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                {product?.translated?.category || productData?.category?.name?.en}
              </p>
            </div>
            <div className="text-right shrink-0">
              {productData?.price && productData?.websitePrice && (
                <span className="text-[10px] text-gray-400 line-through block leading-tight">
                  {formatConvertedPrice(productData?.price)}
                </span>
              )}
              <span className="text-xs font-semibold text-black tracking-wide block leading-tight">
                {formatConvertedPrice(productData?.websitePrice || productData?.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Row: Dual buttons on initial screen -> Compact buttons + Price on scroll */}
        <div className="flex items-center justify-between w-full gap-2.5">
          {/* Button Group: transitions from 100% width to compact ~62% width on scroll */}
          <div
            className={`flex items-center gap-2 transition-all duration-300 ease-in-out ${
              isScrolled ? 'w-[62%] sm:w-[65%]' : 'w-full'
            }`}
          >
            {/* ADD TO CART Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={common.addToCart || 'Add to Cart'}
              className={`flex-1 border border-black tracking-wider text-[11px] sm:text-xs font-semibold uppercase text-center transition-all duration-300 ease-in-out whitespace-nowrap ${
                isOutOfStock
                  ? 'py-2.5 bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : isScrolled
                  ? 'py-2.5 bg-white text-black hover:bg-black hover:text-white active:scale-[0.98]'
                  : 'py-3 bg-white text-black hover:bg-black hover:text-white active:scale-[0.99]'
              }`}
            >
              {isOutOfStock
                ? (common.outOfStock || 'SOLD OUT').toUpperCase()
                : isScrolled
                ? 'ADD'
                : (common.addToCart || 'ADD TO CART').toUpperCase()}
            </button>

            {/* BUY NOW Button */}
            <button
              type="button"
              name="buyNow"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={common.buyNow || 'Buy Now'}
              className={`flex-1 border border-black tracking-wider text-[11px] sm:text-xs font-semibold uppercase text-center transition-all duration-300 ease-in-out whitespace-nowrap ${
                isOutOfStock
                  ? 'py-2.5 bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : isScrolled
                  ? 'py-2.5 bg-black text-white hover:bg-neutral-800 active:scale-[0.98]'
                  : 'py-3 bg-black text-white hover:bg-neutral-800 active:scale-[0.99]'
              }`}
            >
              {isOutOfStock
                ? (common.outOfStock || 'SOLD OUT').toUpperCase()
                : isScrolled
                ? 'BUY'
                : (common.buyNow || 'BUY NOW').toUpperCase()}
            </button>
          </div>

          {/* Compact Price Display: Smoothly appears on the right when scrolled (matching Zara Screenshot 3) */}
          <div
            className={`flex flex-col items-end justify-center transition-all duration-300 ease-in-out ${
              isScrolled
                ? 'w-[38%] sm:w-[35%] max-w-[140px] opacity-100 translate-x-0'
                : 'w-0 max-w-0 opacity-0 translate-x-4 pointer-events-none overflow-hidden'
            }`}
          >
            {productData?.price && productData?.websitePrice && (
              <span className="text-[10px] text-gray-400 line-through leading-tight">
                {formatConvertedPrice(productData?.price)}
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-black tracking-wider leading-tight whitespace-nowrap">
              {formatConvertedPrice(productData?.websitePrice || productData?.price)}
            </span>
            <span className="text-[8px] text-gray-500 uppercase tracking-tighter leading-tight whitespace-nowrap">
              MRP INCL. TAXES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
