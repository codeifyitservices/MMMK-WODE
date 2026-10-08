import { useGlobalContext } from '../../context/GlobalProvider';
import { useMemo } from 'react';

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

  const activeMessages = useMemo(() => {
    if (!topStrip || !topStrip.messages) return [];
    return topStrip.messages.filter((msg) => msg && msg.trim() !== '');
  }, [topStrip]);

  if (!topStrip || !topStrip.enabled || activeMessages.length === 0) {
    return null;
  }

  const backgroundColor = topStrip.backgroundColor || '#28120b';
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
        <span>{msg}</span>
      </div>,
      <span
        key={`${keyPrefix}-star-${index}`}
        className="flex-shrink-0 opacity-60 text-[15px] md:text-md px-8 md:px-12"
        {...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
      >
        ✦
      </span>,
    ]);

  return (
    <div
      style={{ backgroundColor, color: textColor }}
      className="w-full h-12 flex items-center overflow-hidden relative z-[51] select-none text-xs md:text-sm tracking-widest border-b border-black/10 font-medium"
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