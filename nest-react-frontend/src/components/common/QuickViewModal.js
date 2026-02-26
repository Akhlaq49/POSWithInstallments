import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl, getUnsplashFallback } from '../../utils/imageUtils';
import { useQuickView } from '../../context/QuickViewContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import Swal from 'sweetalert2';

const QuickViewModal = () => {
  const { selectedProduct, clearQuickView } = useQuickView();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });

  // Reset quantity and image selection when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setSelectedImage(0);
      setShowMagnifier(false);
    }
  }, [selectedProduct]);

  const handleMouseMove = (e) => {
    const elem = e.currentTarget;
    const { top, left, width, height } = elem.getBoundingClientRect();
    const x = ((e.pageX - left - window.pageXOffset) / width) * 100;
    const y = ((e.pageY - top - window.pageYOffset) / height) * 100;
    setMagnifierPosition({ x, y });
  };

  if (!selectedProduct) {
    return (
      <div className="modal fade custom-modal" id="quickViewModal" tabIndex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            <div className="modal-body">
              <div className="text-center p-5">
                <p>No product selected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { id, name, description, price, discountPercentage, rating, stock, brand, category, images, quantity: productQuantity, inventoryQuantity } = selectedProduct;
  
  // Convert to numbers to handle string values
  const priceNum = parseFloat(price) || 0;
  const discountNum = parseFloat(discountPercentage) || 0;
  const ratingNum = parseFloat(rating) || 0;
  // Try multiple property names for stock/quantity
  const stockNum = parseInt(stock) || parseInt(productQuantity) || parseInt(inventoryQuantity) || 100;
  
  const discountedPrice = discountNum > 0 ? priceNum * (1 - discountNum / 100) : priceNum;
  
  // Get main image - handle different image property structures
  let mainImageUrl;
  if (images && Array.isArray(images) && images.length > selectedImage) {
    mainImageUrl = getImageUrl(images[selectedImage]);
  } else if (selectedProduct.image) {
    mainImageUrl = getImageUrl(selectedProduct.image);
  } else if (selectedProduct.thumbnail) {
    mainImageUrl = selectedProduct.thumbnail;
  } else {
    mainImageUrl = getUnsplashFallback(id);
  }
  
  const mainImage = mainImageUrl;
  const ratingWidth = ratingNum > 0 ? (ratingNum / 5) * 100 : 0;

  const handleQuantityChange = (change) => {
    const maxStock = stockNum > 0 ? stockNum : 999;
    const newQty = Math.max(1, Math.min(maxStock, quantity + change));
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity);
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart!',
      text: `${quantity} ${quantity > 1 ? 'items' : 'item'} of ${name} added to your cart`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleAddToWishlist = async () => {
    await addToWishlist(selectedProduct);
  };

  const handleAddToCompare = async () => {
    await addToCompare(selectedProduct);
  };

  return (
    <div className="modal fade custom-modal" id="quickViewModal" tabIndex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={clearQuickView}></button>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 col-sm-12 col-xs-12 mb-md-0 mb-sm-5">
                <div className="detail-gallery">
                  <div className="product-image-slider mb-4" style={{ position: 'relative' }}>
                    <figure 
                      className="border-radius-10 zoom-image" 
                      style={{ 
                        maxHeight: '500px', 
                        minHeight: '500px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: '#f8f9fa',
                        cursor: 'crosshair',
                        position: 'relative',
                        overflow: 'hidden',
                        margin: 0
                      }}
                      onMouseEnter={() => setShowMagnifier(true)}
                      onMouseLeave={() => setShowMagnifier(false)}
                      onMouseMove={handleMouseMove}
                    >
                      <img 
                        src={mainImage} 
                        alt={name}
                        onError={(e) => { e.target.src = getUnsplashFallback(id); }}
                        style={{ 
                          width: '100%', 
                          maxHeight: '500px', 
                          objectFit: 'contain',
                          pointerEvents: 'none'
                        }}
                      />
                      {showMagnifier && (
                        <div
                          style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            width: '150px',
                            height: '150px',
                            border: '3px solid #3BB77E',
                            borderRadius: '50%',
                            backgroundImage: `url(${mainImage})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '200%',
                            backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            zIndex: 10,
                            left: `calc(${magnifierPosition.x}% - 75px)`,
                            top: `calc(${magnifierPosition.y}% - 75px)`
                          }}
                        />
                      )}
                    </figure>
                  </div>
                  {images && images.length > 1 && (
                    <div className="slider-nav-thumbnails d-flex gap-2">
                      {images.slice(0, 4).map((img, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedImage(idx)}
                          className={`border-radius-10 overflow-hidden ${selectedImage === idx ? 'border-success' : ''}`}
                          style={{ 
                            cursor: 'pointer', 
                            border: selectedImage === idx ? '2px solid #3BB77E' : '2px solid #ececec',
                            flex: '0 0 80px',
                            height: '80px'
                          }}
                        >
                          <img 
                            src={getImageUrl(img)} 
                            alt={`${name} ${idx + 1}`}
                            onError={(e) => { e.target.src = getUnsplashFallback(id + idx); }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6 col-sm-12 col-xs-12">
                <div className="detail-info px-30 pl-30">
                  {discountNum > 0 && (
                    <span className="stock-status out-stock mb-3"> {Math.round(discountNum)}% Off </span>
                  )}
                  <h2 className="title-detail mb-3">
                    <Link to={`/shop-product-right/${id}`} className="text-heading" data-bs-dismiss="modal" style={{ fontSize: '24px', fontWeight: '700', color: '#253D4E' }}>
                      {name}
                    </Link>
                  </h2>
                  {ratingNum > 0 && (
                    <div className="product-detail-rating mb-3">
                      <div className="product-rate-cover d-flex align-items-center">
                        <div className="product-rate d-inline-block" style={{ position: 'relative', width: '60px', overflow: 'hidden' }}>
                          <div className="product-rating" style={{ width: `${ratingWidth}%` }}></div>
                        </div>
                        <span className="font-small ml-2 text-muted"> ({ratingNum.toFixed(1)})</span>
                      </div>
                    </div>
                  )}
                  <div className="clearfix product-price-cover mb-3">
                    <div className="product-price primary-color">
                      <span className="current-price text-brand" style={{ fontSize: '32px', fontWeight: '700' }}>{Math.round(discountedPrice)}</span>
                      {discountNum > 0 && (
                        <span className="ml-3">
                          <span className="save-price font-md color3 ml-15">{Math.round(discountNum)}% Off</span>
                          <span className="old-price font-md ml-15" style={{ fontSize: '18px' }}>{Math.round(priceNum)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {description && (
                    <div className="short-desc mb-4">
                      <div className="font-md" style={{ color: '#7E7E7E', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                  )}
                  <div className="detail-extralink mb-4">
                    <div className="d-flex align-items-stretch gap-3 flex-wrap">
                      <div className="detail-qty border radius">
                        <button 
                          type="button"
                          className="qty-down"
                          onClick={() => handleQuantityChange(-1)}
                          aria-label="Decrease quantity"
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
                        >
                          <i className="fi-rs-angle-small-up"></i>
                        </button>
                      </div>
                      <div className="product-extra-link2 d-flex gap-2">
                        <button 
                          type="submit" 
                          className="button button-add-to-cart"
                          onClick={handleAddToCart}
                        >
                          <i className="fi-rs-shopping-cart"></i>Add to cart
                        </button>
                        <button 
                          type="button"
                          aria-label="Add To Wishlist"
                          className="action-btn hover-up"
                          onClick={handleAddToWishlist}
                          style={{
                            color: isInWishlist(id) ? '#ff0000' : '',
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
                          onClick={handleAddToCompare}
                          style={{
                            color: isInCompare(id) ? '#3BB77E' : '',
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
                  </div>
                  <div className="font-sm border-top pt-3">
                    <ul className="list-unstyled">
                      {brand && <li className="mb-2"><span className="text-muted">Brand:</span> <span className="text-brand fw-bold">{brand}</span></li>}
                      {category && <li className="mb-2"><span className="text-muted">Category:</span> <span className="text-brand fw-bold">{typeof category === 'string' ? category : category?.categoryName || 'Uncategorized'}</span></li>}
                      <li className="mb-2"><span className="text-muted">Availability:</span> <span className={stockNum > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{stockNum > 0 ? `${stockNum} In Stock` : 'Out of Stock'}</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;

