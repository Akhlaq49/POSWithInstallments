import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { showSuccess, showError } from '../utils/swal';
import { getCompareList, addToCompareList as apiAddToCompareList, removeFromCompareList as apiRemoveFromCompareList, clearCompareList as apiClearCompareList } from '../utils/api';

const CompareContext = createContext();
const COMPARE_STORAGE_KEY = 'guestCompareList';
const MAX_COMPARE_ITEMS = 4;

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, token } = useAuth();

  // Load compare list from API when authenticated, or from localStorage for guests
  useEffect(() => {
    if (isAuthenticated && token) {
      loadCompareList();
    } else {
      loadGuestCompareList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const loadGuestCompareList = () => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        setCompareItems(items || []);
      } else {
        setCompareItems([]);
      }
    } catch (error) {
      console.error('Error loading guest compare list:', error);
      setCompareItems([]);
    }
  };

  const saveGuestCompareList = (items) => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving guest compare list:', error);
    }
  };

  const loadCompareList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCompareList();
      setCompareItems(data || []);
    } catch (error) {
      console.error('Error loading compare list:', error);
      // Fallback to guest compare list if API fails
      loadGuestCompareList();
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCompare = async (product) => {
    // Guest user - use localStorage
    if (!isAuthenticated) {
      try {
        // Check if already in compare
        if (compareItems.some(item => item.productId === product.id || item.id === product.id)) {
          showError('Already in Compare List', 'This product is already in your compare list');
          return false;
        }

        // Check max limit
        if (compareItems.length >= MAX_COMPARE_ITEMS) {
          showError('Compare List Full', `You can only compare up to ${MAX_COMPARE_ITEMS} products at a time`);
          return false;
        }

        // Add to guest compare list
        // Extract first image from imagePaths if it's an array
        let imagePath = product.imagePath;
        if (product.imagePaths) {
          try {
            const images = typeof product.imagePaths === 'string' 
              ? JSON.parse(product.imagePaths) 
              : product.imagePaths;
            if (Array.isArray(images) && images.length > 0) {
              imagePath = images[0];
            }
          } catch (e) {
            console.warn('Failed to parse imagePaths:', e);
          }
        }
        
        const newItem = {
          productId: product.id,
          id: product.id,
          productName: product.productName || product.name,
          name: product.productName || product.name,
          price: product.price,
          imagePath: imagePath,
          rating: product.rating,
          description: product.description,
          brand: product.brand,
          category: product.category,
          sku: product.sku,
          stock: product.stock
        };

        const updatedItems = [...compareItems, newItem];
        setCompareItems(updatedItems);
        saveGuestCompareList(updatedItems);

        showSuccess(
          'Added to Compare!',
          `${product.productName || product.name} has been added to compare list`,
          2000
        );
        return true;
      } catch (error) {
        showError('Error', 'Failed to add to compare list');
        return false;
      }
    }

    // Authenticated user - use API
    try {
      const result = await apiAddToCompareList(product.id);
      if (result) {
        await loadCompareList(); // Reload compare list
        showSuccess(
          'Added to Compare!',
          `${product.productName || product.name} has been added to compare list`,
          2000
        );
        return true;
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add to compare list';
      if (errorMessage.includes('already in compare')) {
        showError('Already in Compare List', 'This product is already in your compare list');
      } else if (errorMessage.includes('full')) {
        showError('Compare List Full', 'You can only compare up to 4 products at a time');
      } else {
        showError('Error', errorMessage);
      }
      return false;
    }
  };

  const removeFromCompare = async (productId, productName = '') => {
    // Guest user - use localStorage
    if (!isAuthenticated) {
      try {
        const updatedItems = compareItems.filter(item => 
          (item.productId !== productId && item.id !== productId)
        );
        setCompareItems(updatedItems);
        saveGuestCompareList(updatedItems);
        showSuccess(
          'Removed from Compare',
          `${productName || 'Item'} has been removed from compare list`,
          2000
        );
        return true;
      } catch (error) {
        showError('Error', 'Failed to remove from compare list');
        return false;
      }
    }

    // Authenticated user - use API
    try {
      await apiRemoveFromCompareList(productId);
      setCompareItems(prev => prev.filter(item => item.productId !== productId));
      showSuccess(
        'Removed from Compare',
        `${productName || 'Item'} has been removed from compare list`,
        2000
      );
      return true;
    } catch (error) {
      showError('Error', error.message || 'Failed to remove from compare list');
      return false;
    }
  };

  const clearCompare = async () => {
    // Guest user - use localStorage
    if (!isAuthenticated) {
      try {
        setCompareItems([]);
        saveGuestCompareList([]);
        showSuccess('Compare List Cleared', 'All items have been removed from compare list', 2000);
        return true;
      } catch (error) {
        showError('Error', 'Failed to clear compare list');
        return false;
      }
    }

    // Authenticated user - use API
    try {
      await apiClearCompareList();
      setCompareItems([]);
      showSuccess('Compare List Cleared', 'All items have been removed from compare list', 2000);
      return true;
    } catch (error) {
      showError('Error', error.message || 'Failed to clear compare list');
      return false;
    }
  };

  const isInCompare = (productId) => {
    return compareItems.some(item => 
      item.productId === productId || item.id === productId
    );
  };

  const value = {
    compareItems,
    loading,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    compareCount: compareItems.length
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};
