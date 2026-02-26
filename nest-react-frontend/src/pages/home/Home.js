import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategoriesHierarchical } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useQuickView } from '../../context/QuickViewContext';
import { getImageUrl, getUnsplashFallback } from '../../utils/imageUtils';
import NoProductsFound from '../../components/common/NoProductsFound';

const Home = () => {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const { showQuickView } = useQuickView();
  const heroSliderRef = useRef(null);
  const carausel4ColumnsRef = useRef(null);
  const initializedRefs = useRef({
    heroSlider: false,
    carausel4Columns: false
  });
  
  const [products, setProducts] = useState([]);
  const [popularTabs, setPopularTabs] = useState([]);
  const [activePopularTab, setActivePopularTab] = useState('all');
  const [activeDailyTab, setActiveDailyTab] = useState('featured');
  const [dailyTabLoading, setDailyTabLoading] = useState(false);
  const [menCategoryId, setMenCategoryId] = useState(null);
  const [womenCategoryId, setWomenCategoryId] = useState(null);
  const [kidsCategoryId, setKidsCategoryId] = useState(null);

  // Clean up zoom elements when component mounts
  useEffect(() => {
    if (window.jQuery) {
      // Remove all zoom-related DOM elements
      window.jQuery('.zoomWindowContainer, .zoomContainer, .zoomWindow, .zoomLens').remove();
      
      // Clean up all images with zoom data
      window.jQuery('img').each(function() {
        const $img = window.jQuery(this);
        if ($img.data('elevateZoom')) {
          $img.removeData('elevateZoom');
          $img.removeData('zoomImage');
          $img.removeAttr('data-zoom-image');
        }
        // Remove any zoom-related inline styles
        $img.css('cursor', '');
      });
    }
  }, []);

  useEffect(() => {
    // Prevent global main.js from initializing carousels
    if (window.jQuery && window.jQuery.fn.slick) {
      // Mark that we're handling carousel initialization
      window.reactCarouselInit = true;
    }

    // Initialize all carousels properly
    const initCarousels = () => {
      if (!window.jQuery || !window.jQuery.fn.slick) {
        return;
      }

      // Initialize hero slider
      const initHeroSlider = () => {
        const $heroSlider = window.jQuery('.hero-slider-1');
        if ($heroSlider.length) {
          try {
            // Destroy if already initialized
            if ($heroSlider.hasClass('slick-initialized')) {
              try {
                $heroSlider.slick('unslick');
              } catch (e) {
                // Ignore unslick errors
              }
            }
            
            // Check if arrow container exists
            const $arrowContainer = window.jQuery('.hero-slider-1-arrow');
            const hasArrowContainer = $arrowContainer.length > 0;
            
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              try {
                // Verify element still exists
                if (!window.jQuery('.hero-slider-1').length) {
                  return;
                }
                
                const $slider = window.jQuery('.hero-slider-1');
                
                // Check again if already initialized (race condition)
                if ($slider.hasClass('slick-initialized')) {
                  return;
                }
                
                const slickConfig = {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  fade: true,
                  loop: true,
                  dots: true,
                  arrows: true,
                  prevArrow: '<span class="slider-btn slider-prev"><i class="fi-rs-arrow-small-left"></i></span>',
                  nextArrow: '<span class="slider-btn slider-next"><i class="fi-rs-arrow-small-right"></i></span>',
                  autoplay: true,
                  accessibility: false,
                  adaptiveHeight: false
                };
                
                // Only add appendArrows if container exists
                if (hasArrowContainer && window.jQuery('.hero-slider-1-arrow').length > 0) {
                  slickConfig.appendArrows = '.hero-slider-1-arrow';
                } else {
                  slickConfig.appendArrows = $slider;
                }
                
                $slider.slick(slickConfig);
                initializedRefs.current.heroSlider = true;
              } catch (innerError) {
                // Silently ignore initialization errors
              }
            }, 150);
          } catch (error) {
            // Silently ignore initialization errors
          }
        }
      };

      // Initialize carausel-4-columns
      const initCarausel4Columns = () => {
        const carausels = ['carausel-4-columns', 'carausel-4-columns-2', 'carausel-4-columns-3'];
        carausels.forEach((id, index) => {
          const $carausel = window.jQuery(`#${id}`);
          if ($carausel.length) {
            try {
              // Destroy if already initialized
              if ($carausel.hasClass('slick-initialized')) {
                try {
                  $carausel.slick('unslick');
                } catch (e) {
                  // Ignore unslick errors
                }
              }
              
              const arrowsId = index === 0 ? 'carausel-4-columns-arrows' : 
                              index === 1 ? 'carausel-4-columns-arrows-2' : 
                              'carausel-4-columns-arrows-3';
              
              // Check if arrow container exists
              const $arrowContainer = window.jQuery(`#${arrowsId}`);
              const hasArrowContainer = $arrowContainer.length > 0;
              
              // Small delay to ensure DOM is ready
              setTimeout(() => {
                try {
                  // Verify element still exists
                  if (!window.jQuery(`#${id}`).length) {
                    return;
                  }
                  
                  const $carousel = window.jQuery(`#${id}`);
                  
                  // Check again if already initialized (race condition)
                  if ($carousel.hasClass('slick-initialized')) {
                    return;
                  }
                  
                  const slickConfig = {
                    dots: false,
                    infinite: true,
                    speed: 1000,
                    arrows: true,
                    autoplay: true,
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    loop: true,
                    adaptiveHeight: true,
                    accessibility: false,
                    responsive: [
                      {
                        breakpoint: 1025,
                        settings: {
                          slidesToShow: 3,
                          slidesToScroll: 3
                        }
                      },
                      {
                        breakpoint: 768,
                        settings: {
                          slidesToShow: 2,
                          slidesToScroll: 2
                        }
                      },
                      {
                        breakpoint: 480,
                        settings: {
                          slidesToShow: 1,
                          slidesToScroll: 1
                        }
                      }
                    ],
                    prevArrow: '<span class="slider-btn slider-prev"><i class="fi-rs-arrow-small-left"></i></span>',
                    nextArrow: '<span class="slider-btn slider-next"><i class="fi-rs-arrow-small-right"></i></span>'
                  };
                  
                  // Only add appendArrows if container exists
                  if (hasArrowContainer && window.jQuery(`#${arrowsId}`).length > 0) {
                    slickConfig.appendArrows = `#${arrowsId}`;
                  } else {
                    slickConfig.appendArrows = $carousel;
                  }
                  
                  $carousel.slick(slickConfig);
                } catch (innerError) {
                  // Silently ignore initialization errors
                }
              }, 150);
            } catch (error) {
              // Silently ignore initialization errors
            }
          }
        });
        initializedRefs.current.carausel4Columns = true;
      };


      // Destroy existing instances first
      const destroyCarousels = () => {
        if (window.jQuery) {
          try {
            // Destroy hero slider
            const $heroSlider = window.jQuery('.hero-slider-1');
            if ($heroSlider.length && $heroSlider.hasClass('slick-initialized')) {
              try {
                $heroSlider.slick('unslick');
              } catch (e) {
                // Ignore if already destroyed
              }
            }

            // Destroy carausel-4-columns
            ['carausel-4-columns', 'carausel-4-columns-2', 'carausel-4-columns-3'].forEach(id => {
              try {
                const $carausel = window.jQuery(`#${id}`);
                if ($carausel.length && $carausel.hasClass('slick-initialized')) {
                  $carausel.slick('unslick');
                }
              } catch (e) {
                // Ignore if already destroyed
              }
            });
          } catch (error) {
            // Ignore destroy errors
          }
        }
      };

      // Destroy first, then initialize
      destroyCarousels();
      
      // Wait a bit for DOM to stabilize
      setTimeout(() => {
        initHeroSlider();
        initCarausel4Columns();
      }, 300);
    };

    // Try to initialize carousels
    let attempts = 0;
    const maxAttempts = 20;
    
    const tryInit = () => {
      attempts++;
      if (window.jQuery && window.jQuery.fn.slick) {
        initCarousels();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 200);
      }
    };

    const timeoutId = setTimeout(tryInit, 500);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (window.jQuery) {
        try {
          // Destroy all carousels on unmount - with defensive checks
          const $heroSlider = window.jQuery('.hero-slider-1');
          if ($heroSlider.length && $heroSlider.hasClass('slick-initialized')) {
            try {
              $heroSlider.slick('unslick');
            } catch (e) {
              // Silently ignore if already destroyed
            }
          }

          ['carausel-4-columns', 'carausel-4-columns-2', 'carausel-4-columns-3'].forEach(id => {
            try {
              const $carausel = window.jQuery(`#${id}`);
              if ($carausel.length && $carausel.hasClass('slick-initialized')) {
                $carausel.slick('unslick');
              }
            } catch (e) {
              // Silently ignore if already destroyed
            }
          });

        } catch (error) {
          // Silently ignore cleanup errors
        }
      }
      // Reset initialization flags
      initializedRefs.current = {
        heroSlider: false,
        carausel4Columns: false
      };
    };
  }, []);

  // Handle tab changes for Daily Best Sells carousel
  useEffect(() => {
    if (!window.jQuery || !window.jQuery.fn.slick) return;

    // Show loading state
    setDailyTabLoading(true);

    // Wait for DOM to update after tab change
    const timer = setTimeout(() => {
      const carouselId = activeDailyTab === 'featured' ? 'carausel-4-columns' :
                         activeDailyTab === 'popular' ? 'carausel-4-columns-2' :
                         'carausel-4-columns-3';
      
      const $carousel = window.jQuery(`#${carouselId}`);
      
      // Destroy and reinitialize the active carousel
      if ($carousel.length) {
        try {
          // Destroy if already initialized
          if ($carousel.hasClass('slick-initialized')) {
            $carousel.slick('unslick');
          }
          
          // Reinitialize
          const arrowsId = activeDailyTab === 'featured' ? 'carausel-4-columns-arrows' :
                          activeDailyTab === 'popular' ? 'carausel-4-columns-arrows-2' :
                          'carausel-4-columns-arrows-3';
          
          const slickConfig = {
            dots: false,
            infinite: true,
            speed: 1000,
            arrows: true,
            autoplay: true,
            slidesToShow: 4,
            slidesToScroll: 1,
            loop: true,
            adaptiveHeight: true,
            responsive: [
              {
                breakpoint: 1025,
                settings: {
                  slidesToShow: 3,
                  slidesToScroll: 3
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 2
                }
              },
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1
                }
              }
            ],
            prevArrow: '<span class="slider-btn slider-prev"><i class="fi-rs-arrow-small-left"></i></span>',
            nextArrow: '<span class="slider-btn slider-next"><i class="fi-rs-arrow-small-right"></i></span>',
            appendArrows: `#${arrowsId}`
          };
          
          $carousel.slick(slickConfig);
          
          // Hide loading after carousel is initialized
          setTimeout(() => {
            setDailyTabLoading(false);
          }, 100);
        } catch (error) {
          console.warn('Error reinitializing carousel:', error);
          setDailyTabLoading(false);
        }
      } else {
        setDailyTabLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeDailyTab]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Only fetch first 20 products for better performance
        const apiProducts = await getProducts();
        const limitedProducts = apiProducts.slice(0, 20);
        
        let mappedProducts = [];
        
        if (limitedProducts && limitedProducts.length > 0) {
          // Map API products to component format and preserve category id for filtering
          mappedProducts = limitedProducts.map((product, index) => {
            // Parse imagePaths to get multiple images
            let images = [];
            try {
              if (product.imagePaths) {
                images = typeof product.imagePaths === 'string' 
                  ? JSON.parse(product.imagePaths) 
                  : product.imagePaths;
              }
            } catch (e) {
              console.warn('Failed to parse imagePaths:', e);
              images = [];
            }

            // Use first image as default, second as hover (or fall back to first)
            const defaultImage = getImageUrl(images[0] || product.imagePath) || '/assets/imgs/shop/product-1-1.jpg';
            const hoverImage = getImageUrl(images[1] || images[0] || product.imagePath) || '/assets/imgs/shop/product-1-2.jpg';

            return {
              id: product.id,
              name: product.productName || product.name || 'Product',
              productName: product.productName || product.name || 'Product',
              category: product.childCategory?.childCategoryName || product.category?.categoryName || 'Uncategorized',
              categoryId: product.category?.id || product.category?.categoryId || null,
              price: Math.round(product.price || 0),
              oldPrice: null,
              image: defaultImage,
              hoverImage: hoverImage,
              imagePath: images[0] || product.imagePath, // First image path for compare
              imagePaths: product.imagePaths, // Full image paths array for compare
              description: product.description, // Product description for compare
              rating: 90,
              badge: index < 3 ? { type: index === 0 ? 'hot' : index === 1 ? 'sale' : 'new', text: index === 0 ? 'Hot' : index === 1 ? 'Sale' : 'New' } : null,
              vendor: product.brand?.brandName || 'NestFood',
              brand: product.brand, // Brand object for compare
              sku: product.sku, // SKU for compare
              stock: product.stock // Stock for compare
            };
          });
        }
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  // Re-initialize carousel when products are loaded
  useEffect(() => {
    if (products.length > 0 && window.jQuery && window.jQuery.fn.slick) {
      // Wait a bit for DOM to update with new products
      const timeoutId = setTimeout(() => {
        const initCarausel4Columns = () => {
          const carausels = ['carausel-4-columns', 'carausel-4-columns-2', 'carausel-4-columns-3'];
          carausels.forEach((id, index) => {
            const $carausel = window.jQuery(`#${id}`);
            if ($carausel.length) {
              try {
                // Destroy if already initialized
                if ($carausel.hasClass('slick-initialized')) {
                  try {
                    $carausel.slick('unslick');
                  } catch (e) {
                    // Ignore unslick errors
                  }
                }
                
                const arrowsId = index === 0 ? 'carausel-4-columns-arrows' : 
                                index === 1 ? 'carausel-4-columns-arrows-2' : 
                                'carausel-4-columns-arrows-3';
                
                // Check if arrow container exists
                const $arrowContainer = window.jQuery(`#${arrowsId}`);
                const hasArrowContainer = $arrowContainer.length > 0;
                
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                  try {
                    // Verify element still exists
                    if (!window.jQuery(`#${id}`).length) {
                      return;
                    }
                    
                    const $carousel = window.jQuery(`#${id}`);
                    
                    // Check again if already initialized (race condition)
                    if ($carousel.hasClass('slick-initialized')) {
                      return;
                    }
                    
                    const slickConfig = {
                      dots: false,
                      infinite: true,
                      speed: 1000,
                      arrows: true,
                      autoplay: true,
                      slidesToShow: 4,
                      slidesToScroll: 1,
                      loop: true,
                      adaptiveHeight: true,
                      accessibility: false,
                      responsive: [
                        {
                          breakpoint: 1025,
                          settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3
                          }
                        },
                        {
                          breakpoint: 768,
                          settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2
                          }
                        },
                        {
                          breakpoint: 480,
                          settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                          }
                        }
                      ],
                      prevArrow: '<span class="slider-btn slider-prev"><i class="fi-rs-arrow-small-left"></i></span>',
                      nextArrow: '<span class="slider-btn slider-next"><i class="fi-rs-arrow-small-right"></i></span>'
                    };
                    
                    // Only add appendArrows if container exists
                    if (hasArrowContainer && window.jQuery(`#${arrowsId}`).length > 0) {
                      slickConfig.appendArrows = `#${arrowsId}`;
                    } else {
                      slickConfig.appendArrows = $carousel;
                    }
                    
                    $carousel.slick(slickConfig);
                  } catch (innerError) {
                    // Silently ignore initialization errors
                  }
                }, 150);
              } catch (error) {
                // Silently ignore initialization errors
              }
            }
          });
        };
        
        initCarausel4Columns();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [products]);

  // Fetch categories to build dynamic popular tabs
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategoriesHierarchical();
        if (cats && cats.length > 0) {
          // Use top-level active categories as tabs (limit to 6)
          const tabs = cats.filter(c => c.isActive).slice(0, 6).map(c => ({ id: c.id, name: c.categoryName || c.name || c.slug || 'Category' }));
          setPopularTabs(tabs);
          
          // Find Men category for banner links
          const menCategory = cats.find(c => 
            (c.categoryName || c.name || '').toLowerCase().includes('men') ||
            (c.slug || '').toLowerCase().includes('men')
          );
          if (menCategory) {
            setMenCategoryId(menCategory.id);
          }
          
          // Find Women category for banner links
          const womenCategory = cats.find(c => 
            (c.categoryName || c.name || '').toLowerCase().includes('women') ||
            (c.slug || '').toLowerCase().includes('women')
          );
          if (womenCategory) {
            setWomenCategoryId(womenCategory.id);
          }
          
          // Find Kids category for banner links
          const kidsCategory = cats.find(c => 
            (c.categoryName || c.name || '').toLowerCase().includes('kid') ||
            (c.slug || '').toLowerCase().includes('kid') ||
            (c.categoryName || c.name || '').toLowerCase().includes('child')
          );
          if (kidsCategory) {
            setKidsCategoryId(kidsCategory.id);
          }
        }
      } catch (err) {
        console.error('Error fetching categories for popular tabs:', err);
        setPopularTabs([]);
      }
    };

    fetchCategories();
  }, []);


  return (
    <main className="main">
      {/* Hero Slider Section - Style 2 */}
      <section className="home-slider style-2 position-relative mb-50">
        <div className="container">
          <div className="row">
            <div className="col-xl-8 col-lg-12">
              <div className="home-slide-cover">
                <div className="hero-slider-1 style-4 dot-style-1 dot-style-1-position-1" ref={heroSliderRef} key="hero-slider">
                  <div className="single-hero-slider single-animation-wrap" style={{ backgroundImage: 'url(assets/imgs/slider/slider-3.png)' }}>
                    <div className="slider-content">
                      <h1 className="display-2 mb-40">
                        Pure Coffe<br />
                        Big discount
                      </h1>
                      <p className="mb-65">Save up to 50% off on your first order</p>
                      <Link to="/shop" className="btn btn-lg">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                    </div>
                  </div>
                  <div className="single-hero-slider single-animation-wrap" style={{ backgroundImage: 'url(assets/imgs/slider/slider-4.png)' }}>
                    <div className="slider-content">
                      <h1 className="display-2 mb-40">
                        Snacks box<br />
                        daily save
                      </h1>
                      <p className="mb-65">Sign up for the daily newsletter</p>
                      <Link to="/shop" className="btn btn-lg">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                    </div>
                  </div>
                </div>
                <div className="slider-arrow hero-slider-1-arrow"></div>
              </div>
            </div>
            <div className="col-lg-4 d-none d-xl-block">
              <div className="banner-img style-3 animated animated">
                <div className="banner-text mt-50">
                  <h2 className="mb-50">
                    Delivered <br />
                    to
                    <span className="text-brand">your<br />
                      home</span>
                  </h2>
                  <Link to="/shop" className="btn btn-xs">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*End hero slider*/}

      {/* Banners Section */}
     
      {/*End banners*/}
 <section className="banners mb-25">
            <div className="container">
                <div className="row">
                    <div className="col-lg-4 col-md-6">
                        <div className="banner-img wow animate__animated animate__fadeInUp" data-wow-delay="0">
                            <img src="assets/imgs/banner/banner-1.png" alt="" />
                            <div className="banner-text">
                                <Link to={menCategoryId ? `/shop?categoryId=${menCategoryId}` : '/shop'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h4 style={{ cursor: 'pointer' }}>
                                        Everyday Fresh & <br />Clean with Our<br />
                                        Products
                                    </h4>
                                </Link>
                                <Link to={menCategoryId ? `/shop?categoryId=${menCategoryId}` : '/shop'} className="btn btn-xs">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="banner-img wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                            <img src="assets/imgs/banner/banner-2.png" alt="" />
                            <div className="banner-text">
                                <Link to={womenCategoryId ? `/shop?categoryId=${womenCategoryId}` : '/shop'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h4 style={{ cursor: 'pointer' }}>
                                        Make your Breakfast<br />
                                        Healthy and Easy
                                    </h4>
                                </Link>
                                <Link to={womenCategoryId ? `/shop?categoryId=${womenCategoryId}` : '/shop'} className="btn btn-xs">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 d-md-none d-lg-flex">
                        <div className="banner-img mb-sm-0 wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                            <img src="assets/imgs/banner/banner-3.png" alt="" />
                            <div className="banner-text">
                                <Link to={kidsCategoryId ? `/shop?categoryId=${kidsCategoryId}` : '/shop'} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h4 style={{ cursor: 'pointer' }}>The best Organic <br />Products Online</h4>
                                </Link>
                                <Link to={kidsCategoryId ? `/shop?categoryId=${kidsCategoryId}` : '/shop'} className="btn btn-xs">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      {/* Product Tabs Section */}
      <section className="product-tabs section-padding position-relative">
        <div className="container">
          <div className="section-title style-2">
            <h3>Popular Products</h3>
            <ul className="nav nav-tabs links" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activePopularTab === 'all' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActivePopularTab('all')}
                >All</button>
              </li>
              {popularTabs.map((tab) => (
                <li className="nav-item" role="presentation" key={tab.id}>
                  <button
                    className={`nav-link ${String(activePopularTab) === String(tab.id) ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActivePopularTab(tab.id)}
                  >{tab.name}</button>
                </li>
              ))}
            </ul>
          </div>
          {/*End nav-tabs*/}
          <div className="tab-content" id="myTabContent">
            <div className="tab-pane fade show active" id="tab-one" role="tabpanel" aria-labelledby="tab-one">
              <div className="row product-grid-4">
                {(() => {
                  const productsToShow = activePopularTab === 'all'
                    ? products
                    : products.filter(p => String(p.categoryId) === String(activePopularTab));

                  if (productsToShow.length === 0) {
                    return (
                      <NoProductsFound
                        hasFilters={activePopularTab !== 'all'}
                        message={activePopularTab !== 'all' ? 'No products found in this category' : 'No products available'}
                      />
                    );
                  }

                  return productsToShow.map((product, index) => (
                    <div key={product.id} className="col-lg-1-5 col-md-4 col-12 col-sm-6">
                    <div className="product-cart-wrap mb-30">
                      <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                        <div className="product-img product-img-zoom">
                          <Link to={`/shop-product-right?id=${product.id}`}>
                            <img
                              className="default-img"
                              src={product.image}
                              alt={product.name}
                              style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                              onError={(e) => { e.target.src = getUnsplashFallback(index); }}
                            />
                            <img
                              className="hover-img"
                              src={product.hoverImage}
                              alt={product.name}
                              style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
                              onError={(e) => { e.target.src = getUnsplashFallback(index + 1); }}
                            />
                          </Link>
                        </div>
                        <div className="product-action-1">
                          <button type="button" aria-label="Add To Wishlist" className="action-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishlist(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInWishlist(product.id) ? '#ff0000' : '' }}><i className="fi-rs-heart"></i></button>
                          <button type="button" aria-label="Compare" className="action-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInCompare(product.id) ? '#3BB77E' : '' }}><i className="fi-rs-shuffle"></i></button>
                          <button type="button" aria-label="Quick view" className="action-btn" data-bs-toggle="modal" data-bs-target="#quickViewModal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); showQuickView(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><i className="fi-rs-eye"></i></button>
                        </div>
                        {product.badge && (
                          <div className="product-badges product-badges-position product-badges-mrg">
                            <span className={product.badge.type}>{product.badge.text}</span>
                          </div>
                        )}
                      </div>
                      <div className="product-content-wrap">
                        <div className="product-category">
                          <Link to="/shop">{product.category}</Link>
                        </div>
                        <h2><Link to={`/shop-product-right?id=${product.id}`}>{product.name}</Link></h2>
                        <div className="product-rate-cover">
                          <div className="product-rate d-inline-block">
                            <div className="product-rating" style={{ width: `${product.rating}%` }}></div>
                          </div>
                          <span className="font-small ml-5 text-muted"> (4.0)</span>
                        </div>
                        <div>
                          <span className="font-small text-muted">By <Link to="/vendors-grid">{product.vendor}</Link></span>
                        </div>
                        <div className="product-card-bottom">
                          <div className="product-price">
                            <span>{product.price}</span>
                            {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                          </div>
                          <div className="add-cart">
                            <Link 
                              className="add" 
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  productName: product.name,
                                  price: product.price,
                                  image: product.image || '/assets/imgs/shop/product-1-1.jpg',
                                  quantity: 1,
                                  stock: product.quantity || 999
                                });
                              }}
                            >
                              <i className="fi-rs-shopping-cart mr-5"></i>Add
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
                })()}
              </div>
            </div>
            <div className="tab-pane fade" id="tab-two" role="tabpanel" aria-labelledby="tab-two">
              <NoProductsFound message="No products available at the moment" />
            </div>
            <div className="tab-pane fade" id="tab-three" role="tabpanel" aria-labelledby="tab-three">
              <NoProductsFound message="No products available at the moment" />
            </div>
            <div className="tab-pane fade" id="tab-four" role="tabpanel" aria-labelledby="tab-four">
              <NoProductsFound message="No products available at the moment" />
            </div>
            <div className="tab-pane fade" id="tab-five" role="tabpanel" aria-labelledby="tab-five">
              <NoProductsFound message="No products available at the moment" />
            </div>
            <div className="tab-pane fade" id="tab-six" role="tabpanel" aria-labelledby="tab-six">
              <NoProductsFound message="No products available at the moment" />
            </div>
            <div className="tab-pane fade" id="tab-seven" role="tabpanel" aria-labelledby="tab-seven">
              <NoProductsFound message="No products available at the moment" />
            </div>
          </div>
        </div>
      </section>
      {/*End product tabs*/}

      {/* Daily Best Sells Section */}
      <section className="section-padding pb-5">
        <div className="container">
          <div className="section-title">
            <h3 className="">Daily Best Sells</h3>
            <ul className="nav nav-tabs links" id="myTab-2" role="tablist">
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeDailyTab === 'featured' ? 'active' : ''}`}
                  type="button" 
                  onClick={() => setActiveDailyTab('featured')}
                >Featured</button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeDailyTab === 'popular' ? 'active' : ''}`}
                  type="button" 
                  onClick={() => setActiveDailyTab('popular')}
                >Popular</button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeDailyTab === 'new' ? 'active' : ''}`}
                  type="button" 
                  onClick={() => setActiveDailyTab('new')}
                >New added</button>
              </li>
            </ul>
          </div>
          <div className="row">
            <div className="col-lg-3 d-none d-lg-flex">
              <div className="banner-img style-2">
                <div className="banner-text">
                  <h2 className="mb-100">Bring nature into your home</h2>
                  <Link to="/shop" className="btn btn-xs">Shop Now <i className="fi-rs-arrow-small-right"></i></Link>
                </div>
              </div>
            </div>
            <div className="col-lg-9 col-md-12" style={{ position: 'relative' }}>
              {dailyTabLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  minHeight: '400px'
                }}>
                  <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <div className="tab-content" id="myTabContent-1" style={{ opacity: dailyTabLoading ? 0.3 : 1, transition: 'opacity 0.3s ease' }}>
                <div className={`tab-pane fade ${activeDailyTab === 'featured' ? 'show active' : ''}`} id="tab-one-1" role="tabpanel" aria-labelledby="tab-one-1">
                  {(() => {
                    const featuredProducts = products.slice(0, 6);
                    if (featuredProducts.length === 0) {
                      return (
                        <div className="row">
                          <NoProductsFound
                            message="No featured products available at the moment"
                          />
                        </div>
                      );
                    }
                    return (
                  <div className="carausel-4-columns-cover arrow-center position-relative">
                    <div className="slider-arrow slider-arrow-2 carausel-4-columns-arrow" id="carausel-4-columns-arrows"></div>
                    <div className="carausel-4-columns carausel-arrow-center" id="carausel-4-columns" ref={carausel4ColumnsRef} key="carausel-4-1">
                      {featuredProducts.map((product, index) => (
                        <div key={product.id} className="product-cart-wrap">
                          <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                            <div className="product-img product-img-zoom">
                              <Link to={`/shop-product-right?id=${product.id}`}>
                                <img
                                  className="default-img"
                                  src={product.image}
                                  alt={product.name}
                                  onError={(e) => { e.target.src = getUnsplashFallback(index + 100); }}
                                />
                                <img
                                  className="hover-img"
                                  src={product.hoverImage}
                                  alt={product.name}
                                  onError={(e) => { e.target.src = getUnsplashFallback(index + 101); }}
                                />
                              </Link>
                            </div>
                            <div className="product-action-1">
                              <button type="button" aria-label="Add To Wishlist" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishlist(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInWishlist(product.id) ? '#ff0000' : '' }}><i className="fi-rs-heart"></i></button>
                              <button type="button" aria-label="Compare" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInCompare(product.id) ? '#3BB77E' : '' }}><i className="fi-rs-shuffle"></i></button>
                              <button type="button" aria-label="Quick view" className="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); showQuickView(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><i className="fi-rs-eye"></i></button>
                            </div>
                            {product.badge && (
                              <div className="product-badges product-badges-position product-badges-mrg">
                                <span className={product.badge.type}>{product.badge.text}</span>
                              </div>
                            )}
                          </div>
                          <div className="product-content-wrap">
                            <div className="product-category">
                              <Link to="/shop">{product.category}</Link>
                            </div>
                            <h2><Link to={`/shop-product-right?id=${product.id}`}>{product.name}</Link></h2>
                            <div className="product-rate d-inline-block">
                              <div className="product-rating" style={{ width: `${product.rating}%` }}></div>
                            </div>
                            <div className="product-price mt-10">
                              <span>{product.price} </span>
                              {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                            </div>
                            <div className="sold mt-15 mb-15">
                              <div className="progress mb-5">
                                <div className="progress-bar" role="progressbar" style={{ width: '50%' }} aria-valuemin="0" aria-valuemax="100"></div>
                              </div>
                              <span className="font-xs text-heading"> Sold: 90/120</span>
                            </div>
                            <button 
                              type="button"
                              className="btn w-100 hover-up"
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart({
                                  id: product.id,
                                  name: product.name,
                                  productName: product.name,
                                  price: product.price,
                                  image: product.image || '/assets/imgs/shop/product-1-1.jpg',
                                  quantity: 1,
                                  stock: product.quantity || 999
                                });
                              }}
                            >
                              <i className="fi-rs-shopping-cart mr-5"></i>Add To Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                    );
                  })()}
                </div>
                <div className={`tab-pane fade ${activeDailyTab === 'popular' ? 'show active' : ''}`} id="tab-two-1" role="tabpanel" aria-labelledby="tab-two-1">
                  {(() => {
                    const popularProducts = products.slice(6, 12);
                    if (popularProducts.length === 0) {
                      return (
                        <div className="row">
                          <NoProductsFound
                            message="No popular products available at the moment"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="carausel-4-columns-cover arrow-center position-relative">
                        <div className="slider-arrow slider-arrow-2 carausel-4-columns-arrow" id="carausel-4-columns-arrows-2"></div>
                        <div className="carausel-4-columns carausel-arrow-center" id="carausel-4-columns-2">
                          {popularProducts.map((product, index) => (
                            <div key={product.id} className="product-cart-wrap">
                              <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                                <div className="product-img product-img-zoom">
                                  <Link to={`/shop-product-right?id=${product.id}`}>
                                    <img className="default-img" src={product.image} alt={product.name} onError={(e) => { e.target.src = getUnsplashFallback(index + 200); }} />
                                  </Link>
                                </div>
                                <div className="product-action-1">
                                  <button type="button" aria-label="Add To Wishlist" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishlist(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInWishlist(product.id) ? '#ff0000' : '' }}><i className="fi-rs-heart"></i></button>
                                  <button type="button" aria-label="Compare" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInCompare(product.id) ? '#3BB77E' : '' }}><i className="fi-rs-shuffle"></i></button>
                                  <button type="button" aria-label="Quick view" className="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); showQuickView(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><i className="fi-rs-eye"></i></button>
                                </div>
                                {product.badge && (
                                  <div className="product-badges product-badges-position product-badges-mrg">
                                    <span className={product.badge.type}>{product.badge.text}</span>
                                  </div>
                                )}
                              </div>
                              <div className="product-content-wrap">
                                <h2><Link to={`/shop-product-right?id=${product.id}`}>{product.name}</Link></h2>
                                <div className="product-price mt-10"><span>{product.price}</span></div>
                                <button type="button" className="btn w-100 hover-up" onClick={(e) => { e.preventDefault(); addToCart({ id: product.id, name: product.name, productName: product.name, price: product.price, image: product.image || '/assets/imgs/shop/product-1-1.jpg', quantity: 1, stock: product.quantity || 999 }); }}><i className="fi-rs-shopping-cart mr-5"></i>Add To Cart</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className={`tab-pane fade ${activeDailyTab === 'new' ? 'show active' : ''}`} id="tab-three-1" role="tabpanel" aria-labelledby="tab-three-1">
                  {(() => {
                    const newProducts = products.slice(12, 18);
                    if (newProducts.length === 0) {
                      return (
                        <div className="row">
                          <NoProductsFound
                            message="No new products available at the moment"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="carausel-4-columns-cover arrow-center position-relative">
                        <div className="slider-arrow slider-arrow-2 carausel-4-columns-arrow" id="carausel-4-columns-arrows-3"></div>
                        <div className="carausel-4-columns carausel-arrow-center" id="carausel-4-columns-3">
                          {newProducts.map((product, index) => (
                            <div key={product.id} className="product-cart-wrap">
                              <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                                <div className="product-img product-img-zoom">
                                  <Link to={`/shop-product-right?id=${product.id}`}>
                                    <img className="default-img" src={product.image} alt={product.name} onError={(e) => { e.target.src = getUnsplashFallback(index + 300); }} />
                                  </Link>
                                </div>
                                <div className="product-action-1">
                                  <button type="button" aria-label="Add To Wishlist" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToWishlist(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInWishlist(product.id) ? '#ff0000' : '' }}><i className="fi-rs-heart"></i></button>
                                  <button type="button" aria-label="Compare" className="action-btn small hover-up" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: isInCompare(product.id) ? '#3BB77E' : '' }}><i className="fi-rs-shuffle"></i></button>
                                  <button type="button" aria-label="Quick view" className="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); showQuickView(product); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><i className="fi-rs-eye"></i></button>
                                </div>
                                {product.badge && (
                                  <div className="product-badges product-badges-position product-badges-mrg">
                                    <span className={product.badge.type}>{product.badge.text}</span>
                                  </div>
                                )}
                              </div>
                              <div className="product-content-wrap">
                                <h2><Link to={`/shop-product-right?id=${product.id}`}>{product.name}</Link></h2>
                                <div className="product-price mt-10"><span>{product.price}</span></div>
                                <button type="button" className="btn w-100 hover-up" onClick={(e) => { e.preventDefault(); addToCart({ id: product.id, name: product.name, productName: product.name, price: product.price, image: product.image || '/assets/imgs/shop/product-1-1.jpg', quantity: 1, stock: product.quantity || 999 }); }}><i className="fi-rs-shopping-cart mr-5"></i>Add To Cart</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*End Daily Best Sells*/}

      {/* Deals Of The Day Section */}
      <section className="section-padding pb-5">
        <div className="container">
          <div className="section-title">
            <h3 className="">Deals Of The Day</h3>
            <Link className="show-all" to="/shop">
              All Deals
              <i className="fi-rs-angle-right"></i>
            </Link>
          </div>
          <div className="row">
            {products.slice(0, 4).map((product, index) => (
              <div key={product.id} className={`col-xl-3 col-lg-4 col-md-6 ${index >= 2 ? 'd-none d-lg-block' : ''} ${index === 3 ? 'd-none d-xl-block' : ''}`}>
                <div className="product-cart-wrap style-2">
                  <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                    <div className="product-img">
                      <Link to={`/shop-product-right?id=${product.id}`}>
                        <img 
                          src={product.image} 
                          alt={product.name}
                          onError={(e) => { e.target.src = getUnsplashFallback(index + 200); }}
                        />
                      </Link>
                    </div>
                  </div>
                  <div className="product-content-wrap">
                    <div className="deals-countdown-wrap">
                      <div className="deals-countdown" data-countdown={`2025/${12 - index}/25 00:00:00`}></div>
                    </div>
                    <div className="deals-content">
                      <h2><Link to={`/shop-product-right?id=${product.id}`}>{product.name}</Link></h2>
                      <div className="product-rate-cover">
                        <div className="product-rate d-inline-block">
                          <div className="product-rating" style={{ width: `${product.rating}%` }}></div>
                        </div>
                        <span className="font-small ml-5 text-muted"> (4.0)</span>
                      </div>
                      <div>
                        <span className="font-small text-muted">By <Link to="/vendors-grid">{product.vendor}</Link></span>
                      </div>
                      <div className="product-card-bottom">
                        <div className="product-price">
                          <span>{product.price}</span>
                          {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                        </div>
                        <div className="add-cart">
                          <button 
                            className="add" 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart({
                                id: product.id,
                                name: product.name,
                                productName: product.name,
                                price: product.price,
                                image: product.image || '/assets/imgs/shop/product-1-1.jpg',
                                quantity: 1,
                                stock: product.quantity || 999
                              });
                            }}
                          >
                            <i className="fi-rs-shopping-cart mr-5"></i>Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/*End Deals Of The Day*/}

      {/* Top Selling / Trending / Recently Added Section */}
      <section className="section-padding mb-30">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4 col-md-6 mb-sm-5 mb-md-0">
              <h4 className="section-title style-1 mb-30 animated animated">Top Selling</h4>
              <div className="product-list-small animated animated">
                {products.slice(0, 3).map((product, index) => {
                  const productImage = product.image || `/assets/imgs/shop/product-${(index % 10) + 1}-1.jpg`;
                  return (
                    <article key={product.id} className="row align-items-center hover-up">
                      <figure className="col-md-4 mb-0">
                        <Link to={`/shop-product-right?id=${product.id}`}>
                          <img 
                            src={productImage} 
                            alt={product.name || 'Product'}
                            onError={(e) => {
                              e.target.src = '/assets/imgs/shop/product-1-1.jpg';
                            }}
                          />
                        </Link>
                      </figure>
                      <div className="col-md-8 mb-0">
                        <h6>
                          <Link to={`/shop-product-right?id=${product.id}`}>{product.name || 'Product'}</Link>
                        </h6>
                        <div className="product-rate-cover">
                          <div className="product-rate d-inline-block">
                            <div className="product-rating" style={{ width: '90%' }}></div>
                          </div>
                          <span className="font-small ml-5 text-muted"> (4.0)</span>
                        </div>
                        <div className="product-price">
                          <span>${product.price || 0}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 mb-md-0">
              <h4 className="section-title style-1 mb-30 animated animated">Trending Products</h4>
              <div className="product-list-small animated animated">
                {products.slice(3, 6).map((product, index) => {
                  const productImage = product.image || `/assets/imgs/shop/product-${((index + 3) % 10) + 1}-1.jpg`;
                  return (
                    <article key={product.id} className="row align-items-center hover-up">
                      <figure className="col-md-4 mb-0">
                        <Link to={`/shop-product-right?id=${product.id}`}>
                          <img 
                            src={productImage} 
                            alt={product.name || 'Product'}
                            onError={(e) => {
                              e.target.src = '/assets/imgs/shop/product-1-1.jpg';
                            }}
                          />
                        </Link>
                      </figure>
                      <div className="col-md-8 mb-0">
                        <h6>
                          <Link to={`/shop-product-right?id=${product.id}`}>{product.name || 'Product'}</Link>
                        </h6>
                        <div className="product-rate-cover">
                          <div className="product-rate d-inline-block">
                            <div className="product-rating" style={{ width: '90%' }}></div>
                          </div>
                          <span className="font-small ml-5 text-muted"> (4.0)</span>
                        </div>
                        <div className="product-price">
                          <span>${product.price || 0}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6">
              <h4 className="section-title style-1 mb-30 animated animated">Recently added</h4>
              <div className="product-list-small animated animated">
                {products.slice(5, 8).map((product, index) => {
                  const productImage = product.image || `/assets/imgs/shop/product-${((index + 5) % 10) + 1}-1.jpg`;
                  return (
                    <article key={product.id} className="row align-items-center hover-up">
                      <figure className="col-md-4 mb-0">
                        <Link to={`/shop-product-right?id=${product.id}`}>
                          <img 
                            src={productImage} 
                            alt={product.name || 'Product'}
                            onError={(e) => {
                              e.target.src = '/assets/imgs/shop/product-1-1.jpg';
                            }}
                          />
                        </Link>
                      </figure>
                      <div className="col-md-8 mb-0">
                        <h6>
                          <Link to={`/shop-product-right?id=${product.id}`}>{product.name || 'Product'}</Link>
                        </h6>
                        <div className="product-rate-cover">
                          <div className="product-rate d-inline-block">
                            <div className="product-rating" style={{ width: '90%' }}></div>
                          </div>
                          <span className="font-small ml-5 text-muted"> (4.0)</span>
                        </div>
                        <div className="product-price">
                          <span>${product.price || 0}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="col-xl-3 col-lg-4 col-md-6 d-none d-xl-block">
              <h4 className="section-title style-1 mb-30 animated animated">Top Rated</h4>
              <div className="product-list-small animated animated">
                {products.slice(0, 3).map((product, index) => {
                  const productImage = product.image || `/assets/imgs/shop/product-${(index % 10) + 1}-1.jpg`;
                  return (
                    <article key={product.id} className="row align-items-center hover-up">
                      <figure className="col-md-4 mb-0">
                        <Link to={`/shop-product-right?id=${product.id}`}>
                          <img 
                            src={productImage} 
                            alt={product.name || 'Product'}
                            onError={(e) => {
                              e.target.src = '/assets/imgs/shop/product-1-1.jpg';
                            }}
                          />
                        </Link>
                      </figure>
                      <div className="col-md-8 mb-0">
                        <h6>
                          <Link to={`/shop-product-right?id=${product.id}`}>{product.name || 'Product'}</Link>
                        </h6>
                        <div className="product-rate-cover">
                          <div className="product-rate d-inline-block">
                            <div className="product-rating" style={{ width: '90%' }}></div>
                          </div>
                          <span className="font-small ml-5 text-muted"> (4.0)</span>
                        </div>
                        <div className="product-price">
                          <span>${product.price || 0}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*End Top Selling*/}

    </main>
  );
};

export default Home;
