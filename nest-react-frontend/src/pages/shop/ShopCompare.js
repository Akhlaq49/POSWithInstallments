import React from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/imageUtils';

const ShopCompare = () => {
  const { compareItems, removeFromCompare, clearCompare, loading } = useCompare();
  const { addToCart } = useCart();

  const handleRemove = async (item) => {
    const productName = item.productName || item.name || item.product?.productName;
    await removeFromCompare(item.productId || item.id, productName);
  };

  const handleAddToCart = (item) => {
    const product = {
      id: item.productId || item.id,
      productName: item.productName || item.name || item.product?.productName,
      name: item.productName || item.name || item.product?.productName,
      price: item.price || item.product?.price,
      image: item.imagePath || item.product?.imagePath,
      imagePath: item.imagePath || item.product?.imagePath,
      unit: item.unit || item.product?.unit,
      sku: item.sku || item.product?.sku,
      category: item.category || item.product?.category
    };
    addToCart(product);
  };

  const handleClearCompare = async () => {
    await clearCompare();
  };

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
            <span></span> Compare
          </div>
        </div>
      </div>
      <div className="container mb-80 mt-50">
        <div className="row">
          <div className="col-xl-10 col-lg-12 m-auto">
            <h1 className="heading-2 mb-10">Products Compare</h1>
            <h6 className="text-body mb-40">
              Compare <span className="text-brand">{compareItems.length}</span> products (Maximum 4)
            </h6>
            
            {compareItems.length === 0 ? (
              <div className="text-center pt-50 pb-50">
                <img src="/assets/imgs/theme/icons/icon-compare.svg" alt="Empty Compare" width="80" className="mb-20" />
                <h4 className="mb-20">No products to compare</h4>
                <p className="text-muted mb-30">Add products to compare their features</p>
                <Link to="/shop" className="btn btn-fill-out">
                  <i className="fi-rs-shopping-bag mr-10"></i>Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table text-center table-compare">
                    <tbody>
                      <tr className="pr_image">
                        <td className="text-muted font-sm fw-600 font-heading">Preview</td>
                        {compareItems.map((item) => {
                          // Handle both guest (flat) and authenticated (nested) data structures
                          let imagePath = item.imagePath || item.product?.imagePath;
                          
                          // Try to extract first image from imagePaths if available
                          const imagePaths = item.imagePaths || item.product?.imagePaths;
                          if (imagePaths && !imagePath) {
                            try {
                              const images = typeof imagePaths === 'string' ? JSON.parse(imagePaths) : imagePaths;
                              if (Array.isArray(images) && images.length > 0) {
                                imagePath = images[0];
                              }
                            } catch (e) {
                              console.warn('Failed to parse imagePaths:', e);
                            }
                          }
                          
                          const productName = item.productName || item.name || item.product?.productName;
                          return (
                            <td className="row_img" key={item.id}>
                              <img 
                                src={getImageUrl(imagePath) || '/assets/imgs/shop/product-1-1.jpg'} 
                                alt={productName}
                                style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_title">
                        <td className="text-muted font-sm fw-600 font-heading">Name</td>
                        {compareItems.map((item) => {
                          const productName = item.productName || item.name || item.product?.productName;
                          const productId = item.productId || item.id;
                          return (
                            <td className="product_name" key={item.id}>
                              <h6>
                                <Link to={`/shop-product-right?id=${productId}`} className="text-heading">
                                  {productName}
                                </Link>
                              </h6>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_price">
                        <td className="text-muted font-sm fw-600 font-heading">Price</td>
                        {compareItems.map((item) => {
                          const price = item.price || item.product?.price || 0;
                          return (
                            <td className="product_price" key={item.id}>
                              <h4 className="price text-brand">{Math.round(price)}</h4>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_rating">
                        <td className="text-muted font-sm fw-600 font-heading">Rating</td>
                        {compareItems.map((item) => {
                          return (
                            <td key={item.id}>
                              <div className="rating_wrap">
                                <div className="rating">
                                  <div className="product-rate d-inline-block">
                                    <div className="product-rating" style={{ width: '90%' }}></div>
                                  </div>
                                  <span className="rating_num">(4.0)</span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="description">
                        <td className="text-muted font-sm fw-600 font-heading">Description</td>
                        {compareItems.map((item) => {
                          const description = item.description || item.product?.description || 'No description available';
                          return (
                            <td className="row_text font-xs" key={item.id}>
                              <div className="font-sm text-muted" dangerouslySetInnerHTML={{ __html: description }} />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_stock">
                        <td className="text-muted font-sm fw-600 font-heading">Stock status</td>
                        {compareItems.map((item) => {
                          const stockStatus = item.stockStatus || item.product?.stockStatus || 'In Stock';
                          return (
                            <td className="row_stock" key={item.id}>
                              <span className="stock-status in-stock mb-0">
                                {stockStatus}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_add_to_cart">
                        <td className="text-muted font-sm fw-600 font-heading">Buy now</td>
                        {compareItems.map((item) => {
                          return (
                            <td className="row_btn" key={item.id}>
                              <button 
                                className="btn btn-sm btn-fill-out"
                                onClick={() => handleAddToCart(item)}
                              >
                                <i className="fi-rs-shopping-bag mr-5"></i>Add to cart
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="pr_remove">
                        <td className="text-muted font-md fw-600"></td>
                        {compareItems.map((item) => {
                          return (
                            <td className="row_remove" key={item.id}>
                              <button 
                                type="button"
                                className="text-muted border-0 bg-transparent p-0"
                                onClick={() => handleRemove(item)}
                                style={{ cursor: 'pointer' }}
                                aria-label="Remove from compare"
                              >
                                <i className="fi-rs-trash mr-5"></i>
                                <span>Remove</span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="divider-2 mb-30"></div>
                <div className="cart-action d-flex justify-content-between">
                  <Link to="/shop" className="btn">
                    <i className="fi-rs-arrow-left mr-10"></i>Continue Shopping
                  </Link>
                  <button 
                    className="btn btn-outline hover-up"
                    onClick={handleClearCompare}
                  >
                    <i className="fi-rs-trash mr-10"></i>Clear Compare List
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ShopCompare;

