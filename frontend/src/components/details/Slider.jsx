import { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import 'swiper/css';
import { resolveAssetUrl } from '../../utils/assetUrl';

export default function Slider({ images }) {
  const [mainSwiper, setMainSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbRefs = useRef([]);

  // Auto-scroll active thumbnail into view when swiping the main image
  useEffect(() => {
    if (thumbRefs.current[activeIndex]) {
      thumbRefs.current[activeIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-neutral-900/40 rounded flex items-center justify-center text-gray-500">
        No image available
      </div>
    );
  }

  const handleThumbnailClick = (index) => {
    setActiveIndex(index);
    if (mainSwiper && !mainSwiper.destroyed) {
      mainSwiper.slideTo(index);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto slider-container select-none">
      {/* ── Main Featured Image Showcase ── */}
      <div className="relative w-full rounded overflow-hidden group bg-neutral-950/40 border border-white/10 shadow-sm">
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          onSwiper={setMainSwiper}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
          }}
          className="w-full"
        >
          {images.map((img, index) => (
            <SwiperSlide key={`main-slide-${index}`}>
              <div className="w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] max-h-[460px] sm:max-h-[520px] flex items-center justify-center p-2 sm:p-4 bg-transparent overflow-hidden">
                <img
                  src={resolveAssetUrl(img)}
                  alt={`Product view ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-contain mx-auto select-none pointer-events-none drop-shadow-md"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Counter Pill (e.g., "1 / 4") */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 text-[11px] font-semibold tracking-widest text-white bg-black/75 backdrop-blur-md rounded-full border border-white/20 select-none shadow pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Desktop / Tablet Hover Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => mainSwiper?.slidePrev()}
              aria-label="Previous image"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black/60 hover:bg-black/90 text-white border border-white/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95 shadow"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => mainSwiper?.slideNext()}
              aria-label="Next image"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black/60 hover:bg-black/90 text-white border border-white/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95 shadow"
            >
              <FiChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* ── Small Thumbnails Strip at the Bottom of Main Image ── */}
      {images.length > 1 && (
        <div
          className="w-full mt-3 sm:mt-4 flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 px-1 justify-start sm:justify-center"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
        >
          {images.map((img, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={`thumb-${index}`}
                ref={(el) => (thumbRefs.current[index] = el)}
                type="button"
                onClick={() => handleThumbnailClick(index)}
                aria-label={`View image ${index + 1}`}
                className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden transition-all duration-200 cursor-pointer focus:outline-none ${
                  isActive
                    ? 'border-2 border-[#dfba73] ring-2 ring-[#dfba73]/40 opacity-100 scale-105 shadow-md shadow-[#dfba73]/20'
                    : 'border border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <img
                  src={resolveAssetUrl(img)}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover bg-neutral-900/60"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
