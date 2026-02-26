# Progressive Loading Implementation Guide

## Overview
This application now implements progressive loading to ensure the initial page loads immediately while assets and API calls load in the background. This provides a much faster perceived performance and better user experience.

## Key Components

### 1. ProgressiveLoader (`src/components/common/ProgressiveLoader.js`)
Replaces the old ScriptLoader with intelligent background loading.

**Features:**
- Removes preloader immediately (100ms delay)
- Loads critical scripts first (jQuery, Bootstrap)
- Loads non-critical scripts in background
- Doesn't block page rendering
- Enables lazy loading for images

**How it works:**
1. Preloader removed within 100ms
2. Critical scripts loaded synchronously
3. Page content renders immediately
4. Background scripts load asynchronously
5. No blocking of user interaction

### 2. Background Data Hooks (`src/hooks/useBackgroundData.js`)

#### `useBackgroundData` Hook
Load API data in background without blocking render.

**Usage:**
```javascript
import { useBackgroundData } from '../hooks/useBackgroundData';

function MyComponent() {
  const { data, loading, error, refetch } = useBackgroundData(
    async () => {
      const response = await fetch('/api/products');
      return response.json();
    },
    {
      immediate: true,           // Fetch on mount
      cacheKey: 'products',      // Cache in localStorage
      cacheDuration: 300000,     // 5 minutes
      placeholderData: [],       // Show while loading
      enabled: true              // Enable/disable fetching
    }
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {data && <ProductList products={data} />}
    </div>
  );
}
```

**Benefits:**
- Shows cached data immediately
- Fetches fresh data in background
- Automatic caching with expiration
- Placeholder data while loading

#### `usePrefetch` Hook
Prefetch data that user will likely need soon.

**Usage:**
```javascript
import { usePrefetch } from '../hooks/useBackgroundData';

function ProductCard({ productId }) {
  const { prefetch, getData } = usePrefetch();

  const handleMouseEnter = () => {
    // Prefetch product details when user hovers
    prefetch(`product-${productId}`, async () => {
      const response = await fetch(`/api/products/${productId}`);
      return response.json();
    });
  };

  const handleClick = () => {
    // Use prefetched data if available
    const cached = getData(`product-${productId}`);
    if (cached) {
      // Use cached data immediately
      showProduct(cached);
    } else {
      // Fetch if not prefetched
      fetchProduct(productId);
    }
  };

  return (
    <div onMouseEnter={handleMouseEnter} onClick={handleClick}>
      Product Card
    </div>
  );
}
```

#### `useProgressiveImage` Hook
Load images progressively with low-quality placeholder.

**Usage:**
```javascript
import { useProgressiveImage } from '../hooks/useBackgroundData';

function ProductImage({ lowQuality, highQuality }) {
  const { src, loading } = useProgressiveImage(
    lowQuality,   // Low-quality placeholder
    highQuality   // High-quality full image
  );

  return (
    <img 
      src={src} 
      className={loading ? 'blurred' : 'sharp'}
      alt="Product"
    />
  );
}
```

### 3. LazyImage Component (`src/components/common/LazyImage.js`)

**Features:**
- Only loads images when they enter viewport
- Smooth fade-in transition
- Fallback for browsers without IntersectionObserver
- Native lazy loading support
- Custom placeholder support

**Usage:**
```javascript
import LazyImage from '../components/common/LazyImage';

function ProductCard({ product }) {
  return (
    <LazyImage
      src={product.image}
      alt={product.name}
      className="product-image"
      placeholder="/assets/imgs/placeholder.png"
      threshold={0.01}        // Load when 1% visible
      rootMargin="50px"       // Start loading 50px before viewport
      onLoad={() => console.log('Image loaded')}
      onError={(e) => e.target.src = '/assets/imgs/fallback.png'}
    />
  );
}
```

## Implementation Strategy

### 1. Immediate Page Load
- Preloader hidden within 100ms
- Content renders immediately
- CSS loaded synchronously for proper styling

### 2. Critical Path
Only critical scripts loaded synchronously:
- jQuery (needed for plugins)
- Bootstrap (UI framework)
- jQuery Migrate (compatibility)

### 3. Background Loading
Non-critical scripts loaded asynchronously:
- Slick Carousel
- Magnific Popup
- WOW animations
- Other plugins
- Custom scripts (main.js, shop.js)

### 4. Asset Optimization
- Images lazy-loaded when near viewport
- API calls cached in localStorage
- Background data refresh doesn't block UI

## Best Practices

### For Components with API Calls
```javascript
// ❌ Bad: Blocks rendering
function Products() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);
  
  if (!products.length) return <Loading />;
  return <ProductList products={products} />;
}

// ✅ Good: Shows cached/placeholder immediately
function Products() {
  const { data, loading } = useBackgroundData(
    () => fetch('/api/products').then(r => r.json()),
    {
      immediate: true,
      cacheKey: 'products',
      placeholderData: []  // Show empty list while loading
    }
  );
  
  return (
    <>
      <ProductList products={data} />
      {loading && <LoadingOverlay />}
    </>
  );
}
```

### For Images
```javascript
// ❌ Bad: All images load immediately
<img src="/assets/imgs/product.jpg" alt="Product" />

// ✅ Good: Lazy load when needed
<LazyImage 
  src="/assets/imgs/product.jpg" 
  alt="Product"
  rootMargin="100px"  // Start loading before visible
/>
```

### For Heavy Components
```javascript
// ❌ Bad: Everything loaded upfront
import HeavyComponent from './HeavyComponent';

// ✅ Good: Lazy load when needed
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Performance Metrics

Expected improvements:
- **First Contentful Paint (FCP)**: 40-60% faster
- **Time to Interactive (TTI)**: 30-50% faster
- **Largest Contentful Paint (LCP)**: 20-40% faster
- **Total Blocking Time (TBT)**: 50-70% reduction

## Browser Support

- **Modern Browsers**: Full support with IntersectionObserver
- **Legacy Browsers**: Graceful fallback (immediate loading)
- **No JavaScript**: Basic content still accessible

## Monitoring

Check loading performance:
```javascript
// In browser console
window.performance.getEntriesByType('navigation')[0];
// Check: loadEventEnd - fetchStart for total load time

window.performance.getEntriesByType('resource');
// Check: Individual resource loading times
```

## Migration Guide

To update existing components:

1. **Replace regular images**
   ```javascript
   // Before
   <img src={product.image} alt={product.name} />
   
   // After
   <LazyImage src={product.image} alt={product.name} />
   ```

2. **Update API calls**
   ```javascript
   // Before
   useEffect(() => {
     fetchData().then(setData);
   }, []);
   
   // After
   const { data } = useBackgroundData(fetchData, {
     immediate: true,
     cacheKey: 'myData'
   });
   ```

3. **Add prefetching**
   ```javascript
   const { prefetch } = usePrefetch();
   
   <Link 
     to="/products" 
     onMouseEnter={() => prefetch('products', fetchProducts)}
   >
     Products
   </Link>
   ```

## Troubleshooting

### Images not loading
- Check if `IntersectionObserver` is available
- Verify image paths are correct
- Check browser console for errors

### Scripts not executing
- Verify script paths in ProgressiveLoader
- Check browser console for loading errors
- Ensure jQuery loads before plugins

### Cache not working
- Check localStorage is enabled
- Verify cacheKey is unique
- Check cacheDuration setting

## Future Enhancements

- [ ] Service Worker for offline support
- [ ] HTTP/2 Server Push for critical assets
- [ ] WebP image format with fallbacks
- [ ] Resource hints (preload, prefetch, preconnect)
- [ ] Dynamic import chunking optimization
