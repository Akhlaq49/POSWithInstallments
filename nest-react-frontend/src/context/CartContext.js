import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccess } from '../utils/swal';
import { getClothingImage, getImageUrl } from '../utils/imageUtils';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Ensure all prices and quantities are numbers
        const normalizedCart = parsedCart.map(item => ({
          ...item,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        }));
        setCartItems(normalizedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      const productName = product.productName || product.name;
      
      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity;
        showSuccess(
          'Added to Cart!',
          `${productName} quantity updated to ${newQuantity}`,
          2000
        );
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item to cart
        showSuccess(
          'Added to Cart!',
          `${productName} has been added to your cart`,
          2000
        );
        return [
          ...prevItems,
          {
            id: product.id,
            productName: productName,
            price: Number(product.price) || 0,
            image: getImageUrl(product.imagePath || product.image || null) || getClothingImage(product.imagePath || product.image || null, Math.floor(Math.random() * 10)),
            quantity: quantity,
            unit: product.unit || '',
            sku: product.sku || '',
            category: product.childCategory?.childCategoryName || product.category?.categoryName || ''
          }
        ];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId, productName = '') => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === productId);
      const name = productName || item?.productName || 'Item';
      const filtered = prevItems.filter(item => item.id !== productId);
      showSuccess(
        'Removed from Cart',
        `${name} has been removed from your cart`,
        2000
      );
      return filtered;
    });
  };

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      const item = cartItems.find(i => i.id === productId);
      removeFromCart(productId, item?.productName);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Clear entire cart
  const clearCart = (showAlert = true) => {
    if (showAlert && cartItems.length > 0) {
      showSuccess(
        'Cart Cleared',
        'All items have been removed from your cart',
        2000
      );
    }
    setCartItems([]);
  };

  // Calculate cart totals
  const getCartTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const shipping = 0; // Free shipping for now
    const total = subtotal + shipping;
    
    return {
      subtotal,
      shipping,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    };
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotals
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

