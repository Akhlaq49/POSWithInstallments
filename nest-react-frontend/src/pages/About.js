import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  const carouselRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Patch counterup plugin and add global error handler
    const setupCounterUpProtection = () => {
      if (!window.jQuery) return;

      // Patch counterUp plugin to add null checks
      if (window.jQuery.fn.counterUp) {
        const originalCounterUp = window.jQuery.fn.counterUp;
        
        window.jQuery.fn.counterUp = function(options) {
          return this.each(function() {
            const $this = window.jQuery(this);
            
            // Skip if already initialized
            if ($this.data('counterup-initialized')) {
              return;
            }
            
            try {
              // Call original
              originalCounterUp.call($this, options);
              
              // Wrap the callback immediately after it's set
              setTimeout(() => {
                const originalFunc = $this.data('counterup-func');
                if (originalFunc && typeof originalFunc === 'function') {
                  const safeFunc = function() {
                    try {
                      const nums = $this.data('counterup-nums');
                      if (nums && Array.isArray(nums) && nums.length > 0) {
                        $this.text(nums.shift());
                        if (nums.length) {
                          setTimeout(safeFunc, (options && options.delay) || 10);
                        } else {
                          $this.data('counterup-nums', null);
                          $this.data('counterup-func', null);
                          $this.data('counterup-initialized', true);
                        }
                      } else {
                        // Data is null, stop
                        $this.data('counterup-nums', null);
                        $this.data('counterup-func', null);
                        $this.data('counterup-initialized', true);
                      }
                    } catch (e) {
                      // Error occurred, clean up silently
                      try {
                        $this.data('counterup-nums', null);
                        $this.data('counterup-func', null);
                        $this.data('counterup-initialized', true);
                      } catch (cleanupError) {
                        // Ignore
                      }
                    }
                  };
                  $this.data('counterup-func', safeFunc);
                }
              }, 50);
            } catch (e) {
              // Ignore initialization errors
            }
          });
        };
      }

      // Store original error handler
      const originalErrorHandler = window.onerror;
      
      // Add global error handler for counterup errors
      window.onerror = function(msg, url, line, col, error) {
        // Check if it's a counterup error
        if (msg && (msg.includes('counterup') || msg.includes('shift')) && url && url.includes('counterup')) {
          // Silently handle counterup errors by cleaning up invalid callbacks
          if (window.jQuery) {
            try {
              window.jQuery('.count').each(function() {
                const $this = window.jQuery(this);
                const func = $this.data('counterup-func');
                if (func) {
                  const nums = $this.data('counterup-nums');
                  if (!nums || !Array.isArray(nums) || nums.length === 0) {
                    try {
                      $this.data('counterup-nums', null);
                      $this.data('counterup-func', null);
                      $this.data('counterup-initialized', true);
                    } catch (e) {
                      // Ignore cleanup errors
                    }
                  }
                }
              });
            } catch (e) {
              // Ignore
            }
          }
          return true; // Prevent default error handling for counterup errors
        }
        // Call original error handler for other errors
        if (originalErrorHandler) {
          return originalErrorHandler.apply(this, arguments);
        }
        return false;
      };
      
      // Return cleanup function
      return () => {
        // Restore original error handler
        if (originalErrorHandler) {
          window.onerror = originalErrorHandler;
        } else {
          window.onerror = null;
        }
      };
    };

    // Try to setup protection
    let errorHandlerCleanup = null;
    if (window.jQuery) {
      errorHandlerCleanup = setupCounterUpProtection();
    } else {
      const checkJQuery = setInterval(() => {
        if (window.jQuery) {
          errorHandlerCleanup = setupCounterUpProtection();
          clearInterval(checkJQuery);
        }
      }, 100);
      setTimeout(() => clearInterval(checkJQuery), 5000);
    }

    // Wait for scripts to load and DOM to be ready
    const initCarousel = () => {
      if (!window.jQuery || !window.jQuery.fn.slick || !carouselRef.current) {
        return false;
      }

      const $carousel = window.jQuery(carouselRef.current);
      
      // Check if carousel exists and is not already initialized
      if ($carousel.length && !$carousel.hasClass('slick-initialized') && !isInitialized.current) {
        try {
          // Destroy any existing slick instance first
          if ($carousel.hasClass('slick-initialized')) {
            $carousel.slick('unslick');
          }
          
          // Initialize the carousel
          const id = 'carausel-3-columns';
          const sliderID = '#' + id;
          const appendArrowsClassName = '#' + id + '-arrows';

          // Use a small delay to ensure DOM is stable
          setTimeout(() => {
            if (carouselRef.current && window.jQuery(carouselRef.current).length) {
              window.jQuery(sliderID).slick({
                dots: false,
                infinite: true,
                speed: 1000,
                arrows: true,
                autoplay: true,
                slidesToShow: 3,
                slidesToScroll: 1,
                loop: true,
                adaptiveHeight: true,
                useTransform: true,
                cssEase: 'ease',
                responsive: [
                  {
                    breakpoint: 1025,
                    settings: {
                      slidesToShow: 3,
                      slidesToScroll: 3
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
                appendArrows: appendArrowsClassName
              });
              
              // Carousel initialized successfully
            }
          }, 100);
          
          isInitialized.current = true;
          return true;
        } catch (error) {
          console.error('Error initializing carousel:', error);
          return false;
        }
      }
      return false;
    };

    // Try to initialize with retries
    let attempts = 0;
    const maxAttempts = 30;
    let carouselInitTimeout;
    
    const tryInit = () => {
      attempts++;
      
      if (window.jQuery && window.jQuery.fn.slick && carouselRef.current) {
        initCarousel();
      }
      
      if (attempts < maxAttempts && !isInitialized.current) {
        carouselInitTimeout = setTimeout(tryInit, 300);
      } else if (attempts >= maxAttempts && !isInitialized.current) {
        // Fallback: try one more time after a longer delay
        setTimeout(() => {
          if (carouselRef.current) {
            initCarousel();
          }
        }, 2000);
      }
    };

    // Start trying after a short delay to ensure scripts are loaded
    const timeoutId = setTimeout(tryInit, 1500);

    // Note: CounterUp is initialized globally by main.js and uses waypoints
    // to trigger when elements come into view. The safeguard above prevents errors.

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(carouselInitTimeout);
      
      // Restore error handler
      if (errorHandlerCleanup) {
        errorHandlerCleanup();
      }
      
      const currentCarousel = carouselRef.current;
      if (window.jQuery && currentCarousel) {
        try {
          const $carousel = window.jQuery(currentCarousel);
          if ($carousel.length && $carousel.hasClass('slick-initialized')) {
            $carousel.slick('unslick');
          }
        } catch (error) {
          // Ignore cleanup errors
          console.warn('Error during carousel cleanup:', error);
        }
      }
      isInitialized.current = false;
    };
  }, []);

  return (
    <main className="main pages">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/" rel="nofollow">
              <i className="fi-rs-home mr-5"></i>Home
            </Link>
            <span></span> Pages <span></span> About us
          </div>
        </div>
      </div>
      <div className="page-content pt-50">
        <div className="container">
          <div className="row">
            <div className="col-xl-10 col-lg-12 m-auto">
              <section className="row align-items-center mb-50">
                <div className="col-lg-6">
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop" 
                    alt="About Corio Fashion" 
                    className="border-radius-15 mb-md-3 mb-lg-0 mb-sm-4"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop'; }}
                  />
                </div>
                <div className="col-lg-6">
                  <div className="pl-25">
                    <h2 className="mb-30">Welcome to Nest</h2>
                    <p className="mb-25">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate id est laborum.
                    </p>
                    <p className="mb-50">
                      Ius ferri velit sanctus cu, sed at soleat accusata. Dictas prompta et Ut placerat legendos interpre.Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante Etiam sit amet orci eget. Quis commodo odio aenean sed adipiscing. Turpis massa tincidunt dui ut ornare lectus. Auctor elit sed vulputate mi sit amet. Commodo consequat. Duis aute irure dolor in reprehenderit in voluptate id est laborum.
                    </p>
                    <div className="carausel-3-columns-cover position-relative" key="carousel-container">
                      <div id="carausel-3-columns-arrows"></div>
                      <div className="carausel-3-columns" id="carausel-3-columns" ref={carouselRef} key="carousel-slider">
                        <img key="img-1" src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop" alt="About gallery" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop'; }} />
                        <img key="img-2" src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop" alt="About gallery" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop'; }} />
                        <img key="img-3" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop" alt="About gallery" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop'; }} />
                        <img key="img-4" src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop" alt="About gallery" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop'; }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="text-center mb-50">
                <h2 className="title style-3 mb-40">What We Provide?</h2>
                <div className="row">
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-1.svg" alt="Best Prices" />
                      <h4>Best Prices & Offers</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-2.svg" alt="Wide Assortment" />
                      <h4>Wide Assortment</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-3.svg" alt="Free Delivery" />
                      <h4>Free Delivery</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-4.svg" alt="Easy Returns" />
                      <h4>Easy Returns</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-5.svg" alt="100% Satisfaction" />
                      <h4>100% Satisfaction</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-24">
                    <div className="featured-card">
                      <img src="/assets/imgs/theme/icons/icon-6.svg" alt="Great Daily Deal" />
                      <h4>Great Daily Deal</h4>
                      <p>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form</p>
                      <Link to="#">Read more</Link>
                    </div>
                  </div>
                </div>
              </section>
              <section className="row align-items-center mb-50">
                <div className="row mb-50 align-items-center">
                  <div className="col-lg-7 pr-30">
                    <img 
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop" 
                      alt="Our performance" 
                      className="mb-md-3 mb-lg-0 mb-sm-4"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop'; }} 
                    />
                  </div>
                  <div className="col-lg-5">
                    <h4 className="mb-20 text-muted">Our performance</h4>
                    <h1 className="heading-1 mb-40">Your Partner for e-commerce fashion solution</h1>
                    <p className="mb-30">
                      Ed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto
                    </p>
                    <p>
                      Pitatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-4 pr-30 mb-md-5 mb-lg-0 mb-sm-5">
                    <h3 className="mb-30">Who we are</h3>
                    <p>
                      Volutpat diam ut venenatis tellus in metus. Nec dui nunc mattis enim ut tellus eros donec ac odio orci ultrices in. ellus eros donec ac odio orci ultrices in.
                    </p>
                  </div>
                  <div className="col-lg-4 pr-30 mb-md-5 mb-lg-0 mb-sm-5">
                    <h3 className="mb-30">Our history</h3>
                    <p>
                      Volutpat diam ut venenatis tellus in metus. Nec dui nunc mattis enim ut tellus eros donec ac odio orci ultrices in. ellus eros donec ac odio orci ultrices in.
                    </p>
                  </div>
                  <div className="col-lg-4">
                    <h3 className="mb-30">Our mission</h3>
                    <p>
                      Volutpat diam ut venenatis tellus in metus. Nec dui nunc mattis enim ut tellus eros donec ac odio orci ultrices in. ellus eros donec ac odio orci ultrices in.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
        <section className="container mb-50 d-none d-md-block">
          <div className="row about-count">
            <div className="col-lg-1-5 col-md-6 text-center mb-lg-0 mb-md-5">
              <h1 className="heading-1">
                <span className="count">12</span>+
              </h1>
              <h4>Glorious years</h4>
            </div>
            <div className="col-lg-1-5 col-md-6 text-center">
              <h1 className="heading-1">
                <span className="count">36</span>+
              </h1>
              <h4>Happy clients</h4>
            </div>
            <div className="col-lg-1-5 col-md-6 text-center">
              <h1 className="heading-1">
                <span className="count">58</span>+
              </h1>
              <h4>Projects complete</h4>
            </div>
            <div className="col-lg-1-5 col-md-6 text-center">
              <h1 className="heading-1">
                <span className="count">24</span>+
              </h1>
              <h4>Team advisor</h4>
            </div>
            <div className="col-lg-1-5 text-center d-none d-lg-block">
              <h1 className="heading-1">
                <span className="count">26</span>+
              </h1>
              <h4>Products Sale</h4>
            </div>
          </div>
        </section>
        <div className="container">
          <div className="row">
            <div className="col-xl-10 col-lg-12 m-auto">
              <section className="mb-50">
                <h2 className="title style-3 mb-40 text-center">Our Team</h2>
                <div className="row">
                  <div className="col-lg-4 mb-lg-0 mb-md-5 mb-sm-5">
                    <h6 className="mb-5 text-brand">Our Team</h6>
                    <h1 className="mb-30">Meet Our Expert Team</h1>
                    <p className="mb-30">
                      Proin ullamcorper pretium orci. Donec necscele risque leo. Nam massa dolor imperdiet neccon sequata congue idsem. Maecenas malesuada faucibus finibus.
                    </p>
                    <p className="mb-30">
                      Proin ullamcorper pretium orci. Donec necscele risque leo. Nam massa dolor imperdiet neccon sequata congue idsem. Maecenas malesuada faucibus finibus.
                    </p>
                    <Link to="#" className="btn">View All Members</Link>
                  </div>
                  <div className="col-lg-8">
                    <div className="row">
                      <div className="col-lg-6 col-md-6">
                        <div className="team-card">
                          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop" alt="H. Merinda" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop'; }} />
                          <div className="content text-center">
                            <h4 className="mb-5">H. Merinda</h4>
                            <span>CEO & Co-Founder</span>
                            <div className="social-network mt-20">
                              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <img src="/assets/imgs/theme/icons/icon-facebook-brand.svg" alt="Facebook" />
                              </a>
                              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <img src="/assets/imgs/theme/icons/icon-twitter-brand.svg" alt="Twitter" />
                              </a>
                              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <img src="/assets/imgs/theme/icons/icon-instagram-brand.svg" alt="Instagram" />
                              </a>
                              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <img src="/assets/imgs/theme/icons/icon-youtube-brand.svg" alt="YouTube" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6">
                        <div className="team-card">
                          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop" alt="Dilan Specter" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop'; }} />
                          <div className="content text-center">
                            <h4 className="mb-5">Dilan Specter</h4>
                            <span>Head Engineer</span>
                            <div className="social-network mt-20">
                              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <img src="/assets/imgs/theme/icons/icon-facebook-brand.svg" alt="Facebook" />
                              </a>
                              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <img src="/assets/imgs/theme/icons/icon-twitter-brand.svg" alt="Twitter" />
                              </a>
                              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <img src="/assets/imgs/theme/icons/icon-instagram-brand.svg" alt="Instagram" />
                              </a>
                              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <img src="/assets/imgs/theme/icons/icon-youtube-brand.svg" alt="YouTube" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default About;
