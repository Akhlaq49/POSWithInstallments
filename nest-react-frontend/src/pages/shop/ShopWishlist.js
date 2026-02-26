import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import './ShopWishlist.css';

const ShopWishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Update select all when wishlist items change
  useEffect(() => {
    if (wishlistItems.length > 0 && selectedItems.length === wishlistItems.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, wishlistItems]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(wishlistItems.map(item => item.id));
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleAddSelectedToCart = () => {
    const itemsToAdd = wishlistItems.filter(item => selectedItems.includes(item.id));
    itemsToAdd.forEach(item => handleAddToCart(item));
    setSelectedItems([]);
  };

  const handleRemove = async (item) => {
    await removeFromWishlist(item.productId, item.product?.productName);
  };

  const handleAddToCart = (item) => {
    const product = {
      id: item.productId,
      productName: item.product?.productName,
      name: item.product?.productName,
      price: item.product?.price,
      image: item.product?.imagePath,
      imagePath: item.product?.imagePath,
      unit: item.product?.unit,
      sku: item.product?.sku,
      category: item.product?.category
    };
    addToCart(product);
  };

  const handleClearWishlist = async () => {
    await clearWishlist();
  };

  if (!isAuthenticated) {
    return (
      <div className="page-content pt-150 pb-150">
        <div className="container">
          <div className="row">
            <div className="col-xl-8 col-lg-10 col-md-12 m-auto">
              <div className="text-center">
                <h2 className="mb-20">Please Login</h2>
                <p className="mb-20">You need to be logged in to view your wishlist.</p>
                <Link to="/login" className="btn btn-fill-out btn-block hover-up">
                  <i className="fi-rs-sign-in mr-10"></i>Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content pt-150 pb-150">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="main">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
            <span></span> Shop
            <span></span> Wishlist
          </div>
        </div>
      </div>
      <div className="container mb-30 mt-50">
        <div className="row">
          <div className="col-xl-10 col-lg-12 m-auto">
            <div className="mb-50">
              <h1 className="heading-2 mb-10">Your Wishlist</h1>
              <h6 className="text-body">
                There are <span className="text-brand">{wishlistItems.length}</span> products in your wishlist
              </h6>
            </div>
            
            {wishlistItems.length === 0 ? (
              <div className="text-center pt-50 pb-50">
                <img src="/assets/imgs/theme/icons/icon-heart.svg" alt="Empty Wishlist" width="80" className="mb-20" />
                <h4 className="mb-20">Your wishlist is empty</h4>
                <p className="text-muted mb-30">Save your favorite products to your wishlist</p>
                <Link to="/shop" className="btn btn-fill-out">
                  <i className="fi-rs-shopping-bag mr-10"></i>Continue Shopping
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
                              id="exampleCheckbox11" 
                              checked={selectAll}
                              onChange={handleSelectAll}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </th>
                        <th scope="col">Image</th>
                        <th scope="col">Product</th>
                        <th scope="col">Price</th>
                        <th scope="col">Stock Status</th>
                        <th scope="col">Action</th>
                        <th scope="col" className="end">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlistItems.map((item, index) => {
                        const product = item.product || {};
                        const checkboxId = `exampleCheckbox${index + 1}`;
                        return (
                          <tr className="pt-30" key={item.id}>
                            <td className="pl-30">
                              <div className="custome-checkbox">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  name="checkbox" 
                                  id={checkboxId}
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </td>
                            <td className="image product-thumbnail pt-40">
                              <img 
                                src={getImageUrl(product.imagePath) || '/assets/imgs/shop/product-1-1.jpg'} 
                                alt={product.productName}
                              />
                            </td>
                            <td className="product-des product-name">
                              <h6>
                                <Link 
                                  className="product-name mb-10 text-heading" 
                                  to={`/shop-product-right?id=${item.productId}`}
                                >
                                  {product.productName}
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
                              <h3 className="text-brand">{Math.round(product.price || 0)}</h3>
                            </td>
                            <td className="text-center detail-info" data-title="Stock">
                              <span className="stock-status in-stock mb-0">
                                {product.stockStatus || 'In Stock'}
                              </span>
                            </td>
                            <td className="text-right" data-title="Cart">
                              <button 
                                className="btn btn-sm btn-fill-out"
                                onClick={() => handleAddToCart(item)}
                              >
                                <i className="fi-rs-shopping-bag mr-5"></i>Add to cart
                              </button>
                            </td>
                            <td className="action text-center" data-title="Remove">
                              <button
                                type="button"
                                className="text-body"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemove(item);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer'
                                }}
                              >
                                <i className="fi-rs-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="divider-2 mb-30"></div>
                <div className="cart-action d-flex justify-content-between">
                  <Link to="/shop" className="btn">
                    <i className="fi-rs-arrow-left mr-10"></i>Continue Shopping
                  </Link>
                  <div className="d-flex gap-2">
                    {selectedItems.length > 0 && (
                      <button 
                        className="btn btn-fill-out hover-up"
                        onClick={handleAddSelectedToCart}
                      >
                        <i className="fi-rs-shopping-bag mr-10"></i>Add Selected to Cart ({selectedItems.length})
                      </button>
                    )}
                    <button 
                      className="btn btn-outline hover-up"
                      onClick={handleClearWishlist}
                    >
                      <i className="fi-rs-trash mr-10"></i>Clear Wishlist
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ShopWishlist;

