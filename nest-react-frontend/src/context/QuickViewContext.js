import React, { createContext, useContext, useState } from 'react';

const QuickViewContext = createContext();

export const useQuickView = () => {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error('useQuickView must be used within QuickViewProvider');
  }
  return context;
};

export const QuickViewProvider = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const showQuickView = (product) => {
    setSelectedProduct(product);
  };

  const clearQuickView = () => {
    setSelectedProduct(null);
  };

  return (
    <QuickViewContext.Provider value={{ selectedProduct, showQuickView, clearQuickView }}>
      {children}
    </QuickViewContext.Provider>
  );
};
