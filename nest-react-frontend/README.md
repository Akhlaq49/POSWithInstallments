# Nest React Frontend

This is a React conversion of the Nest eCommerce HTML template. The project has been organized with proper component structure and routing.

## Project Structure

```
nest-react-frontend/
├── public/
│   ├── assets/          # All CSS, images, fonts, JS files from original template
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/      # Shared components (Header, Footer, Layout, Modals)
│   │   └── ui/          # Reusable UI components (ProductCard, CategoryCard, etc.)
│   ├── pages/
│   │   ├── home/        # Home page variants
│   │   ├── shop/        # Shop pages
│   │   ├── blog/        # Blog pages
│   │   ├── vendor/      # Vendor pages
│   │   ├── account/     # Account pages
│   │   └── ...          # Other pages (About, Contact, etc.)
│   ├── App.js           # Main app with routing
│   ├── index.js         # Entry point
│   └── index.css        # Global styles
└── package.json
```

## Setup Instructions

1. **Copy Assets**: Copy the `assets` folder from `nest-frontend` to `nest-react-frontend/public/`
   ```bash
   cp -r nest-frontend/assets nest-react-frontend/public/
   ```

2. **Install Dependencies**:
   ```bash
   cd nest-react-frontend
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm start
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Features

- ✅ React Router setup with all routes
- ✅ Common components (Header, Footer, Layout)
- ✅ Modal components (QuickView, Onload)
- ✅ Organized page structure by category
- ✅ Reusable UI components
- ✅ Responsive design maintained from original template

## Pages Structure

### Home Pages
- `/` - Home 1
- `/home-2` - Home 2
- `/home-3` - Home 3
- `/home-4` - Home 4
- `/home-5` - Home 5
- `/home-6` - Home 6

### Shop Pages
- `/shop-grid-right` - Shop Grid Right Sidebar
- `/shop-grid-left` - Shop Grid Left Sidebar
- `/shop-list-right` - Shop List Right Sidebar
- `/shop-list-left` - Shop List Left Sidebar
- `/shop-fullwidth` - Shop Fullwidth
- `/shop-filter` - Shop with Filters
- `/shop-product-right` - Product Page Right Sidebar
- `/shop-product-left` - Product Page Left Sidebar
- `/shop-product-full` - Product Page Fullwidth
- `/shop-product-vendor` - Product Page with Vendor
- `/shop-cart` - Shopping Cart
- `/shop-checkout` - Checkout
- `/shop-wishlist` - Wishlist
- `/shop-compare` - Compare Products
- `/shop-invoice-1` through `/shop-invoice-6` - Invoice Pages

### Blog Pages
- `/blog-category-grid` - Blog Category Grid
- `/blog-category-list` - Blog Category List
- `/blog-category-fullwidth` - Blog Category Fullwidth
- `/blog-category-big` - Blog Category Big
- `/blog-post-right` - Blog Post Right Sidebar
- `/blog-post-left` - Blog Post Left Sidebar
- `/blog-post-fullwidth` - Blog Post Fullwidth

### Vendor Pages
- `/vendors-grid` - Vendors Grid
- `/vendors-list` - Vendors List
- `/vendor-details-1` - Vendor Details 1
- `/vendor-details-2` - Vendor Details 2
- `/vendor-dashboard` - Vendor Dashboard
- `/vendor-guide` - Vendor Guide

### Account Pages
- `/login` - Login
- `/register` - Register
- `/forgot-password` - Forgot Password
- `/reset-password` - Reset Password
- `/account` - My Account

### Other Pages
- `/about` - About Us
- `/contact` - Contact
- `/terms` - Terms of Service
- `/privacy-policy` - Privacy Policy
- `/purchase-guide` - Purchase Guide
- `/404` - 404 Page

## Next Steps

1. Copy all assets from `nest-frontend/assets` to `nest-react-frontend/public/assets`
2. Convert remaining HTML pages to React components (currently only Home and ShopGridRight have basic structure)
3. Implement state management if needed (Redux, Context API, etc.)
4. Add form handling and validation
5. Integrate with backend API when ready
6. Add loading states and error handling
7. Optimize images and assets
8. Add unit tests

## Notes

- The original CSS and JavaScript files are preserved in the public/assets folder
- All routes are set up in App.js
- Common components are reusable across pages
- ProductCard component is available for displaying products
- More page components need to be created by converting the HTML files

