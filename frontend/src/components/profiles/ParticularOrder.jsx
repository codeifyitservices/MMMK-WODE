import dayjs from 'dayjs';
import { getPercentageOf, percentageValue } from '../../utils/globalMethods';
import { LuArrowLeft } from 'react-icons/lu';
import { FaExchangeAlt } from 'react-icons/fa';
import {
  translate,
  useTranslationContext,
} from '../../context/TranslationContext';
import { useEffect } from 'react';
import { formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { TbGiftCard } from 'react-icons/tb';

const ParticularOrder = ({ activeOrder, setActiveOrder }) => {
  const {
    content: { profile, common },
    translateLanguage,
  } = useTranslationContext();
  const { currency } = useCurrency();
  const orderCurrency = activeOrder?.currency || currency;
  const isGiftCard = activeOrder?.temp?.purchaseType === 'gift-card' || activeOrder?.products?.[0]?.sku === 'gift-card';

  const formatOrderPrice = (amount) =>
    formatPrice(Number(amount || 0), orderCurrency);

  const paymentSummary = {
    subtotal:
      Number(activeOrder?.price?.subtotal) ||
      activeOrder?.products?.reduce((a, b) => {
        return a + (Number(b?.amount) || 0);
      }, 0) || Number(activeOrder?.amount || 0),
    shippingCharges: Number(activeOrder?.price?.shippingCharges || 0),
    couponDiscount: Number(activeOrder?.price?.couponDiscount || 0),
    creditApplied: Number(activeOrder?.price?.creditApplied || 0),
    total: Number(activeOrder?.price?.total || activeOrder?.totalAmount || activeOrder?.amount || 0),
    payableTotal: Number(activeOrder?.price?.payableTotal || activeOrder?.amountDueCOD || activeOrder?.amountPaidOnline || 0),
  };

  const handleTranslateProductData = async (data, language) => {
    const allFieldsToTranslate = {
      shippingStreet: data.shippingAddress?.streetAddress,
      shippingCity: data.shippingAddress?.city,
      shippingState: data.shippingAddress?.state,
      shippingPostalCode: data.shippingAddress?.postalCode,
      shippingCountry: data.shippingAddress?.country,
      shippingCompany: data.shippingAddress?.company,
      shippingPhone: data.shippingAddress?.phoneNumber,
      billingStreet: data.billingAddress?.streetAddress,
      billingCity: data.billingAddress?.city,
      billingState: data.billingAddress?.state,
      billingPostalCode: data.billingAddress?.postalCode,
      billingCountry: data.billingAddress?.country,
      billingCompany: data.billingAddress?.company,
      billingPhone: data.billingAddress?.phoneNumber,
    };

    data.products?.forEach((product, i) => {
      allFieldsToTranslate[`productName_${i}`] =
        product?.id?.productName?.en || product?.name || '';
      allFieldsToTranslate[`productDescription_${i}`] =
        product?.id?.productDescription?.en || '';
    });

    if (language === 'en') {
      setActiveOrder({
        ...data,
        translated: allFieldsToTranslate,
        translatedTo: 'en',
      });
      return;
    }

    const toTranslate = Object.entries(allFieldsToTranslate).reduce(
      (acc, [key, value]) => {
        if (value && typeof value === 'string') {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    const translatedData = await translate(
      Object.values(toTranslate),
      language
    );

    setActiveOrder({
      ...data,
      translated: Object.keys(toTranslate).reduce((acc, key, index) => {
        acc[key] = translatedData[index];
        return acc;
      }, {}),
      translatedTo: language,
    });
  };

  useEffect(() => {
    if (activeOrder && activeOrder.translatedTo !== translateLanguage)
      handleTranslateProductData(activeOrder, translateLanguage);
  }, [activeOrder, translateLanguage]);
  return (
    <div className="container p-4 mx-auto">
      {/* Header */}
      <div className="flex flex-col items-start justify-between pb-4 mb-6 border-b md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveOrder(null)}>
            <LuArrowLeft size={28} />
          </button>
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-semibold">
              {isGiftCard ? (
                <span className="text-orange-600">GIFT CARD</span>
              ) : (
                activeOrder?.orderId
              )}
            </h2>
            <p className="text-gray-600">
              {dayjs(activeOrder?.createdAt).format('DD/MM/YYYY hh:mm A')}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <span className="px-4 py-2 text-white bg-yellow-400 rounded-full uppercase">
            {isGiftCard ? '-' : activeOrder?.status}
          </span>
          <div className="flex ml-4 space-x-4">
          </div>
        </div>
      </div>

      {/* Product Items */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Product List */}
        <div className="md:col-span-2 h-min">
          {isGiftCard ? (
            <div className="space-y-6">
              <div className="relative mx-auto w-full max-w-md">
                <div className="bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg shadow-lg p-6 aspect-[1.6/1] flex flex-col justify-between">
                  <div className="text-right flex justify-between">
                    <img src="/logoIcon1.jpg" className="w-20 h-auto object-contain" alt="" />
                    <img src="/logoIcon2.jpg" alt="" className="w-20 h-auto object-contain" />
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-medium text-black mb-1">
                      {activeOrder?.temp?.giftCardPurchase?.name || "Premium Gift Card"}
                    </p>
                    <p className="text-3xl font-bold text-black">
                      {formatOrderPrice(paymentSummary.total)}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 uppercase tracking-tight">
                      {common.validForOnlinePurchases || "Valid for online purchases"}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <p className="text-[10px] text-gray-600 italic">
                      • {profile.termsApply || "Terms apply"}
                    </p>
                    <p className="text-[10px] text-gray-700 text-right">
                      <span className="block font-medium">Valid until</span>
                      {dayjs(activeOrder?.createdAt).add(1, 'year').format('DD MMM YYYY')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
                <p className="text-blue-800 font-medium">
                  This is a digital gift card. Your unique code and password have been sent to your email. 
                  You can also manage and share it from your <a href="/profile/my-credit" className="underline font-bold">Credits Page</a>.
                </p>
              </div>
            </div>
          ) : (
            activeOrder?.products?.map((product, index) => (
              <div
                key={index}
                className="flex flex-col p-4 transition-all duration-200 bg-gray-100 border rounded-lg hover:shadow-md mb-4"
              >
                <div className="flex">
                  <img
                    src={
                      product.sku === 'MMMK-BAG' 
                        ? '/mmmk-bag.jpeg' 
                        : resolveAssetUrl(product?.id?.images?.[0])
                    }
                    onError={(e) => {
                      if (product.sku === 'MMMK-BAG') e.target.src = '/logoIcon1.jpg';
                    }}
                    className="object-cover w-20 h-20 mr-4 rounded bg-white"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {product.sku === 'MMMK-BAG' ? 'MMMK Exclusive Bag' : (activeOrder.translated?.[`productName_${index}`] || product?.name)}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4">
                        {product?.id?.discount > 0 && (
                          <p className="text-gray-500 text-sm">
                            <span className="line-through">
                              {' '}
                              {formatOrderPrice(
                                (Number(product?.amount || 0) / (1 - Number(product.id.discount)/100))
                              )}
                            </span>
                            <span className="text-green-600 font-semibold ml-1">
                              {product?.id?.discount}% OFF
                            </span>
                          </p>
                        )}
                        <h3 className="text-lg font-bold text-black">
                          {formatOrderPrice(Number(product?.amount || 0))}
                        </h3>
                      </div>
                      <p className="text-gray-600 font-medium">
                        {profile.quantity}: {product?.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details */}
        <div className="p-6 border rounded-lg bg-gray-50">
          {!isGiftCard && (
            <>
              {/* Shipping Information */}
              <div className="mb-6">
                <h4 className="font-semibold">{profile.shippingInformation}</h4>
                <p className="text-gray-600">
                  {profile.street}: {activeOrder?.translated?.shippingStreet} <br />
                  {profile.city}:{' '}
                  <strong>{activeOrder?.translated?.shippingCity}</strong> <br />
                  {profile.state}: {activeOrder?.translated?.shippingState} <br />
                  {profile.postalCode}: {activeOrder?.shippingAddress?.postalCode}{' '}
                  <br />
                  {profile.country}: {activeOrder?.translated?.shippingCountry}
                </p>
              </div>

              {/* Delivery Information */}
              <div className="mb-6">
                <h4 className="font-semibold">{profile.deliveryInformation}</h4>
                <div className="text-gray-600">
                  <span className="font-semibold">{profile.deliveryStatus}: </span>
                  <span
                    className={`font-medium ${
                      activeOrder?.deliveryStatus === 'Delivered'
                        ? 'text-green-600'
                        : activeOrder?.deliveryStatus === 'In Transit' ||
                            activeOrder?.deliveryStatus === 'Out for Delivery'
                        ? 'text-blue-500'
                        : activeOrder?.deliveryStatus === 'Failed' ||
                            activeOrder?.deliveryStatus === 'Returned'
                        ? 'text-red-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {activeOrder?.deliveryStatus || profile.pending}
                  </span>
                  <br />
                  <span className="font-semibold">{profile.shipper}: </span>
                  {activeOrder?.shipperName || '-'} <br />
                  <span className="font-semibold">{profile.awb}: </span>
                  {activeOrder?.awb || '-'}
                  {activeOrder?.trackingUrl && (
                    <div className="mt-1">
                      <a
                        href={activeOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline font-medium flex items-center gap-1"
                      >
                        {profile.trackPackage}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="font-semibold">{profile.contactInformation}</h4>
            <p className="text-gray-600">
              <span className="font-semibold">{profile.phone}: </span>
              {activeOrder?.userId?.contactNumber || 'N/A'} <br />
              <span className="font-semibold">{profile.email}: </span>
              {activeOrder?.userId?.email}
            </p>
          </div>

          {!isGiftCard && (
            /* Billing Address */
            <div className="mb-6">
              <h4 className="font-semibold">{profile.billingAddress}</h4>
              <p className="text-gray-600">
                {profile.street}: {activeOrder?.translated?.billingStreet} <br />
                {profile.city}:{' '}
                <strong>{activeOrder?.translated?.billingCity}</strong> <br />
                {profile.state}: {activeOrder?.translated?.billingState} <br />
                {profile.postalCode}: {activeOrder?.billingAddress?.postalCode}{' '}
                <br />
                {profile.country}: {activeOrder?.translated?.billingCountry}
              </p>
            </div>
          )}

          {/* Support Information */}
          <div>
            <h4 className="font-semibold">{profile.support}</h4>
            <p className="text-gray-600">
              {profile.email}: support@mmmk-wode.com <br />
              {profile.phone}: +971-7837647890
            </p>
          </div>
        </div>

        <div>
          {/* Payment Breakdown */}
          <div className="w-full max-w-[620px] p-4 mt-6 bg-white border shadow-sm rounded-lg">
            <h4 className="mb-4 text-lg font-bold border-b pb-2 uppercase tracking-tight">
              {profile.paymentBreakdown}
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <p>{profile.subTotal}</p>
                <p>{formatOrderPrice(paymentSummary.subtotal)}</p>
              </div>

              {activeOrder?.couponCode && (
                <div className="flex justify-between text-gray-600 italic">
                  <p>Coupon ({activeOrder.couponCode})</p>
                  <p>-{formatOrderPrice(paymentSummary.couponDiscount)}</p>
                </div>
              )}

              {!isGiftCard && paymentSummary.shippingCharges > 0 && (
                <div className="flex justify-between text-gray-600">
                  <p>Shipping</p>
                  <p>{formatOrderPrice(paymentSummary.shippingCharges)}</p>
                </div>
              )}

              {paymentSummary.creditApplied > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <p>Credits Used</p>
                  <p>-{formatOrderPrice(paymentSummary.creditApplied)}</p>
                </div>
              )}

              <div className="flex justify-between pt-4 mt-2 font-bold text-xl text-black border-t border-gray-100">
                <p>
                  {activeOrder?.paymentMethod?.includes('cod') || activeOrder?.mode === 'cod' 
                    ? 'Amount Due' 
                    : 'Grand Total'}
                </p>
                <p>{formatOrderPrice(paymentSummary.total)}</p>
              </div>

              <div className="flex justify-between text-xs font-bold uppercase mt-1">
                 <span className="text-gray-400">Payment Status</span>
                 <span className={activeOrder?.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-500'}>
                    {activeOrder?.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                 </span>
              </div>
            </div>
          </div>

          {/* Return / Exchange + Cancel Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            {!isGiftCard && ['delivered', 'completed'].includes(
              activeOrder?.status?.toLowerCase()
            ) && (
              <button
                onClick={() =>
                  window.open(
                    `https://juraa.co/general/return-order?id=${activeOrder.orderId}&website=MMMK+WODE`,
                    '_blank'
                  )
                }
                className="w-full sm:w-auto px-6 py-2 text-amber-600 transition-all duration-200 border border-amber-600 rounded hover:bg-amber-50 flex items-center justify-center gap-2"
              >
                <FaExchangeAlt size={13} />
                Return / Exchange
              </button>
            )}
            <button
              onClick={() => setActiveOrder(null)}
              className="w-full sm:w-auto px-12 py-2 text-gray-500 transition-all duration-200 border border-gray-500 rounded hover:bg-gray-100"
            >
              {common.back || "Back"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticularOrder;
