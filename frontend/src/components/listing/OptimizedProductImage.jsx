/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FALLBACK_IMAGE,
  getAssetFallbackUrl,
  getThumbnailAssetUrl,
  resolveAssetUrl,
} from '../../utils/assetUrl';
import { cn } from '../../utils/cn';

const OptimizedProductImage = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
}) => {
  const fallbackSrc = useMemo(() => resolveAssetUrl(src), [src]);
  const thumbnailSrc = useMemo(() => getThumbnailAssetUrl(src), [src]);
  const localFallbackSrc = useMemo(() => getAssetFallbackUrl(src), [src]);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || fallbackSrc);
  const [triedFallback, setTriedFallback] = useState(false);
  const [triedLocalFallback, setTriedLocalFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(thumbnailSrc || fallbackSrc);
    setTriedFallback(false);
    setTriedLocalFallback(false);
    setIsLoaded(false);
  }, [fallbackSrc, thumbnailSrc]);

  const handleError = () => {
    if (!triedFallback && currentSrc !== fallbackSrc && fallbackSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      return;
    }

    if (!triedLocalFallback && currentSrc !== localFallbackSrc && localFallbackSrc) {
      setTriedLocalFallback(true);
      setCurrentSrc(localFallbackSrc);
      return;
    }

    // If all asset URLs 404, show clean placeholder
    if (currentSrc !== DEFAULT_FALLBACK_IMAGE) {
      setCurrentSrc(DEFAULT_FALLBACK_IMAGE);
      setIsLoaded(true);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      width="400"
      height="500"
      className={cn(
        'h-full w-full object-cover object-top transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
    />
  );
};

export default OptimizedProductImage;
