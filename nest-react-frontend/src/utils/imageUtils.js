// Clothing image utilities with Unsplash fallbacks

// Unsplash clothing images (high quality, reliable)
const unsplashClothingImages = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop', // Fashion store
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=800&fit=crop', // Clothing rack
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop', // Women's fashion
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop', // Fashion model
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop', // Clothing display
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop', // Fashion shopping
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=800&fit=crop', // Clothing store
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop', // Fashion items
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop', // Apparel
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop'  // Style
];

// Unsplash hero/banner images for backgrounds
const unsplashHeroImages = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2280&h=1080&fit=crop', // Fashion store wide
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=2280&h=1080&fit=crop', // Women's fashion wide
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=2280&h=1080&fit=crop', // Fashion model wide
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=2280&h=1080&fit=crop', // Clothing display wide
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=2280&h=1080&fit=crop'  // Fashion shopping wide
];

// Local clothing images (from assets)
const localClothingImages = [
  '/assets/images/08231db713634e96baf664cf7b99d1a5.thumbnail.0000000000_small.jpg',
  '/assets/images/0dc5821c585f46b9b2192244ced74eac.thumbnail.0000000000_small.jpg',
  '/assets/images/11108a5f42834d188f6ae9871da852f5.thumbnail.0000000000_small.jpg',
  '/assets/images/203e2fd074904431bffdbbc76b96c70a.thumbnail.0000000000_small.jpg',
  '/assets/images/2ef5609901fc4b50baffbe58dadacc7f.thumbnail.0000000000_small.jpg',
  '/assets/images/36060003164b41e8ae52753cd05a8a5e.thumbnail.0000000000_small.jpg',
  '/assets/images/3bf561f19c4948dd9b278fbace3d69e7.thumbnail.0000000000_small.jpg',
  '/assets/images/4a0ce756c34646ae99541a2f32c29df3.thumbnail.0000000000_small.jpg',
  '/assets/images/4bea482391154b2ebfd55e071391f2d1.thumbnail.0000000000_small.jpg',
  '/assets/images/5518ffa8ef9b418486d7f52300cf8d45.thumbnail.0000000000_small.jpg'
];

/**
 * Get clothing product image with Unsplash fallback
 * @param {string} imagePath - Image path from API or local
 * @param {number} index - Index for cycling through images
 * @returns {string} Image URL
 */
export const getClothingImage = (imagePath, index = 0) => {
  // If no image path provided, use local first, then Unsplash
  if (!imagePath) {
    return localClothingImages[index % localClothingImages.length] || 
           unsplashClothingImages[index % unsplashClothingImages.length];
  }
  
  // Check if it's a grocery image path
  if (imagePath.includes('/assets/imgs/shop/product-') || 
      imagePath.includes('/assets/imgs/shop/thumbnail-') ||
      (imagePath.includes('product-') && imagePath.includes('.jpg') && !imagePath.includes('/assets/images/'))) {
    // Replace with local clothing image, fallback to Unsplash
    return localClothingImages[index % localClothingImages.length] || 
           unsplashClothingImages[index % unsplashClothingImages.length];
  }
  
  // If it's already a clothing image or external URL, use it
  return imagePath;
};

/**
 * Get hero/banner background image with Unsplash fallback
 * @param {string} imagePath - Image path
 * @param {number} index - Index for cycling
 * @returns {string} Image URL
 */
export const getHeroImage = (imagePath, index = 0) => {
  if (!imagePath || imagePath.includes('/assets/imgs/')) {
    // Use local hero images first, then Unsplash
    const localHeroImages = [
      '/assets/images/women-hero-desktop-2280x1080_300x.jpg',
      '/assets/images/Men-page-hero-2280X1080-2_300x.jpg',
      '/assets/images/2280x1080-v2_1_300x.jpg',
      '/assets/images/Web_Banner-Female-v3_300x.jpg',
      '/assets/images/Accessories_Web_300x.jpg'
    ];
    return localHeroImages[index % localHeroImages.length] || 
           unsplashHeroImages[index % unsplashHeroImages.length];
  }
  return imagePath;
};

/**
 * Get Unsplash fallback image for onError handlers
 * @param {number} index - Index for variety
 * @returns {string} Unsplash image URL
 */
export const getUnsplashFallback = (index = 0) => {
  return unsplashClothingImages[index % unsplashClothingImages.length];
};

/**
 * Get Unsplash hero fallback
 * @param {number} index - Index for variety
 * @returns {string} Unsplash hero image URL
 */
export const getUnsplashHeroFallback = (index = 0) => {
  return unsplashHeroImages[index % unsplashHeroImages.length];
};

/**
 * Get full image URL with base domain
 * @param {string} imagePath - Relative or absolute image path
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Prepend ReactPosApi base URL for relative paths (e.g. /uploads/products/img.jpg)
  const baseUrl = process.env.REACT_APP_MEDIA_URL || 'http://192.168.1.8:5000';
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Export arrays for direct use
export { localClothingImages, unsplashClothingImages, unsplashHeroImages };

