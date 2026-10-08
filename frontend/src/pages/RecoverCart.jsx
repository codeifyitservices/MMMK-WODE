import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Tag, Spin, message } from 'antd';
import { ShoppingBag, CheckCircle, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RecoverCart() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'SUCCESS', 'ALREADY_CLAIMED', 'EXPIRED', 'ERROR'
  const [claimData, setClaimData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setStatus('ERROR');
      setErrorMessage('No recovery token was provided in the link.');
      return;
    }

    const claimOffer = async () => {
      try {
        setLoading(true);
        const userToken = localStorage.getItem('userToken');
        const headers = userToken ? { Authorization: `Bearer ${userToken}` } : {};

        const res = await axios.post(
          `${backendUrl}/api/v1/checkout/claim-recovery-coupon`,
          { token },
          { headers }
        );

        if (res.data?.success) {
          const couponInfo = res.data.data;
          setClaimData(couponInfo);
          setStatus('SUCCESS');

          // Persist the claimed coupon into local storage so CartProvider picks it up
          if (couponInfo.couponCode) {
            localStorage.setItem('appliedCouponCode', couponInfo.couponCode);
            localStorage.setItem('isCouponApplied', 'true');
            localStorage.setItem(
              'appliedCouponData',
              JSON.stringify({
                couponCode: couponInfo.couponCode,
                discount: couponInfo.discount,
                discountType: couponInfo.discountType,
                scope: 'All',
                applyToProducts: true,
              })
            );
          }
          message.success('Recovery offer claimed and applied to your cart!');
        } else {
          setStatus('ERROR');
          setErrorMessage(res.data?.message || 'Failed to claim recovery offer.');
        }
      } catch (err) {
        const errCode = err.response?.data?.code;
        const msg = err.response?.data?.message || 'Unable to claim offer.';

        if (errCode === 'ALREADY_CLAIMED') {
          setStatus('ALREADY_CLAIMED');
          setErrorMessage('This recovery offer has already been claimed.');
        } else if (errCode === 'TOKEN_EXPIRED' || errCode === 'COUPON_EXPIRED') {
          setStatus('EXPIRED');
          setErrorMessage('This recovery offer link has expired.');
        } else {
          setStatus('ERROR');
          setErrorMessage(msg);
        }
      } finally {
        setLoading(false);
      }
    };

    claimOffer();
  }, [token, backendUrl]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#f4f0ec]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#ded7d1] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#28120b] py-8 px-6 text-center text-[#ded7d1]">
          <h1 className="font-serif text-2xl tracking-widest text-[#f9f5f2] uppercase mb-1">
            MMMK Wode
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#8b5e4b]">Cart Recovery Offer</p>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {loading && (
            <div className="py-12 flex flex-col items-center">
              <Spin size="large" />
              <p className="mt-4 font-sans text-sm text-[#635d4a] tracking-wide">
                Validating your exclusive recovery offer...
              </p>
            </div>
          )}

          {!loading && status === 'SUCCESS' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[#e6ffcc] text-[#28120b] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={36} className="text-[#3d1e10]" />
              </div>

              <div>
                <h2 className="font-serif text-2xl text-[#28120b] mb-2 font-normal">
                  Offer Successfully Claimed!
                </h2>
                <p className="text-sm text-[#635d4a] leading-relaxed">
                  Your <strong className="text-[#28120b]">{claimData?.discount}% discount</strong> has
                  been activated and attached to your shopping cart.
                </p>
              </div>

              {claimData?.couponCode && (
                <div className="bg-[#f9f5f2] border border-[#ded7d1] rounded p-4 inline-block mx-auto">
                  <span className="text-xs uppercase tracking-widest text-[#8b5e4b] block mb-1">
                    Coupon Code
                  </span>
                  <span className="font-mono text-lg font-bold text-[#28120b] tracking-wider">
                    {claimData.couponCode}
                  </span>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/shopping-cart')}
                  className="bg-[#28120b] hover:bg-[#3d1e10] text-[#ded7d1] px-6 py-3 rounded text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <ShoppingBag size={16} />
                  Return to Cart
                </button>
                <button
                  onClick={() => navigate('/checkout')}
                  className="border border-[#28120b] text-[#28120b] hover:bg-[#28120b] hover:text-[#ded7d1] px-6 py-3 rounded text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {!loading && status === 'ALREADY_CLAIMED' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock size={32} />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-[#28120b] mb-2 font-normal">
                  Offer Already Claimed
                </h2>
                <p className="text-sm text-[#635d4a] leading-relaxed">
                  {errorMessage} Each recovery coupon link is single-use and has already been
                  activated for your cart.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/shopping-cart')}
                  className="bg-[#28120b] hover:bg-[#3d1e10] text-[#ded7d1] px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <ShoppingBag size={16} />
                  View Shopping Cart
                </button>
              </div>
            </div>
          )}

          {!loading && (status === 'EXPIRED' || status === 'ERROR') && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-[#28120b] mb-2 font-normal">
                  {status === 'EXPIRED' ? 'Offer Expired' : 'Unable to Claim Offer'}
                </h2>
                <p className="text-sm text-[#635d4a] leading-relaxed">{errorMessage}</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/shopping-cart')}
                  className="bg-[#28120b] hover:bg-[#3d1e10] text-[#ded7d1] px-8 py-3 rounded text-xs uppercase tracking-widest font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <ShoppingBag size={16} />
                  Return to Shopping Cart
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f9f5f2] border-t border-[#ede8e4] px-6 py-4 text-center">
          <p className="text-xs text-[#8b5e4b] mb-0">
            Questions regarding your order? <Link to="/contact-us" className="underline hover:text-[#28120b]">Contact Customer Support</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
