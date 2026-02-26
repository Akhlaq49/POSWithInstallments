import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, register } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token and user from localStorage on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await login(email, password);
      if (response.success && response.data) {
        const { token: authToken, customer } = response.data;
        setToken(authToken);
        setUser(customer);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(customer));
        // Also set customerEmail for backward compatibility
        if (customer.customerEmail) {
          localStorage.setItem('customerEmail', customer.customerEmail);
        }
        return { success: true };
      }
      return { success: false, error: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const handleRegister = async (name, email, password, phone) => {
    try {
      const response = await register(name, email, password, phone);
      if (response.success && response.data) {
        const { token: authToken, customer } = response.data;
        setToken(authToken);
        setUser(customer);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(customer));
        // Also set customerEmail for backward compatibility
        if (customer.customerEmail) {
          localStorage.setItem('customerEmail', customer.customerEmail);
        }
        return { success: true };
      }
      return { success: false, error: response.message || 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('customerEmail');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

