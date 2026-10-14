import React, { useEffect, useRef, useState } from 'react';
import { Form, Input, Rate, Button, message } from 'antd';
import {
  addReview,
  getReviewEligibility,
} from '../../apis/user/review';
import { useQuery } from '@tanstack/react-query';
import { getReviewsByProduct } from '../../apis/nonAuth/review';
import {
  translate,
  useTranslationContext,
} from '../../context/TranslationContext';
import { getStoredUserToken } from '../../utils/authStorage';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaQuoteRight, FaStar } from 'react-icons/fa';

const getInitial = (name) => {
  if (!name) return 'V';
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
};

const ProductReview = ({ product }) => {
  const {
    content: { productDetails, common },
    translateLanguage,
  } = useTranslationContext();
  const [form] = Form.useForm();
  const reviewText = Form.useWatch('review', form) || '';
  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).filter(Boolean).length : 0;
  const [reviews, setReviews] = useState([]);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [colsPerView, setColsPerView] = useState(3);

  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const userToken = getStoredUserToken();

  const query = useQuery({
    queryKey: ['product-reviews', product],
    queryFn: () => getReviewsByProduct(product),
    enabled: Boolean(product),
  });

  const eligibilityQuery = useQuery({
    queryKey: ['review-eligibility', product, userToken],
    queryFn: () => getReviewEligibility(product),
    enabled: Boolean(product && userToken),
  });

  // Calculate visible columns for responsive slide stepping
  useEffect(() => {
    const updateCols = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setColsPerView(1);
      } else if (window.innerWidth < 1024) {
        setColsPerView(2);
      } else {
        setColsPerView(3);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  // Recalculate max offset on data change, column change, or resize
  useEffect(() => {
    const recalc = () => {
      if (!trackRef.current) return;
      const containerW = trackRef.current.parentElement?.offsetWidth || 0;
      const totalW = trackRef.current.scrollWidth;
      const newMax = Math.max(0, totalW - containerW);
      setMaxOffset(newMax);
      setOffset((prev) => Math.min(newMax, prev));
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [reviews, colsPerView]);

  const scrollBy = (dir) => {
    setOffset((prev) => {
      if (!trackRef.current) return prev;
      const firstChild = trackRef.current.children[0];
      const cardWidth = firstChild?.offsetWidth || 280;
      const gap = window.innerWidth < 640 ? 12 : 24;
      // Step precisely by card width + gap for pixel-perfect card alignment
      const step = (cardWidth + gap) * (window.innerWidth < 640 ? 1 : colsPerView);
      const next = dir === 'left' ? prev - step : prev + step;
      return Math.min(maxOffset, Math.max(0, next));
    });
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        scrollBy('right');
      } else {
        scrollBy('left');
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (!eligibilityQuery.data?.canReview) {
        message.error(
          eligibilityQuery.data?.message ||
            'You can only review this product after delivery.'
        );
        return;
      }

      await addReview({ ...values, product });
      form.resetFields();
      query.refetch();
      message.success('Thanks for adding review');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to add review');
    }
  };

  const handleTranslateReviewData = async (data, language) => {
    const toTranslate = data.map((review) => review.review);

    if (language === 'en') {
      setReviews(
        data.map((review) => ({
          ...review,
          translated: {
            review: review.review,
          },
        }))
      );
      return;
    }

    try {
      const translatedReviews = await translate(toTranslate, language);
      const translatedReviewsData = data.map((review, index) => ({
        ...review,
        translated: {
          review: translatedReviews[index] || review.review,
        },
      }));

      setReviews(translatedReviewsData);
    } catch {
      setReviews(
        data.map((review) => ({
          ...review,
          translated: {
            review: review.review,
          },
        }))
      );
    }
  };

  useEffect(() => {
    if (query.data?.data?.length > 0) {
      handleTranslateReviewData(
        query.data.data?.map((item) => ({
          ...item,
          rating: item.rating,
          review: item.review,
          name:
            item.reviewerName ||
            (item.user?.firstName
              ? `${item.user.firstName} ${item.user.lastName || ''}`.trim()
              : 'Verified Customer'),
          date: item.createdAt,
        })),
        translateLanguage
      );
    } else setReviews([]);
  }, [query.data, translateLanguage]);

  return (
    <div className="flex flex-col items-center w-full mb-8 sm:mb-12 mt-2 sm:mt-4 px-2 sm:px-4">
      {/* ── Testimonials Section ── */}
      {reviews.length > 0 ? (
        <div className="w-full max-w-6xl flex flex-col items-center mb-8 sm:mb-10">
          {/* Centered Heading */}
          <div className="text-center mb-4 sm:mb-8 px-2 w-full">
            <h3
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-widest uppercase"
              style={{ letterSpacing: '0.12em' }}
            >
              {common.reviews || 'Reviews'}
            </h3>
            <p className="text-[11px] sm:text-sm text-gray-300 mt-1 sm:mt-2 font-light tracking-wide max-w-xl mx-auto">
              Real stories and experiences from our verified customers
            </p>
          </div>

          {/* Row: Left Button -> Reviews in Middle -> Right Button */}
          <div className="w-full flex items-center justify-center gap-1.5 sm:gap-4 px-0.5 sm:px-2">
            {/* Left Button */}
            {reviews.length > 1 && (
              <button
                type="button"
                onClick={() => scrollBy('left')}
                disabled={offset <= 0}
                aria-label="Previous review"
                className={`flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 min-w-[32px] sm:min-w-[44px] rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                  offset <= 0
                    ? 'border-white/10 text-white/20 cursor-not-allowed bg-black/25 opacity-30'
                    : 'border-[#dfba73]/40 text-[#dfba73] hover:border-[#dfba73] hover:bg-[#dfba73] hover:text-black bg-black/60 backdrop-blur-md shadow-lg active:scale-95'
                }`}
              >
                <FiChevronLeft className="text-base sm:text-xl" />
              </button>
            )}

            {/* Middle: Slider Viewport */}
            <div
              className="overflow-hidden flex-1 relative max-w-5xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={trackRef}
                className={`flex gap-3 sm:gap-6 transition-transform duration-500 ease-in-out py-2 sm:py-3 ${
                  reviews.length < colsPerView ? 'justify-center' : ''
                }`}
                style={{ transform: `translateX(-${offset}px)` }}
              >
                {reviews.map((review, index) => (
                  <div
                    key={review._id || index}
                    className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    {/* Dark Luxury Testimonial Card */}
                    <div className="bg-[#121212]/85 backdrop-blur-md text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl border border-[#c5a880]/25 flex flex-col justify-between h-full min-h-[190px] sm:min-h-[220px] transition-all duration-300 hover:border-[#dfba73]/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.6)] relative overflow-hidden group">
                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#dfba73]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Top Row: Crisp Golden Stars + Luxury Quote Watermark */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`text-sm sm:text-base ${
                                star <= Math.round(review.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-600 fill-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <FaQuoteRight className="text-[#dfba73]/20 text-2xl sm:text-3xl md:text-4xl pointer-events-none select-none transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      {/* Middle: Quoted Review Text */}
                      <div className="my-3 sm:my-4 flex-1">
                        <p className="text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed italic font-light line-clamp-4">
                          &ldquo;{review.translated?.review || review.review}&rdquo;
                        </p>
                      </div>

                      {/* Bottom Row: Gold Avatar Badge + Reviewer Name */}
                      <div className="flex items-center gap-2.5 sm:gap-3 pt-2.5 sm:pt-3.5 border-t border-white/10">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#9a7b4f] to-[#dfba73] text-black font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                          {getInitial(review.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white text-xs sm:text-sm md:text-base tracking-wide truncate">
                            {review.name || 'Verified Customer'}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Button */}
            {reviews.length > 1 && (
              <button
                type="button"
                onClick={() => scrollBy('right')}
                disabled={offset >= maxOffset}
                aria-label="Next review"
                className={`flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 min-w-[32px] sm:min-w-[44px] rounded-full flex items-center justify-center border transition-all duration-300 z-10 ${
                  offset >= maxOffset
                    ? 'border-white/10 text-white/20 cursor-not-allowed bg-black/25 opacity-30'
                    : 'border-[#dfba73]/40 text-[#dfba73] hover:border-[#dfba73] hover:bg-[#dfba73] hover:text-black bg-black/60 backdrop-blur-md shadow-lg active:scale-95'
                }`}
              >
                <FiChevronRight className="text-base sm:text-xl" />
              </button>
            )}
          </div>

          {/* Indicator Dots */}
          {maxOffset > 0 && (
            <div className="flex justify-center gap-1.5 mt-4 sm:mt-6">
              {Array.from({
                length: Math.ceil(reviews.length / colsPerView),
              }).map((_, i) => {
                const totalDots = Math.ceil(reviews.length / colsPerView);
                const step = maxOffset / Math.max(1, totalDots - 1);
                const active = Math.round(offset / (step || 1)) === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setOffset(Math.min(maxOffset, Math.round(i * step)))
                    }
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      active ? 'w-6 sm:w-8 bg-[#dfba73]' : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* View All Reviews Button */}
          <div className="mt-6 flex justify-center">
            <Link
              to={`/product-details/${product}/reviews`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#dfba73]/60 text-[#dfba73] hover:text-black hover:bg-[#dfba73] text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(223,186,115,0.4)] active:scale-95"
            >
              <span>{common?.viewAllReviews || 'View All Reviews'}</span>
              <FiChevronRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mb-6 sm:mb-8 p-5 sm:p-8 rounded-2xl shadow-lg backdrop-blur-lg bg-[#121212]/80 text-center border border-[#c5a880]/20">
          <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
            {common.reviews || 'Customer Reviews'}
          </h3>
          <p className="text-gray-300 text-xs sm:text-base">
            No reviews yet for this product. Be the first to share your experience!
          </p>
        </div>
      )}

      {/* ── Add Your Review Form ── */}
      <div className="w-full max-w-4xl p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-md bg-[#121212]/85 border border-[#c5a880]/25">
        <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 text-center tracking-wide">
          {productDetails.addYourReview}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mb-4 sm:mb-6 text-center font-light">
          Share your experience with other customers
        </p>

        {!userToken ? (
          <p className="mb-4 text-center text-xs sm:text-sm text-amber-200">
            Sign in to review this product.
          </p>
        ) : eligibilityQuery.isLoading ? (
          <p className="mb-4 text-center text-xs sm:text-sm text-amber-200">
            Checking review eligibility...
          </p>
        ) : !eligibilityQuery.data?.canReview ? (
          <p className="mb-4 text-center text-xs sm:text-sm text-amber-200">
            {eligibilityQuery.data?.message ||
              'You can leave a review after the order is completed or delivered.'}
          </p>
        ) : null}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-3 sm:space-y-4"
          disabled={!eligibilityQuery.data?.canReview}
        >
          <Form.Item
            name="rating"
            label={
              <span className="text-white text-xs sm:text-sm font-medium">{common.rating}</span>
            }
            rules={[{ required: true, message: 'Please provide a rating!' }]}
          >
            <Rate
              allowHalf
              className="text-amber-400 text-sm sm:text-base [&_.ant-rate-star-second]:text-amber-400"
            />
          </Form.Item>

          <Form.Item
            name="review"
            label={
              <div className="flex items-center justify-between w-full">
                <span className="text-white text-xs sm:text-sm font-medium">
                  {productDetails.yourReview}
                </span>
                <span
                  className={`text-xs ${
                    wordCount > 100
                      ? 'text-red-400 font-bold'
                      : wordCount >= 85
                      ? 'text-amber-300 font-medium'
                      : 'text-gray-400 font-light'
                  }`}
                >
                  {wordCount} / 100 words
                </span>
              </div>
            }
            rules={[
              { required: true, message: 'Review cannot be empty!' },
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const words = value.trim().split(/\s+/).filter(Boolean);
                  if (words.length > 100) {
                    return Promise.reject(
                      new Error(`Review cannot exceed 100 words (currently ${words.length} words)`)
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Write your review here (maximum 100 words)..."
              className="rounded-lg bg-black/40 text-white text-xs sm:text-sm border border-white/20 p-2.5 sm:p-3 
               focus:ring-2 focus:ring-[#dfba73] focus:border-[#dfba73] focus:bg-black/50 hover:bg-black/50 placeholder-gray-500"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full sm:w-36 bg-[#dfba73] hover:bg-[#f1cd84] text-black font-semibold border-none rounded-lg py-2 sm:py-1.5 text-sm sm:text-base transition-all shadow-md"
              disabled={!eligibilityQuery.data?.canReview || wordCount > 100}
            >
              {common.submit}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ProductReview;
