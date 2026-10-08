import React, { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, FreeMode } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useTranslationContext } from '../../context/TranslationContext';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

const CinematicVideoPlayer = ({ videoSrc, isActive }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (e) {}
    }
  }, [isActive]);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  return (
    <div 
      className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black transition-all duration-500 ease-out ${
        isActive 
          ? 'shadow-2xl shadow-black/50 scale-100 z-10 opacity-100' 
          : 'scale-90 opacity-80 z-0'
      }`}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover rounded-2xl select-none"
        muted={isMuted}
        loop
        playsInline
        preload="auto"
      />

      {/* Subtle overlay for side cards */}
      {!isActive && (
        <div className="absolute inset-0 bg-black/15 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Mute button (only active on center card) */}
      {isActive && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-sm border border-white/10 flex items-center justify-center"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
};

export default function Section11() {
  const {
    content: { homepage },
  } = useTranslationContext();

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [init, setInit] = useState(false);

  // Trigger re-render to bind custom navigation refs after mount
  useEffect(() => {
    setInit(true);
  }, []);

  return (
    <div className="py-10 md:py-[50px] overflow-hidden">
      {/* Header */}
      <div className="px-4 text-black md:px-20 mb-8 md:mb-12">
        <h2 className="text-2xl font-semibold md:text-4xl lg:text-5xl tracking-wide">
          {homepage.section16Heading1}
        </h2>
      </div>

      {/* Swiper Container */}
      <div className="relative w-full px-4 md:px-16">
        <Swiper
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          loopAdditionalSlides={6}
          loopedSlides={6}
          slideToClickedSlide={true}
          freeMode={{
            enabled: true,
            sticky: true,
            momentumRatio: 0.3,
            momentumVelocityRatio: 0.4,
          }}
          touchRatio={0.8}
          threshold={15}
          navigation={init ? {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          } : false}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 1,
            slideShadows: false,
          }}
          breakpoints={{
            0: {
              slidesPerView: 1.35,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2.2,
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 30,
            },
            1536: {
              slidesPerView: 7,
              spaceBetween: 40,
            },
          }}
          modules={[EffectCoverflow, Navigation, FreeMode]}
          className="cinematic-swiper !overflow-visible"
        >
          {Array.from({ length: 24 }, (_, i) => {
            const videoIndex = (i % 12) + 1;
            return (
              <SwiperSlide key={i} className="flex justify-center pb-10">
                {({ isActive }) => (
                  <CinematicVideoPlayer 
                    videoSrc={`/backstageVideo${videoIndex}.mp4`} 
                    isActive={isActive} 
                  />
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Custom navigation arrows (Desktop only) */}
        <button
          ref={prevRef}
          className="absolute left-6 top-[40%] -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/10"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          ref={nextRef}
          className="absolute right-6 top-[40%] -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/10"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
