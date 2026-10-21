import { useGlobalContext } from '../../context/GlobalProvider';
import { useMemo } from 'react';
import useInfluencerTracking from '../../hook/useInfluencerTracking';

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export default function TopStrip() {
  const { topStrip } = useGlobalContext();
  const { activeReferralCode, hasActiveDiscount } = useInfluencerTracking();

  const activeMessages = useMemo(() => {
    const messages = [];

    // Prioritize active influencer discount message at the start of the marquee
    if (hasActiveDiscount && activeReferralCode) {
      messages.push(
        `EXCLUSIVE 20% INFLUENCER DISCOUNT ACTIVE (${activeReferralCode}) • AUTO-APPLIED AT CHECKOUT`
      );
    }

    if (topStrip && topStrip.messages) {
      messages.push(...topStrip.messages.filter((msg) => msg && msg.trim() !== ''));
    }

    return messages;
  }, [topStrip, hasActiveDiscount, activeReferralCode]);

  const isEnabled = (topStrip && topStrip.enabled) || (hasActiveDiscount && activeReferralCode);
  if (!isEnabled || activeMessages.length === 0) {
    return null;
  }

  const backgroundColor = topStrip?.backgroundColor || '#28120b';
  const textColor = getContrastColor(backgroundColor);
  const N = activeMessages.length;

  const renderMessages = (keyPrefix, ariaHidden = false) =>
    activeMessages.flatMap((msg, index) => [
      <div
        key={`${keyPrefix}-${index}`}
        style={{ minWidth: '100vw' }}
        className="flex-shrink-0 flex items-center justify-center h-full px-12 md:px-16 text-center uppercase whitespace-nowrap"
        {...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
      >
        <span className={msg.includes('INFLUENCER DISCOUNT') ? 'text-[#dfba73] font-bold tracking-wider' : ''}>
          {msg}
        </span>
      </div>,
      <span
        key={`${keyPrefix}-star-${index}`}
        className="flex-shrink-0 opacity-60 text-[15px] md:text-md px-8 md:px-12 text-[#dfba73]"
        {...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
      >
        ✦
      </span>,
    ]);

  return (
    <div
      style={{ backgroundColor, color: textColor }}
      className="hidden md:flex w-full h-12 items-center overflow-hidden relative z-[51] select-none text-xs md:text-sm tracking-widest border-b border-black/10 font-medium"
    >
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="animate-marquee-custom h-full"
          style={{
            '--marquee-duration': `${N * 20}s`,
            '--marquee-duration-mobile': `${N * 10}s`,
            width: 'max-content',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {renderMessages('p1')}
          {renderMessages('p2', true)}
        </div>
      </div>
    </div>
  );
}