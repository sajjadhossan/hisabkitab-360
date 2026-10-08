import React, { useState, useEffect, useRef } from 'react';
import { Package } from 'lucide-react';

// In-memory cache of already loaded images to prevent re-shimmering
const imageLoadedMemoryCache = new Set();

/**
 * Mobile-Optimized Lazy WebP Image Component
 * --------------------------------------------
 * Zero-jank progressive image loading with GPU-composited skeleton shimmer,
 * viewport intersection detection, and automatic broken image fallback.
 */
export const OptimizedImage = ({
  src,
  alt = '',
  width = 40,
  height = 40,
  borderRadius = '8px',
  className = '',
  style = {},
  fallbackIcon = <Package size={18} style={{ color: 'var(--text-dim)' }} />
}) => {
  const [isLoaded, setIsLoaded] = useState(() => (src ? imageLoadedMemoryCache.has(src) : false));
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    if (imageLoadedMemoryCache.has(src)) {
      setIsLoaded(true);
      setIsVisible(true);
      return;
    }

    // Lazy load when image enters viewport within 200px
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '200px' }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, [src]);

  const handleLoad = () => {
    if (src) imageLoadedMemoryCache.add(src);
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.04)',
    flexShrink: 0,
    ...style
  };

  if (!src || hasError) {
    return (
      <div className={`opt-image-container ${className}`} style={containerStyle}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`opt-image-container ${className}`} style={containerStyle}>
      {!isLoaded && <div className="opt-image-skeleton" style={{ borderRadius }} />}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
      )}
    </div>
  );
};
