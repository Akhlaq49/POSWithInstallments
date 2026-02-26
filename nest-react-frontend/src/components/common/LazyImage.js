import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage - Progressive image loading component
 * Shows placeholder immediately, loads actual image when in viewport
 */
const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  style = {},
  placeholder = null,
  threshold = 0.01,
  rootMargin = '50px',
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, load image immediately
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : (placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E')}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'} ${error ? 'error' : ''}`}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0.6,
        transition: 'opacity 0.3s ease-in-out'
      }}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;
