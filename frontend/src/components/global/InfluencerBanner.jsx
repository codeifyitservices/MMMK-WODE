import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuSparkles, LuX } from 'react-icons/lu';
import useInfluencerTracking from '../../hook/useInfluencerTracking';

export default function InfluencerBanner() {
  const { activeReferralCode, hasActiveDiscount } = useInfluencerTracking();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!activeReferralCode) return;
    const isDismissed = sessionStorage.getItem(`mmmk_banner_dismissed_${activeReferralCode}`);
    setDismissed(isDismissed === 'true');
  }, [activeReferralCode]);

  if (!hasActiveDiscount || !activeReferralCode || dismissed) {
    return null;
  }

  const handleDismiss = (e) => {
    e?.stopPropagation();
    setDismissed(true);
    if (activeReferralCode) {
      sessionStorage.setItem(`mmmk_banner_dismissed_${activeReferralCode}`, 'true');
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        aria-label="Influencer VIP Promotion"
        className="fixed top-16 md:top-28 right-3 left-3 sm:left-auto sm:right-6 lg:right-10 z-50 max-w-md bg-gradient-to-r from-gray-950/95 via-yellow-950/90 to-gray-950/95 backdrop-blur-xl border border-[#dfba73]/40 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl shadow-black/80 flex items-center justify-between gap-3 select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#dfba73]/20 border border-[#dfba73]/40 flex items-center justify-center shrink-0 text-[#dfba73]">
            <LuSparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="text-xs tracking-wide truncate">
            <span className="text-gray-300">VIP Perk: </span>
            <strong className="text-[#dfba73] font-semibold">20% OFF</strong>
            <span className="text-gray-300"> via </span>
            <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-[11px]">
              {activeReferralCode}
            </span>
            <span className="hidden md:inline text-gray-400 text-[11px] ml-1.5">
              • Applied at checkout
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss discount notification"
          className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <LuX className="w-3.5 h-3.5" />
        </button>
      </motion.aside>
    </AnimatePresence>
  );
}
