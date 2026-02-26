import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUtils';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { useQuickView } from '../../context/QuickViewContext';

const ProductCard = memo(({ product }) => {
  const {
    id,
    name,
    category,
    price,
    oldPrice,
    image,
    hoverImage,
    rating = 90,
    badge = null,
    vendor = 'Corio Fashion'
  } = product;

  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const { addToCart } = useCart();
  const { showQuickView } = useQuickView();

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product);
  };

  const handleAddToCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showQuickView(product);
  };

  return (
    <div className="col-lg-1-5 col-md-4 col-12 col-sm-6">
      <div className="product-cart-wrap mb-30">
        <div className="product-img-action-wrap">
          <div className="product-img product-img-zoom">
            <Link to={`/shop-product-right?id=${id}`}>
              <img 
                className="default-img" 
                src={getImageUrl(image) || image} 
                alt={name}
                loading="lazy"
              />
              {hoverImage && (
                <img 
                  className="hover-img" 
                  src={getImageUrl(hoverImage) || hoverImage} 
                  alt={name}
                  loading="lazy"
                />
              )}
            </Link>
          </div>
          <div className="product-action-1">
            <button 
              type="button"
              aria-label="Quick view" 
              className="action-btn hover-up" 
              data-bs-toggle="modal" 
              data-bs-target="#quickViewModal"
              onClick={handleQuickView}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <i className="fi-rs-eye"></i>
            </button>
            <button 
              type="button"
              aria-label="Add To Wishlist" 
              className={`action-btn hover-up ${isInWishlist(id) ? 'active' : ''}`}
              onClick={handleAddToWishlist}
              style={{
                ...(isInWishlist(id) ? { color: '#ff0000' } : {}),
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <i className={isInWishlist(id) ? 'fi-rs-heart' : 'fi-rs-heart'}></i>
            </button>
            <button 
              type="button"
              aria-label="Compare" 
              className={`action-btn hover-up ${isInCompare(id) ? 'active' : ''}`}
              onClick={handleAddToCompare}
              style={{
                ...(isInCompare(id) ? { color: '#3BB77E' } : {}),
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <i className="fi-rs-shuffle"></i>
            </button>
          </div>
          {badge && (
            <div className="product-badges product-badges-position product-badges-mrg">
              <span className={badge.type}>{badge.text}</span>
            </div>
          )}
        </div>
        <div className="product-content-wrap">
          <div className="product-category">
            <Link to="/shop">{typeof category === 'string' ? category : category?.categoryName || 'Uncategorized'}</Link>
          </div>
          <h2><Link to={`/shop-product-right?id=${id}`}>{name}</Link></h2>
          <div className="product-rate-cover">
            <div className="product-rate d-inline-block">
              <div className="product-rating" style={{ width: `${rating}%` }}></div>
            </div>
            <span className="font-small ml-5 text-muted"> (4.0)</span>
          </div>
          <div>
            <span className="font-small text-muted">By <Link to="/vendors-grid">{vendor}</Link></span>
          </div>
          <div className="product-card-bottom">
            <div className="product-price">
              <span>{price}</span>
              {oldPrice && <span className="old-price">{oldPrice}</span>}
            </div>
            <div className="add-cart">
              <button type="button" className="add border-0 bg-transparent p-0" onClick={handleAddToCart} style={{ cursor: 'pointer', font: 'inherit' }}>
                <i className="fi-rs-shopping-cart mr-5"></i>Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

