import React from 'react';
import '../../pages/shop/Shop.css';

const NoProductsFound = ({ 
  searchTerm = null, 
  hasFilters = false,
  onClearFilters = null,
  message = null 
}) => {
  // Determine the appropriate message
  const getMessage = () => {
    if (message) return message;
    
    if (searchTerm) {
      return `We couldn't find any products matching "${searchTerm}"`;
    }
    
    if (hasFilters) {
      return 'No products match your current filters';
    }
    
    return 'No products available at the moment';
  };

  return (
    <div className="col-12">
      <div className="no-products-container">
        <div className="no-products-box">
          <i className="fi-rs-search no-products-icon"></i>
          <h4 className="no-products-title">No Products Found</h4>
          <p className="no-products-message">
            {getMessage()}
          </p>
          {onClearFilters && hasFilters && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={onClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoProductsFound;
