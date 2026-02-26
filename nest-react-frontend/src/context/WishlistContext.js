import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { showSuccess, showError } from '../utils/swal';
import { getWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist, clearWishlist as apiClearWishlist } from '../utils/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, token } = useAuth();

  // Load wishlist from API when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated, token]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    if (!isAuthenticated) {
      showError('Authentication Required', 'Please login to add items to your wishlist');
      return false;
    }

    try {
      const result = await apiAddToWishlist(product.id);
      if (result) {
        await loadWishlist(); // Reload wishlist
        showSuccess(
          'Added to Wishlist!',
          `${product.productName || product.name} has been added to your wishlist`,
          2000
        );
        return true;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add to wishlist';
      if (errorMessage.includes('already in wishlist')) {
        showError('Already in Wishlist', 'This product is already in your wishlist');
      } else {
        showError('Error', errorMessage);
      }
      return false;
    }
  };

  const removeFromWishlist = async (productId, productName = '') => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      await apiRemoveFromWishlist(productId);
      setWishlistItems(prev => prev.filter(item => item.productId !== productId));
      showSuccess(
        'Removed from Wishlist',
        `${productName || 'Item'} has been removed from your wishlist`,
        2000
      );
      return true;
    } catch (error) {
      showError('Error', error.message || 'Failed to remove from wishlist');
      return false;
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      await apiClearWishlist();
      setWishlistItems([]);
      showSuccess('Wishlist Cleared', 'All items have been removed from your wishlist', 2000);
      return true;
    } catch (error) {
      showError('Error', error.message || 'Failed to clear wishlist');
      return false;
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const value = {
    wishlistItems,
    loading,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    wishlistCount: wishlistItems.length
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
