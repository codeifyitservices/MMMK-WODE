import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getReviewsByProduct } from '../apis/nonAuth/review';
import { getSingleProduct } from '../apis/nonAuth/products';
import { resolveAssetUrl } from '../utils/assetUrl';
import { useCurrency } from '../context/CurrencyContext';
import { convertPrice, formatPrice } from '../utils/currency';
import { useTranslationContext } from '../context/TranslationContext';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import bgImg from '../assets/bg.png';

const getInitial = (name) => {
  if (!name) return 'V';
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
};

const ProductReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'good' | 'bad'
  const reviewsFeedRef = useRef(null);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (reviewsFeedRef.current) {
      reviewsFeedRef.current.scrollTop = 0;
    }
  };

  const { currency, rates } = useCurrency();
  const {
    content: { common },
  } = useTranslationContext();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  // Fetch product data
  const productQuery = useQuery({
    queryKey: ['product-details', id],
    queryFn: () => getSingleProduct(id),
    enabled: Boolean(id),
  });

  // Fetch reviews data
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => getReviewsByProduct(id),
    enabled: Boolean(id),
  });

  const productData =
    productQuery.data?.data || productQuery.data?.product || productQuery.data || {};
  const rawReviews = reviewsQuery.data?.data || [];

  const reviews = rawReviews.map((item) => ({
    ...item,
    rating: item.rating || 5,
    review: item.review || '',
    name:
      item.reviewerName ||
      (item.user?.firstName
        ? `${item.user.firstName} ${item.user.lastName || ''}`.trim()
        : 'Customer'),
  }));

  const productName =
    productData?.translated?.productName ||
    productData?.productName?.en ||
    productData?.productName ||
    'Luxury Product';

  const productImage =
    productData?.thumbnail ||
    productData?.image ||
    productData?.images?.[0] ||
    '';

  const categoryName =
    productData?.category?.name?.en ||
    productData?.category?.name ||
    productData?.category ||
    '';

  const shortDescription =
    productData?.productDescription?.en ||
    productData?.productDescription ||
    productData?.description ||
    '';

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length
      : 5;

  const goodReviews = reviews.filter((r) => Number(r.rating) >= 4);
  const badReviews = reviews.filter((r) => Number(r.rating) < 4);

  const displayedReviews =
    activeFilter === 'good'
      ? goodReviews
      : activeFilter === 'bad'
      ? badReviews
      : reviews;

  // Reliable back navigation
  const handleBackToProduct = (e) => {
    if (e) e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else if (id) {
      navigate(`/product-details/${id}`);
    } else {
      navigate('/product-listings');
    }
  };

  return (
    <div
      className="min-h-screen text-white pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-16 px-3 sm:px-6 lg:px-10 relative overflow-x-hidden bg-[#0c0a08]"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(223, 186, 115, 0.12) 0%, rgba(12, 10, 8, 0.95) 75%), url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Sleek luxury custom scrollbar with mobile touch support */}
      <style>{`
        .reviews-feed {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: #dfba73 rgba(255, 255, 255, 0.04);
          scrollbar-gutter: stable;
        }
        .reviews-feed::-webkit-scrollbar {
          width: 5px;
        }
        .reviews-feed::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 9999px;
          margin: 4px 0;
        }
        .reviews-feed::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #dfba73, #a27b4c);
          border-radius: 9999px;
          box-shadow: 0 0 6px rgba(223, 186, 115, 0.35);
        }
        .reviews-feed::-webkit-scrollbar-thumb:hover {
          background: #f1cd84;
        }
      `}</style>

      {/* Dark overlay for rich contrast */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10 w-full space-y-4 sm:space-y-6">
        {/* ── Top Bar: Back Button Navigation ── */}
        <div className="flex items-center justify-between">
          <Link
            to={`/product-details/${id}`}
            onClick={handleBackToProduct}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#dfba73]/30 bg-black/60 hover:bg-[#dfba73] text-[#dfba73] hover:text-black text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(223,186,115,0.35)] cursor-pointer select-none active:scale-95"
            aria-label="Back to Product"
          >
            <FiArrowLeft size={14} />
            <span>Back to Product</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-400 font-light">
            <span className="hidden sm:inline">Customer Review Portal</span>
            <span className="hidden sm:inline text-[#dfba73]/40">•</span>
            <span className="text-[#dfba73] font-medium">{reviews.length} Verified Reviews</span>
          </div>
        </div>

        {/* ════════ FULL-WIDTH LARGE NAVBAR: Customer Reviews Header ════════ */}
        <header className="w-full bg-[#141210]/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#dfba73]/30 shadow-2xl relative overflow-hidden">
          {/* Subtle Gold Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfba73]/80 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wider sm:tracking-widest uppercase"
                  style={{ letterSpacing: '0.06em' }}
                >
                  Customer Reviews
                </h1>
                <span className="bg-[#dfba73]/15 text-[#dfba73] border border-[#dfba73]/30 text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
                  {reviews.length}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-300 font-light mt-0.5 sm:mt-1">
                Real unedited impressions and experiences from verified customers
              </p>
            </div>

            {/* Right Side: Rating Score Badge + Horizontal Filter Pills */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5 w-full lg:w-auto">
              {/* Overall Rating Badge */}
              <div className="flex items-center gap-2 bg-black/40 border border-[#dfba73]/25 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-inner shrink-0">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      size={13}
                      className={
                        star <= Math.round(averageRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-600 fill-gray-600'
                      }
                    />
                  ))}
                </div>
                <span className="text-white font-bold text-xs sm:text-sm tracking-wide">
                  {averageRating > 0 ? averageRating.toFixed(1) : '5.0'} / 5
                </span>
              </div>

              {/* Filter Tabs / Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1 lg:flex-initial">
                <button
                  type="button"
                  onClick={() => handleFilterChange('all')}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-colors duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeFilter === 'all'
                      ? 'bg-[#dfba73] text-black shadow-md font-bold'
                      : 'bg-white/5 border border-white/15 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('good')}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-colors duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeFilter === 'good'
                      ? 'bg-[#dfba73] text-black shadow-md font-bold'
                      : 'bg-white/5 border border-white/15 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Good Reviews (4-5★) ({goodReviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('bad')}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-colors duration-150 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeFilter === 'bad'
                      ? 'bg-[#dfba73] text-black shadow-md font-bold'
                      : 'bg-white/5 border border-white/15 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Bad Reviews (1-3★) ({badReviews.length})
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ════════ BOTTOM LAYOUT: Left Product Card + Right Framed Reviews Box ════════ */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start w-full">
          {/* ════════ LEFT COLUMN: Product Snapshot Card (Responsive on all devices) ════════ */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 lg:sticky lg:top-28 z-10">
            <div className="bg-[#141210]/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#dfba73]/25 shadow-2xl overflow-hidden relative group">
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfba73]/70 to-transparent" />

              {/* Responsive Container: Horizontal on mobile, vertical stack on tablet/desktop */}
              <div className="flex flex-row sm:flex-col gap-3.5 sm:gap-4 items-center sm:items-stretch">
                {/* Product Image */}
                <div className="w-24 h-24 sm:w-full sm:h-auto sm:aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 relative shadow-inner">
                  {productImage ? (
                    <img
                      src={resolveAssetUrl(productImage)}
                      alt={productName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] sm:text-xs uppercase tracking-widest">
                      No Image
                    </div>
                  )}

                  {productData?.discount > 0 && (
                    <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-[#dfba73] text-black text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded shadow">
                      -{productData.discount}%
                    </div>
                  )}
                </div>

                {/* Product Info Block */}
                <div className="flex-1 min-w-0">
                  {/* Category */}
                  {categoryName && (
                    <p className="text-[10px] sm:text-xs text-[#dfba73]/80 uppercase tracking-widest mb-1 font-medium truncate">
                      {categoryName}
                    </p>
                  )}

                  {/* Product Title */}
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-white mb-1 leading-snug truncate sm:whitespace-normal">
                    {productName}
                  </h2>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    {productData?.price &&
                      productData?.websitePrice &&
                      productData.price > productData.websitePrice && (
                        <span className="text-gray-400 line-through text-xs sm:text-sm">
                          {formatConvertedPrice(productData.price)}
                        </span>
                      )}
                    <span className="text-[#dfba73] font-bold text-lg sm:text-2xl tracking-wide">
                      {formatConvertedPrice(productData?.websitePrice || productData?.price || 0)}
                    </span>
                  </div>

                  {/* Short Description (Hidden on small mobile, visible on sm and up) */}
                  {shortDescription && (
                    <p className="hidden sm:block text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 font-light line-clamp-3">
                      {stripHtml(shortDescription)}
                    </p>
                  )}

                  {/* Action Button: View Full Product Details */}
                  <Link
                    to={`/product-details/${id}`}
                    onClick={handleBackToProduct}
                    className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-[#dfba73] hover:bg-[#f1cd84] text-black font-semibold text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(223,186,115,0.35)] cursor-pointer active:scale-[0.98]"
                  >
                    <FiShoppingBag size={15} />
                    <span>View Product Details</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* ════════ RIGHT COLUMN: Framed Reviews Box with Clean Scroller ════════ */}
          <main className="flex-1 min-w-0 w-full">
            <div className="bg-[#141210]/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-[#dfba73]/25 shadow-2xl relative overflow-hidden flex flex-col h-[520px] sm:h-[580px] lg:h-[calc(100vh-270px)] lg:min-h-[540px]">
              {/* Subtle Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfba73]/70 to-transparent" />

              {/* Box Subheader */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-white/10 shrink-0">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-[#dfba73] font-semibold">
                  Verified Reviews Feed
                </span>
                <span className="text-[11px] sm:text-xs text-gray-400 font-light">
                  Showing {displayedReviews.length} of {reviews.length} reviews
                </span>
              </div>

              {/* ── Scrollable Reviews Container ── */}
              {displayedReviews.length > 0 ? (
                <div
                  ref={reviewsFeedRef}
                  className="flex-1 min-h-0 overflow-y-auto pr-1.5 sm:pr-3 space-y-3 sm:space-y-4 reviews-feed"
                >
                  {displayedReviews.map((review, index) => (
                    <div
                      key={review._id || `review-${review.name}-${index}`}
                      className="w-full bg-black/40 backdrop-blur-md text-white rounded-lg sm:rounded-xl p-3.5 sm:p-5 border border-white/10 hover:border-[#dfba73]/40 transition-colors duration-150 relative overflow-hidden group shadow-md"
                    >
                      {/* Top Accent Highlight */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#dfba73]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Header Row: Stars + Rating Number (No Date) */}
                      <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                size={13}
                                className={
                                  star <= Math.round(review.rating || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-600 fill-gray-600'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-[11px] sm:text-xs text-gray-400 font-light ml-1">
                            {review.rating} / 5
                          </span>
                        </div>
                      </div>

                      {/* Review Text */}
                      <div className="my-1.5 sm:my-2 text-gray-200 text-xs sm:text-sm leading-relaxed font-light whitespace-pre-line break-words">
                        &ldquo;{review.review}&rdquo;
                      </div>

                      {/* Bottom Row: Avatar + Reviewer Name Only (No Verified Tag, No Date) */}
                      <div className="flex items-center gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 mt-2 sm:mt-3 border-t border-white/10">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#9a7b4f] to-[#dfba73] text-black font-bold text-xs flex items-center justify-center shrink-0 shadow-md ring-1 ring-[#dfba73]/30">
                          {getInitial(review.name)}
                        </div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {review.name || 'Customer'}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty Filter State */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                  <p className="text-gray-300 text-xs sm:text-sm mb-2">
                    No reviews found for{' '}
                    <span className="text-[#dfba73] font-semibold">
                      {activeFilter === 'good'
                        ? 'Good Reviews'
                        : activeFilter === 'bad'
                        ? 'Bad Reviews'
                        : 'All Reviews'}
                    </span>
                    .
                  </p>
                  {activeFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className="mt-2 text-xs text-[#dfba73] hover:underline cursor-pointer"
                    >
                      View All Reviews ({reviews.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsPage;
