import { useState } from 'react';
import useInfluencerTracking from '../../hook/useInfluencerTracking';
import { LuSparkles, LuX } from 'react-icons/lu';

export default function InfluencerBanner() {
  const { activeReferralCode, hasActiveDiscount } = useInfluencerTracking();
  const [dismissed, setDismissed] = useState(false);

  if (!hasActiveDiscount || !activeReferralCode || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Influencer Promotion Banner"
      className="w-full bg-gradient-to-r from-[#cfa557] via-[#dfba73] to-[#ebd296] text-black px-4 py-1.5 text-center text-xs sm:text-sm font-medium tracking-wide shadow-md flex items-center justify-center relative select-none z-40 transition-all"
    >
      <div className="flex items-center gap-2">
        <LuSparkles className="w-4 h-4 text-black animate-pulse flex-shrink-0" />
        <span>
          Exclusive <strong>20% Influencer Discount</strong> activated via{' '}
          <span className="font-bold underline uppercase tracking-wider">
            {activeReferralCode}
          </span>
          . Discount will be applied at checkout!
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/70 hover:text-black transition-colors rounded"
      >
        <LuX className="w-4 h-4" />
      </button>
    </aside>
  );
}
