/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiClock,
} from 'react-icons/fi';
import { notification } from 'antd';
import { useTranslationContext } from '../../context/TranslationContext';
import { useCurrency } from '../../context/CurrencyContext';
import { convertPrice, formatPrice } from '../../utils/currency';
import { addItemToWishList } from '../../apis/user/wishList';
import { getStoredUserId } from '../../utils/authStorage';
import bgImg from '../../assets/bg.png';
import { resolveAssetUrl } from '../../utils/assetUrl';


const RecentlyViewedSlider = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [colsPerView, setColsPerView] = useState(4);

  const {
    content: { common },
  } = useTranslationContext();
  const { currency, rates } = useCurrency();

  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  /* ── calculate columns per view based on window width ── */
  useEffect(() => {
    const updateCols = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setColsPerView(2);
      } else if (window.innerWidth < 1024) {
        setColsPerView(3);
      } else {
        setColsPerView(4);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  /* ── load from session storage ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('recentlyViewed');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        // deduplicate just in case
        const unique = parsed.filter(
          (item, index, self) =>
            item?._id && index === self.findIndex((t) => t._id === item._id)
        );
        setProducts(unique);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    }
  }, []);

  /* ── recalculate max scroll offset on resize / data change ── */
  useEffect(() => {
    const recalc = () => {
      if (!trackRef.current) return;
      const containerW = trackRef.current.parentElement?.offsetWidth ?? 0;
      const totalW = trackRef.current.scrollWidth;
      const newMax = Math.max(0, totalW - containerW);
      setMaxOffset(newMax);
      setOffset((prev) => Math.min(newMax, prev));
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [products, colsPerView]);

  const scrollBy = (dir) => {
    setOffset((prev) => {
      const containerW =
        trackRef.current?.parentElement?.offsetWidth || 300;
      const step = containerW;
      const next = dir === 'left' ? prev - step : prev + step;
      return Math.min(maxOffset, Math.max(0, next));
    });
  };

  /* ── mobile touch swipe handlers ── */
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        scrollBy('right');
      } else {
        scrollBy('left');
      }
    }
  };

  /* ── helpers ── */
  const getProductName = (p) =>
    p?.translated?.productName ||
    p?.productName?.en ||
    p?.productName ||
    common?.itemUnavailable ||
    'Unavailable';

  const getProductImage = (p) => p?.thumbnail || p?.image || p?.images?.[0] || '';

  const handleWishlist = async (id) => {
    const userId = getStoredUserId();
    if (!userId) {
      notification.error({
        message: common?.signInToContinue || 'Sign in to continue',
        placement: 'topRight',
      });
      navigate('/auth', { state: { from: window.location.pathname } });
      return;
    }
    try {
      await addItemToWishList({ productId: id, userId });
      setWishlistedIds((prev) => new Set([...prev, id]));
      notification.success({
        message: common?.wishlistAdded || 'Added to wishlist',
        placement: 'topRight',
      });
    } catch {
      notification.error({
        message: common?.wishlistAddFailed || 'Could not add to wishlist',
        placement: 'topRight',
      });
    }
  };

  if (!products.length) return null;

  const canLeft = offset > 0;
  const canRight = offset < maxOffset;

  return (
    <section
      style={{
        background: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
      className="recently-viewed-section w-full "
    >
      <div className="bg-black/60 py-8 px-4 md:py-10 md:px-20">
        {/* ── heading ── */}
        <div className="flex items-center justify-between mb-6 md:mb-10">
          <div className="flex items-center gap-3">
            <h2
              className="text-white font-bold tracking-widest uppercase text-lg sm:text-xl md:text-3xl"
              style={{ letterSpacing: '0.1em' }}
            >
              Recently Viewed
            </h2>
          </div>

          {/* nav buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy('left')}
              disabled={!canLeft}
              aria-label="Scroll left"
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border transition-all duration-200
              ${
                canLeft
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-white/30 text-white/30 cursor-not-allowed'
              }`}
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy('right')}
              disabled={!canRight}
              aria-label="Scroll right"
              className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border transition-all duration-200
              ${
                canRight
                  ? 'border-white text-white hover:bg-white hover:text-black'
                  : 'border-white/30 text-white/30 cursor-not-allowed'
              }`}
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── slider viewport ── */}
        <div
          className="overflow-hidden w-full"
          style={{ position: 'relative' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex gap-4 md:gap-6 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${offset}px)` }}
          >
            {products.map((product) => {
              const name = getProductName(product);
              const img = getProductImage(product);
              const isWishlisted = wishlistedIds.has(product._id);

              return (
                <div
                  key={product._id}
                  /* Responsive width: 2 cards on mobile, 3 cards on tablet, 4 cards on desktop */
                  className="relative flex-shrink-0 border border-white group cursor-pointer w-[calc(50%-8px)] sm:w-[220px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]"
                  onClick={() => navigate(`/product-details/${product._id}`)}
                >
                  {/* wishlist btn */}
                  <button
                    title={common?.addToWishlist || 'Add to wishlist'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlist(product._id);
                    }}
                    className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 p-1 transition-transform hover:scale-110"
                  >
                    <FiHeart
                      size={18}
                      className={`transition-colors ${
                        isWishlisted
                          ? 'fill-red-500 text-red-500'
                          : 'text-red-400'
                      }`}
                    />
                  </button>

                  {/* discount badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 bg-amber-400 text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 tracking-wide">
                      -{product.discount}%
                    </div>
                  )}

                  {/* image */}
                  <div className="h-[220px] md:h-[360px] overflow-hidden bg-gray-950">
                    {img ? (
                      <img
                        src={resolveAssetUrl(img)}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs uppercase tracking-widest">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* info */}
                  <div className="p-2.5 sm:p-3 flex flex-col gap-1">
                    <h3 className="text-white text-sm sm:text-base md:text-lg font-semibold truncate">
                      {name}
                    </h3>

                    {/* price */}
                    {product.price && product.websitePrice ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <span className="text-gray-500 line-through text-xs sm:text-sm md:text-md tracking-wide">
                          {formatConvertedPrice(product.price)}
                        </span>
                        <span className="text-white font-bold text-xs sm:text-sm md:text-md tracking-[1px]">
                          {formatConvertedPrice(product.websitePrice)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm md:text-md tracking-wide mt-1">
                        {common?.itemUnavailable || 'Unavailable'}
                      </p>
                    )}

                    {/* view button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product-details/${product._id}`);
                      }}
                      className="mt-1.5 sm:mt-2 w-full border border-white text-white text-xs sm:text-sm md:text-base py-1.5 sm:py-2 tracking-widest uppercase
                      hover:bg-white hover:text-black transition-colors duration-200"
                    >
                      {common?.buyNow || 'Buy Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── progress dots ── */}
        {maxOffset > 0 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {Array.from({
              length: Math.ceil(products.length / colsPerView),
            }).map((_, i) => {
              const totalDots = Math.ceil(products.length / colsPerView);
              const step = maxOffset / Math.max(1, totalDots - 1);
              const active = Math.round(offset / (step || 1)) === i;
              return (
                <button
                  key={i}
                  onClick={() =>
                    setOffset(Math.min(maxOffset, Math.round(i * step)))
                  }
                  className={`h-0.5 transition-all duration-300 ${
                    active ? 'w-6 bg-amber-400' : 'w-2 bg-gray-600'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentlyViewedSlider;
