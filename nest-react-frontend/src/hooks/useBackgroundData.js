import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for loading data in the background without blocking initial render
 * Shows cached/placeholder data immediately, then updates when API responds
 */
export const useBackgroundData = (fetchFunction, options = {}) => {
  const {
    immediate = false, // Whether to fetch immediately or wait
    cacheKey = null, // Key for localStorage caching
    cacheDuration = 5 * 60 * 1000, // Cache duration in ms (default 5 minutes)
    placeholderData = null, // Data to show while loading
    enabled = true // Whether fetching is enabled
  } = options;

  const [data, setData] = useState(() => {
    // Try to load from cache first
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheDuration) {
            return cachedData;
          }
        }
      } catch (error) {
        console.warn('Cache read error:', error);
      }
    }
    return placeholderData;
  });

  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const [isBackground, setIsBackground] = useState(false);

  const fetchData = useCallback(async (background = false) => {
    if (!enabled) return;

    if (background) {
      setIsBackground(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);

      // Cache the result
      if (cacheKey) {
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: result,
              timestamp: Date.now()
            })
          );
        } catch (error) {
          console.warn('Cache write error:', error);
        }
      }
    } catch (err) {
      console.error('Background data fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
      setIsBackground(false);
    }
  }, [fetchFunction, cacheKey, enabled, cacheDuration]);

  useEffect(() => {
    if (immediate && enabled) {
      // If we have cached data, fetch in background
      // Otherwise, show loading state
      fetchData(!!data);
    }
  }, [immediate, enabled, fetchData]);

  const refetch = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isBackground,
    refetch
  };
};

/**
 * Hook for prefetching data that will be needed soon
 * Useful for preloading data for links the user might click
 */
export const usePrefetch = () => {
  const [prefetchedData, setPrefetchedData] = useState(new Map());

  const prefetch = useCallback(async (key, fetchFunction) => {
    if (prefetchedData.has(key)) {
      return prefetchedData.get(key);
    }

    try {
      const data = await fetchFunction();
      setPrefetchedData(prev => new Map(prev).set(key, data));
      return data;
    } catch (error) {
      console.error('Prefetch error:', error);
      return null;
    }
  }, [prefetchedData]);

  const getData = useCallback((key) => {
    return prefetchedData.get(key);
  }, [prefetchedData]);

  const clearPrefetch = useCallback((key) => {
    setPrefetchedData(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  return {
    prefetch,
    getData,
    clearPrefetch,
    prefetchedData
  };
};

/**
 * Hook for progressive image loading
 * Shows low-quality placeholder, then loads high-quality image
 */
export const useProgressiveImage = (lowQualitySrc, highQualitySrc) => {
  const [src, setSrc] = useState(lowQualitySrc);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start with low quality
    setSrc(lowQualitySrc);
    setLoading(true);

    // Load high quality in background
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => {
      setSrc(highQualitySrc);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return { src, loading };
};
