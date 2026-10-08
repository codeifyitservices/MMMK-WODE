import React, { useEffect, useState, useRef } from 'react';
import { Form, Input, InputNumber, message } from 'antd';
import Banner from '../components/global/Banner';
import CategoryNavBar from '../components/global/CategoryNavBar';
import NewsLetter from '../components/global/NewsLetter';
import Section10 from '../components/home/Section10';
import { CommonButton } from '../components/global/UIButtons';
import { useTranslationContext } from '../context/TranslationContext';
import bg from '../assets/bg.png';
import { useNavigate } from 'react-router-dom';
import { createPaymentIntent } from '../apis/user/payment';
import { loadStripe } from '@stripe/stripe-js';
import { convertPrice, formatPrice, convertStoredPrice } from '../utils/currency';
import { useCurrency } from '../context/CurrencyContext';

const BuyGiftCard = () => {
  const {
    content: { common, buyGiftCard },
  } = useTranslationContext();
  const navigate = useNavigate();
  const { currency, rates } = useCurrency();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const giftCardName = Form.useWatch('name', form);
  const amount = Form.useWatch('amount', form);
  
  const prevCurrencyRef = useRef(currency);

  // Convert current amount when currency changes
  useEffect(() => {
    if (amount && prevCurrencyRef.current !== currency) {
      const currentAmount = form.getFieldValue('amount');
      const convertedAmount = convertStoredPrice(
        currentAmount,
        prevCurrencyRef.current,
        currency,
        rates
      );
      form.setFieldValue('amount', convertedAmount);
    }
    prevCurrencyRef.current = currency;
  }, [currency, rates, amount, form]);

  const minAmount = convertPrice(10, currency, rates);
  const maxAmount = convertPrice(27000, currency, rates);

  const expiryDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  // Predefined gift card amounts in USD
  const predefinedAmountsUSD = [25, 50, 100, 250, 500];

  const handleAmountSelect = (value) => {
    form.setFieldValue('amount', value);
  };

  const handleSubmit = async (values) => {
    const normalizedAmount = Number(values.amount || 0);
    const normalizedName = values.name?.trim();

    try {
      setLoading(true);

      if (
        !normalizedAmount ||
        normalizedAmount < minAmount ||
        normalizedAmount > maxAmount
      ) {
        message.error(
          `Amount must be between ${formatPrice(minAmount, currency)} and ${formatPrice(maxAmount, currency)}`
        );
        return;
      }

      if (!normalizedName) {
        message.error('Gift card name is required');
        return;
      }

      const publishableKey = getStripePublishableKey();
      if (!publishableKey) {
        throw new Error('Stripe publishable key is not configured');
      }

      const stripePromise = await loadStripe(publishableKey);
      if (!stripePromise) {
        throw new Error('Stripe checkout could not be initialized');
      }
      const paymentIntent = await createPaymentIntent({
        products: [
          {
            product: {
              _id: 'gift-card',
              productName: { en: normalizedName },
              price: normalizedAmount,
              discount: 0,
              image: '',
            },
            quantity: 1,
            sku: 'gift-card',
            filters: {},
          },
        ],
        shippingAddress: buildGiftCardAddress(normalizedName),
        billingAddress: buildGiftCardAddress(normalizedName),
        shippingCharges: 0,
        couponCode: null,
        creditsUsed: 0,
        totalAmount: normalizedAmount,
        currency,
        giftCardPurchase: {
          name: normalizedName,
          amount: normalizedAmount,
        },
        orderType: 'gift-card',
        paymentType: 'card',
      });

      if (paymentIntent?.paidWithCredits && paymentIntent?.orderId) {
        message.success('Gift card purchase completed successfully');
        form.resetFields();
        navigate(`/gift-card-success/${paymentIntent.orderId}`);
        return;
      }

      if (!paymentIntent?.id) {
        throw new Error('Payment session could not be created');
      }

      message.success(
        'Gift card purchase initiated! Redirecting to payment...'
      );

      form.resetFields();
      const result = await stripePromise.redirectToCheckout({
        sessionId: paymentIntent.id,
      });

      if (result?.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Gift card purchase error:', error);
      message.error('Failed to process gift card purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="w-full md:mt-24 mt-36">
          <CategoryNavBar />

          {/* Header Section */}
          <div className="flex flex-col items-center justify-between w-full gap-4 px-6 py-6 text-black bg-white border-t border-b md:flex-row md:py-12 md:gap-5 md:px-10 lg:px-20">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold md:text-4xl lg:text-5xl">
                {buyGiftCard.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {buyGiftCard.subtitle}
              </p>
            </div>
            <CommonButton variant={6} isLink to="/product-listings">
              {common.continueShopping}
            </CommonButton>
          </div>

          {/* Main Content */}
          <main className="w-full px-4 py-8 text-black bg-white md:px-6 lg:px-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Side - Gift Card Preview */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl text-[#D6AD60] font-bold md:text-3xl">
                    {buyGiftCard.mmmkWoodGiftCard}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {buyGiftCard.giftCardDescription}
                  </p>
                </div>

                {/* Gift Card Visual */}
                <div className="relative mx-auto w-full max-w-md">
                  <div className="bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg shadow-lg p-6 aspect-[1.6/1] flex flex-col justify-between">
                    <div className="text-right flex justify-between">
                      {/* <h3 className="text-xl font-bold text-black">
                        {common.mmmk}
                      </h3>
                      <p className="text-sm text-gray-700">{common.giftCard}</p> */}
                      <img src="/logoIcon1.jpg" className="w-20" alt="" />
                      <img src="/logoIcon2.jpg" alt="" className="w-20" />
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-medium text-black mb-1">
                        {giftCardName || buyGiftCard.giftCardName}
                      </p>
                      <p className="text-3xl font-bold text-black">
                        {formatPrice(amount || 0, currency)}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {common.validForOnlinePurchases}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <p className="text-xs text-gray-600">
                        • {buyGiftCard.termsApply}
                      </p>
                      <p className="text-xs text-gray-700 text-right">
                        <span className="block font-medium">Valid until</span>
                        {expiryDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gift Card Benefits */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {buyGiftCard.whyChoose}
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      {buyGiftCard.validForAYear}
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      {buyGiftCard.anyProduct}
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      {buyGiftCard.instantRedemption}
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✓</span>
                      {buyGiftCard.giftCardDescription}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Side - Purchase Form */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">
                  {buyGiftCard.purchaseGiftCard}
                </h2>

                {/* Purchase Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  className="space-y-4"
                >
                  {/* Gift Card Name */}
                  <Form.Item
                    label={
                      <span className="text-lg font-semibold">
                        {buyGiftCard.giftCardName}:
                      </span>
                    }
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: buyGiftCard.pleaseEnterGiftCardName,
                      },
                      {
                        min: 2,
                        message: buyGiftCard.atLeast2Char,
                      },
                      {
                        max: 50,
                        message: buyGiftCard.atMost50Char,
                      },
                    ]}
                  >
                    <Input
                      placeholder={buyGiftCard.namePlaceholder}
                      className="py-3 text-base"
                    />
                  </Form.Item>

                  {/* Amount Selection */}
                  <div className="space-y-4">
                    <label className="text-lg font-semibold">
                      {buyGiftCard.selectAmount}:
                    </label>

                    {/* Predefined Amounts */}
                    <div className="grid grid-cols-3 gap-3">
                      {predefinedAmountsUSD.map((usdValue) => {
                        const localValue = convertPrice(usdValue, currency, rates);
                        return (
                          <button
                            key={usdValue}
                            type="button"
                            onClick={() => handleAmountSelect(localValue)}
                            className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                              localValue === amount
                                ? 'border-orange-200 bg-orange-50 text-orange-800'
                                : 'border-gray-300 hover:border-orange-200'
                            }`}
                          >
                            {formatPrice(localValue, currency)}
                          </button>
                        );
                      })}
                    </div>

                    <Form.Item
                      label={`${buyGiftCard.customAmount} (${formatPrice(minAmount, currency)} - ${formatPrice(maxAmount, currency)}):`}
                      name="amount"
                      rules={[
                        {
                          required: true,
                          message: buyGiftCard.pleaseEnterGiftCardAmount,
                        },
                      ]}
                    >
                      <InputNumber
                        min={minAmount}
                        max={maxAmount}
                        placeholder={buyGiftCard.enterAmount}
                        className="py-2 text-base w-full"
                      />
                    </Form.Item>
                  </div>

                  {/* Purchase Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      {buyGiftCard.purchaseSummary}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span>{buyGiftCard.giftCardAmount}:</span>
                      <span className="font-bold">
                        {formatPrice(amount || 0, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <span className="font-semibold">{common.total}:</span>
                      <span className="font-bold text-lg">
                        {formatPrice(amount || 0, currency)}
                      </span>
                    </div>
                  </div>

                  <CommonButton
                    type="submit"
                    variant={3}
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading
                      ? `${buyGiftCard.processing}...`
                      : buyGiftCard.purchaseGiftCard}
                  </CommonButton>
                </Form>

                {/* Terms */}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• {buyGiftCard.term1}</p>
                  <p>• {buyGiftCard.term2}</p>
                  <p>• {buyGiftCard.term3}</p>
                  <p>• {buyGiftCard.term4}</p>
                </div>
              </div>
            </div>
          </main>

          <div className="w-full text-black bg-white">
            <Section10 />
          </div>

          <div className="py-10">
            <NewsLetter />
          </div>
        </div>
      </Banner>
    </div>
  );
};

export default BuyGiftCard;

const getStripePublishableKey = () => {
  const mode = (import.meta.env.VITE_STRIPE_MODE || 'live').toLowerCase();
  if (mode === 'test') {
    return (
      import.meta.env.VITE_STRIPE_TEST_API_KEY ||
      import.meta.env.VITE_STRIPE_API_KEY ||
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );
  }

  return (
    import.meta.env.VITE_STRIPE_LIVE_API_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_STRIPE_API_KEY
  );
};

const buildGiftCardAddress = (name) => ({
  firstName: name || 'Gift',
  lastName: 'Card',
  streetAddress: 'Digital delivery',
  country: '',
  state: '',
  postalCode: '',
  city: '',
  company: '',
  phoneNumber: '',
  landmark: 'Online purchase',
});
