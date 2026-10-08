import { useEffect, useRef, useState } from 'react';
import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { getModuleUrl } from '../../utils/globalMethods';

const BikiniSection = () => {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="grid w-full grid-cols-1 md:grid-cols-12 overflow-hidden md:min-h-screen">
      {/* Box 1 */}
      <div className="col-span-1 h-[250px] sm:h-[300px] md:col-span-5 md:h-full bg-gray-800">
        {inView && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            src="/Bikni-left-section-(1).mp4"
            poster="/comingsoon3.jpg"
          ></video>
        )}
      </div>

      {/* Box 2 - Horizontal Strip on Mobile, Vertical Column on Desktop */}
      <div className="col-span-1 flex flex-row items-center justify-between bg-yellow-900 px-4 py-3 text-center text-white md:col-span-2 md:flex-col md:justify-center md:min-h-0 md:p-6 md:py-[150px]">
        <img
          src="Wode Logo.png"
          className="w-10 h-10 md:w-32 md:h-32"
          alt={common.mmmk}
          width="128"
          height="128"
          loading="lazy"
          decoding="async"
        />

        {/* Text layout changes from row on mobile to column on desktop */}
        <p className="flex flex-row flex-wrap justify-center gap-1 text-[10px] font-medium uppercase tracking-wider md:my-8 md:flex-col md:gap-4 md:text-lg md:leading-10 md:tracking-[5px] lg:text-2xl">
          <span>{common.explore}</span>
          <span>{common.premium}</span>
          <span>{common.bikini}</span>
          <span>{common.collection}</span>
        </p>

        <Button4 
          isLink 
          to={getModuleUrl('category', 'Design Bikni Swimwear')}
          className="!static !px-4 !py-1.5 !text-[10px] md:!relative md:!top-8 md:!px-12 md:!py-3 md:!text-base"
        >
          {common.shopNow}
        </Button4>
      </div>

      {/* Box 3 */}
      <div className="col-span-1 h-[250px] sm:h-[300px] md:col-span-5 md:h-full bg-gray-800">
        {inView && (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            src="/rightside-(1).mp4"
            poster="/comingsoon3.jpg"
          ></video>
        )}
      </div>
    </div>
  );
};

export default BikiniSection;
