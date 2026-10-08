import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';
import { convertPrice, formatPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'framer-motion';

const products = [
  {
    id: 1,
    video: '/homeVideos/one.mp4',
    backgroundColor: 'bg-pink-200',
    isNew: true,
    type: 'product',
    title: 'Maaliyah',
    OriginalPrice: 418,
    OfferedPrice: 379,
    productId: '6932b828f831c31cc6425581',
  },
  {
    id: 2,
    video: '/homeVideos/two.mp4',
    backgroundColor: 'bg-gray-200',
    isNew: true,
    type: 'product',
    title: 'Mada',
    OriginalPrice: 59,
    OfferedPrice: 54,
    productId: '69ef60705f9f6f03b48d592e',
  },
  {
    id: 3,
    video: '/homeVideos/three.mp4',
    backgroundColor: 'bg-blue-200',
    isNew: true,
    type: 'product',
    title: 'Mandingo',
    OriginalPrice: 268,
    OfferedPrice: 245,
    productId: '692424ab4a1b8d3378c91467',
  },
  {
    id: 4,
    video: '/homeVideos/four.mp4',
    backgroundColor: 'bg-gradient-to-br from-purple-400 to-pink-400',
    isNew: false,
    isBefore: true,
    type: 'model',
    hasQuickShop: true,
    title: 'Maelhys',
    OriginalPrice: 216,
    OfferedPrice: 197,
    productId: '6932b8a6f831c31cc64255a9',
  },
];

const ProductVideoCard = memo(function ProductVideoCard({
  product,
  originalPrice,
  offeredPrice,
  brandLabel,
  onOpen,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { margin: '200px 0px', once: true });

  const captureFirstFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Seek to 0 to ensure we get frame 0, not a mid-decode frame
    video.currentTime = 0;
  }, []);

  const handleSeeked = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.currentTime > 0.1) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    // Fade in the canvas frame, fade out the background color
    canvas.style.opacity = '1';
  }, []);

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleMouseLeave = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const handleClick = useCallback(() => {
    onOpen(product.productId);
  }, [onOpen, product.productId]);

  return (
    <button
      ref={containerRef}
      type="button"
      className="group cursor-pointer text-left w-full"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Open ${product.title}`}
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-lg ${product.backgroundColor}`}
      >
        {/* First-frame canvas — shown before/between hover plays */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
          style={{ display: 'block' }}
        />

        {isInView && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={product.video}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={captureFirstFrame}
            onSeeked={handleSeeked}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      <div className="mt-3">
        <div className="flex">
          <p className="text-lg text-gray-700 line-through">{originalPrice}</p>
          <p className="ml-3 text-lg text-gray-700">{offeredPrice}</p>
        </div>
        <h3 className="text-2xl text-gray-900">{product.title}</h3>
        <h3 className="text-md font-semibold text-gray-900">{brandLabel}</h3>
      </div>
    </button>
  );
});

export default function VideoCard() {
  const {
    content: { common, homepage },
  } = useTranslationContext();
  const { currency, rates } = useCurrency();
  const navigate = useNavigate();

  const formatConvertedPrice = useCallback(
    (amount) => formatPrice(convertPrice(amount, currency, rates), currency),
    [currency, rates]
  );

  const handleOpenProduct = useCallback(
    (productId) => {
      navigate(`/product-details/${productId}`);
    },
    [navigate]
  );

  return (
    <div className="bg-white py-8 px-4 md:px-8 md:py-12">
      <div className="mx-auto max-w-full">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-bold leading-tight text-black sm:text-3xl md:text-4xl">
              {homepage.section17Heading1}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductVideoCard
              key={product.id}
              product={product}
              originalPrice={formatConvertedPrice(product.OriginalPrice)}
              offeredPrice={formatConvertedPrice(product.OfferedPrice)}
              brandLabel={common.mmmk}
              onOpen={handleOpenProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
