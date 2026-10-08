import { useEffect, useRef, useState } from 'react';

const LazySection = ({ children, className = '', minHeight = 'auto' }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible || !ref.current) return undefined;

    const el = ref.current;
    const loadIfNearViewport = () => {
      if (!el) return;

      const { top, bottom } = el.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const preloadThreshold = 800;

      if (bottom >= -preloadThreshold && top <= viewportHeight + preloadThreshold) {
        setIsVisible(true);
      }
    };

    loadIfNearViewport();
    if (isVisible) return undefined;

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          root: null,
          rootMargin: '800px 0px',
          threshold: 0,
        }
      );

      observer.observe(el);
    }

    window.addEventListener('scroll', loadIfNearViewport, { passive: true });
    window.addEventListener('resize', loadIfNearViewport);

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', loadIfNearViewport);
      window.removeEventListener('resize', loadIfNearViewport);
    };
  }, [isVisible]);

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {isVisible ? children : null}
    </div>
  );
};

export default LazySection;
