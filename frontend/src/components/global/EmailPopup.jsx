import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Copy, ArrowRight } from 'lucide-react';
import { getPopupConfig, subscribeNewsletter } from '../../apis/nonAuth/newsletter';

const STORAGE_KEY_SUBSCRIBED = 'mmmk_newsletter_subscribed';
const STORAGE_KEY_SUBSCRIBER_EMAIL = 'mmmk_newsletter_subscriber_email';
const STORAGE_KEY_DISMISSED_UNTIL = 'mmmk_newsletter_dismissed_until';

const EXCLUDED_PREFIXES = [
  '/admin',
  '/influencer',
  '/checkout',
  '/order-success',
  '/thank-you',
  '/payment',
  '/auth',
  '/new-password',
  '/forget-password',
];

const EmailPopup = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null); // { discountCode, message, hasCoupon }
  const [copied, setCopied] = useState(false);

  // Check if current route is excluded
  const isExcludedRoute = EXCLUDED_PREFIXES.some((prefix) =>
    location.pathname.toLowerCase().startsWith(prefix)
  );

  // Allow ?test_popup=true or #test-popup for developers/admins to test anytime without clearing storage
  const isForceTest =
    location.search.includes('test_popup=true') ||
    location.hash === '#test-popup';

  useEffect(() => {
    // Clear any legacy dismissal blocker so popup always appears on refresh
    try {
      localStorage.removeItem(STORAGE_KEY_DISMISSED_UNTIL);
    } catch (_) {}

    if (isExcludedRoute) return;

    let isMounted = true;
    let timer = null;

    const storedEmail = localStorage.getItem(STORAGE_KEY_SUBSCRIBER_EMAIL);

    // Fetch config, passing storedEmail if exists to verify with DB
    getPopupConfig(storedEmail ? { email: storedEmail } : {})
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && res?.data?.enabled !== false) {
          const popupConfig = res.data;
          setConfig(popupConfig);

          // If the visitor's email is actively found in DB, suppress popup
          if (!isForceTest && popupConfig.isSubscribed) {
            console.log('[EmailPopup] Suppressed: Visitor is actively subscribed in DB.');
            return;
          }

          // If the email was deleted by the Admin from DB, reactivate popup on refresh
          if (storedEmail && !popupConfig.isSubscribed) {
            console.log('[EmailPopup] Email was deleted by Admin. Reactivating popup!');
            try {
              localStorage.removeItem(STORAGE_KEY_SUBSCRIBER_EMAIL);
              localStorage.removeItem(STORAGE_KEY_SUBSCRIBED);
            } catch (_) {}
          }

          const delayMs = (popupConfig.delaySeconds || 6) * 1000;
          console.log(`[EmailPopup] Waiting ${popupConfig.delaySeconds || 6}s before displaying popup...`);
          timer = setTimeout(() => {
            if (isMounted) {
              setIsOpen(true);
            }
          }, delayMs);
        } else {
          console.log('[EmailPopup] Popup is currently disabled in Admin settings.');
        }
      })
      .catch((err) => {
        console.warn('Could not load email popup config:', err);
      });

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname, location.search, location.hash, isExcludedRoute, isForceTest]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Dismissing only closes the current popup view.
    // It will show again on browser refresh if user hasn't submitted their email.
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await subscribeNewsletter({
        email: cleanEmail,
        source: 'popup',
      });

      if (response?.success) {
        // Mark as subscribed and record email for dynamic DB synchronization
        try {
          localStorage.setItem(STORAGE_KEY_SUBSCRIBER_EMAIL, cleanEmail);
          localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true');
        } catch (_) {}

        setSuccessData({
          discountCode: response.discountCode || (config?.offerCoupon !== false ? config?.discountCode : null),
          message: response.message,
          hasCoupon: Boolean(response.discountCode || (config?.offerCoupon !== false && config?.discountCode)),
        });
      } else {
        setErrorMessage(response?.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('[EmailPopup] Subscription error:', error?.response || error);
      const msg =
        error?.response?.data?.message ||
        'Unable to subscribe right now. Please try again later.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!successData?.discountCode) return;
    navigator.clipboard.writeText(successData.discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShopNow = () => {
    setIsOpen(false);
    navigate('/product-listings');
  };

  if (!isOpen || isExcludedRoute) return null;

  const showCouponOffer = config?.offerCoupon !== false;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#dfba73]/30 bg-gradient-to-b from-[#181411] via-[#100c0a] to-[#0a0706] p-7 md:p-9 shadow-2xl text-white z-10"
          style={{
            boxShadow: '0 25px 60px -15px rgba(223, 186, 115, 0.15)',
          }}
        >
          {/* Subtle gold radial background glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-[#dfba73]/15 blur-3xl" />

          {/* Close Icon Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close newsletter popup"
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          {!successData ? (
            /* ================= SUBSCRIPTION FORM STATE ================= */
            <div className="relative text-center">
              {/* Brand Tag Pill */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dfba73]/30 bg-[#dfba73]/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#dfba73]">
                <Sparkles size={12} />
                <span>Maison Privilege</span>
              </div>

              {/* Title */}
              <h2 className="mt-4 font-serif text-2xl md:text-3xl font-normal tracking-wide text-white">
                {config?.title || 'JOIN THE MAISON MMMK WODE'}
              </h2>

              {/* Subtitle */}
              <p className="mt-2 text-sm md:text-base leading-relaxed text-stone-300">
                {config?.subtitle ||
                  'Enjoy exclusive privileges and receive private invitations to new releases.'}
              </p>

              {/* Discount Highlight Banner (Only if offerCoupon is enabled) */}
              {showCouponOffer && (
                <div className="mt-4 rounded-xl border border-[#dfba73]/20 bg-[#dfba73]/5 py-2.5 px-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-[#dfba73]">
                    {config?.discountText ||
                      `Use code ${config?.discountCode || 'WELCOME15'} at checkout for discount`}
                  </span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubscribe} className="mt-6 space-y-3.5 text-left">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your email address"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 text-sm text-white placeholder-stone-400 focus:border-[#dfba73] focus:outline-none focus:ring-1 focus:ring-[#dfba73] transition-all disabled:opacity-60"
                  />
                  {errorMessage && (
                    <p className="mt-1.5 text-xs text-rose-400 pl-1">{errorMessage}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#e7cb8c] via-[#dfba73] to-[#cba358] py-3.5 px-6 font-medium text-black text-sm tracking-wide shadow-lg hover:shadow-[#dfba73]/30 transition-all duration-300 hover:brightness-105 active:scale-[0.99] disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                      Securing Privilege...
                    </span>
                  ) : (
                    <>
                      <span>
                        {config?.buttonText ||
                          (showCouponOffer ? 'CLAIM MY PRIVILEGE' : 'JOIN THE MAISON')}
                      </span>
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Dismiss Subtle Link */}
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-4 text-xs text-stone-400 hover:text-stone-200 transition-colors underline-offset-4 hover:underline"
              >
                No thank you, I prefer full price
              </button>
            </div>
          ) : (
            /* ================= SUCCESS STATE ================= */
            <div className="relative text-center py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dfba73]/15 border border-[#dfba73]/40 text-[#dfba73]">
                <Check size={28} />
              </div>

              <h3 className="mt-4 font-serif text-2xl font-normal text-white">
                Welcome to the VIP Circle
              </h3>

              <p className="mt-2 text-sm text-stone-300">
                {successData.message ||
                  (successData.hasCoupon
                    ? 'Your privilege is unlocked. Use this voucher code at checkout.'
                    : 'You will receive private invitations to exclusive drops and releases.')}
              </p>

              {/* Copyable Voucher Box (Only if coupon is awarded) */}
              {successData.hasCoupon && successData.discountCode && (
                <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-[#dfba73]/50 bg-black/60 p-3.5 px-5">
                  <span className="font-mono text-lg font-bold tracking-widest text-[#dfba73]">
                    {successData.discountCode}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-[#dfba73]/20 hover:bg-[#dfba73]/30 px-3 py-1.5 text-xs font-semibold text-[#dfba73] transition-colors active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Shop CTA */}
              <button
                type="button"
                onClick={handleShopNow}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e7cb8c] via-[#dfba73] to-[#cba358] py-3 px-6 font-medium text-black text-sm tracking-wide shadow-lg hover:brightness-105 transition-all"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EmailPopup;
