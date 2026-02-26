import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategoriesHierarchical } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { showConfirm, showSuccess } from '../../utils/swal';
import { getUnsplashFallback } from '../../utils/imageUtils';
import './Header.css';


const Header = () => {
  const { cartItems, removeFromCart, getCartTotals } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { compareCount } = useCompare();
  const navigate = useNavigate();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [hoveredMenuCategory, setHoveredMenuCategory] = useState(null);
  const [hoveredMenuSubCategory, setHoveredMenuSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef(null);
  const categoryRef = useRef(null);
  const menuHoverTimeoutRef = useRef(null);
  
  const cartTotals = getCartTotals();

  const handleLogout = async () => {
    const result = await showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      'Yes, Logout',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      logout();
      showSuccess('Logged Out', 'You have been successfully logged out', 1500).then(() => {
        navigate('/login');
      });
    }
  };

  // Fetch hierarchical categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const apiCategories = await getCategoriesHierarchical();
        
        // Map API categories to UI format with default icons
        const categoryIcons = [
          'category-1.svg', 'category-2.svg', 'category-3.svg', 'category-4.svg', 
          'category-5.svg', 'category-6.svg', 'category-7.svg', 'category-8.svg',
          'category-9.svg', 'category-10.svg'
        ];
        
        const mappedCategories = apiCategories
          .filter(cat => cat.isActive) // Only show active categories
          .map((cat, index) => {
            // Map subcategories with their nested subCategory1s (support API shapes: sub.subCategory1s or sub.childCategories)
            const subCategories = (cat.subCategories || [])
              .filter(sub => sub.isActive)
              .map(sub => {
                // Get subCategory1s from the subCategory object itself (already normalized from childCategories in api.js)
                const nestedSubCategory1s = (sub.subCategory1s || [])
                  .filter(s => s && s.isActive !== false)
                  .map(s => ({
                    id: s.id,
                    name: s.subCategoryName || s.childCategoryName || s.name,
                    code: s.categoryCode || s.childCategoryCode || s.code,
                    imagePath: s.imagePath,
                    link: `/shop?categoryId=${cat.id}&subCategoryId=${sub.id}&subCategory1Id=${s.id}`
                  }));

                const subCatWithSub1s = {
                  id: sub.id,
                  name: sub.subCategoryName || sub.name,
                  code: sub.categoryCode || sub.code,
                  imagePath: sub.imagePath,
                  link: `/shop?categoryId=${cat.id}&subCategoryId=${sub.id}`,
                  subCategory1s: nestedSubCategory1s || []
                };
                
                // Debug logging
                if (nestedSubCategory1s.length > 0) {
                  console.log(`SubCategory ${subCatWithSub1s.name} (${subCatWithSub1s.id}) has ${nestedSubCategory1s.length} subCategory1s:`, nestedSubCategory1s.map(s => s.name));
                }
                
                return subCatWithSub1s;
              });
            
            // Map subcategory1s (third level) - directly under category (use normalized subCategory1s from api.js)
            const subCategory1s = (cat.subCategory1s || [])
              .filter(sub1 => sub1 && sub1.isActive !== false)
              .map(sub1 => ({
                id: sub1.id,
                name: sub1.subCategoryName || sub1.childCategoryName || sub1.name,
                code: sub1.categoryCode || sub1.childCategoryCode || sub1.code,
                imagePath: sub1.imagePath,
                link: `/shop?categoryId=${cat.id}&subCategory1Id=${sub1.id}`
              }));
            
            return {
              id: cat.id,
              name: cat.categoryName,
              slug: cat.categorySlug,
              icon: categoryIcons[index % categoryIcons.length],
              link: `/shop?categoryId=${cat.id}`,
              subCategories: subCategories,
              subCategory1s: subCategory1s
            };
          });
        
        setCategories(mappedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      // Close search category dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setDropdownSearch('');
      }
    };

    if (isCategoryOpen || isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen, isDropdownOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (menuHoverTimeoutRef.current) {
        clearTimeout(menuHoverTimeoutRef.current);
      }
    };
  }, []);





  return (
    <header className="header-area header-style-1 header-height-2">
      <div className="mobile-promotion">
        <span>New Collection Launch, <strong>up to 30%</strong> off fashion items. Only <strong>3 days</strong> left</span>
      </div>
      
      {/* Header Top */}
      {/* <div className="header-top header-top-ptb-1 d-none d-lg-block">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-3 col-lg-4">
              <div className="header-info">
                <ul>
                  <li><Link to="/about">About Us</Link></li>
                  <li><Link to="/account">My Account</Link></li>
                  <li><Link to="/shop-wishlist">Wishlist</Link></li>
                  <li><Link to="/account?tab=orders">Order</Link></li>
                </ul>
              </div>
            </div>
            <div className="col-xl-6 col-lg-4">
              <div className="text-center">
                <div id="news-flash" className="d-inline-block">
                  <ul>
                    <li>100% Secure delivery without contacting the courier | Super Value Deals - Save more with coupons</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-lg-4">
              <div className="header-info header-info-right">
                <ul>
                  <li>Need help? Call Us: <strong className="text-brand"> + 1800 900</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Header Middle */}
      <div className="header-middle header-middle-ptb-1 d-none d-lg-block">
        <div className="container">
          <div className="header-wrap">
            <div className="logo logo-width-1">
              <Link to="/"><img src="/assets/imgs/theme/logo.svg" alt="logo" /></Link>
            </div>
            <div className="header-right">
              <div className="search-style-2">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  if (searchTerm) params.append('search', searchTerm);
                  if (searchCategory) params.append('categoryId', searchCategory);
                  navigate(`/shop${params.toString() ? '?' + params.toString() : ''}`);
                }}>
                  <div className="custom-select-wrapper" ref={dropdownRef}>
                    <div 
                      className="select-active"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span>{categories.find(cat => cat.id === searchCategory)?.name || 'All Categories'}</span>
                      <i className="fi-rs-angle-down"></i>
                    </div>
                    {isDropdownOpen && (
                      <div className="select-dropdown">
                        <div className="dropdown-search">
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="dropdown-options">
                          <div 
                            className={`dropdown-option ${!searchCategory ? 'selected' : ''}`}
                            onClick={() => {
                              setSearchCategory('');
                              setIsDropdownOpen(false);
                              setDropdownSearch('');
                            }}
                          >
                            All Categories
                          </div>
                          {categories
                            .filter(cat => cat.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                            .map(cat => (
                              <div 
                                key={cat.id}
                                className={`dropdown-option ${searchCategory === cat.id ? 'selected' : ''}`}
                                onClick={() => {
                                  setSearchCategory(cat.id);
                                  setIsDropdownOpen(false);
                                  setDropdownSearch('');
                                }}
                              >
                                {cat.name}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search for items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit">
                    <i className="fi-rs-search"></i>
                  </button>
                </form>
              </div>
              <div className="header-action-right">
                <div className="header-action-2">
                  {/* <div className="search-location">
                    <form action="#">
                      <select className="select-active">
                        <option>Your Location</option>
                        <option>Alabama</option>
                        <option>Alaska</option>
                        <option>Arizona</option>
                        <option>Delaware</option>
                        <option>Florida</option>
                        <option>Georgia</option>
                        <option>Hawaii</option>
                        <option>Indiana</option>
                        <option>Maryland</option>
                        <option>Nevada</option>
                        <option>New Jersey</option>
                        <option>New Mexico</option>
                        <option>New York</option>
                      </select>
                    </form>
                  </div> */}
                  <div className="header-action-icon-2">
                    <Link to="/shop-compare">
                        <img className="svgInject" alt="Nest" src="/assets/imgs/theme/icons/icon-compare.svg" />
                        {compareCount > 0 && (
                          <span className="pro-count blue">{compareCount}</span>
                        )}
                    </Link>
                    <Link to="/shop-compare"><span className="lable ml-0">Compare</span></Link>
                  </div>
                  <div className="header-action-icon-2">
                    <Link to="/shop-wishlist">
                        <img className="svgInject" alt="Nest" src="/assets/imgs/theme/icons/icon-heart.svg" />
                        {wishlistCount > 0 && (
                          <span className="pro-count blue">{wishlistCount}</span>
                        )}
                    </Link>
                    <Link to="/shop-wishlist"><span className="lable">Wishlist</span></Link>
                  </div>
                  <div className="header-action-icon-2">
                    <Link className="mini-cart-icon" to="/shop-cart">
                        <img alt="Nest" src="/assets/imgs/theme/icons/icon-cart.svg" />
                        {cartTotals.itemCount > 0 && (
                          <span className="pro-count blue">{cartTotals.itemCount}</span>
                        )}
                    </Link>
                    <Link to="/shop-cart"><span className="lable">Cart</span></Link>
                    <div className="cart-dropdown-wrap cart-dropdown-hm2">
                        {cartItems.length === 0 ? (
                          <div className="p-20 text-center">
                            <p className="text-muted">Your cart is empty</p>
                            <Link to="/shop" className="btn mt-10">Start Shopping</Link>
                          </div>
                        ) : (
                          <>
                            <ul>
                              {cartItems.slice(0, 3).map((item) => (
                                <li key={item.id}>
                                  <div className="shopping-cart-img">
                                    <Link to={`/shop-product-right?id=${item.id}`}>
                                      <img 
                                        alt={item.productName} 
                                        src={item.image}
                                        onError={(e) => {
                                          e.target.src = getUnsplashFallback(0);
                                        }}
                                      />
                                    </Link>
                                  </div>
                                  <div className="shopping-cart-title">
                                    <h4>
                                      <Link to={`/shop-product-right?id=${item.id}`}>
                                        {item.productName}
                                      </Link>
                                    </h4>
                                    <h4>
                                      <span>{item.quantity} × </span>{Math.round(Number(item.price) || 0)}
                                    </h4>
                                  </div>
                                  <div className="shopping-cart-delete">
                                    <button 
                                      type="button" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        removeFromCart(item.id);
                                      }} 
                                      aria-label="Remove item"
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '5px',
                                        cursor: 'pointer',
                                        color: '#666',
                                        fontSize: '16px',
                                        lineHeight: '1',
                                        transition: 'all 0.3s',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px'
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
                                      <i className="fi-rs-cross-small"></i>
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            {cartItems.length > 3 && (
                              <div className="text-center p-10">
                                <p className="text-muted">And {cartItems.length - 3} more item(s)</p>
                              </div>
                            )}
                            <div className="shopping-cart-footer">
                              <div className="shopping-cart-total">
                                <h4>Total <span>{Math.round(Number(cartTotals.total) || 0)}</span></h4>
                              </div>
                              <div className="shopping-cart-button">
                                <Link to="/shop-cart" className="outline">View cart</Link>
                                <Link to="/shop-checkout">Checkout</Link>
                              </div>
                            </div>
                          </>
                        )}
                    </div>
                  </div>
                  <div className="header-action-icon-2">
                    <Link to="/account">
                        <img className="svgInject" alt="Nest" src="/assets/imgs/theme/icons/icon-user.svg" />
                    </Link>
                    <Link to="/account"><span className="lable ml-0">Account</span></Link>
                    <div className="cart-dropdown-wrap cart-dropdown-hm2 account-dropdown">
                        <ul>
                            <li><Link to="/account"><i className="fi fi-rs-user mr-10"></i>My Account</Link></li>
                            <li><Link to="/account?tab=orders"><i className="fi fi-rs-location-alt mr-10"></i>Order</Link></li>
                            <li><Link to="/account"><i className="fi fi-rs-label mr-10"></i>My Voucher</Link></li>
                            <li><Link to="/shop-wishlist"><i className="fi fi-rs-heart mr-10"></i>My Wishlist</Link></li>
                            <li><Link to="/account?tab=account-detail"><i className="fi fi-rs-settings-sliders mr-10"></i>Setting</Link></li>
                            {isAuthenticated ? (
                              <li>
                                <button
                                  className="border-0 bg-transparent p-0 text-start w-100 text-decoration-none"
                                  onClick={handleLogout}
                                  style={{ color: 'inherit' }}
                                >
                                  <i className="fi fi-rs-sign-out mr-10"></i>Sign out
                                </button>
                              </li>
                            ) : (
                              <li><Link to="/login"><i className="fi fi-rs-sign-out mr-10"></i>Sign in</Link></li>
                            )}
                        </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Bottom */}
      <div className="header-bottom header-bottom-bg-color sticky-bar">
        <div className="container">
          <div className="header-wrap header-space-between position-relative">
            <div className="logo logo-width-1 d-block d-lg-none">
              <Link to="/"><img src="/assets/imgs/theme/logo.svg" alt="logo" /></Link>
            </div>
            <div className="header-nav d-none d-lg-flex">
              <div className="main-categori-wrap d-none d-lg-block" ref={categoryRef}>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <button 
                  type="button"
                  className={`categories-button-active ${isCategoryOpen ? 'open' : ''}`}
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', width: '100%' }}
                >
                  <span className="fi-rs-apps"></span> <span className="et">Browse</span> All Categories
                  <i className="fi-rs-angle-down"></i>
                </button>
                <div className={`categories-dropdown-wrap categories-dropdown-active-large font-heading ${isCategoryOpen ? 'open' : ''}`}>
                  {loadingCategories ? (
                    <div className="category-loading">
                      <div className="loading-spinner"></div>
                      <span>Loading categories...</span>
                    </div>
                  ) : categories.length > 0 ? (
                    <>
                      <div className="d-flex categori-dropdown-inner">
                        <ul>
                          {categories.slice(0, 10).filter((_, index) => index % 2 === 0).map((cat, index) => (
                            <li key={cat.id || index * 2}>
                              <Link to={cat.link || `/shop?category=${cat.id}`}>
                                <img src={`/assets/imgs/theme/icons/${cat.icon || `category-${index * 2 + 1}.svg`}`} alt={cat.name} />
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <ul className="end">
                          {categories.slice(0, 10).filter((_, index) => index % 2 === 1).map((cat, index) => (
                            <li key={cat.id || index * 2 + 1}>
                              <Link to={cat.link || `/shop?category=${cat.id}`}>
                                <img src={`/assets/imgs/theme/icons/${cat.icon || `category-${index * 2 + 2}.svg`}`} alt={cat.name} />
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {categories.length > 10 && (
                        <>
                          <div className={`more_slide_open ${showMoreCategories ? '' : 'd-none'}`}>
                            <div className="d-flex categori-dropdown-inner">
                              <ul>
                                {categories.slice(10).filter((_, index) => index % 2 === 0).map((cat, index) => (
                                  <li key={cat.id || 10 + index * 2}>
                                    <Link to={cat.link || `/shop?category=${cat.id}`}>
                                      <img src={`/assets/imgs/theme/icons/${cat.icon || `icon-${index * 2 + 1}.svg`}`} alt={cat.name} />
                                      {cat.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                              <ul className="end">
                                {categories.slice(10).filter((_, index) => index % 2 === 1).map((cat, index) => (
                                  <li key={cat.id || 10 + index * 2 + 1}>
                                    <Link to={cat.link || `/shop?category=${cat.id}`}>
                                      <img src={`/assets/imgs/theme/icons/${cat.icon || `icon-${index * 2 + 2}.svg`}`} alt={cat.name} />
                                      {cat.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div 
                            className="more_categories"
                            onClick={() => setShowMoreCategories(!showMoreCategories)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="icon"></span>
                            <span className="heading-sm-1">
                              {showMoreCategories ? 'Show less...' : 'Show more...'}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="category-empty">
                      <i className="fi-rs-inbox"></i>
                      <span>No categories available</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="main-menu main-menu-padding-1 main-menu-lh-2 d-none d-lg-block font-heading">
                <nav>
                  <ul>
                    {categories.slice(0, 3).map((category, index) => {
                      const hasSubCategories = category.subCategories && category.subCategories.length > 0;
                      const hasSubCategory1s = category.subCategory1s && category.subCategory1s.length > 0;
                      const hasDropdown = hasSubCategories || hasSubCategory1s;
                      
                      return (
                        <li 
                          key={category.id} 
                          className={hasDropdown ? 'menu-item-has-children' : ''}
                          onMouseEnter={() => {
                            if (menuHoverTimeoutRef.current) {
                              clearTimeout(menuHoverTimeoutRef.current);
                              menuHoverTimeoutRef.current = null;
                            }
                            if (hasDropdown) {
                              setHoveredMenuCategory(category.id);
                              // Auto-select first subcategory if available
                              if (hasSubCategories) {
                                setHoveredMenuSubCategory(category.subCategories[0].id);
                              }
                            }
                          }}
                          onMouseLeave={() => {
                            menuHoverTimeoutRef.current = setTimeout(() => {
                              setHoveredMenuCategory(null);
                              setHoveredMenuSubCategory(null);
                            }, 200);
                          }}
                        >
                          <Link to={category.link}>{category.name} {hasDropdown && <i className="fi-rs-angle-down"></i>}</Link>
                          
                          {hasDropdown && hoveredMenuCategory === category.id && (
                            <ul className="sub-menu">
                              {hasSubCategories ? (
                                // Show subcategories with their child categories
                                category.subCategories.map((subCat) => {
                                  const hasSubCategory1s = subCat.subCategory1s && subCat.subCategory1s.length > 0;
                                  
                                  return (
                                    <li 
                                      key={subCat.id}
                                      className={hasSubCategory1s ? 'menu-item-has-children' : ''}
                                      onMouseEnter={() => {
                                        if (menuHoverTimeoutRef.current) {
                                          clearTimeout(menuHoverTimeoutRef.current);
                                        }
                                        if (hasSubCategory1s) {
                                          setHoveredMenuSubCategory(subCat.id);
                                        }
                                      }}
                                    >
                                      <Link to={subCat.link}>
                                         {subCat.name}
                                        {hasSubCategory1s && <i className="fi-rs-angle-right"></i>}
                                      </Link>
                                      
                                      {hasSubCategory1s && hoveredMenuSubCategory === subCat.id && (
                                        <ul className="level-menu level-menu-modify">
                                          {subCat.subCategory1s.map((sub1) => (
                                            <li key={sub1.id}>
                                              <Link to={sub1.link}>{sub1.name}</Link>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  );
                                })
                              ) : (
                                // Show direct subCategory1s if no subcategories
                                category.subCategory1s.map((sub1) => (
                                  <li key={sub1.id}>
                                    <Link to={sub1.link}>
                             
                                      {sub1.name}
                                    </Link>
                                  </li>
                                ))
                              )}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li>
                  </ul>
                </nav>
              </div>
            </div>
            <div className="hotline d-none d-lg-flex">
              <img src="/assets/imgs/theme/icons/icon-headphone.svg" alt="hotline" />
              <p>1900 - 888<span>24/7 Support Center</span></p>
            </div>
            <div className="header-action-icon-2 d-block d-lg-none">
              <Link className="mini-cart-icon" to="/shop-cart">
                <img alt="Nest" src="/assets/imgs/theme/icons/icon-cart.svg" />
                {cartTotals.itemCount > 0 && (
                  <span className="pro-count white">{cartTotals.itemCount}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

