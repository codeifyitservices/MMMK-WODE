import React, { useState, useMemo, useCallback } from 'react';

import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import CheckoutForm from '../components/checkout/CheckoutForm';
import bg from '../assets/bg.png';
import Section10 from '../components/home/Section10';
import CategoryNavBar from '../components/global/CategoryNavBar';

import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';
import { useCart } from '../context/CartProvider';
import { useCurrency } from '../context/CurrencyContext';

const Checkout = () => {
  const [shippingCharges, setShippingCharges] = useState(0);

  const {
    content: { common, cart, checkout },
    translateLanguage,
  } = useTranslationContext();
  const {
    data: cartItems,
    appliedCreditAmount,
    calculateCartSummary,
    couponData,
    isCouponApply,
    isBagAdded,
  } = useCart();
  const { currency, rates } = useCurrency();

  // Memoize so a new object reference is only created when inputs actually change.
  // Without this, liveSummary is a new object every render, which triggers the
  // setCheckoutSummary useEffect in CheckoutForm on every render → infinite loop.
  const liveSummary = useMemo(
    () =>
      calculateCartSummary({
        items: cartItems,
        couponData,
        isCouponApply,
        appliedCreditAmount,
        isBagAdded,
        shippingCharges,
        currency,
        rates,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItems, couponData, isCouponApply, appliedCreditAmount, isBagAdded, shippingCharges, currency, rates]
  );

  // Stable callback reference so the shipping useEffect in CheckoutForm
  // does not retrigger on every render.
  const handleShippingChange = useCallback((charge) => setShippingCharges(charge), []);

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="w-full py-32 lg:py-24">
          <CategoryNavBar />

          <div className="flex flex-col items-center justify-between w-full gap-4 px-6 py-6 text-black bg-white border-t border-b md:flex-row md:py-12 md:gap-5 md:px-10 lg:px-20 brown-border">
            <h2 className="text-xl font-bold md:text-3xl lg:text-5xl">
              {checkout.checkoutButton}
            </h2>
            <CommonButton variant={6} isLink to="/product-listings">
              {common.continueShopping}
            </CommonButton>
          </div>

          <main className="w-full text-black bg-white">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 lg:px-8">
              <CheckoutForm
                onShippingChange={handleShippingChange}
                liveSummary={liveSummary}
                shippingCharges={shippingCharges}
                appliedCreditAmount={appliedCreditAmount}
                cartItems={cartItems}
                translateLanguage={translateLanguage}
                common={common}
                checkout={checkout}
                cart={cart}
              />
            </div>

            <div className="flex flex-col items-center justify-between w-full gap-4 px-8 py-8 text-black bg-white border-t border-b md:flex-row md:py-16 md:gap-5 brown-border">
              <h2 className="text-lg font-bold md:text-2xl lg:text-3xl">
                {common.continueShopping}
              </h2>
              <CommonButton variant={6} isLink to="/product-listings">
                {common.showAll}
              </CommonButton>
            </div>
          </main>

          <div className="w-full text-black bg-white">
            <Section10 />
          </div>

          <div className="pb-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default Checkout;
