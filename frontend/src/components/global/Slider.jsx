/* eslint-disable no-unused-vars */
import { memo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button3 } from './UIButtons';
import CustomCarousel from './Carousal';
import { useTranslationContext } from '../../context/TranslationContext';
import { useGlobalContext } from '../../context/GlobalProvider';
import { getCategoryLabel } from '../../utils/categoryTranslation';
import { resolveAssetUrl } from '../../utils/assetUrl';

const CategorySlide = memo(function CategorySlide({
  product,
  translateLanguage,
}) {
  return (
    <div
      className="group relative mx-auto h-[300px] w-[82vw] flex-shrink-0 sm:w-[300px] md:h-[350px] md:w-[340px] lg:h-[550px] lg:w-[430px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="w-full h-full overflow-hidden"
        style={{
          backgroundImage: `url(${resolveAssetUrl(product.image)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>
      <div className="absolute z-[1] bottom-0 transition-all duration-500 shadow-2xl w-full max-h-[100px] h-full text-white">
        <Link
          to={
            '/product-listings?categories=' +
            encodeURIComponent(product.name.en).replace(/%20/g, '+')
          }
          className="absolute z-10 left-0 right-0 bottom-0 h-full transition-all duration-500 flex items-center justify-center group-hover:shadow-[inset_0_0_0_4px_white]"
        >
          <h3 className="text-lg font-semibold sm:text-xl md:text-2xl text-center w-full [text-shadow:0_2px_12px_rgba(0,0,0,0.75)]">
            {getCategoryLabel(product, translateLanguage)}
          </h3>
        </Link>
      </div>
    </div>
  );
});

export default function Slider() {
  const {
    translateLanguage,
    content: { common, homepage },
  } = useTranslationContext();
  const { categories } = useGlobalContext();
  const carouselRef = useRef(null);
  const isHoveringRef = useRef(false);
  const isTouchingRef = useRef(false);
  const maxScrollRef = useRef(0);

  const updateScrollBounds = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    maxScrollRef.current = Math.max(
      0,
      carousel.scrollWidth - carousel.clientWidth
    );
  }, []);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
  }, []);
  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
  }, []);
  const handleTouchStart = useCallback(() => {
    isTouchingRef.current = true;
  }, []);
  const handleTouchEnd = useCallback(() => {
    // small delay so snap animation finishes before auto-scroll resumes
    setTimeout(() => {
      isTouchingRef.current = false;
    }, 1000);
  }, []);

  const renderCategorySlide = useCallback(
    (product) => (
      <CategorySlide
        key={product._id}
        product={product}
        translateLanguage={translateLanguage}
      />
    ),
    [translateLanguage]
  );

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || categories.length === 0) return undefined;

    updateScrollBounds();

    let resizeObserver;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateScrollBounds);
      resizeObserver.observe(carousel);
    } else {
      window.addEventListener('resize', updateScrollBounds);
    }

    let animationId;
    let scrollPos = carousel.scrollLeft;

    const animate = () => {
      const maxScroll = maxScrollRef.current;
      if (!isHoveringRef.current && !isTouchingRef.current && maxScroll > 0) {
        scrollPos += 0.5; // Slow scroll speed
        if (scrollPos >= maxScroll) {
          scrollPos = 0;
        }
        carousel.scrollLeft = scrollPos;
      } else {
        // Sync scrollPos with actual scroll position if user scrolled manually or hovering
        scrollPos = carousel.scrollLeft;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [categories.length, updateScrollBounds]);

  return (
    <section className="w-full py-12">
      <div className="container px-4 mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:ml-12 md:flex-row">
          <h2 className="text-xl text-[#05682F] font-bold text-center sm:text-3xl md:text-4xl lg:text-5xl">
            {homepage.section2Heading1}
          </h2>
          <Button3 isLink to="/product-listings" className="!text-sm !py-2">
            {common.viewAll}
          </Button3>
        </div>

        <div className="relative">
          <CustomCarousel
            ref={carouselRef}
            items={categories}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            renderItem={renderCategorySlide}
            style={{ scrollSnapType: 'none' }}
          />
        </div>
      </div>
    </section>
  );
}
