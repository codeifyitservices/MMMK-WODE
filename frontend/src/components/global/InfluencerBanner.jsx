import { useState, useEffect, useMemo } from 'react';
import { LuSparkles, LuX } from 'react-icons/lu';
import useInfluencerTracking from '../../hook/useInfluencerTracking';

export default function InfluencerBanner() {
  const { activeReferralCode } = useInfluencerTracking();
  const [dismissed, setDismissed] = useState(false);

  // Check if current URL actively has the referral query (?ref=CODE or ?ref-CODE)
  const urlReferralCode = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    let paramCode = urlParams.get('ref') || urlParams.get('influencer');
    if (!paramCode && window.location.search) {
      const match = window.location.search.match(/[?&](?:ref|influencer)[=-]([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        paramCode = match[1];
      }
    }
    return paramCode ? paramCode.trim().toUpperCase() : null;
  }, []);

  const displayCode = urlReferralCode || activeReferralCode;

  useEffect(() => {
    if (!displayCode) return;
    const isDismissed = sessionStorage.getItem(`mmmk_banner_dismissed_${displayCode}`);
    setDismissed(isDismissed === 'true');
  }, [displayCode]);

  // Strictly only show when the visitor accesses the URL with an active referral parameter
  if (!urlReferralCode || dismissed) {
    return null;
  }

  const handleDismiss = (e) => {
    e?.stopPropagation();
    setDismissed(true);
    if (displayCode) {
      sessionStorage.setItem(`mmmk_banner_dismissed_${displayCode}`, 'true');
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
            {displayCode}
          </span>
          ) • AUTO-APPLIED AT CHECKOUT
        </span>
      </div>

      {/* Perfectly Vertically Centered Dismiss Button */}
      <div className="absolute right-3 inset-y-0 flex items-center justify-center z-20">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="w-7 h-7 flex items-center justify-center text-gray-950/70 hover:text-gray-950 hover:bg-black/10 transition-colors rounded-full cursor-pointer"
        >
          <LuX className="w-4 h-4 block" />
        </button>
      </div>
    </aside>
  );
}
