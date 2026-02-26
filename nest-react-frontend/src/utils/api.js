// API configuration and base functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.7:5000/api/storefront';

// Media base URL for product images served by ReactPosApi
export const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_URL || 'http://192.168.1.7:5000';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Generic API fetch function
 * @param {string} endpoint - API endpoint (e.g., '/categories')
 * @param {object} options - Fetch options
 * @returns {Promise} Response data
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // Add JWT token to headers if available
  const token = getAuthToken();
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  // Convert body to JSON string if it's an object
  if (defaultOptions.body && typeof defaultOptions.body === 'object' && !(defaultOptions.body instanceof FormData)) {
    defaultOptions.body = JSON.stringify(defaultOptions.body);
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    const data = await response.json();
    
    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // Don't redirect automatically, let the component handle it
      }
      // Try to extract error message from API response
      const errorMessage = data.message || data.error || (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

/**
 * Create an order (checkout)
 * @param {object} orderData - Order data including customer info, addresses, items, etc.
 * @returns {Promise<object>} Created order
 */
export const createOrder = async (orderData) => {
  try {
    const response = await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    // Handle the API response structure
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Get all categories
 * @returns {Promise<Array>} Array of categories
 */
export const getCategories = async () => {
  try {
    const response = await apiCall('/categories/all');
    // Handle the API response structure
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get categories with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 10)
 * @returns {Promise<Object>} Paginated response
 */
export const getCategoriesPaginated = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiCall(`/categories?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    console.error('Error fetching paginated categories:', error);
    return { data: [], totalCount: 0, page: 1, pageSize: 10 };
  }
};

/**
 * Get category by ID
 * @param {string} id - Category ID
 * @returns {Promise<Object>} Category object
 */
export const getCategoryById = async (id) => {
  try {
    const response = await apiCall(`/categories/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

/**
 * Get all products
 * @returns {Promise<Array>} Array of products
 */
export const getProducts = async () => {
  try {
    const response = await apiCall('/products/all');
    // Handle the API response structure
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * Get products with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 10)
 * @returns {Promise<Object>} Paginated response
 */
export const getProductsPaginated = async (page = 1, pageSize = 10) => {
  try {
    const response = await apiCall(`/products?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    console.error('Error fetching paginated products:', error);
    return { data: [], totalCount: 0, page: 1, pageSize: 10 };
  }
};

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
export const getProductById = async (id) => {
  try {
    const response = await apiCall(`/products/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

/**
 * Get products by category ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of products in the category
 */
export const getProductsByCategory = async (categoryId) => {
  try {
    const response = await apiCall(`/products/category/${categoryId}`);
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
};

/**
 * Get products by subcategory ID
 * @param {string} subCategoryId - SubCategory ID
 * @returns {Promise<Array>} Array of products in the subcategory
 */
export const getProductsBySubCategory = async (subCategoryId) => {
  try {
    const response = await apiCall(`/products/subcategory/${subCategoryId}`);
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products by subcategory:', error);
    // Fallback: filter products by subcategory on frontend if API doesn't support it
    return [];
  }
};

/**
 * Get products by subcategory1 ID
 * @param {string} subCategory1Id - SubCategory1 ID
 * @returns {Promise<Array>} Array of products in the subcategory1
 */
export const getProductsBySubCategory1 = async (subCategory1Id) => {
  try {
    const response = await apiCall(`/products/childcategory/${subCategory1Id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products by subcategory1:', error);
    // Fallback: filter products by subcategory1 on frontend if API doesn't support it
    return [];
  }
};

/**
 * Get hierarchical categories with subcategories and subcategory1s
 * @returns {Promise<Array>} Array of categories with nested subcategories
 */
export const getCategoriesHierarchical = async () => {
  try {
    const response = await apiCall('/categories/all');
    let categories = [];
    
    if (response.success && response.data) {
      categories = response.data;
    } else {
      categories = response.data || [];
    }
    
    // Normalize API response to the UI format the header expects.
    // Some API responses use `childCategories` (with `childCategoryName`/`childCategoryCode`)
    // nested under `subCategories`. The UI expects `subCategory1s` and `subCategoryName`.
    const organizedCategories = categories.map(cat => {
      const normalizedSubCategories = (cat.subCategories || []).map(sub => {
        // Convert childCategories -> subCategory1s if present
        const childCats = sub.childCategories || sub.childCategorys || [];

        const subCategory1s = (sub.subCategory1s || []).length > 0
          ? sub.subCategory1s
          : childCats.map(cc => ({
              ...cc,
              // map API naming to UI naming used elsewhere
              subCategoryName: cc.childCategoryName || cc.subCategoryName || cc.name,
              categoryCode: cc.childCategoryCode || cc.categoryCode || cc.code
            }));

        return {
          ...sub,
          subCategory1s
        };
      });

      // Also normalize any top-level subCategory1s/childCategories directly under category
      const topLevelChildCats = cat.childCategories || cat.childCategorys || [];
      const topLevelSubCategory1s = (cat.subCategory1s || []).length > 0
        ? cat.subCategory1s
        : topLevelChildCats.map(cc => ({
            ...cc,
            subCategoryName: cc.childCategoryName || cc.subCategoryName || cc.name,
            categoryCode: cc.childCategoryCode || cc.categoryCode || cc.code
          }));

      return {
        ...cat,
        subCategories: normalizedSubCategories,
        subCategory1s: topLevelSubCategory1s
      };
    });

    return organizedCategories;
  } catch (error) {
    console.error('Error fetching hierarchical categories:', error);
    return [];
  }
};

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Order object
 */
export const getOrderById = async (id) => {
  try {
    const response = await apiCall(`/orders/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

/**
 * Get orders by customer email
 * @param {string} email - Customer email
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersByEmail = async (email) => {
  try {
    const response = await apiCall(`/orders/email/${encodeURIComponent(email)}`);
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching orders by email:', error);
    return [];
  }
};

/**
 * Get order by order number
 * @param {string} orderNumber - Order number
 * @returns {Promise<Object>} Order object
 */
export const getOrderByOrderNumber = async (orderNumber) => {
  try {
    const response = await apiCall(`/orders/number/${encodeURIComponent(orderNumber)}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order by number:', error);
    return null;
  }
};

/**
 * Get customer by email
 * @param {string} email - Customer email
 * @returns {Promise<Object>} Customer object
 */
export const getCustomerByEmail = async (email) => {
  try {
    const response = await apiCall(`/customers/email/${encodeURIComponent(email)}`);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
};

/**
 * Get customer addresses
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} Array of addresses
 */
export const getCustomerAddresses = async (customerId) => {
  try {
    const response = await apiCall(`/customers/${customerId}/addresses`);
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return [];
  }
};

/**
 * Update customer details
 * @param {string} customerId - Customer ID
 * @param {object} customerData - Customer data to update
 * @returns {Promise<Object>} Updated customer object
 */
export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await apiCall(`/customers/${customerId}`, {
      method: 'PUT',
      body: customerData,
    });
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || response;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

/**
 * Create or update customer address
 * @param {string} customerId - Customer ID
 * @param {object} addressData - Address data
 * @returns {Promise<Object>} Created/updated address object
 */
export const createOrUpdateAddress = async (customerId, addressData) => {
  try {
    const response = await apiCall(`/customers/${customerId}/addresses`, {
      method: 'POST',
      body: addressData,
    });
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || response;
  } catch (error) {
    console.error('Error saving address:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const login = async (email, password) => {
  try {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Register new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} phone - User phone (optional)
 * @returns {Promise<Object>} Register response with token and user data
 */
export const register = async (name, email, password, phone = null) => {
  try {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: { customerName: name, email, password, phone },
    });
    return response;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

/**
 * Get customer profile
 * @returns {Promise<object>} Customer profile
 */
export const getCustomerProfile = async () => {
  try {
    const response = await apiCall('/customers/profile');
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || null;
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    throw error;
  }
};

// Wishlist API Functions

/**
 * Get customer's wishlist
 * @returns {Promise<Array>} Wishlist items
 */
export const getWishlist = async () => {
  try {
    const response = await apiCall('/wishlist');
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

/**
 * Add product to wishlist
 * @param {string} productId - Product ID
 * @returns {Promise<object>} Added wishlist item
 */
export const addToWishlist = async (productId) => {
  try {
    const response = await apiCall('/wishlist', {
      method: 'POST',
      body: { productId }
    });
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || null;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>}
 */
export const removeFromWishlist = async (productId) => {
  try {
    const response = await apiCall(`/wishlist/${productId}`, {
      method: 'DELETE'
    });
    return response.success;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

/**
 * Clear wishlist
 * @returns {Promise<boolean>}
 */
export const clearWishlist = async () => {
  try {
    const response = await apiCall('/wishlist', {
      method: 'DELETE'
    });
    return response.success;
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    throw error;
  }
};

// Compare List API Functions

/**
 * Get customer's compare list
 * @returns {Promise<Array>} Compare list items
 */
export const getCompareList = async () => {
  try {
    const response = await apiCall('/compare');
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || [];
  } catch (error) {
    console.error('Error fetching compare list:', error);
    throw error;
  }
};

/**
 * Add product to compare list
 * @param {string} productId - Product ID
 * @returns {Promise<object>} Added compare item
 */
export const addToCompareList = async (productId) => {
  try {
    const response = await apiCall('/compare', {
      method: 'POST',
      body: { productId }
    });
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || null;
  } catch (error) {
    console.error('Error adding to compare list:', error);
    throw error;
  }
};

/**
 * Remove product from compare list
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>}
 */
export const removeFromCompareList = async (productId) => {
  try {
    const response = await apiCall(`/compare/${productId}`, {
      method: 'DELETE'
    });
    return response.success;
  } catch (error) {
    console.error('Error removing from compare list:', error);
    throw error;
  }
};

/**
 * Clear compare list
 * @returns {Promise<boolean>}
 */
export const clearCompareList = async () => {
  try {
    const response = await apiCall('/compare', {
      method: 'DELETE'
    });
    return response.success;
  } catch (error) {
    console.error('Error clearing compare list:', error);
    throw error;
  }
};

/**
 * Submit contact form
 * @param {object} contactData - Contact form data
 * @returns {Promise<object>} Created contact message
 */
export const submitContactForm = async (contactData) => {
  try {
    const response = await apiCall('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
    // Handle the API response structure
    if (response.success && response.data) {
      return response.data;
    }
    return response.data || response;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
};

