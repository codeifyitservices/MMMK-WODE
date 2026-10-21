import { useState, useEffect } from 'react';
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
      window.dispatchEvent(new CustomEvent('mmmk_influencer_banner_dismissed'));
    }
  };

  return (
    <aside
      aria-label="Influencer Promotion Banner"
      className="w-full h-10 bg-gradient-to-r from-[#dfba73] via-[#ebd296] to-[#cba657] text-gray-950 px-4 flex items-center justify-center relative select-none z-[49] shadow-sm border-b border-black/10 transition-all"
    >
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-center px-8 truncate">
        <LuSparkles className="w-4 h-4 text-gray-950 shrink-0 animate-pulse" />
        <span className="truncate">
          EXCLUSIVE <strong>20% INFLUENCER DISCOUNT</strong> ACTIVE (CODE:{' '}
          <span className="font-mono underline uppercase tracking-wider">
            {activeReferralCode}
          </span>
          ) • AUTO-APPLIED AT CHECKOUT
        </span>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-950/70 hover:text-gray-950 hover:bg-black/10 transition-colors rounded-full z-20 cursor-pointer"
      >
        <LuX className="w-4 h-4" />
      </button>
    </aside>
  );
}
