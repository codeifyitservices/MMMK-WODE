import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import bg from '../assets/bg.png';
import { getOrderByIdPublic } from '../apis/user/order';
import { refreshPaymentStatusPublic } from '../apis/user/payment';
import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';
import {
  formatPrice,
} from '../utils/currency';
import { useCurrency } from '../context/CurrencyContext';
import { TbGiftCard, TbCircleCheck, TbCircleX } from 'react-icons/tb';

const GiftCardSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const {
    content: { common, giftCard: giftCardText },
  } = useTranslationContext();
  const { currency } = useCurrency();
  const [refreshingOrder, setRefreshingOrder] = useState(false);

  const query = useQuery({
    queryKey: ['gift-card-success', orderId],
    queryFn: () => getOrderByIdPublic(orderId),
    enabled: !!orderId,
  });

  const order = query.data?.data?.[0];
  const isPaid = order?.paymentStatus === 'Paid';
  const isFailed = order?.paymentStatus === 'Failed';
  
  useEffect(() => {
    if (!orderId || !order || refreshingOrder) return;
    if (order.mode !== 'card') return;
    if (isPaid || isFailed) return;

    const refreshOrderStatus = async () => {
      try {
        setRefreshingOrder(true);
        await refreshPaymentStatusPublic(orderId);
        await query.refetch();
      } catch (error) {
        console.error('[GIFT_CARD_SUCCESS] Failed to refresh status', error);
      } finally {
        setRefreshingOrder(false);
      }
    };

    refreshOrderStatus();
  }, [orderId, order, refreshingOrder, query, isPaid, isFailed]);

  return (
    <div className="w-full">
      <Banner minHeight={35} bg={bg} />

      <main className="w-full pb-20 text-black bg-white">
        <div className="w-full gap-5 px-5 py-12 text-center text-black bg-white border-t border-b md:px-20">
          
          <div className="flex justify-center mb-6">
            {isPaid ? (
               <div className="bg-green-100 p-4 rounded-full">
                  <TbCircleCheck size={64} className="text-green-600" />
               </div>
            ) : isFailed ? (
                <div className="bg-red-100 p-4 rounded-full">
                   <TbCircleX size={64} className="text-red-600" />
                </div>
            ) : (
                <div className="bg-blue-100 p-4 rounded-full animate-pulse">
                   <TbGiftCard size={64} className="text-blue-600" />
                </div>
            )}
          </div>

          <h2 className="text-2xl font-bold md:text-4xl lg:text-5xl uppercase tracking-tight">
            {isPaid ? 'Purchase Successful!' : isFailed ? 'Purchase Failed' : 'Verifying Purchase...'}
          </h2>

          <p className="py-5 text-lg text-gray-600 max-w-2xl mx-auto">
            {isPaid 
              ? `Congratulations! Your gift card "${order?.temp?.giftCardPurchase?.name || 'Premium Gift Card'}" has been issued. You can find the code in your email or management dashboard.`
              : isFailed 
              ? 'Unfortunately, your payment could not be processed. Please check your payment details and try again.'
              : 'Please wait while we confirm your gift card purchase...'}
          </p>

          {refreshingOrder && (
            <p className="pb-4 text-sm text-blue-500 animate-pulse font-medium">
              Synchronizing with payment provider...
            </p>
          )}

          {order && (
            <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-gray-200 bg-gray-50 p-8 text-left shadow-sm">
               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-500 uppercase text-xs tracking-widest font-bold">Transaction ID</span>
                    <span className="font-mono font-bold text-gray-800">{order.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-500 uppercase text-xs tracking-widest font-bold">Gift Card</span>
                    <span className="font-bold text-gray-800">{order?.temp?.giftCardPurchase?.name || 'MMMK Wode Gift Card'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-500 uppercase text-xs tracking-widest font-bold">Value</span>
                    <span className="text-xl font-black text-orange-600">
                        {formatPrice(order?.temp?.giftCardPurchase?.amountInCurrency || order?.totalAmount || 0, order?.currency || currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 uppercase text-xs tracking-widest font-bold">Status</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase ${isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.paymentStatus}
                    </span>
                  </div>
               </div>
            </div>
          )}

          <div className="flex flex-col gap-4 justify-center mt-12 md:flex-row md:items-center">
            {isPaid && (
              <>
                <CommonButton variant={6} size="md" isLink to="/profile/my-credit">
                  View Credits
                </CommonButton>
                <CommonButton variant={5} size="md" isLink to="/profile/my-orders">
                  My Orders
                </CommonButton>
              </>
            )}
            
            <CommonButton 
                variant={isPaid ? 2 : 6} 
                size="md" 
                isLink 
                to="/gift-cards"
            >
              Back to Gift Cards
            </CommonButton>

            {isFailed && (
               <CommonButton 
               variant={5} 
               size="md" 
               isLink 
               to="/gift-cards/buy"
           >
             Try Again
           </CommonButton>
            )}
          </div>
        </div>
      </main>

      <NewsLetter />
    </div>
  );
};

export default GiftCardSuccess;
