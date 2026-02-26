import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProductById, getProductsByCategory, getProducts, getCategoriesHierarchical } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { getClothingImage, getUnsplashFallback, getImageUrl } from '../../utils/imageUtils';
import VideoImage from '../../components/common/VideoImage';
import './ShopProductRight.css';

const ShopProductRight = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // For category counts
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sliderReady, setSliderReady] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  
  const imageSliderRef = useRef(null);
  const thumbnailSliderRef = useRef(null);
  const sliderInitializedRef = useRef(false);
  const currentProductIdRef = useRef(null);
  const initTimerRef = useRef(null);
  const carouselLockedRef = useRef(false);
  const mainImageRef = useRef(null);
  const zoomInitializedRef = useRef(false);

  // Scroll to top when component mounts or product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  // Patch main.js modal handler and slick setPosition to prevent errors
  useEffect(() => {
    if (!window.jQuery) return;

    // Patch slick's setPosition method to be safer
    const originalSlick = window.jQuery.fn.slick;
    if (originalSlick) {
      window.jQuery.fn.slick = function(method, ...args) {
        // If calling setPosition, check if slick is initialized first
        if (method === 'setPosition') {
          const $this = window.jQuery(this);
          // Check each element in the jQuery collection
          const validElements = $this.filter(function() {
            const $el = window.jQuery(this);
            return $el.hasClass('slick-initialized') && $el.data('slick');
          });
          
          if (validElements.length === 0) {
            // No valid slick instances, skip silently
            return $this;
          }
          
          // Only call setPosition on valid elements
          return validElements.each(function() {
            const $el = window.jQuery(this);
            try {
              if ($el.hasClass('slick-initialized') && $el.data('slick')) {
                originalSlick.call($el, method, ...args);
              }
            } catch (err) {
              // Silently ignore errors
            }
          });
        }
        
        // For all other methods, use original slick
        return originalSlick.apply(this, [method, ...args]);
      };
    }

    // Patch the modal handler - run immediately and also after delay
    const patchModalHandler = () => {
      // Remove ALL existing handlers first
      window.jQuery(".modal").off("shown.bs.modal");
      
      // Add safe version
      window.jQuery(".modal").on("shown.bs.modal", function (e) {
        // Only call setPosition if slick is initialized
        window.jQuery(".product-image-slider").each(function() {
          const $slider = window.jQuery(this);
          if ($slider.hasClass('slick-initialized') && $slider.data('slick')) {
            try {
              $slider.slick("setPosition");
            } catch (err) {
              // Silently ignore errors
            }
          }
        });
        
        window.jQuery(".slider-nav-thumbnails").each(function() {
          const $slider = window.jQuery(this);
          if ($slider.hasClass('slick-initialized') && $slider.data('slick')) {
            try {
              $slider.slick("setPosition");
            } catch (err) {
              // Silently ignore errors
            }
          }
        });
      });
    };

    // Apply patch immediately and also after main.js loads
    patchModalHandler();
    const patchTimer = setTimeout(patchModalHandler, 2000);
    
    return () => {
      clearTimeout(patchTimer);
      if (window.jQuery) {
        window.jQuery(".modal").off("shown.bs.modal");
        // Restore original slick if needed
        if (originalSlick) {
          window.jQuery.fn.slick = originalSlick;
        }
      }
    };
  }, []);


  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setProduct(null);
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productData = await getProductById(productId);
        
        if (!productData) {
          setProduct(null);
          setRelatedProducts([]);
        } else {
          setProduct(productData);
          
          // Fetch related products (same category)
          if (productData?.categoryId) {
            try {
              const related = await getProductsByCategory(productData.categoryId);
              // Filter out current product and limit to 4
              const filtered = related
                .filter(p => p.id !== productId)
                .slice(0, 4);
              setRelatedProducts(filtered);
            } catch (relatedError) {
              console.error('Error fetching related products:', relatedError);
              setRelatedProducts([]);
            }
          } else {
            // If no category, get random products
            try {
              const allProducts = await getProducts();
              if (allProducts && allProducts.length > 0) {
                const filtered = allProducts
                  .filter(p => p.id !== productId)
                  .slice(0, 4);
                setRelatedProducts(filtered);
              } else {
                setRelatedProducts([]);
              }
            } catch (allProductsError) {
              console.error('Error fetching all products:', allProductsError);
              setRelatedProducts([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch categories for sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesHierarchical();
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch all products for category counts
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const data = await getProducts();
        setAllProducts(data || []);
      } catch (error) {
        console.error('Error fetching all products:', error);
        setAllProducts([]);
      }
    };
    fetchAllProducts();
  }, []);

  // Get product count for category
  const getCategoryProductCount = (categoryId) => {
    return allProducts.filter(p => p.categoryId === categoryId || p.category?.id === categoryId).length;
  };

  // Get product images from API product data
  const getProductImages = React.useCallback(() => {
    if (!product) {
      return [];
    }

    // Use product imagePath or imagePaths from API
    const images = [];
    let imagePaths = null;

    // Handle imagePaths - it can be a string (JSON) or an array
    if (product.imagePaths) {
      if (typeof product.imagePaths === 'string') {
        // Parse JSON string to array
        try {
          imagePaths = JSON.parse(product.imagePaths);
          console.log('Parsed imagePaths:', imagePaths);
        } catch (e) {
          console.error('Error parsing imagePaths JSON:', e);
          imagePaths = null;
        }
      } else if (Array.isArray(product.imagePaths)) {
        imagePaths = product.imagePaths;
        console.log('imagePaths is already array:', imagePaths);
      }
    }

    // If we have imagePaths array, use it
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      imagePaths.forEach((imgPath, index) => {
        if (imgPath) {
          images.push({
            hd: getImageUrl(imgPath),
            thumbnail: getImageUrl(imgPath),
            fallback: getImageUrl(imgPath)
          });
        }
      });
      console.log('Using imagePaths - total images:', images.length);
    } 
    // If product has single imagePath, use it
    else if (product.imagePath) {
      images.push({
        hd: getImageUrl(product.imagePath),
        thumbnail: getImageUrl(product.imagePath),
        fallback: getImageUrl(product.imagePath)
      });
      console.log('Using single imagePath - total images:', images.length);
    }
    // Fallback to default image if no images available
    else {
      images.push({
        hd: '/assets/imgs/shop/product-1-1.jpg',
        thumbnail: '/assets/imgs/shop/product-1-1.jpg',
        fallback: '/assets/imgs/shop/product-1-1.jpg'
      });
      console.log('Using fallback image - total images:', images.length);
    }

    return images;
  }, [product]);

  // Get thumbnail images - use thumbnails from product images
  const getThumbnailImages = React.useCallback(() => {
    const productImages = getProductImages();
    return productImages.map(img => img.thumbnail || img.fallback || img.hd);
  }, [getProductImages]);

  // Initialize zoom functionality on main image
  const initializeZoom = React.useCallback(() => {
    if (!window.jQuery || !window.jQuery.fn.elevateZoom) {
      return;
    }

    // Find the currently visible image
    const productImages = getProductImages();
    const currentImage = productImages[selectedImageIndex];
    if (!currentImage) return;

    // Remove existing zoom instances and clean up all zoom elements
    window.jQuery('.zoomWindowContainer, .zoomContainer, .zoomWindow, .zoomLens').remove();
    window.jQuery('img').each(function() {
      const $img = window.jQuery(this);
      if ($img.data('elevateZoom')) {
        $img.removeData('elevateZoom');
        $img.removeData('zoomImage');
        $img.removeAttr('data-zoom-image');
      }
    });
    zoomInitializedRef.current = false;

    // Only initialize on desktop (width > 768)
    if (window.innerWidth > 768) {
      // Wait for image to be in DOM and loaded
      setTimeout(() => {
        try {
          // Find ONLY the selected image element - use selectedImageIndex directly
          const figures = imageSliderRef.current?.querySelectorAll('figure');
          let imgElement = null;
          
          if (figures && figures.length > selectedImageIndex) {
            // Get the figure at exactly selectedImageIndex
            const selectedFigure = figures[selectedImageIndex];
            if (selectedFigure) {
              const style = window.getComputedStyle(selectedFigure);
              // Only get image if this figure is visible
              if (style.display !== 'none') {
                imgElement = selectedFigure.querySelector('img');
              }
            }
          }
          
          if (!imgElement) {
            console.warn('Image element not found for zoom at index:', selectedImageIndex);
            return;
          }

          // Wait for image to load
          if (!imgElement.complete || imgElement.naturalWidth === 0) {
            imgElement.onload = () => {
              initializeZoom();
            };
            return;
          }

          const $img = window.jQuery(imgElement);
          if ($img.length && imgElement.src) {
            // Set mainImageRef to the actual img element
            mainImageRef.current = imgElement;

            // Get HD image for zoom - use the actual image src if it's already loaded
            // For videos, we need to use the extracted frame or thumbnail
            let zoomImage = currentImage.hd || currentImage.thumbnail;
            
            // If the current src is a data URL (from video extraction), use it
            if (imgElement.src.startsWith('data:')) {
              zoomImage = imgElement.src;
            } else if (currentImage.hd && currentImage.hd.includes('.mp4')) {
              // For videos, use the thumbnail as zoom image (elevateZoom needs an image, not video)
              zoomImage = currentImage.thumbnail || currentImage.fallback;
            }
            
            // Initialize elevateZoom with HD image
            $img.attr('data-zoom-image', zoomImage);
            
            // Destroy any existing zoom first
            if ($img.data('elevateZoom')) {
              $img.elevateZoom('destroy');
            }
            
            // Get container dimensions for proper constraints
            const $container = $img.closest('.product-image-slider');
            const containerWidth = $container.width();
            const containerHeight = $container.height();
            
            $img.elevateZoom({
              zoomType: "inner",
              cursor: "crosshair",
              zoomWindowFadeIn: 200,
              zoomWindowFadeOut: 200,
              scrollZoom: false, // Disable scroll zoom to prevent issues
              easing: true,
              easingDuration: 300,
              constrainType: "height",
              constrainSize: containerHeight || 600,
              zoomWindowWidth: containerWidth || 400,
              zoomWindowHeight: containerHeight || 600,
              zoomWindowOffetx: 0,
              zoomWindowOffety: 0,
              zoomWindowPosition: 1,
              lensSize: 200,
              borderSize: 0,
              borderColour: "transparent",
              showLens: true,
              lensFadeIn: 200,
              lensFadeOut: 200
            });
            zoomInitializedRef.current = true;
          }
        } catch (error) {
          console.error('Zoom initialization error:', error);
        }
      }, 300);
    }
  }, [selectedImageIndex, getProductImages]);

  // Re-initialize zoom when selected image changes
  useEffect(() => {
    if (sliderReady && selectedImageIndex >= 0) {
      // Wait a bit longer to ensure image is loaded and visible
      const timer = setTimeout(() => {
        initializeZoom();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [selectedImageIndex, sliderReady, initializeZoom]);

  // Cleanup zoom when component unmounts
  useEffect(() => {
    return () => {
      // Destroy elevateZoom instances on ALL images
      if (window.jQuery) {
        // Find all images with elevateZoom
        window.jQuery('img').each(function() {
          const $img = window.jQuery(this);
          if ($img.data('elevateZoom')) {
            try {
              $img.removeData('elevateZoom');
              $img.removeData('zoomImage');
              $img.removeAttr('data-zoom-image');
            } catch (err) {
              console.warn('Error removing elevateZoom data:', err);
            }
          }
        });
        
        // Remove all zoom-related DOM elements
        window.jQuery('.zoomWindowContainer, .zoomContainer, .zoomWindow, .zoomLens').remove();
        
        // Remove any inline styles that zoom might have added
        window.jQuery('img[style*="cursor"]').css('cursor', '');
      }
      
      // Reset zoom initialized flag
      zoomInitializedRef.current = false;
      mainImageRef.current = null;
    };
  }, []);

  // Handle thumbnail click to change main image - NO API CALL NEEDED
  const handleThumbnailClick = (index) => {
    console.log('Thumbnail clicked - index:', index);
    
    // Update the state - this is all we need, React will re-render
    setSelectedImageIndex(index);
    
    // Sync thumbnail carousel position if it's initialized
    if (window.jQuery && thumbnailSliderRef.current) {
      const $thumb = window.jQuery(thumbnailSliderRef.current);
      
      if ($thumb.hasClass('slick-initialized') && $thumb.data('slick')) {
        try {
          $thumb.slick('slickGoTo', index, false);
          $thumb.find('.slick-slide').removeClass('slick-active').eq(index).addClass('slick-active');
        } catch (err) {
          console.warn('Thumbnail carousel sync error:', err);
        }
      }
    }
    
    // Re-initialize zoom after short delay
    setTimeout(() => {
      initializeZoom();
    }, 200);
  };

  // Define displayProduct - use actual product from API
  const displayProduct = React.useMemo(() => {
    return product;
  }, [product]);

  // PROPER FIX: Initialize carousel once and prevent React interference
  useEffect(() => {
    // Use displayProduct which is now defined early
    if (!displayProduct || !window.jQuery || !window.jQuery.fn.slick) {
      return;
    }

    const productImages = getProductImages();
    if (productImages.length === 0) {
      return;
    }

    // Skip if already initialized for this product
    if (currentProductIdRef.current === displayProduct.id && sliderInitializedRef.current) {
      setSliderReady(true);
      return;
    }

    // Clean up timers
    if (initTimerRef.current) {
      clearTimeout(initTimerRef.current);
    }

    // Destroy old sliders if product changed
    if (currentProductIdRef.current !== displayProduct.id && currentProductIdRef.current !== null) {
      if (window.jQuery) {
        if (imageSliderRef.current) {
          const $slider = window.jQuery(imageSliderRef.current);
          if ($slider.hasClass('slick-initialized') && $slider.data('slick')) {
            try {
              $slider.off('beforeChange').slick('unslick');
            } catch (e) {
              console.warn('Error destroying main slider:', e);
            }
          }
        }
        if (thumbnailSliderRef.current) {
          const $slider = window.jQuery(thumbnailSliderRef.current);
          if ($slider.hasClass('slick-initialized') && $slider.data('slick')) {
            try {
              $slider.slick('unslick');
            } catch (e) {
              console.warn('Error destroying thumbnail slider:', e);
            }
          }
        }
      }
    }

    currentProductIdRef.current = displayProduct.id;
    sliderInitializedRef.current = false;
    carouselLockedRef.current = false;
    setSliderReady(false);

    // Initialize function - called ONCE
    const init = () => {
      if (!imageSliderRef.current || !thumbnailSliderRef.current) return;
      if (currentProductIdRef.current !== displayProduct.id) return;

      const $main = window.jQuery(imageSliderRef.current);
      const $thumb = window.jQuery(thumbnailSliderRef.current);

      if ($main.hasClass('slick-initialized') || $thumb.hasClass('slick-initialized')) {
        sliderInitializedRef.current = true;
        carouselLockedRef.current = true;
        setSliderReady(true);
        return;
      }

      try {
        // Verify elements exist and are valid
        if (!$main.length || !$thumb.length) {
          console.warn('Slider elements not found');
          return;
        }

        const mainFigures = $main.find('figure');
        const thumbDivs = $thumb.find('> div');
        console.log('Main carousel figures:', mainFigures.length, 'Thumbnail divs:', thumbDivs.length);

        // Don't use Slick for main carousel - let React manage display via state
        // Main carousel is controlled by selectedImageIndex state and display: block/none

        // Initialize thumbnail slider with error handling ONLY
        if (!$thumb.hasClass('slick-initialized')) {
          $thumb.slick({
            slidesToShow: Math.min(4, productImages.length),
            slidesToScroll: 1,
            dots: false,
            focusOnSelect: true,
            accessibility: false, // Disable accessibility to prevent errors
            prevArrow: '<button type="button" class="slick-prev"><i class="fi-rs-arrow-small-left"></i></button>',
            nextArrow: '<button type="button" class="slick-next"><i class="fi-rs-arrow-small-right"></i></button>',
            responsive: [{
              breakpoint: 768,
              settings: { slidesToShow: Math.min(3, productImages.length) }
            }],
          });
        }

        // Verify slick instances are properly initialized
        setTimeout(() => {
          if ($main.hasClass('slick-initialized') && $main.data('slick')) {
            // Set active thumbnail
            if ($thumb.hasClass('slick-initialized') && $thumb.data('slick')) {
              $thumb.find('.slick-slide').removeClass('slick-active').eq(0).addClass('slick-active');
            }
          }
        }, 100);

        // Handle slide changes with safety checks
        $main.off('beforeChange').on('beforeChange', function (e, slick, current, next) {
          if (!$main.data('slick')) return; // Safety check
          
          console.log('Slick beforeChange:', current, '->', next);
          
          // Sync thumbnail carousel position
          if ($thumb.hasClass('slick-initialized') && $thumb.data('slick')) {
            try {
              $thumb.slick('slickGoTo', next, false);
              $thumb.find('.slick-slide').removeClass('slick-active').eq(next).addClass('slick-active');
            } catch (e) {
              console.warn('Error syncing thumbnail:', e);
            }
          }
        });
        
        // Also handle afterChange to ensure state is synced
        $main.off('afterChange').on('afterChange', function (e, slick, current) {
          console.log('Slick afterChange - current index:', current);
          setSelectedImageIndex(current);
        });
        
        // Initialize zoom on the active image after slider is ready
        setTimeout(() => {
          initializeZoom();
        }, 300);

        sliderInitializedRef.current = true;
        carouselLockedRef.current = true;
        setSliderReady(true);
      } catch (err) {
        console.error('Carousel init error:', err);
      }
    };

    // Wait for DOM - single attempt
    initTimerRef.current = setTimeout(() => {
      if (imageSliderRef.current?.querySelectorAll('figure').length > 0 &&
          thumbnailSliderRef.current?.querySelectorAll('div').length > 0) {
        init();
      } else {
        // One retry
        initTimerRef.current = setTimeout(init, 500);
      }
    }, 1000);

    return () => {
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current);
        initTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProduct?.id]);

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (!displayProduct) return;
    
    addToCart(displayProduct, quantity);
    setAddToCartSuccess(true);
    
    // Show success message
    setTimeout(() => {
      setAddToCartSuccess(false);
    }, 3000);
  };

  // Show loading state only if actually loading
  if (loading) {
    return (
      <div className="main-content-inner">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading product...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state if no productId or product not found
  if (!productId || !displayProduct) {
    return (
      <div className="main-content-inner">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center py-5">
              <h2>Product Not Found</h2>
              <p className="mt-3">The product you're looking for doesn't exist or has been removed.</p>
              <Link to="/shop" className="btn btn-primary mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get product images
  const productImages = getProductImages();

  // Format price
  const price = displayProduct.price || 0;
  const formattedPrice = `${Math.round(price)}`;

  return (
    <div className="main-content-inner">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/"><i className="fi-rs-home mr-5"></i>Home</Link>
            <span></span>
            {displayProduct.category ? (
              <Link to={`/shop?categoryId=${displayProduct.categoryId}`}>
                {displayProduct.category.categoryName || 'Shop'}
              </Link>
            ) : (
              <Link to="/shop">Shop</Link>
            )}
            <span></span> {displayProduct.productName}
          </div>
        </div>
      </div>

      <div className="container mb-30">
        <div className="row">
          <div className="col-xl-11 col-lg-12 m-auto">
            <div className="row">
              <div className="col-xl-9">
                <div className="product-detail accordion-detail">
                  <div className="row mb-50 mt-30">
                    {/* Product Images */}
                    <div className="col-md-6 col-sm-12 col-xs-12 mb-md-0 mb-sm-5" style={{ overflow: 'hidden', position: 'relative', maxWidth: '100%' }}>
                      <div className="detail-gallery" style={{ overflow: 'hidden', position: 'relative', maxWidth: '100%' }}>
                        <span className="zoom-icon">
                          <i className="fi-rs-search"></i>
                        </span>
                        {/* Main Image Display - Show selected image with zoom */}
                        <div 
                          className="product-image-slider" 
                          ref={imageSliderRef}
                          style={{ visibility: sliderReady ? 'visible' : 'hidden', overflow: 'hidden' }}
                        >
                          {productImages.map((imgObj, index) => {
                            // Normalize image object
                            const imgObjTyped = typeof imgObj === 'string' 
                              ? { hd: imgObj, thumbnail: imgObj, fallback: imgObj }
                              : imgObj;
                            
                            // Use HD video if available, otherwise use thumbnail
                            // For display, prefer HD first, then thumbnail
                            const img = imgObjTyped.hd || imgObjTyped.thumbnail || imgObjTyped.fallback;
                            const thumbnail = imgObjTyped.thumbnail || imgObjTyped.fallback || imgObjTyped.hd;
                            const isSelected = index === selectedImageIndex;
                            
                            // Ensure we have a valid image source
                            if (!img) {
                              console.warn(`No image source for index ${index}`, imgObjTyped);
                              return null;
                            }
                            
                            // React state controls display - simple and reliable
                            const displayStyle = {
                              display: isSelected ? 'block' : 'none',
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              margin: 0,
                              padding: 0
                            };
                            
                            return (
                              <figure 
                                key={`main-${index}`} 
                                className="border-radius-10"
                                style={{ 
                                  ...displayStyle,
                                  position: 'relative',
                                  width: '100%',
                                  height: '100%',
                                  margin: 0,
                                  padding: 0
                                }}
                              >
                                <div 
                                  className="zoom-image-container"
                                  style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                    borderRadius: '10px',
                                    clipPath: 'inset(0 round 10px)',
                                    contain: 'layout style paint'
                                  }}
                                onMouseLeave={(e) => {
                                  const imgElement = e.currentTarget.querySelector('img');
                                  if (imgElement) {
                                    imgElement.style.transform = 'scale(1)';
                                    imgElement.style.transformOrigin = 'center center';
                                  }
                                }}
                                >
                                  <VideoImage
                                    src={img}
                                    alt={displayProduct.productName}
                                    fallback={thumbnail || getUnsplashFallback(0)}
                                    className="product-main-image"
                                    style={{
                                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      cursor: 'zoom-in',
                                      transformOrigin: 'center center',
                                      willChange: 'transform',
                                      width: '100%',
                                      height: '100%',
                                      maxWidth: '100%',
                                      display: 'block',
                                      objectFit: 'contain',
                                      imageRendering: 'auto'
                                    }}
                                    onLoad={() => {
                                      // Re-initialize zoom when selected image loads
                                      if (isSelected && sliderReady) {
                                        setTimeout(() => {
                                          initializeZoom();
                                        }, 200);
                                      }
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      pointerEvents: 'auto',
                                      zIndex: 1,
                                      cursor: 'zoom-in'
                                    }}
                                    onMouseEnter={(e) => {
                                      const imgElement = e.currentTarget.parentElement.querySelector('img');
                                      if (imgElement) {
                                        imgElement.style.transform = 'scale(1.8)';
                                      }
                                    }}
                                    onMouseMove={(e) => {
                                      const imgElement = e.currentTarget.parentElement.querySelector('img');
                                      if (imgElement) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        imgElement.style.transformOrigin = `${x}% ${y}%`;
                                      }
                                    }}
                                  />
                                </div>
                              </figure>
                          );
                          })}
                        </div>
                        {/* Thumbnail Slider */}
                        {productImages.length > 1 && (() => {
                          const thumbnailImages = getThumbnailImages();
                          return (
                            <div 
                              className="slider-nav-thumbnails" 
                              ref={thumbnailSliderRef}
                              style={{ visibility: sliderReady ? 'visible' : 'hidden' }}
                            >
                              {thumbnailImages.map((img, index) => (
                                <div 
                                  key={`thumb-${index}`}
                                  onClick={() => handleThumbnailClick(index)}
                                  style={{ 
                                    cursor: 'pointer',
                                    opacity: index === selectedImageIndex ? 1 : 0.7,
                                    transition: 'all 0.3s'
                                  }}
                                >
                                  <VideoImage 
                                    src={img} 
                                    alt={`${displayProduct.productName} thumbnail ${index + 1}`}
                                    fallback={getUnsplashFallback(0)}
                                    style={{ 
                                      width: '60px', 
                                      height: '60px',
                                      minWidth: '60px',
                                      minHeight: '60px',
                                      maxWidth: '60px',
                                      maxHeight: '60px',
                                      display: 'block',
                                      objectFit: 'cover',
                                      overflow: 'hidden'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="col-md-6 col-sm-12 col-xs-12">
                      <div className="detail-info pr-30 pl-30">
                        {displayProduct.quantity > 0 ? (
                          <span className="stock-status in-stock">In Stock</span>
                        ) : (
                          <span className="stock-status out-stock">Out of Stock</span>
                        )}
                        
                        <h2 className="title-detail">{displayProduct.productName}</h2>
                        
                        <div className="product-detail-rating">
                          <div className="product-rate-cover text-end">
                            <div className="product-rate d-inline-block">
                              <div className="product-rating" style={{ width: '90%' }}></div>
                            </div>
                            <span className="font-small ml-5 text-muted">(32 reviews)</span>
                          </div>
                        </div>

                        <div className="clearfix product-price-cover">
                          <div className="product-price primary-color float-left">
                            <span className="current-price text-brand" style={{ fontSize: '1.8em' }}>{formattedPrice}</span>
                          </div>
                        </div>

                        <div className="short-desc mb-30">
                          <div className="font-lg" style={{ lineHeight: '1.6', color: '#555' }} dangerouslySetInnerHTML={{ __html: displayProduct.description }} />
                        </div>

                        {displayProduct.unit && (
                          <div className="attr-detail attr-size mb-30">
                            <strong className="mr-10">Size / Weight: </strong>
                            <ul className="list-filter size-filter font-small">
                              <li className="active">
                                <span>{displayProduct.unit}</span>
                              </li>
                            </ul>
                          </div>
                        )}

                        <div className="detail-extralink mb-50">
                          <div className="detail-qty border radius">
                            <button 
                              type="button"
                              className="qty-down"
                              onClick={() => handleQuantityChange(-1)}
                              aria-label="Decrease quantity"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                              <i className="fi-rs-angle-small-down"></i>
                            </button>
                            <input 
                              type="text" 
                              name="quantity" 
                              className="qty-val" 
                              value={quantity} 
                              min="1"
                              readOnly
                            />
                            <button 
                              type="button"
                              className="qty-up"
                              onClick={() => handleQuantityChange(1)}
                              aria-label="Increase quantity"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                              <i className="fi-rs-angle-small-up"></i>
                            </button>
                          </div>
                          <div className="product-extra-link2">
                            <button 
                              type="submit" 
                              className={`button button-add-to-cart ${addToCartSuccess ? 'success' : ''}`}
                              onClick={handleAddToCart}
                              disabled={displayProduct.quantity === 0 || addToCartSuccess}
                            >
                              <i className="fi-rs-shopping-cart"></i>
                              {addToCartSuccess ? 'Added to Cart!' : 'Add to cart'}
                            </button>
                            <button 
                              type="button"
                              aria-label="Add To Wishlist" 
                              className="action-btn hover-up"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToWishlist({
                                  id: displayProduct.id,
                                  name: displayProduct.productName,
                                  price: displayProduct.price,
                                  oldPrice: displayProduct.oldPrice,
                                  image: displayProduct.productPicture,
                                  rating: 90,
                                  category: displayProduct.category?.categoryName || 'Uncategorized'
                                });
                              }}
                              style={{
                                color: isInWishlist(displayProduct.id) ? '#ff0000' : '',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fi-rs-heart"></i>
                            </button>
                            <button 
                              type="button"
                              aria-label="Compare" 
                              className="action-btn hover-up"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCompare({
                                  id: displayProduct.id,
                                  name: displayProduct.productName,
                                  price: displayProduct.price,
                                  oldPrice: displayProduct.oldPrice,
                                  image: displayProduct.productPicture,
                                  rating: 90,
                                  category: displayProduct.category?.categoryName || 'Uncategorized'
                                });
                              }}
                              style={{
                                color: isInCompare(displayProduct.id) ? '#3BB77E' : '',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fi-rs-shuffle"></i>
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Product Details Section */}
                        <div className="font-xs" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                          <div className="row">
                            <div className="col-md-6">
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {displayProduct.category && (
                                  <li className="mb-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                    <strong style={{ color: '#333' }}>Category:</strong> 
                                    <br />
                                    <Link to={`/shop?categoryId=${displayProduct.categoryId}`} className="text-brand">
                                      {displayProduct.category.categoryName}
                                    </Link>
                                  </li>
                                )}
                                {displayProduct.sku && (
                                  <li className="mb-10 mt-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                    <strong style={{ color: '#333' }}>SKU:</strong> 
                                    <br />
                                    <code style={{ backgroundColor: '#fff', padding: '3px 6px', borderRadius: '3px' }}>{displayProduct.sku}</code>
                                  </li>
                                )}
                                {displayProduct.barcode && (
                                  <li className="mb-10 mt-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                    <strong style={{ color: '#333' }}>Barcode:</strong> 
                                    <br />
                                    <code style={{ backgroundColor: '#fff', fontSize: '0.85em' }}>{displayProduct.barcode}</code>
                                  </li>
                                )}
                              </ul>
                            </div>
                            <div className="col-md-6">
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {displayProduct.manufacturedDate && (
                                  <li className="mb-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                    <strong style={{ color: '#333' }}>MFG Date:</strong> 
                                    <br />
                                    <span className="text-brand">
                                      {new Date(displayProduct.manufacturedDate).toLocaleDateString()}
                                    </span>
                                  </li>
                                )}
                                {displayProduct.expiryDate && (
                                  <li className="mb-10 mt-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                    <strong style={{ color: '#333' }}>Expiry:</strong> 
                                    <br />
                                    <span className="text-brand">
                                      {new Date(displayProduct.expiryDate).toLocaleDateString()} 
                                      <small style={{ display: 'block', color: '#27ae60' }}>
                                        ({Math.ceil((new Date(displayProduct.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days left)
                                      </small>
                                    </span>
                                  </li>
                                )}
                                <li className="mb-10 mt-10" style={{ paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                                  <strong style={{ color: '#333' }}>Stock:</strong> 
                                  <br />
                                  <span className={`${displayProduct.quantity > 0 ? 'in-stock' : 'out-stock'} text-brand ml-5`}>
                                    <strong>{displayProduct.quantity || 0}</strong> {displayProduct.unit || 'items'}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Info Tabs */}
                  <div className="product-info">
                    <div className="tab-style3">
                      <ul className="nav nav-tabs text-uppercase">
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'Description' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab('Description');
                            }}
                            href="#Description"
                          >
                            Description
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'Additional-info' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab('Additional-info');
                            }}
                            href="#Additional-info"
                          >
                            Additional info
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'Vendor-info' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab('Vendor-info');
                            }}
                            href="#Vendor-info"
                          >
                            Vendor
                          </a>
                        </li>
                        <li className="nav-item">
                          <a 
                            className={`nav-link ${activeTab === 'Reviews' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab('Reviews');
                            }}
                            href="#Reviews"
                          >
                            Reviews (3)
                          </a>
                        </li>
                      </ul>
                      <div className="tab-content shop_info_tab entry-main-content">
                        {/* Description Tab */}
                        <div className={`tab-pane fade ${activeTab === 'Description' ? 'show active' : ''}`} id="Description">
                          <div>
                            <h5 className="mb-20">Product Overview</h5>
                            <div style={{ lineHeight: '1.8', color: '#666' }} dangerouslySetInnerHTML={{ __html: displayProduct.description }} />

                            <div className="mt-30">
                              <h5 className="mb-20">Key Features & Specifications</h5>
                              <ul className="product-more-infor" style={{ listStyle: 'none', padding: 0 }}>
                                {displayProduct.unit && (
                                  <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Unit/Packaging:</span> 
                                    <span style={{ color: '#666' }}>{displayProduct.unit}</span>
                                  </li>
                                )}
                                {displayProduct.barcode && (
                                  <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Barcode:</span> 
                                    <code style={{ backgroundColor: '#f5f5f5', padding: '3px 6px', borderRadius: '3px', fontSize: '0.9em' }}>{displayProduct.barcode}</code>
                                  </li>
                                )}
                                {displayProduct.sku && (
                                  <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>SKU:</span> 
                                    <span style={{ color: '#666' }}>{displayProduct.sku}</span>
                                  </li>
                                )}
                                {displayProduct.quantity !== undefined && (
                                  <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Available Quantity:</span> 
                                    <span style={{ color: '#666', fontWeight: 'bold' }}>{displayProduct.quantity} units</span>
                                  </li>
                                )}
                                {displayProduct.price && (
                                  <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Price:</span> 
                                    <span style={{ color: '#3BB77E', fontWeight: 'bold', fontSize: '1.1em' }}>{formattedPrice}</span>
                                  </li>
                                )}
                              </ul>
                            </div>

                            {displayProduct.manufacturedDate || displayProduct.expiryDate ? (
                              <div className="mt-30">
                                <h5 className="mb-20">Product Timeline</h5>
                                <ul className="product-more-infor" style={{ listStyle: 'none', padding: 0 }}>
                                  {displayProduct.manufacturedDate && (
                                    <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                      <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Manufactured:</span> 
                                      <span style={{ color: '#666' }}>
                                        {new Date(displayProduct.manufacturedDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                    </li>
                                  )}
                                  {displayProduct.expiryDate && (
                                    <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                      <span style={{ fontWeight: 'bold', color: '#222', minWidth: '120px', display: 'inline-block' }}>Expires:</span> 
                                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                                        {new Date(displayProduct.expiryDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </span>
                                      <span style={{ marginLeft: '10px', color: '#27ae60', fontSize: '0.9em' }}>
                                        ({Math.ceil((new Date(displayProduct.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                                      </span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            ) : null}

                            {displayProduct.category && (
                              <div className="mt-30">
                                <h5 className="mb-20">Category Information</h5>
                                <p style={{ color: '#666' }}>
                                  <strong>Category:</strong>{' '}
                                  <Link to={`/shop?categoryId=${displayProduct.categoryId}`} className="text-brand">
                                    {displayProduct.category.categoryName}
                                  </Link>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Info Tab */}
                        <div className={`tab-pane fade ${activeTab === 'Additional-info' ? 'show active' : ''}`} id="Additional-info">
                          <div className="row">
                            <div className="col-md-6">
                              <h5 className="mb-20">Product Information</h5>
                              <table className="font-md" style={{ width: '100%' }}>
                                <tbody>
                                  {displayProduct.productName && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Product Name</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{displayProduct.productName}</td>
                                    </tr>
                                  )}
                                  {displayProduct.sku && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>SKU</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <span className="text-brand font-weight-bold">{displayProduct.sku}</span>
                                      </td>
                                    </tr>
                                  )}
                                  {displayProduct.barcode && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Barcode</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <code style={{ backgroundColor: '#f5f5f5', padding: '5px 8px', borderRadius: '3px' }}>{displayProduct.barcode}</code>
                                      </td>
                                    </tr>
                                  )}
                                  {displayProduct.unit && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Unit</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{displayProduct.unit}</td>
                                    </tr>
                                  )}
                                  {displayProduct.price && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Price</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <span className="text-brand font-weight-bold h5">{formattedPrice}</span>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <div className="col-md-6">
                              <h5 className="mb-20">Stock & Availability</h5>
                              <table className="font-md" style={{ width: '100%' }}>
                                <tbody>
                                  {displayProduct.quantity !== undefined && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Quantity Available</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <strong>{displayProduct.quantity}</strong> {displayProduct.unit || 'units'}
                                      </td>
                                    </tr>
                                  )}
                                  <tr>
                                    <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Stock Status</th>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                      <span className={`badge ${displayProduct.quantity > 0 ? 'badge-success' : 'badge-danger'}`} style={{ 
                                        padding: '6px 12px', 
                                        borderRadius: '20px',
                                        backgroundColor: displayProduct.quantity > 0 ? '#28a745' : '#dc3545',
                                        color: '#fff'
                                      }}>
                                        {displayProduct.quantity > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                                      </span>
                                    </td>
                                  </tr>
                                  {displayProduct.category && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Category</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <Link to={`/shop?categoryId=${displayProduct.categoryId}`} className="text-brand">
                                          {displayProduct.category.categoryName}
                                        </Link>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Additional Dates and Details */}
                          <div className="row mt-40">
                            <div className="col-12">
                              <h5 className="mb-20">Additional Details</h5>
                              <table className="font-md" style={{ width: '100%' }}>
                                <tbody>
                                  {displayProduct.manufacturedDate && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Manufactured Date</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        {new Date(displayProduct.manufacturedDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}
                                      </td>
                                    </tr>
                                  )}
                                  {displayProduct.expiryDate && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Expiry Date</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <strong>{new Date(displayProduct.expiryDate).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric' 
                                        })}</strong>
                                        <span className="ms-2" style={{ fontSize: '0.85em', color: '#666' }}>
                                          ({Math.ceil((new Date(displayProduct.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                                        </span>
                                      </td>
                                    </tr>
                                  )}
                                  {displayProduct.isActive !== undefined && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Status</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <span className={`badge ${displayProduct.isActive ? 'badge-info' : 'badge-secondary'}`} style={{ 
                                          padding: '6px 12px', 
                                          borderRadius: '20px',
                                          backgroundColor: displayProduct.isActive ? '#17a2b8' : '#6c757d',
                                          color: '#fff'
                                        }}>
                                          {displayProduct.isActive ? '◉ Active' : '◯ Inactive'}
                                        </span>
                                      </td>
                                    </tr>
                                  )}
                                  {displayProduct.productSlug && (
                                    <tr>
                                      <th style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Product Slug</th>
                                      <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                        <code style={{ backgroundColor: '#f5f5f5', padding: '5px 8px', borderRadius: '3px' }}>{displayProduct.productSlug}</code>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Vendor Info Tab */}
                        <div className={`tab-pane fade ${activeTab === 'Vendor-info' ? 'show active' : ''}`} id="Vendor-info">
                          <div className="vendor-logo d-flex mb-30">
                            <div className="vendor-name ml-15">
                              <h6>
                                <a href="/vendors-grid">Corio Fashion</a>
                              </h6>
                              <div className="product-rate-cover text-end">
                                <div className="product-rate d-inline-block">
                                  <div className="product-rating" style={{ width: '90%' }}></div>
                                </div>
                                <span className="font-small ml-5 text-muted">(32 reviews)</span>
                              </div>
                            </div>
                          </div>
                          <p>
                            Corio Fashion is your trusted online fashion marketplace for quality clothing and accessories. We offer a wide range of fashion products with excellent customer service and fast delivery.
                          </p>
                        </div>

                        {/* Reviews Tab */}
                        <div className={`tab-pane fade ${activeTab === 'Reviews' ? 'show active' : ''}`} id="Reviews">
                          <div className="comments-area">
                            <div className="row">
                              <div className="col-lg-8">
                                <h4 className="mb-30">Customer questions & answers</h4>
                                <div className="comment-list">
                                  <div className="single-comment justify-content-between d-flex mb-30">
                                    <div className="user justify-content-between d-flex">
                                      <div className="thumb text-center">
                                        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100&h=100&fit=crop" alt="" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop'; }} />
                                        <span className="font-heading text-brand">Sienna</span>
                                      </div>
                                      <div className="desc">
                                        <div className="d-flex justify-content-between mb-10">
                                          <div className="d-flex align-items-center">
                                            <span className="font-xs text-muted">December 4, 2025 at 3:12 pm</span>
                                          </div>
                                          <div className="product-rate d-inline-block">
                                            <div className="product-rating" style={{ width: '100%' }}></div>
                                          </div>
                                        </div>
                                        <p className="mb-10">
                                          Great product! Very satisfied with the quality and delivery.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-lg-4">
                                <h4 className="mb-30">Customer reviews</h4>
                                <div className="d-flex mb-30">
                                  <div className="product-rate d-inline-block mr-15">
                                    <div className="product-rating" style={{ width: '90%' }}></div>
                                  </div>
                                  <h6>4.8 out of 5</h6>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Products */}
                  {relatedProducts.length > 0 && (
                    <div className="row mt-60">
                      <div className="col-12">
                        <h2 className="section-title style-1 mb-30">Related products</h2>
                      </div>
                      <div className="col-12">
                        <div className="row related-products">
                          {relatedProducts.map((relatedProduct) => {
                            const relatedImage = getImageUrl(relatedProduct.imagePath) || getClothingImage(relatedProduct.imagePath, 0);
                            const relatedPrice = relatedProduct.price ? `${Math.round(relatedProduct.price)}` : '0';
                            
                            return (
                              <div key={relatedProduct.id} className="col-lg-3 col-md-4 col-12 col-sm-6">
                                <div className="product-cart-wrap hover-up">
                                  <div className="product-img-action-wrap">
                                    <div className="product-img product-img-zoom">
                                      <Link to={`/shop-product-right?id=${relatedProduct.id}`}>
                                        <VideoImage 
                                          className="default-img" 
                                          src={relatedImage} 
                                          alt={relatedProduct.productName}
                                          fallback={getUnsplashFallback(1)}
                                          style={{ width: '100%', height: 'auto', display: 'block' }}
                                        />
                                      </Link>
                                    </div>
                                    <div className="product-action-1">
                                      <Link 
                                        to={`/shop-product-right?id=${relatedProduct.id}`}
                                        aria-label="Quick view" 
                                        className="action-btn small hover-up"
                                      >
                                        <i className="fi-rs-search"></i>
                                      </Link>
                                      <button
                                        type="button"
                                        aria-label="Add To Wishlist" 
                                        className="action-btn small hover-up"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          addToWishlist({
                                            id: relatedProduct.id,
                                            name: relatedProduct.productName,
                                            price: relatedProduct.price,
                                            oldPrice: relatedProduct.oldPrice,
                                            image: relatedProduct.productPicture,
                                            rating: 90,
                                            category: relatedProduct.category?.categoryName || 'Uncategorized'
                                          });
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          cursor: 'pointer',
                                          color: isInWishlist(relatedProduct.id) ? '#ff0000' : ''
                                        }}
                                      >
                                        <i className="fi-rs-heart"></i>
                                      </button>
                                      <button
                                        type="button"
                                        aria-label="Compare" 
                                        className="action-btn small hover-up"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          addToCompare({
                                            id: relatedProduct.id,
                                            name: relatedProduct.productName,
                                            price: relatedProduct.price,
                                            oldPrice: relatedProduct.oldPrice,
                                            image: relatedProduct.productPicture,
                                            rating: 90,
                                            category: relatedProduct.category?.categoryName || 'Uncategorized'
                                          });
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          cursor: 'pointer',
                                          color: isInCompare(relatedProduct.id) ? '#3BB77E' : ''
                                        }}
                                      >
                                        <i className="fi-rs-shuffle"></i>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="product-content-wrap">
                                    <h2>
                                      <Link to={`/shop-product-right?id=${relatedProduct.id}`}>
                                        {relatedProduct.productName}
                                      </Link>
                                    </h2>
                                    <div className="rating-result" title="90%">
                                      <span></span>
                                    </div>
                                    <div className="product-price">
                                      <span>{relatedPrice}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-xl-3 primary-sidebar sticky-sidebar mt-30">
                <div className="sidebar-widget widget-category-2 mb-30">
                  <h5 className="section-title style-1 mb-30">Category</h5>
                  <ul>
                    {categories.length > 0 ? (
                      categories.map((category) => {
                        const count = getCategoryProductCount(category.id);
                        return (
                          <li key={category.id}>
                            <Link to={`/shop?categoryId=${category.id}`}>
                              <img src="/assets/imgs/theme/icons/category-1.svg" alt="" />
                              {category.categoryName}
                            </Link>
                            <span className="count">{count}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <span className="text-muted">No categories available</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* New Products Widget */}
                <div className="sidebar-widget product-sidebar mb-30 p-30 bg-grey border-radius-10">
                  <h5 className="section-title style-1 mb-30">New products</h5>
                  {relatedProducts.slice(0, 3).map((newProduct) => {
                    const newImage = getImageUrl(newProduct.imagePath) || getClothingImage(newProduct.imagePath, 0);
                    const newPrice = newProduct.price ? `${Math.round(newProduct.price)}` : '0';
                    
                    return (
                      <div key={newProduct.id} className="single-post clearfix">
                        <div className="image">
                          <VideoImage 
                            src={newImage} 
                            alt={newProduct.productName}
                            fallback={getUnsplashFallback(2)}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </div>
                        <div className="content pt-10">
                          <h6>
                            <Link to={`/shop-product-right?id=${newProduct.id}`}>
                              {newProduct.productName}
                            </Link>
                          </h6>
                          <p className="price mb-0 mt-5">{newPrice}</p>
                          <div className="product-rate">
                            <div className="product-rating" style={{ width: '90%' }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProductRight;
