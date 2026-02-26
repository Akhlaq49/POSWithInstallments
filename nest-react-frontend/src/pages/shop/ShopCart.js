import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { showConfirm, showSuccess } from '../../utils/swal';
import { getUnsplashFallback, getImageUrl } from '../../utils/imageUtils';
import './ShopCart.css';

const ShopCart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotals } = useCart();
  const [selectedItems, setSelectedItems] = useState([]);
  const totals = getCartTotals();
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef(null);

  // Sync selectedItems with cartItems when cart changes
  useEffect(() => {
    setSelectedItems(cartItems.map(item => item.id));
  }, [cartItems]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
        setCountrySearch('');
      }
    };

    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryDropdownOpen]);

  const countries = [
    'United Kingdom',
    'USA (US)',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'India',
    'Pakistan'
  ];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleQuantityChange = (itemId, delta) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    setSelectedItems(selectedItems.filter(id => id !== itemId));
  };

  const handleClearCart = async () => {
    const result = await showConfirm(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      'Yes, Clear Cart',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      clearCart();
      setSelectedItems([]);
    }
  };


  return (
    <div className="main-content-inner">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/"><i className="fi-rs-home mr-5"></i>Home</Link>
            <span></span> Shop
            <span></span> Cart
          </div>
        </div>
      </div>

      <div className="container mb-80 mt-50">
        <div className="row">
          <div className="col-lg-8 mb-40">
            <h1 className="heading-2 mb-10">Your Cart</h1>
            <div className="d-flex justify-content-between">
              <h6 className="text-body">
                There are <span className="text-brand">{cartItems.length}</span> product{cartItems.length !== 1 ? 's' : ''} in your cart
              </h6>
              {cartItems.length > 0 && (
                <h6 className="text-body">
                  <button type="button" className="text-muted border-0 bg-transparent p-0" onClick={handleClearCart} style={{ cursor: 'pointer' }}>
                    <i className="fi-rs-trash mr-5"></i>Clear Cart
                  </button>
                </h6>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
            {cartItems.length === 0 ? (
              <div className="text-center py-5">
                <h3 className="mb-20">Your cart is empty</h3>
                <Link to="/shop" className="btn">
                  <i className="fi-rs-arrow-left mr-10"></i>Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="table-responsive shopping-summery">
                  <table className="table table-wishlist">
                    <thead>
                      <tr className="main-heading">
                        <th className="start pl-30">
                          <div className="custome-checkbox">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name="checkbox"
                              id="selectAll"
                              checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </th>
                        <th scope="col">Image</th>
                        <th scope="col">Product</th>
                        <th scope="col">Unit Price</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Subtotal</th>
                        <th scope="col" className="end">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, index) => (
                        <tr key={item.id} className={index === 0 ? 'pt-30' : ''}>
                          <td className="pl-30">
                            <div className="custome-checkbox">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="checkbox"
                                id={`checkbox-${item.id}`}
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </td>
                          <td className="image product-thumbnail pt-40">
                            <img 
                              src={getImageUrl(item.image) || item.image} 
                              alt={item.productName}
                              onError={(e) => {
                                e.target.src = getUnsplashFallback(0);
                              }}
                            />
                          </td>
                          <td className="product-des product-name">
                            <h6 className="mb-5">
                              <Link className="product-name mb-10 text-heading" to={`/shop-product-right?id=${item.id}`}>
                                {item.productName}
                              </Link>
                            </h6>
                            <div className="product-rate-cover">
                              <div className="product-rate d-inline-block">
                                <div className="product-rating" style={{ width: '90%' }}></div>
                              </div>
                              <span className="font-small ml-5 text-muted"> (4.0)</span>
                            </div>
                          </td>
                          <td className="price" data-title="Price">
                            <h4 className="text-body">{Math.round(Number(item.price) || 0)}</h4>
                          </td>
                          <td className="text-center detail-info" data-title="Stock">
                            <div className="detail-extralink mr-15">
                              <div className="detail-qty border radius">
                                <button 
                                  type="button"
                                  className="qty-down"
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  aria-label="Decrease quantity"
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                  <i className="fi-rs-angle-small-down"></i>
                                </button>
                                <input 
                                  type="text" 
                                  name="quantity" 
                                  className="qty-val" 
                                  value={item.quantity || 1} 
                                  min="1"
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    if (newQty > 0) {
                                      updateQuantity(item.id, newQty);
                                    }
                                  }}
                                />
                                <button 
                                  type="button"
                                  className="qty-up"
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  aria-label="Increase quantity"
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                  <i className="fi-rs-angle-small-up"></i>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="price" data-title="Price">
                            <h4 className="text-brand">{Math.round((Number(item.price) || 0) * (Number(item.quantity) || 0))}</h4>
                          </td>
                          <td className="action text-center" data-title="Remove">
                            <button 
                              type="button"
                              className="text-body border-0 bg-transparent p-0"
                              onClick={() => handleRemoveItem(item.id)}
                              style={{
                                display: 'inline-block',
                                cursor: 'pointer',
                                width: '30px',
                                height: '30px',
                                lineHeight: '30px',
                                textAlign: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.3s',
                                color: '#666'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f5f5f5';
                                e.target.style.color = '#e74c3c';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#666';
                              }}
                            >
                              <i className="fi-rs-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divider-2 mb-30"></div>
                <div className="cart-action d-flex justify-content-between">
                  <Link to="/shop" className="btn">
                    <i className="fi-rs-arrow-left mr-10"></i>Continue Shopping
                  </Link>
                  <button 
                    type="button"
                    className="btn mr-10 mb-sm-15"
                    onClick={(e) => {
                      e.preventDefault();
                      showSuccess('Cart Updated', 'Your cart has been updated successfully');
                    }}
                  >
                    <i className="fi-rs-refresh mr-10"></i>Update Cart
                  </button>
                </div>

                <div className="row mt-50">
                  <div className="col-lg-7">
                    <div className="calculate-shiping p-40 border-radius-15 border">
                      <h4 className="mb-10">Calculate Shipping</h4>
                      <p className="mb-30">
                        <span className="font-lg text-muted">Flat rate:</span>
                        <strong className="text-brand">5%</strong>
                      </p>
                      <form className="field_form shipping_calculator">
                        <div className="form-row">
                          <div className="form-group col-lg-12">
                            <div className="country-select-wrapper" ref={countryDropdownRef}>
                              <div 
                                className="country-select-active"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                              >
                                <span>{selectedCountry}</span>
                                <i className="fi-rs-angle-down"></i>
                              </div>
                              {isCountryDropdownOpen && (
                                <div className="country-select-dropdown">
                                  <div className="dropdown-search">
                                    <input
                                      type="text"
                                      placeholder="Search countries..."
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="dropdown-options">
                                    {countries
                                      .filter(country => country.toLowerCase().includes(countrySearch.toLowerCase()))
                                      .map((country, index) => (
                                        <div 
                                          key={index}
                                          className={`dropdown-option ${selectedCountry === country ? 'selected' : ''}`}
                                          onClick={() => {
                                            setSelectedCountry(country);
                                            setIsCountryDropdownOpen(false);
                                            setCountrySearch('');
                                          }}
                                        >
                                          {country}
                                        </div>
                                      ))
                                    }
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="form-row row">
                          <div className="form-group col-lg-6">
                            <input required="required" placeholder="State / Country" name="state" type="text" />
                          </div>
                          <div className="form-group col-lg-6">
                            <input required="required" placeholder="PostCode / ZIP" name="postcode" type="text" />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <div className="p-40">
                      <h4 className="mb-10">Apply Coupon</h4>
                      <p className="mb-30">
                        <span className="font-lg text-muted">Using A Promo Code?</span>
                      </p>
                      <form action="#">
                        <div className="d-flex justify-content-between">
                          <input 
                            className="font-medium mr-15 coupon" 
                            name="Coupon" 
                            placeholder="Enter Your Coupon"
                          />
                          <button 
                            className="btn" 
                            type="submit"
                            onClick={(e) => {
                              e.preventDefault();
                              showSuccess('Coupon Applied', 'Your coupon has been applied successfully');
                            }}
                          >
                            <i className="fi-rs-label mr-10"></i>Apply
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="col-lg-4">
            <div className="border p-md-4 cart-totals ml-30">
              <div className="table-responsive">
                <table className="table no-border">
                  <tbody>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Subtotal</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h4 className="text-brand text-end">{Math.round(Number(totals.subtotal) || 0)}</h4>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        <div className="divider-2 mt-10 mb-10"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Shipping</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h5 className="text-heading text-end">Free</h5>
                      </td>
                    </tr>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Estimate for</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h5 className="text-heading text-end">United Kingdom</h5>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        <div className="divider-2 mt-10 mb-10"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Total</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h4 className="text-brand text-end">{Math.round(Number(totals.total) || 0)}</h4>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Link to="/shop-checkout" className="btn mb-20 w-100">
                Proceed To CheckOut<i className="fi-rs-sign-out ml-15"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCart;
