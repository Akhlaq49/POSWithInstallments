import React from 'react';

const ShopGridLeft = () => {
  return (
    <div className="main-content-inner">
      <div className="container">
        <div className="row">
          <div className="col-lg-3 primary-sidebar sticky-sidebar">
            <div className="sidebar-widget widget-category-2 mb-30">
              <h5 className="section-title style-1 mb-30">Category</h5>
              <ul>
                <li><a href="/shop-grid-left"> <img src="/assets/imgs/theme/icons/category-1.svg" alt="" />Women's Fashion</a><span className="count">30</span></li>
                <li><a href="/shop-grid-left"> <img src="/assets/imgs/theme/icons/category-2.svg" alt="" />Men's Fashion</a><span className="count">35</span></li>
                <li><a href="/shop-grid-left"> <img src="/assets/imgs/theme/icons/category-3.svg" alt="" />Accessories</a><span className="count">25</span></li>
                <li><a href="/shop-grid-left"> <img src="/assets/imgs/theme/icons/category-4.svg" alt="" />Shoes & Footwear</a><span className="count">20</span></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-9">
            <div className="shop-product-fillter">
              <div className="totall-product">
                <p>We found <strong className="text-brand">29</strong> items for you!</p>
              </div>
            </div>
            <div className="row product-grid">
              {/* Products will be rendered here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopGridLeft;

