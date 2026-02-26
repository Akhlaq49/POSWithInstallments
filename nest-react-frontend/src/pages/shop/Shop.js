import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getProductsByCategory, getCategoriesHierarchical, getProductsBySubCategory, getProductsBySubCategory1 } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useQuickView } from '../../context/QuickViewContext';
import { getClothingImage, getUnsplashFallback, getImageUrl } from '../../utils/imageUtils';
import NoProductsFound from '../../components/common/NoProductsFound';
import './Shop.css';

const Shop = () => {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const { showQuickView } = useQuickView();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');
  const subCategoryIdParam = searchParams.get('subCategoryId');
  const subCategory1IdParam = searchParams.get('subCategory1Id');
  const searchTerm = searchParams.get('search');
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for category counts
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam || null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategoryIdParam || null);
  const [selectedSubCategory1, setSelectedSubCategory1] = useState(subCategory1IdParam || null);
  const [sortBy] = useState('featured');
  const [pageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [maxPrice, setMaxPrice] = useState(10000);
  const [unfilteredProducts, setUnfilteredProducts] = useState([]); // Store unfiltered products

  // Clean up zoom elements when component mounts
  useEffect(() => {
    if (window.jQuery) {
      // Remove all zoom-related DOM elements
      window.jQuery('.zoomWindowContainer, .zoomContainer, .zoomWindow, .zoomLens').remove();
      
      // Clean up all images with zoom data
      window.jQuery('img').each(function() {
        const $img = window.jQuery(this);
        if ($img.data('elevateZoom')) {
          $img.removeData('elevateZoom');
          $img.removeData('zoomImage');
          $img.removeAttr('data-zoom-image');
        }
        // Remove any zoom-related inline styles
        $img.css('cursor', '');
      });
    }
  }, []);

  // Fetch hierarchical categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesHierarchical();
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);
  
  // Update selected categories from URL params
  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategory(categoryIdParam);
    }
    if (subCategoryIdParam) {
      setSelectedSubCategory(subCategoryIdParam);
    }
    if (subCategory1IdParam) {
      setSelectedSubCategory1(subCategory1IdParam);
    }
  }, [categoryIdParam, subCategoryIdParam, subCategory1IdParam]);

  // Fetch all products for category counts (only once)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const data = await getProducts();
        setAllProducts(data || []);
      } catch (error) {
        console.error('Error fetching all products:', error);
      }
    };
    fetchAllProducts();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let data = [];
        
        // Priority: SubCategory1 > SubCategory > Category > All
        if (selectedSubCategory1) {
          // Try API endpoint first, fallback to filtering
          try {
            data = await getProductsBySubCategory1(selectedSubCategory1);
            if (data.length === 0) {
              // Fallback: filter all products
              const allData = await getProducts();
              data = allData.filter(p => p.childCategoryId === selectedSubCategory1);
            }
          } catch (error) {
            // Fallback: filter all products
            const allData = await getProducts();
            data = allData.filter(p => p.childCategoryId === selectedSubCategory1);
          }
        } else if (selectedSubCategory) {
          // Try API endpoint first, fallback to filtering
          try {
            data = await getProductsBySubCategory(selectedSubCategory);
            if (data.length === 0) {
              // Fallback: filter all products
              const allData = await getProducts();
              data = allData.filter(p => p.subCategoryId === selectedSubCategory);
            }
          } catch (error) {
            // Fallback: filter all products
            const allData = await getProducts();
            data = allData.filter(p => p.subCategoryId === selectedSubCategory);
          }
        } else if (selectedCategory) {
          data = await getProductsByCategory(selectedCategory);
        } else {
          // Otherwise, fetch all products
          data = await getProducts();
        }
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          data = data.filter(p => {
            const productName = (p.productName || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            const brandName = (p.brand?.name || '').toLowerCase();
            const categoryName = (p.category?.categoryName || '').toLowerCase();
            return productName.includes(searchLower) || 
                   description.includes(searchLower) ||
                   brandName.includes(searchLower) ||
                   categoryName.includes(searchLower);
          });
        }
        
        // Calculate max price and store unfiltered products
        if (data.length > 0) {
          const calculatedMaxPrice = Math.max(...data.map(p => parseFloat(p.price || 0)));
          const roundedMaxPrice = Math.ceil(calculatedMaxPrice / 100) * 100; // Round up to nearest 100
          setMaxPrice(roundedMaxPrice);
          setPriceRange({ min: 0, max: roundedMaxPrice });
        }
        
        // Store unfiltered products for price filtering
        setUnfilteredProducts(data || []);
        
        // Apply sorting
        data = sortProducts(data, sortBy);
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setUnfilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedSubCategory, selectedSubCategory1, sortBy, searchTerm]);

  // Apply price filter locally when price range changes
  useEffect(() => {
    if (unfilteredProducts.length > 0) {
      const filtered = unfilteredProducts.filter(p => {
        const price = parseFloat(p.price || 0);
        return price >= priceRange.min && price <= priceRange.max;
      });
      setProducts(sortProducts(filtered, sortBy));
    }
  }, [priceRange, unfilteredProducts, sortBy]);

  // Sort products
  const sortProducts = (productsList, sortType) => {
    const sorted = [...productsList];
    switch (sortType) {
      case 'price-low':
        return sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      case 'price-high':
        return sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
      case 'name':
        return sorted.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdOn || 0) - new Date(a.createdOn || 0));
      case 'rating':
        return sorted; // Rating sorting would need rating data
      default: // 'featured'
        return sorted;
    }
  };

  // Handle category filter
  const handleCategoryFilter = (categoryId, subCategoryId = null, subCategory1Id = null) => {
    const params = {};
    
    // Preserve search term if it exists
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (categoryId) {
      params.categoryId = categoryId;
      setSelectedCategory(categoryId);
    } else {
      setSelectedCategory(null);
    }
    
    if (subCategoryId) {
      params.subCategoryId = subCategoryId;
      setSelectedSubCategory(subCategoryId);
    } else {
      setSelectedSubCategory(null);
    }
    
    if (subCategory1Id) {
      params.subCategory1Id = subCategory1Id;
      setSelectedSubCategory1(subCategory1Id);
    } else {
      setSelectedSubCategory1(null);
    }
    
    setSearchParams(params);
    setCurrentPage(1);
  };
  
  // Get current category name for display
  const getCurrentCategoryName = () => {
    if (searchTerm) {
      return `Search Results for "${searchTerm}"`;
    }
    if (selectedSubCategory1) {
      const category = categories.find(c => c.subCategory1s?.some(s => s.id === selectedSubCategory1));
      const subCategory1 = category?.subCategory1s?.find(s => s.id === selectedSubCategory1);
      return subCategory1?.name || 'Shop';
    }
    if (selectedSubCategory) {
      const category = categories.find(c => c.subCategories?.some(s => s.id === selectedSubCategory));
      const subCategory = category?.subCategories?.find(s => s.id === selectedSubCategory);
      return subCategory?.name || 'Shop';
    }
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      return category?.categoryName || 'Shop';
    }
    return 'Shop';
  };


  // Pagination
  const totalPages = Math.ceil(products.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = products.slice(startIndex, endIndex);

  // Get product count for category (use allProducts for accurate counts)
  const getCategoryProductCount = (categoryId) => {
    return allProducts.filter(p => p.categoryId === categoryId || p.category?.id === categoryId).length;
  };


  // Format product data
  const formatProduct = (product, index = 0) => {
    const apiImage = product.imagePath || null;
    const apiHoverImage = product.imagePath || null;
    // Show childCategory if available, otherwise show category
    const categoryDisplay = product.childCategory?.childCategoryName || product.category?.categoryName || 'Uncategorized';
    
    // Extract first image from imagePaths if available
    let imagePath = apiImage;
    let imageArray = [];
    if (product.imagePaths) {
      try {
        const images = typeof product.imagePaths === 'string' ? JSON.parse(product.imagePaths) : product.imagePaths;
        if (Array.isArray(images) && images.length > 0) {
          imagePath = images[0];
          imageArray = images;
        }
      } catch (e) {
        console.warn('Failed to parse imagePaths:', e);
      }
    }
    
    // If no images array, use the single image
    if (imageArray.length === 0 && imagePath) {
      imageArray = [imagePath];
    }
    
    return {
      id: product.id,
      name: product.productName || 'Product',
      productName: product.productName || 'Product',
      category: categoryDisplay,
      categoryId: product.categoryId,
      price: Math.round(parseFloat(product.price || 0)),
      image: getImageUrl(imagePath) || getClothingImage(apiImage, index),
      hoverImage: getImageUrl(apiHoverImage) || getClothingImage(apiHoverImage, index + 1),
      images: imageArray, // Array of images for quick view modal
      imagePath: imagePath, // First image path for compare
      imagePaths: product.imagePaths, // Full image paths array for compare
      description: product.description, // Product description for compare
      rating: 90, // Default rating
      vendor: product.brand?.brandName || 'Corio Fashion',
      brand: product.brand, // Brand object for compare
      sku: product.sku,
      stock: product.stock
    };
  };

  return (
    <main className="main">
      <div className="page-header mt-30 mb-50">
        <div className="container">
          <div className="archive-header">
            <div className="row align-items-center">
              <div className="col-xl-3">
                <h1 className="mb-15">
                  {getCurrentCategoryName()}
                </h1>
                <div className="breadcrumb">
                  <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
                  <span></span> Shop
                  {selectedCategory && (
                    <>
                      <span></span> {categories.find(c => c.id === selectedCategory)?.categoryName}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mb-30">
        <div className="row">
          <div className="col-lg-4-5">
            <div className="shop-product-fillter">
              <div className="totall-product">
                <p>
                  We found <strong className="text-brand">{products.length}</strong> items for you!
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-50">
                <p>Loading products...</p>
              </div>
            ) : (
              <>
                <div className="row product-grid">
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product, index) => {
                      const formattedProduct = formatProduct(product, index);
                      return (
                        <div key={product.id} className="col-lg-3 col-md-4 col-12 col-sm-6">
                          <div className="product-cart-wrap mb-30">
                            <div className="product-img-action-wrap" style={{ position: 'relative' }}>
                              <div className="product-img product-img-zoom">
                                <Link to={`/shop-product-right?id=${product.id}`}>
                                  <img
                                    className="default-img"
                                    src={formattedProduct.image}
                                    alt={formattedProduct.name}
                                    style={{ width: '100%', height: '222px', maxWidth: '100%' }}
                                    onError={(e) => { e.target.src = getUnsplashFallback(0); }}
                                  />
                                  <img
                                    className="hover-img"
                                    src={formattedProduct.hoverImage}
                                    alt={formattedProduct.name}
                                      style={{ width: '100%', height: '222px', maxWidth: '100%' }}
                                    onError={(e) => { e.target.src = getUnsplashFallback(1); }}
                                  />
                                </Link>
                              </div>
                              <div className="product-action-1">
                                <button
                                  type="button"
                                  aria-label="Add To Wishlist"
                                  className="action-btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToWishlist(product);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: isInWishlist(product.id) ? '#ff0000' : ''
                                  }}
                                >
                                  <i className="fi-rs-heart"></i>
                                </button>
                                <button
                                  type="button"
                                  aria-label="Compare"
                                  className="action-btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCompare(product);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: isInCompare(product.id) ? '#3BB77E' : ''
                                  }}
                                >
                                  <i className="fi-rs-shuffle"></i>
                                </button>
                                <button
                                  type="button"
                                  aria-label="Quick view"
                                  className="action-btn"
                                  data-bs-toggle="modal"
                                  data-bs-target="#quickViewModal"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    showQuickView(formattedProduct);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="fi-rs-eye"></i>
                                </button>
                              </div>
                              {index < 3 && (
                                <div className="product-badges product-badges-position product-badges-mrg">
                                  <span className={index === 0 ? 'hot' : index === 1 ? 'sale' : 'new'}>
                                    {index === 0 ? 'Hot' : index === 1 ? 'Sale' : 'New'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="product-content-wrap">
                              <div className="product-category">
                                <Link
                                  to={`/shop?categoryId=${formattedProduct.categoryId}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleCategoryFilter(formattedProduct.categoryId);
                                  }}
                                >
                                  {formattedProduct.category}
                                </Link>
                              </div>
                              <h2>
                                <Link to={`/shop-product-right?id=${product.id}`}>
                                  {formattedProduct.name}
                                </Link>
                              </h2>
                              <div className="product-rate-cover">
                                <div className="product-rate d-inline-block">
                                  <div
                                    className="product-rating"
                                    style={{ width: `${formattedProduct.rating}%` }}
                                  ></div>
                                </div>
                                <span className="font-small ml-5 text-muted"> (4.0)</span>
                              </div>
                              <div>
                                <span className="font-small text-muted">
                                  By <Link to="/vendors-grid">{formattedProduct.vendor}</Link>
                                </span>
                              </div>
                              <div className="product-card-bottom">
                                <div className="product-price">
                                  <span>{formattedProduct.price}</span>
                                </div>
                                <div className="add-cart">
                                  <button 
                                    className="add" 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      addToCart({
                                        id: product.id,
                                        name: formattedProduct.name,
                                        productName: formattedProduct.name,
                                        price: formattedProduct.price,
                                        image: formattedProduct.image,
                                        quantity: 1,
                                        stock: product.quantity || 999
                                      });
                                    }}
                                  >
                                    <i className="fi-rs-shopping-cart mr-5"></i>Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <NoProductsFound
                      searchTerm={searchTerm}
                      hasFilters={
                        !!searchTerm || 
                        priceRange.min > 0 || 
                        priceRange.max < maxPrice || 
                        !!selectedCategory || 
                        !!selectedSubCategory || 
                        !!selectedSubCategory1
                      }
                      message={
                        searchTerm 
                          ? `We couldn't find any products matching "${searchTerm}"`
                          : (priceRange.min > 0 || priceRange.max < maxPrice)
                            ? 'No products match your price filter'
                            : selectedSubCategory1 || selectedSubCategory || selectedCategory
                              ? 'No products available in this category'
                              : 'No products available at the moment'
                      }
                      onClearFilters={() => {
                        setSearchParams({});
                        setSelectedCategory(null);
                        setSelectedSubCategory(null);
                        setSelectedSubCategory1(null);
                        setPriceRange({ min: 0, max: maxPrice });
                      }}
                    />
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="pagination-area mt-20 mb-20">
                    <nav aria-label="Page navigation example">
                      <ul className="pagination justify-content-start">
                        <li className="page-item">
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <i className="fi-rs-arrow-small-left"></i>
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <li
                                key={page}
                                className={`page-item ${currentPage === page ? 'active' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="page-link"
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </button>
                              </li>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <li key={page} className="page-item">
                                <button type="button" className="page-link dot" disabled>
                                  ...
                                </button>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li className="page-item">
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <i className="fi-rs-arrow-small-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="col-lg-1-5 primary-sidebar sticky-sidebar">
            <div className="sidebar-widget widget-category-2 mb-30">
              <h5 className="section-title style-1 mb-30">Category</h5>
              <ul>
                <li>
                  <button
                    type="button"
                    className={`category-link ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <span>All Categories</span>
                  </button>
                  <span className="count">{allProducts.length}</span>
                </li>
                {categories.map((category) => {
                  const count = getCategoryProductCount(category.id);
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        className={`category-link ${selectedCategory === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryFilter(category.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{category.categoryName}</span>
                      </button>
                      <span className="count">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Price Filter */}
            <div className="sidebar-widget price_range range mb-30">
              <h5 className="section-title style-1 mb-30">Fill by price</h5>
              <div className="price-filter">
                <div className="price-filter-inner">
                  <div className="d-flex justify-content-between mb-20">
                    <div className="caption">
                      From: <strong className="text-brand">{priceRange.min}</strong>
                    </div>
                    <div className="caption">
                      To: <strong className="text-brand">{priceRange.max}</strong>
                    </div>
                  </div>
                  <div className="mb-15">
                    <label className="form-label small text-muted">Min Price</label>
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="10"
                      value={priceRange.min}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value);
                        if (newMin <= priceRange.max) {
                          setPriceRange({ ...priceRange, min: newMin });
                        }
                      }}
                      className="form-range"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="form-label small text-muted">Max Price</label>
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      step="10"
                      value={priceRange.max}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value);
                        if (newMax >= priceRange.min) {
                          setPriceRange({ ...priceRange, max: newMax });
                        }
                      }}
                      className="form-range"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-default mt-10"
                onClick={() => setPriceRange({ min: 0, max: maxPrice })}
              >
                <i className="fi-rs-filter mr-5"></i> Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Shop;
