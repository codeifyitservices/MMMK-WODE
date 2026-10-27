/* eslint-disable react/prop-types */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import OptimizedProductImage from './OptimizedProductImage';

const ProductImageCarousel = ({
  images = [],
  alt,
  className = '',
  imageClassName = '',
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  const validImages = images.filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedIndexes, setLoadedIndexes] = useState(() => new Set([0]));
  const [touchStartX, setTouchStartX] = useState(null);
  const hasMultipleImages = validImages.length > 1;

  const goToImage = (nextIndex) => {
    if (!validImages.length) return;
    const normalizedIndex = (nextIndex + validImages.length) % validImages.length;
    setLoadedIndexes((current) => {
      const next = new Set(current);
      next.add(normalizedIndex);
      return next;
    });
    setCurrentIndex(normalizedIndex);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null || !hasMultipleImages) return;

    const touchEndX = event.changedTouches?.[0]?.clientX;
    if (typeof touchEndX !== 'number') return;

    const deltaX = touchStartX - touchEndX;
    if (Math.abs(deltaX) > 40) {
      goToImage(deltaX > 0 ? currentIndex + 1 : currentIndex - 1);
    }

    setTouchStartX(null);
  };

  if (!validImages.length) {
    return null;
  }

  // Fast path for single image products - no carousel wrappers, no buttons, no dots
  if (!hasMultipleImages) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-gray-800', className)}>
        <OptimizedProductImage
          src={validImages[0]}
          alt={alt}
          className={imageClassName}
          loading={loading}
          fetchPriority={fetchPriority}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden bg-gray-800', className)}
      onTouchStart={(event) => {
        setTouchStartX(event.touches?.[0]?.clientX ?? null);
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {validImages.map((image, index) => (
          <div key={`${image}-${index}`} className="h-full w-full flex-none bg-gray-800">
            {loadedIndexes.has(index) && (
              <OptimizedProductImage
                src={image}
                alt={alt}
                className={imageClassName}
                loading={index === 0 ? loading : 'lazy'}
                fetchPriority={index === 0 ? fetchPriority : 'auto'}
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous product image"
        onClick={(event) => {
          event.stopPropagation();
          goToImage(currentIndex - 1);
        }}
        className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 p-1 text-white/90 transition-transform duration-200 hover:scale-125 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] focus:outline-none"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Next product image"
        onClick={(event) => {
          event.stopPropagation();
          goToImage(currentIndex + 1);
        }}
        className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 p-1 text-white/90 transition-transform duration-200 hover:scale-125 hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] focus:outline-none"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
        {validImages.map((image, index) => (
          <button
            key={`dot-${image}-${index}`}
            type="button"
            aria-label={`Show product image ${index + 1}`}
            aria-current={currentIndex === index}
            onClick={(event) => {
              event.stopPropagation();
              goToImage(index);
            }}
            className={cn(
              'h-2 w-2 rounded-full border border-white transition pointer-events-auto',
              currentIndex === index ? 'bg-white' : 'bg-black/40 hover:bg-white/70'
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImageCarousel;
