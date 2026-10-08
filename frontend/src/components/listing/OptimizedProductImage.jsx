/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { getThumbnailAssetUrl, resolveAssetUrl } from '../../utils/assetUrl';
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
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || fallbackSrc);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(thumbnailSrc || fallbackSrc);
    setTriedFallback(false);
  }, [fallbackSrc, thumbnailSrc]);

  const handleError = () => {
    if (!triedFallback && currentSrc !== fallbackSrc && fallbackSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      return;
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      width="400"
      height="500"
      className={cn('h-full w-full object-cover object-top', className)}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      onError={handleError}
      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
    />
  );
};

export default OptimizedProductImage;
