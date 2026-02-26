import { useEffect } from 'react';

/**
 * ProgressiveLoader - Shows content immediately and loads assets in background
 * This provides a faster initial page load by:
 * 1. Removing preloader immediately
 * 2. Loading scripts progressively in background
 * 3. Allowing content to render while assets load
 */
const ProgressiveLoader = () => {
  useEffect(() => {
    // STEP 1: Remove preloader immediately to show content
    const preloader = document.getElementById('preloader-active');
    if (preloader) {
      // Hide preloader after a very short delay (just enough for first paint)
      setTimeout(() => {
        preloader.style.transition = 'opacity 0.3s ease-out';
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 300);
      }, 100);
    }

    // STEP 2: Remove no-js class
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');

    // STEP 4: Load critical scripts first (jQuery, Bootstrap)
    const loadScript = (src, critical = false) => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = !critical; // Critical scripts load synchronously
        script.defer = critical;
        script.onload = resolve;
        script.onerror = () => {
          console.warn(`Failed to load script: ${src}`);
          resolve(); // Continue even if script fails
        };
        document.body.appendChild(script);
      });
    };

    // Helper function to verify a plugin is loaded
    const verifyPlugin = (checkFn, pluginName, maxAttempts = 50) => {
      return new Promise((resolve) => {
        let attempts = 0;
        
        const check = () => {
          attempts++;
          if (checkFn()) {
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(check, 100);
          } else {
            console.warn(`${pluginName} did not load in time, but continuing...`);
            resolve(); // Continue anyway to prevent blocking
          }
        };
        
        check();
      });
    };

    // Critical scripts needed for functionality
    const criticalScripts = [
      '/assets/js/vendor/jquery-3.7.1.min.js',
      '/assets/js/vendor/jquery-migrate-3.3.0.min.js',
      '/assets/js/vendor/bootstrap.bundle.min.js'
    ];

    // Non-critical scripts that can load in background (after main.js and shop.js)
    const backgroundScripts = [
      '/assets/js/vendor/modernizr-3.6.0.min.js',
      '/assets/js/plugins/jquery.syotimer.min.js',
      '/assets/js/plugins/perfect-scrollbar.js',
      '/assets/js/plugins/select2.min.js'
    ];

    // Load critical scripts first
    let loadPromise = Promise.resolve();
    criticalScripts.forEach((src) => {
      loadPromise = loadPromise.then(() => loadScript(src, true));
    });

    // After critical scripts, load dependencies for main.js in order
    // 1. Load slick.js first
    loadPromise = loadPromise.then(() => {
      return loadScript('/assets/js/plugins/slick.js', true);
    }).then(() => {
      // Verify slick is loaded before proceeding
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.slick,
        'Slick.js'
      );
    }).then(() => {
      // 2. Load scrollup.js (required by main.js)
      return loadScript('/assets/js/plugins/scrollup.js', true);
    }).then(() => {
      // Wait a bit for script to execute, then verify
      return new Promise((resolve) => {
        setTimeout(() => {
          verifyPlugin(
            () => window.jQuery && window.jQuery.scrollUp,
            'scrollup.js'
          ).then(resolve);
        }, 200);
      });
    }).then(() => {
      // 3. Load wow.js before main.js (main.js initializes WOW)
      return loadScript('/assets/js/plugins/wow.js', true);
    }).then(() => {
      return verifyPlugin(() => window.WOW, 'WOW.js');
    }).then(() => {
      // 4. Load waypoints.js (required by counterup.js)
      return loadScript('/assets/js/plugins/waypoints.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.waypoint,
        'waypoints.js'
      );
    }).then(() => {
      // 5. Load counterup.js (requires waypoints)
      return loadScript('/assets/js/plugins/counterup.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.counterUp,
        'counterup.js'
      );
    }).then(() => {
      // 6. Load images-loaded.js (required by isotope.js)
      return loadScript('/assets/js/plugins/images-loaded.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.imagesLoaded,
        'images-loaded.js'
      );
    }).then(() => {
      // 7. Load isotope.js (requires imagesLoaded)
      return loadScript('/assets/js/plugins/isotope.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.isotope,
        'isotope.js'
      );
    }).then(() => {
      // 8. Load jquery.countdown.min.js (used by main.js)
      return loadScript('/assets/js/plugins/jquery.countdown.min.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.countdown,
        'jquery.countdown.min.js'
      );
    }).then(() => {
      // 9. Load magnific-popup.js (used by main.js)
      return loadScript('/assets/js/plugins/magnific-popup.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.magnificPopup,
        'magnific-popup.js'
      );
    }).then(() => {
      // 10. Load jquery.theia.sticky.js (used by main.js)
      return loadScript('/assets/js/plugins/jquery.theia.sticky.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.theiaStickySidebar,
        'jquery.theia.sticky.js'
      );
    }).then(() => {
      // 11. Load jquery.elevatezoom.js (used by main.js and shop.js)
      return loadScript('/assets/js/plugins/jquery.elevatezoom.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.elevateZoom,
        'jquery.elevatezoom.js'
      );
    }).then(() => {
      // 12. Load jquery.vticker-min.js (used by main.js)
      return loadScript('/assets/js/plugins/jquery.vticker-min.js', true);
    }).then(() => {
      return verifyPlugin(
        () => window.jQuery && window.jQuery.fn.vTicker,
        'jquery.vticker-min.js'
      );
    }).then(() => {
      // Set flag to prevent carousel auto-init conflicts
      window.preventSlickAutoInit = true;

      // 13. Now load main.js (all required plugins should be loaded)
      return loadScript('/assets/js/main.js?v=6.1', true);
    }).then(() => {
      // 14. Load shop.js (slick and elevateZoom should be loaded)
      return loadScript('/assets/js/shop.js?v=6.1', true);
    }).then(() => {
      // Load other background scripts asynchronously (won't block page)
      backgroundScripts.forEach((src) => {
        loadScript(src, false).catch(err => 
          console.warn(`Background script load failed: ${src}`, err)
        );
      });

      // Override slick initialization to prevent conflicts
      const checkAndOverrideSlick = setInterval(() => {
        if (window.jQuery && window.jQuery.fn.slick) {
          const originalSlick = window.jQuery.fn.slick;
          window.jQuery.fn.slick = function(...args) {
            if (this.length > 0 && this[0].parentElement) {
              try {
                return originalSlick.apply(this, args);
              } catch (error) {
                console.warn('Slick initialization prevented:', error.message);
                return this;
              }
            }
            return this;
          };
          clearInterval(checkAndOverrideSlick);
        }
      }, 100);

      // Clear interval after 5 seconds if jQuery/Slick not found
      setTimeout(() => clearInterval(checkAndOverrideSlick), 5000);
    }).catch(error => {
      console.error('Error loading scripts:', error);
      // Even if there's an error, try to load background scripts
      backgroundScripts.forEach((src) => {
        loadScript(src, false).catch(err => 
          console.warn(`Background script load failed: ${src}`, err)
        );
      });
    });

    // STEP 5: Enable lazy loading for images
    const enableLazyLoading = () => {
      // Use Intersection Observer for native lazy loading support
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px 0px', // Start loading 50px before image enters viewport
          threshold: 0.01
        });

        // Observe all images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    };

    // Enable lazy loading after a short delay
    setTimeout(enableLazyLoading, 500);

    // Cleanup
    return () => {
      window.preventSlickAutoInit = false;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ProgressiveLoader;
