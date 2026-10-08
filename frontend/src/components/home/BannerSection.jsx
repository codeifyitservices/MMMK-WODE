import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import bannerSide from '../../assets/Home/model6.png';
import { Button4 } from '../global/UIButtons';
import { useTranslationContext } from '../../context/TranslationContext';
import { getModuleUrl } from '../../utils/globalMethods';
import leftImg from '../../assets/Home/banner-section/left.jpg';
import rightImg from '../../assets/Home/banner-section/right.jpg';

export default function BannerSection() {
  const {
    content: { common, homepage },
  } = useTranslationContext();

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Auto-advance slides on mobile
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sections.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isMobile]);

  // Define the sections data
  const sections = [
    {
      id: 'logo',
      type: 'logo',
      content: (
        <div className="flex w-full flex-col items-center gap-2 px-4 text-center md:px-0 md:text-left">
          {/* Logo */}
          <div className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48">
            <img
              src="Wode Logo.png"
              alt={common.mmmk}
              width="192"
              height="192"
              loading="lazy"
              decoding="async"
              className="object-contain w-full h-full"
            />
          </div>

          {/* Text and Button */}
          <div className="text-center text-white">
            <h2 className="text-lg font-semibold tracking-wide sm:text-2xl lg:text-3xl">
              {homepage.section6Heading1}
            </h2>
            <h2 className="mt-3 text-2xl font-light tracking-wide sm:text-4xl lg:text-xl">
              {homepage.section6Description1}
            </h2>

            <Button4
              isLink
              to={getModuleUrl('category', 'Jewelry & Accessories')}
              className="mt-6"
            >
              {common.shopNow}
            </Button4>
          </div>
        </div>
      ),
    },
    {
      id: 'image1',
      type: 'image',
      content: (
        <img
          src={leftImg}
          alt={common.productImageAlt}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="object-cover shadow w-full h-full"
        />
      ),
    },
    {
      id: 'image2',
      type: 'image',
      content: (
        <img
          src="/bannerSectionImage.jpg"
          alt={common.productImageAlt}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="object-cover shadow w-full h-full"
        />
      ),
    },
    {
      id: 'image3',
      type: 'image',
      content: (
        <img
          src={rightImg}
          alt={common.productImageAlt}
          width="1200"
          height="900"
          loading="lazy"
          decoding="async"
          className="object-cover shadow w-full h-full"
        />
      ),
    },
    {
      id: 'falcon',
      type: 'falcon',
      content: (
        <div className="relative flex h-full w-full items-center justify-center text-[rgb(248,238,188)]">
          <p className="absolute left-0 right-0 top-8 z-10 px-4 text-center text-xl sm:text-2xl">
            {common.comingSoon}
          </p>
          <img
            src="/africanFalcon.jpg"
            alt={common.productImageAlt}
            width="1200"
            height="1200"
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full rounded-md"
          />
          <p className="absolute bottom-8 left-0 right-0 z-10 px-4 text-center text-xl sm:text-2xl">
            {homepage.section6Heading2}
          </p>
        </div>
      ),
    },
  ];

  // Calculate flex values based on hover state (desktop only)
  const getFlexValue = (index) => {
    if (isMobile) return 1; // All equal on mobile

    if (hoveredIndex === null) {
      // Default state: all sections equal size
      return 1;
    }
    // Hover state: hovered item larger, others much smaller
    return hoveredIndex === index ? 0.5 : 0.3;
  };

  // Handle mobile swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % sections.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + sections.length) % sections.length);
    }
  };

  return (
    <div className="relative flex h-[560px] w-full overflow-hidden bg-[rgb(83,49,37)] sm:h-[620px] md:h-[500px]">
      {/* Mobile slider indicators */}
      {isMobile && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
          {sections.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-gray-400'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          className="flex items-center justify-center relative cursor-pointer h-full"
          initial={false}
          animate={{
            flex: isMobile
              ? index === currentSlide
                ? 1
                : 0
              : getFlexValue(index),
            x: isMobile ? `-${currentSlide * 100}%` : 0,
          }}
          transition={{
            duration: 0.6,
            ease: [0.23, 1, 0.32, 1],
          }}
          onMouseEnter={() => !isMobile && setHoveredIndex(index)}
          onMouseLeave={() => !isMobile && setHoveredIndex(null)}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          style={isMobile ? { minWidth: '100%' } : {}}
        >
          <div className="w-full h-full flex items-center justify-center">
            {section.content}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
