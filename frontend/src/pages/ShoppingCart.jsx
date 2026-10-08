/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';

import Banner from '../components/global/Banner';
import ProductGrid from '../components/listing/ProductGrid';
import NewsLetter from '../components/global/NewsLetter';
import bg from '../assets/bg.png';
import Section10 from '../components/home/Section10';
import { useNavigate } from 'react-router-dom';
import CategoryNavBar from '../components/global/CategoryNavBar';
import { useCart } from '../context/CartProvider';
import { message, Modal } from 'antd';
import {
  getPercentageOf,
  showTranslatedMessage,
  isUserSignedIn,
} from '../utils/globalMethods';
import { convertPrice, formatPrice } from '../utils/currency';
import { applyCoupon, getValidTokens } from '../apis/user/coupon';
import { useQuery } from '@tanstack/react-query';
import { LuX } from 'react-icons/lu';
import {
  translate,
  useTranslationContext,
} from '../context/TranslationContext';
import { Button4, CommonButton } from '../components/global/UIButtons';
import { getProductSkus } from '../apis/nonAuth/products';
import { useCurrency } from '../context/CurrencyContext';
import RecentlyViewedSlider from '../components/listing/RecentlyViewedSlider';
import { resolveAssetUrl } from '../utils/assetUrl';

const ShoppingCart = () => {
  const {
    content: { cart, common },
    translateLanguage,
  } = useTranslationContext();
  const {
    data,
    refetch,
    couponCode,
    setCouponCode,
    isCouponApply,
    setIsCouponApply,
    setCouponData,
    couponData,
    removeFromCart,
    addProductToCart,
    calculateCartSummary,
    setCheckoutSummary,
    appliedCreditAmount,
    setAppliedCreditAmount,
    isBagAdded,
    setIsBagAdded,
  } = useCart();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loadings, setLoadings] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [availableStockByItem, setAvailableStockByItem] = useState({});
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProceedingToCheckout, setIsProceedingToCheckout] = useState(false);

  const addLoading = (index) => {
    setLoadings((prev) => [...prev, index]);
  };
  const removeLoading = (index) => {
    setLoadings((prev) => prev.filter((item) => item !== index));
  };

  const couponsQuery = useQuery({
    queryKey: ['valid-coupons'],
    queryFn: getValidTokens,
    enabled: isUserSignedIn(),
    retry: false,
  });
  const availableCoupons =
    (couponsQuery.data?.data || []).filter(
      (coupon) => coupon?.showToUsers !== false
    );
  const { currency, rates } = useCurrency();
  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  const cartSummary = calculateCartSummary({
    items: data,
    couponData,
    isCouponApply,
    appliedCreditAmount,
    isBagAdded,
    currency,
    rates,
  });

  const handleApplyCoupon = async (coupon) => {
    if (!coupon) return;
    
    if (!isUserSignedIn()) {
      showTranslatedMessage({
        msg: 'Please proceed to checkout and verify your email to apply coupons.',
        language: translateLanguage,
        type: 'warning',
      });
      return;
    }
    
    setIsApplyingCoupon(true);

    try {
      const res = await applyCoupon(coupon);
      const validCoupon = res?.data;

      // Check if coupon is eligible for current cart items
      const tempSummary = calculateCartSummary({
        items: data,
        couponData: validCoupon,
        isCouponApply: true,
        currency,
        rates,
      });

      if (
        validCoupon.scope &&
        validCoupon.scope !== 'All' &&
        tempSummary.couponDiscount <= 0
      ) {
        showTranslatedMessage({
          msg: 'this coupon is not eligible for your cart',
          language: translateLanguage,
          type: 'error',
        });
        setIsApplyingCoupon(false);
        return;
      }

      setCouponData(validCoupon);
      setCouponInput('');
      setCouponCode(validCoupon?.couponCode);
      setIsCouponApply(true);
      setIsCouponModalOpen(false);
    } catch (err) {
      showTranslatedMessage({
        msg: err?.response?.data?.message || 'Failed to apply coupon',
        language: translateLanguage,
        type: 'error',
      });
      // message.error(err.response?.data?.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCart = async (id, sku, i) => {
    try {
      addLoading(i);
      await removeFromCart({ productId: id, sku, showMessage: false });
      removeLoading(i);
    } catch (err) {
      removeLoading(i);
      showTranslatedMessage({
        msg: err?.response?.data?.message || 'Failed to remove cart item',
        language: translateLanguage,
        type: 'error',
      });
      // message.error(
      //   err?.response?.data?.message || "Failed to remove cart item"
      // );
    }
  };

  const handleAdjustQuantity = async (id, sku, action, i) => {
    try {
      const itemKey = `${id}:${sku}`;
      const matchingItem = cartItems.find(
        (item) => item?.product?._id === id && item?.sku === sku
      );
      const availableQuantity = Number(availableStockByItem[itemKey] ?? matchingItem?.product?.quantity ?? Infinity);

      if (
        action === 'inc' &&
        matchingItem &&
        Number(matchingItem.quantity || 0) >= availableQuantity
      ) {
        message.warning(
          `This item has only ${availableQuantity} pieces left`
        );
        return;
      }

      addLoading(i);
      if (action === 'inc')
        await addProductToCart({
          productId: id,
          sku,
          quantity: 1,
          showMessage: false,
          productData: matchingItem?.product, // Pass existing data to avoid API calls
        });
      else
        await removeFromCart({
          productId: id,
          sku,
          quantity: 1,
          showMessage: false,
        });
      removeLoading(i);
    } catch (err) {
      removeLoading(i);
      message.error(
        err?.response?.data?.message || 'Failed to adjust cart item quantity'
      );
    }
  };

  const translationCacheRef = React.useRef({});

  const handleTranslateCartData = async (incomingData, language) => {
    // Check if we need to translate anything
    const needsTranslation = incomingData.filter(item => {
      const cacheKey = `${item.product?._id}:${language}`;
      return !translationCacheRef.current[cacheKey];
    });

    if (language === 'en' || needsTranslation.length === 0) {
      return setCartItems(
        incomingData.map((item) => {
          const cacheKey = `${item.product?._id}:${language}`;
          return {
            ...item,
            translated: {
              productName: language === 'en' 
                ? item?.product?.productName?.en 
                : translationCacheRef.current[cacheKey] || item?.product?.productName?.[language] || item?.product?.productName?.en,
            },
          };
        })
      );
    }

    const translatedProductNames = await translate(
      needsTranslation.map((item) => item?.product?.productName?.en || ''),
      language
    );

    // Update cache
    needsTranslation.forEach((item, index) => {
      const cacheKey = `${item.product?._id}:${language}`;
      translationCacheRef.current[cacheKey] = translatedProductNames[index];
    });

    setCartItems(
      incomingData.map((item) => {
        const cacheKey = `${item.product?._id}:${language}`;
        return {
          ...item,
          translated: {
            productName: translationCacheRef.current[cacheKey] || item?.product?.productName?.en,
          },
        };
      })
    );
  };

  useEffect(() => {
    if (data?.length > 0) {
      handleTranslateCartData(data, translateLanguage);
    } else {
      setCartItems([]);
    }
  }, [data, translateLanguage]);

  const stockCacheRef = React.useRef({});

  useEffect(() => {
    let isMounted = true;

    const loadItemAvailability = async () => {
      if (!Array.isArray(data) || data.length === 0) {
        if (isMounted) setAvailableStockByItem({});
        return;
      }

      const entries = await Promise.all(
        data.map(async (item) => {
          const productId = item?.product?._id;
          const sku = item?.sku;
          const cacheKey = `${productId}:${sku}`;

          // Skip if we already have a recent stock count for this exact item
          if (stockCacheRef.current[cacheKey] !== undefined) {
             return [cacheKey, stockCacheRef.current[cacheKey]];
          }

          // Case 1: Product has no variants, stock is directly on product
          if (
            !item?.product?.filters || 
            (Array.isArray(item.product.filters) && item.product.filters.length === 0)
          ) {
            const qty = Number(item?.product?.quantity || 0);
            stockCacheRef.current[cacheKey] = qty;
            return [cacheKey, qty];
          }

          // Case 2: Product has variants, fetch SKU details
          try {
            const productSkus = await getProductSkus(productId);
            const selectedSku = productSkus.find((skuItem) => skuItem?.sku === sku);
            const qty = Number(selectedSku?.quantity || 0);
            stockCacheRef.current[cacheKey] = qty;
            return [cacheKey, qty];
          } catch {
            const qty = Number(item?.product?.quantity || 0);
            stockCacheRef.current[cacheKey] = qty;
            return [cacheKey, qty];
          }
        })
      );

      if (isMounted) {
        setAvailableStockByItem(Object.fromEntries(entries));
      }
    };

    loadItemAvailability();

    return () => {
      isMounted = false;
    };
  }, [data]);

  const handleProceedToCheckout = async () => {
    if (isProceedingToCheckout) return;
    setIsProceedingToCheckout(true);
    try {
      const summary = calculateCartSummary({
        items: data,
        couponData,
        isCouponApply,
        appliedCreditAmount,
        isBagAdded,
        currency,
        rates,
      });
      setCheckoutSummary(summary);
      navigate('/checkout', { state: { cartSummary: summary } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProceedingToCheckout(false);
    }
  };

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="w-full py-36 md:py-12 md:mt-12">
          {/* Navbar */}
          <CategoryNavBar />

          {/* Sort and Breadcrumbs */}
          <div className="flex items-center justify-between w-full gap-5 px-5 py-8 text-black bg-white border-t border-b border-black text-2nd md:px-20">
            <h2 className=" text-base md:text-5xl font-[700]">
              {cart.shoppingCart}
            </h2>
          </div>

          {/* Main Section */}
          <main className="w-full text-black bg-white">
            <Modal
              title="Available Coupons"
              open={isCouponModalOpen}
              onCancel={() => setIsCouponModalOpen(false)}
              footer={null}
              centered
            >
              {!isUserSignedIn() ? (
                <p className="text-sm text-gray-600">
                  {common.signInToContinue}
                </p>
              ) : couponsQuery.isLoading ? (
                <p className="text-sm text-gray-600">{common.loading}</p>
              ) : availableCoupons.length ? (
                <div className="space-y-3">
                  {availableCoupons.map((coupon) => {
                    const isActiveCoupon = couponCode === coupon.couponCode;

                    return (
                      <button
                        key={coupon._id}
                        type="button"
                        onClick={() => handleApplyCoupon(coupon.couponCode)}
                        className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isActiveCoupon || isApplyingCoupon}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{coupon.couponCode}</p>
                              {isActiveCoupon && (
                                <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                  Applied
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {coupon.couponName}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            {coupon.discount}% OFF
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No active coupons found.</p>
              )}
            </Modal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Left Side: Cart Items */}
              <div className="col-span-12 p-2 px-12 border md:px-0 brown-border md:col-span-7 md:p-5">
                {cartItems?.map((list, i) => {
                  const itemKey = `${list?.product?._id}:${list?.sku}`;
                  const maxAvailable = Number(
                    availableStockByItem[itemKey] ?? Infinity
                  );
                  const atMaxStock = Number(list?.quantity || 0) >= maxAvailable;

                  return (
                    <div
                      key={list._id}
                      className="w-full py-6 px-6 md:px-10 mb-10 bg-white shadow-lg rounded-lg"
                    >
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
                      {/* Product Image */}
                      <img
                        src={
                          resolveAssetUrl(list?.product?.images?.[0])
                        }
                        className="object-cover rounded-lg shadow-md w-[180px] md:w-[220px] border"
                        alt={list.translated?.productName}
                      />

                      {/* Product Info */}
                      <div className="flex-1 mt-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {list.translated?.productName}
                          </h3>
                          {list?.filters && (
                            <span>
                              (
                              {Object.keys(list?.filters || {})
                                .map((key) => `${key}: ${list?.filters[key]}`)
                                .join(', ')}
                              )
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {/* Original Price */}
                          {list?.product?.discount > 0 && (
                            <p className="text-gray-500 text-sm">
                              <span className="line-through">
                                {' '}
                              {formatConvertedPrice(
                                Number(list?.product?.price || 0) * Number(list?.quantity || 0),
                              )}
                              </span>
                              <span className="font-[600]">
                                {' '}
                                {list?.product?.discount} % off
                              </span>
                            </p>
                          )}

                          {/* Discounted Price (10% off) */}
                          <h3 className="flex items-end gap-2">
                            <span className="text-lg font-semibold text-red-600">
                              {formatConvertedPrice(
                                Number(
                                  getPercentageOf(
                                    list?.product?.price,
                                    list?.product?.discount
                                  )
                                ) * Number(list.quantity || 0),
                              )}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({formatConvertedPrice(
                                getPercentageOf(
                                  list?.product?.price,
                                  list?.product?.discount
                                ),
                              )}{' '}
                              * {list.quantity})
                            </span>
                          </h3>

                          {/* Quantity */}
                        </div>
                      </div>

                      {/* Pricing Section */}
                    </div>
                      <div className="flex items-center justify-end gap-4 mt-4">
                        <div className="flex items-center gap-2">
                        <CommonButton
                          onClick={() =>
                            handleAdjustQuantity(
                              list.product?._id,
                              list.sku,
                              'dec',
                              i
                            )
                          }
                          size="xs"
                          variant="primary1"
                          disabled={loadings.includes(i)}
                          className="w-[40px] text-center"
                        >
                          -
                        </CommonButton>
                        <span className="text-gray-600 px-2 text-lg">
                          {list.quantity}
                        </span>
                        <div 
                          className="inline-block"
                          onClick={() => atMaxStock && !loadings.includes(i) && message.warning(`Only ${maxAvailable} item(s) available for selected option`)}
                        >
                          <CommonButton
                            onClick={() =>
                              handleAdjustQuantity(
                                list.product?._id,
                                list.sku,
                                'inc',
                                i
                              )
                            }
                            size="xs"
                            variant="primary1"
                            disabled={loadings.includes(i) || atMaxStock}
                            className="w-[40px] text-center"
                          >
                            +
                          </CommonButton>
                        </div>
                        </div>

                        {/* Remove Button */}
                        <CommonButton
                          variant="danger1"
                          onClick={() =>
                            handleRemoveCart(list.product?._id, list.sku, i)
                          }
                          size="sm"
                          disabled={loadings.includes(i)}
                        >
                          {common.remove}
                        </CommonButton>
                      </div>
                    </div>
                  );
                })}

                {/* Add Bag Option */}
                <div className="w-full py-6 px-6 md:px-10 mb-10 bg-white shadow-lg rounded-lg flex items-center justify-between border border-gray-200 mt-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/mmmk-bag.jpeg" 
                      alt="MMMK Bag" 
                      className="w-16 h-16 object-cover rounded shadow border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">Add a Bag</h3>
                      <p className="text-sm text-gray-500">Includes an exclusive MMMK bag with your order.</p>
                      <p className="font-semibold">{formatConvertedPrice(1.79)}</p>
                    </div>
                  </div>
                  <div>
                    <CommonButton 
                      variant={isBagAdded ? 'danger1' : 'primary1'} 
                      onClick={() => setIsBagAdded(!isBagAdded)}
                      size="sm"
                    >
                      {isBagAdded ? 'Remove Bag' : 'Add Bag'}
                    </CommonButton>
                  </div>
                </div>

              </div>

              {/* Right Side: Payment Breakdown */}
              <div className="col-span-12 p-5 border brown-border md:col-span-5 md:p-10">
                <div className="py-5 px-5 md:px-10 bg-[#d9d9d9]">
                  <h3 className="font-bold text-center md:text-left">
                    {cart.paymentBreakdown}
                  </h3>
                  <div className="flex items-center justify-between my-5 ">
                    <p>{common.subTotal}</p>
                    <p>{formatPrice(cartSummary.subtotal, currency)}</p>
                  </div>

                  {cartSummary.bagFee > 0 && (
                    <div className="flex items-center justify-between my-5 text-gray-600">
                      <p>Bag Fee</p>
                      <p>+ {formatPrice(cartSummary.bagFee, currency)}</p>
                    </div>
                  )}

                  {isCouponApply && (
                    <div className="flex flex-col my-5 gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center flex-1 justify-between">
                          <p>{common.coupon}</p>
                          <p className="text-green-500">
                            - {formatPrice(cartSummary.couponDiscount, currency)}{' '}
                            ({couponData?.discount}% off)
                          </p>
                        </div>
                        <button
                          className="mb-2"
                          onClick={() => {
                            setCouponInput('');
                            setCouponCode(null);
                            setIsCouponApply(false);
                            setCouponData({});
                          }}
                        >
                          <LuX />
                        </button>
                      </div>
                      {couponData?.scope && couponData.scope !== 'All' && (
                        <p className="text-xs text-gray-500 italic">
                          Applied to:{' '}
                          {couponData.scope === 'Category'
                            ? couponData.scopeCategory?.name?.[
                                translateLanguage
                              ] || couponData.scopeCategory?.name?.en
                            : couponData.scopeProduct?.productName?.[
                                translateLanguage
                              ] || couponData.scopeProduct?.productName?.en}
                        </p>
                      )}
                      {couponData?.applyToDelivery && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          ✨ You also have{' '}
                          {couponData.deliveryDiscountType === 'amount'
                            ? formatConvertedPrice(couponData.deliveryDiscount)
                            : `${couponData.deliveryDiscount}%`}{' '}
                          off on delivery!
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between my-5 font-bold ">
                    <p>{common.total}</p>
                    <p>{formatPrice(cartSummary.total, currency)}</p>
                  </div>

                  {/* Promo Code Section */}
                  <div className="mt-5">
                    {/* Promo Code input moved to checkout */}
                    <div className="mt-4">
                      <p className="text-gray-500 text-sm">Please proceed to checkout to apply coupon codes.</p>
                    </div>

                    <CommonButton
                      variant={6}
                      className="w-full mb-6 ms-auto block mt-4"
                      size="md"
                      type="button"
                      onClick={handleProceedToCheckout}
                      disabled={isProceedingToCheckout}
                    >
                      {isProceedingToCheckout ? 'Processing...' : common.checkout}
                    </CommonButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Shopping Section */}
            <div className="flex flex-col items-center justify-between w-full gap-5 px-5 py-12 text-black bg-white border-t border-b md:flex-row brown-border text-2nd md:px-20">
              <h2 className="text-base font-bold text-center md:text-4xl md:text-left">
                {cart.continueShopping}
              </h2>
              <CommonButton variant={6} isLink to="/product-listings">
                {common.showAll}
              </CommonButton>
            </div>

            {/* Product Grid Section */}
            <div className="w-full">
              <RecentlyViewedSlider/>
            </div>
          </main>

          {/* Additional Section */}
          <div className="w-full text-black bg-white">
            <Section10 />
          </div>

          {/* Newsletter Section */}
          <div className="py-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default ShoppingCart;
