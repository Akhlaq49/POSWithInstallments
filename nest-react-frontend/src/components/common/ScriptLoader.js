import { useEffect } from 'react';

const ScriptLoader = () => {
  useEffect(() => {
    // Remove no-js class from html element
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');

    // Load scripts in order - only load if not already loaded
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.defer = false;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const scripts = [
      '/assets/js/vendor/modernizr-3.6.0.min.js',
      '/assets/js/vendor/jquery-3.7.1.min.js',
      '/assets/js/vendor/jquery-migrate-3.3.0.min.js',
      '/assets/js/vendor/bootstrap.bundle.min.js',
      '/assets/js/plugins/slick.js',
      '/assets/js/plugins/jquery.syotimer.min.js',
      '/assets/js/plugins/waypoints.js',
      '/assets/js/plugins/wow.js',
      '/assets/js/plugins/perfect-scrollbar.js',
      '/assets/js/plugins/magnific-popup.js',
      '/assets/js/plugins/select2.min.js',
      '/assets/js/plugins/counterup.js',
      '/assets/js/plugins/jquery.countdown.min.js',
      '/assets/js/plugins/images-loaded.js',
      '/assets/js/plugins/isotope.js',
      '/assets/js/plugins/scrollup.js',
      '/assets/js/plugins/jquery.vticker-min.js',
      '/assets/js/plugins/jquery.theia.sticky.js',
      '/assets/js/plugins/jquery.elevatezoom.js',
      '/assets/js/main.js?v=6.1',
      '/assets/js/shop.js?v=6.1'
    ];

    // Load scripts sequentially
    let promise = Promise.resolve();
    scripts.forEach((src) => {
      promise = promise.then(() => loadScript(src));
    });

    // After scripts load, prevent main.js carousel auto-init
    promise.then(() => {
      // Set flag to prevent global carousel initialization
      window.preventSlickAutoInit = true;
      
      // Override slick initialization in main.js by wrapping it
      if (window.jQuery && window.jQuery.fn.slick) {
        const originalSlick = window.jQuery.fn.slick;
        window.jQuery.fn.slick = function(...args) {
          // Only allow slick init if explicitly called from React component
          // or if the element actually exists in the DOM
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
      }
    }).catch(error => {
      console.error('Error loading scripts:', error);
    });

    // Cleanup function
    return () => {
      // Scripts are typically not removed on unmount
      // but we can hide preloader if needed
      const preloader = document.getElementById('preloader-active');
      if (preloader) {
        preloader.style.display = 'none';
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ScriptLoader;

