import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { QuickViewProvider } from './context/QuickViewContext';
import Layout from './components/common/Layout';
import Home from './pages/home/Home';

// Loading component - lightweight and fast
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    padding: '20px'
  }}>
    <div style={{
      fontSize: '16px',
      color: '#3BB77E',
      fontWeight: '500'
    }}>
      Loading...
    </div>
  </div>
);

// Lazy load other Home Pages
const Home2 = lazy(() => import('./pages/home/Home2'));
const Home3 = lazy(() => import('./pages/home/Home3'));
const Home4 = lazy(() => import('./pages/home/Home4'));
const Home5 = lazy(() => import('./pages/home/Home5'));
const Home6 = lazy(() => import('./pages/home/Home6'));

// Lazy load Shop Pages
const Shop = lazy(() => import('./pages/shop/Shop'));
const ShopGridLeft = lazy(() => import('./pages/shop/ShopGridLeft'));
const ShopListRight = lazy(() => import('./pages/shop/ShopListRight'));
const ShopListLeft = lazy(() => import('./pages/shop/ShopListLeft'));
const ShopFullwidth = lazy(() => import('./pages/shop/ShopFullwidth'));
const ShopFilter = lazy(() => import('./pages/shop/ShopFilter'));
const ShopProductRight = lazy(() => import('./pages/shop/ShopProductRight'));
const ShopProductLeft = lazy(() => import('./pages/shop/ShopProductLeft'));
const ShopProductFull = lazy(() => import('./pages/shop/ShopProductFull'));
const ShopProductVendor = lazy(() => import('./pages/shop/ShopProductVendor'));
const ShopCart = lazy(() => import('./pages/shop/ShopCart'));
const ShopCheckout = lazy(() => import('./pages/shop/ShopCheckout'));
const ShopWishlist = lazy(() => import('./pages/shop/ShopWishlist'));
const ShopCompare = lazy(() => import('./pages/shop/ShopCompare'));
const ShopInvoice1 = lazy(() => import('./pages/shop/ShopInvoice1'));
const ShopInvoice2 = lazy(() => import('./pages/shop/ShopInvoice2'));
const ShopInvoice3 = lazy(() => import('./pages/shop/ShopInvoice3'));
const ShopInvoice4 = lazy(() => import('./pages/shop/ShopInvoice4'));
const ShopInvoice5 = lazy(() => import('./pages/shop/ShopInvoice5'));
const ShopInvoice6 = lazy(() => import('./pages/shop/ShopInvoice6'));

// Lazy load Blog Pages
const BlogCategoryGrid = lazy(() => import('./pages/blog/BlogCategoryGrid'));
const BlogCategoryList = lazy(() => import('./pages/blog/BlogCategoryList'));
const BlogCategoryFullwidth = lazy(() => import('./pages/blog/BlogCategoryFullwidth'));
const BlogCategoryBig = lazy(() => import('./pages/blog/BlogCategoryBig'));
const BlogPostRight = lazy(() => import('./pages/blog/BlogPostRight'));
const BlogPostLeft = lazy(() => import('./pages/blog/BlogPostLeft'));
const BlogPostFullwidth = lazy(() => import('./pages/blog/BlogPostFullwidth'));

// Lazy load Vendor Pages
const VendorsGrid = lazy(() => import('./pages/vendor/VendorsGrid'));
const VendorsList = lazy(() => import('./pages/vendor/VendorsList'));
const VendorDetails1 = lazy(() => import('./pages/vendor/VendorDetails1'));
const VendorDetails2 = lazy(() => import('./pages/vendor/VendorDetails2'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorGuide = lazy(() => import('./pages/vendor/VendorGuide'));

// Lazy load Account Pages
const Login = lazy(() => import('./pages/account/Login'));
const Register = lazy(() => import('./pages/account/Register'));
const ForgotPassword = lazy(() => import('./pages/account/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/account/ResetPassword'));
const Account = lazy(() => import('./pages/account/Account'));

// Lazy load Other Pages
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const PurchaseGuide = lazy(() => import('./pages/PurchaseGuide'));
const Page404 = lazy(() => import('./pages/Page404'));

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <QuickViewProvider>
              <Router>
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                    {/* Home Routes */}
                    <Route path="/" element={<Home />} />
                <Route path="/home-2" element={<Home2 />} />
                <Route path="/home-3" element={<Home3 />} />
                <Route path="/home-4" element={<Home4 />} />
                <Route path="/home-5" element={<Home5 />} />
                <Route path="/home-6" element={<Home6 />} />

                {/* Shop Routes */}
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop" element={<Navigate to="/shop" replace />} />
                <Route path="/shop-grid-left" element={<ShopGridLeft />} />
                <Route path="/shop-list-right" element={<ShopListRight />} />
                <Route path="/shop-list-left" element={<ShopListLeft />} />
                <Route path="/shop-fullwidth" element={<ShopFullwidth />} />
                <Route path="/shop-filter" element={<ShopFilter />} />
                <Route path="/shop-product-right" element={<ShopProductRight />} />
                <Route path="/shop-product-left" element={<ShopProductLeft />} />
                <Route path="/shop-product-full" element={<ShopProductFull />} />
                <Route path="/shop-product-vendor" element={<ShopProductVendor />} />
                <Route path="/shop-cart" element={<ShopCart />} />
                <Route path="/shop-checkout" element={<ShopCheckout />} />
                <Route path="/shop-wishlist" element={<ShopWishlist />} />
                <Route path="/shop-compare" element={<ShopCompare />} />
                <Route path="/shop-invoice-1" element={<ShopInvoice1 />} />
                <Route path="/shop-invoice-2" element={<ShopInvoice2 />} />
                <Route path="/shop-invoice-3" element={<ShopInvoice3 />} />
                <Route path="/shop-invoice-4" element={<ShopInvoice4 />} />
                <Route path="/shop-invoice-5" element={<ShopInvoice5 />} />
                <Route path="/shop-invoice-6" element={<ShopInvoice6 />} />

                {/* Blog Routes */}
                <Route path="/blog-category-grid" element={<BlogCategoryGrid />} />
                <Route path="/blog-category-list" element={<BlogCategoryList />} />
                <Route path="/blog-category-fullwidth" element={<BlogCategoryFullwidth />} />
                <Route path="/blog-category-big" element={<BlogCategoryBig />} />
                <Route path="/blog-post-right" element={<BlogPostRight />} />
                <Route path="/blog-post-left" element={<BlogPostLeft />} />
                <Route path="/blog-post-fullwidth" element={<BlogPostFullwidth />} />

                {/* Vendor Routes */}
                <Route path="/vendors-grid" element={<VendorsGrid />} />
                <Route path="/vendors-list" element={<VendorsList />} />
                <Route path="/vendor-details-1" element={<VendorDetails1 />} />
                <Route path="/vendor-details-2" element={<VendorDetails2 />} />
                <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                <Route path="/vendor-guide" element={<VendorGuide />} />

                {/* Account Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/account" element={<Account />} />

                {/* Other Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/purchase-guide" element={<PurchaseGuide />} />
                <Route path="/404" element={<Page404 />} />
                <Route path="*" element={<Page404 />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </QuickViewProvider>
    </CompareProvider>
  </WishlistProvider>
</CartProvider>
</AuthProvider>
  );
}

export default App;

