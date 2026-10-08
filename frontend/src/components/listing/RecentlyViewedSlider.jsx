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

const CARD_WIDTH = 280; // px, approximate width of one card including gap
const VISIBLE_COLS = 4;

const RecentlyViewedSlider = () => {
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  const {
    content: { common },
  } = useTranslationContext();
  const { currency, rates } = useCurrency();

  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

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
      setMaxOffset(Math.max(0, totalW - containerW));
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [products]);

  const scrollBy = (dir) => {
    setOffset((prev) => {
      const step = CARD_WIDTH * VISIBLE_COLS;
      const next = dir === 'left' ? prev - step : prev + step;
      return Math.min(maxOffset, Math.max(0, next));
    });
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
      <div className="bg-black/60 py-10 px-4 md:px-20">
        {/* ── heading ── */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            
            <h2
              className="text-white font-bold tracking-widest uppercase text-xl md:text-3xl"
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
              className={`w-9 h-9 flex items-center justify-center border transition-all duration-200
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
              className={`w-9 h-9 flex items-center justify-center border transition-all duration-200
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
        >
          <div
            ref={trackRef}
            className="flex gap-6 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${offset}px)` }}
          >
            {products.map((product) => {
              const name = getProductName(product);
              const img = getProductImage(product);
              const isWishlisted = wishlistedIds.has(product._id);

              return (
                <div
                  key={product._id}
                  /* fixed width per card; 4 visible = 25% each with a small gap */
                  className="relative flex-shrink-0 border border-white group cursor-pointer"
                  style={{ width: 'calc(25% - 1px)' }}
                  onClick={() => navigate(`/product-details/${product._id}`)}
                >
                  {/* wishlist btn */}
                  <button
                    title={common?.addToWishlist || 'Add to wishlist'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlist(product._id);
                    }}
                    className="absolute top-3 right-3 z-10 p-1 transition-transform hover:scale-110"
                  >
                    <FiHeart
                      size={20}
                      className={`transition-colors ${
                        isWishlisted
                          ? 'fill-red-500 text-red-500'
                          : 'text-red-400'
                      }`}
                    />
                  </button>

                  {/* discount badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-3 left-3 z-10 bg-amber-400 text-black text-xs font-bold px-2 py-0.5 tracking-wide">
                      -{product.discount}%
                    </div>
                  )}

                  {/* image */}
                  <div className="h-[320px] md:h-[360px] overflow-hidden bg-gray-950">
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
                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="text-white text-lg font-semibold truncate">
                      {name}
                    </h3>

                    {product.brand && (
                      <p className="text-gray-400 text-xs truncate">
                        {product.brand}
                      </p>
                    )}

                    {/* price */}
                    {product.price && product.websitePrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 line-through text-md tracking-wide">
                          {formatConvertedPrice(product.price)}
                        </span>
                        <span className="text-white font-bold text-md tracking-[1px]">
                          {formatConvertedPrice(product.websitePrice)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-md tracking-wide mt-1">
                        {common?.itemUnavailable || 'Unavailable'}
                      </p>
                    )}

                    {/* view button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product-details/${product._id}`);
                      }}
                      className="mt-2 w-full border border-white text-white text-lg py-2 tracking-widest uppercase
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
              length: Math.ceil(products.length / VISIBLE_COLS),
            }).map((_, i) => {
              const step = CARD_WIDTH * VISIBLE_COLS;
              const active = Math.round(offset / step) === i;
              return (
                <button
                  key={i}
                  onClick={() => setOffset(Math.min(maxOffset, i * step))}
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
