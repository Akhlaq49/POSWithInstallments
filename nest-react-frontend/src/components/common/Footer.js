import React from 'react';
import { Link } from 'react-router-dom';
import { getUnsplashFallback } from '../../utils/imageUtils';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  return (
    <footer className="main">
      {/* Newsletter Section */}
      <section className="newsletter mb-15 wow animate__animated animate__fadeIn">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="position-relative newsletter-inner">
                <div className="newsletter-content">
                  <h2 className="mb-20">
                    Stay home & get your daily <br />
                    needs from our shop
                  </h2>
                  <p className="mb-45">Start You'r Daily Shopping with <span className="text-brand">Nest Mart</span></p>
                  <form className="form-subcriber d-flex">
                    <input type="email" placeholder="Your emaill address" />
                    <button className="btn" type="submit">Subscribe</button>
                  </form>
                </div>
                <img 
                  src="assets/imgs/banner/banner-9.png" 
                  alt="newsletter"
                  onError={(e) => {
                    e.target.src = getUnsplashFallback(0);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6 mb-md-4 mb-xl-0">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay="0">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-1.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">Best prices & offers</h3>
                  <p>Orders 50 or more</p>
                </div>
              </div>
            </div>
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-2.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">100% Secure delivery without contacting the courier</h3>
                </div>
              </div>
            </div>
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-3.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">Super Value Deals - Save more with coupons</h3>
                </div>
              </div>
            </div>
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-4.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">Wide assortment</h3>
                  <p>Mega Discounts</p>
                </div>
              </div>
            </div>
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-5.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">Easy returns</h3>
                  <p>Within 30 days</p>
                </div>
              </div>
            </div>
            <div className="col-lg-1-5 col-md-4 col-12 col-sm-6 d-xl-none">
              <div className="banner-left-icon d-flex align-items-center wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
                <div className="banner-icon">
                  <img src="/assets/imgs/theme/icons/icon-6.svg" alt="" />
                </div>
                <div className="banner-text">
                  <h3 className="icon-box-title">Safe delivery</h3>
                  <p>Within 30 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Mid Section */}
      <section className="section-padding footer-mid">
        <div className="container pt-15 pb-20">
          <div className="row">
            <div className="col">
              <div className="widget-about font-md mb-md-3 mb-lg-3 mb-xl-0 wow animate__animated animate__fadeInUp" data-wow-delay="0">
                <div className="logo mb-30">
                  <Link to="/" className="mb-15"><img src="/assets/imgs/theme/logo.svg" alt="Asentyx Consultancy" /></Link>
                  <p className="font-lg text-heading">Asentyx Consultancy - Your trusted business partner</p>
                </div>
                <ul className="contact-infor">
                  <li>
                    <img src="/assets/imgs/theme/icons/icon-location.svg" alt="" />
                    <strong>Address: </strong> 
                    <span>Lahore, Pakistan</span>
                  </li>
                  <li>
                    <img src="/assets/imgs/theme/icons/icon-contact.svg" alt="" />
                    <strong>Call Us:</strong>
                    <span>03012805749</span>
                  </li>
                  <li>
                    <img src="/assets/imgs/theme/icons/icon-email-2.svg" alt="" />
                    <strong>Email:</strong>
                    <span>info@asentyx.com</span>
                  </li>
                  <li>
                    <img src="/assets/imgs/theme/icons/icon-clock.svg" alt="" />
                    <strong>Hours:</strong>
                    <span>10:00 - 18:00, Mon - Sat</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer-link-widget col wow animate__animated animate__fadeInUp" data-wow-delay=".1s">
              <h4 className="widget-title">Company</h4>
              <ul className="footer-list mb-sm-5 mb-md-0">
                <li><Link to="/about">About Us</Link></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Delivery Information</button></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms &amp; Conditions</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Support Center</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Careers</button></li>
              </ul>
            </div>
            <div className="footer-link-widget col wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
              <h4 className="widget-title">Account</h4>
              <ul className="footer-list mb-sm-5 mb-md-0">
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/shop-cart">View Cart</Link></li>
                <li><Link to="/shop-wishlist">My Wishlist</Link></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Track My Order</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Help Ticket</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Shipping Details</button></li>
                <li><Link to="/shop-compare">Compare products</Link></li>
              </ul>
            </div>
            <div className="footer-link-widget col wow animate__animated animate__fadeInUp" data-wow-delay=".3s">
              <h4 className="widget-title">Corporate</h4>
              <ul className="footer-list mb-sm-5 mb-md-0">
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Become a Vendor</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Affiliate Program</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Farm Business</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Farm Careers</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Our Suppliers</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Accessibility</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Promotions</button></li>
              </ul>
            </div>
            <div className="footer-link-widget col wow animate__animated animate__fadeInUp" data-wow-delay=".4s">
              <h4 className="widget-title">Popular</h4>
              <ul className="footer-list mb-sm-5 mb-md-0">
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Women's Dresses</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Men's Shirts</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Shoes & Sneakers</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Handbags & Bags</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Jewelry & Accessories</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Watches</button></li>
                <li><button type="button" className="link-button" onClick={(e) => e.preventDefault()}>Activewear</button></li>
              </ul>
            </div>
            <div className="footer-link-widget widget-install-app col wow animate__animated animate__fadeInUp" data-wow-delay=".5s">
              <h4 className="widget-title">Install App</h4>
              <p className="">From App Store or Google Play</p>
              <div className="download-app">
                <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="hover-up mb-sm-2 mb-lg-0">
                  <img className="active" src="/assets/imgs/theme/app-store.jpg" alt="App Store" />
                </a>
                <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="hover-up mb-sm-2">
                  <img src="/assets/imgs/theme/google-play.jpg" alt="Google Play" />
                </a>
              </div>
              <p className="mb-20">Secured Payment Gateways</p>
              <img className="" src="/assets/imgs/theme/payment-method.png" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Bottom */}
      <div className="container pb-30 wow animate__animated animate__fadeInUp" data-wow-delay="0">
        <div className="row align-items-center">
          <div className="col-12 mb-30">
            <div className="footer-bottom"></div>
          </div>
          <div className="col-xl-4 col-lg-6 col-md-6">
            <p className="font-sm mb-0">
              &copy; {currentYear}-{nextYear} - All rights reserved
            </p>
          </div>
          <div className="col-xl-4 col-lg-6 text-center d-none d-xl-block">
            <div className="hotline d-lg-inline-flex mr-30">
              <img src="/assets/imgs/theme/icons/phone-call.svg" alt="hotline" />
              <p>03012805749<span>24/7 Support - Asentyx Consultancy</span></p>
            </div>
            <div className="hotline d-lg-inline-flex">
              <img src="/assets/imgs/theme/icons/phone-call.svg" alt="hotline" />
              <p>1900 - 8888<span>24/7 Support Center</span></p>
            </div>
          </div>
            <div className="col-xl-4 col-lg-6 col-md-6 text-end d-none d-md-block">
            <div className="mobile-social-icon">
              <h6>Follow Us</h6>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><img src="/assets/imgs/theme/icons/icon-facebook-white.svg" alt="" /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><img src="/assets/imgs/theme/icons/icon-twitter-white.svg" alt="" /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src="/assets/imgs/theme/icons/icon-instagram-white.svg" alt="" /></a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest"><img src="/assets/imgs/theme/icons/icon-pinterest-white.svg" alt="" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><img src="/assets/imgs/theme/icons/icon-youtube-white.svg" alt="" /></a>
            </div>
            <p className="font-sm">Up to 15% discount on your first subscribe</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

