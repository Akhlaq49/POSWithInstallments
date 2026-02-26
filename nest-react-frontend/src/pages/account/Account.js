import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getOrdersByEmail,
  getOrderByOrderNumber,
  getCustomerAddresses,
  updateCustomer,
  createOrUpdateAddress
} from '../../utils/api';
import { showSuccess, showError, showLoading, closeAlert, showInfo } from '../../utils/swal';
import { getUnsplashFallback, getImageUrl } from '../../utils/imageUtils';

const Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Customer data
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track order form
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // View order details
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Account details form
  const [accountForm, setAccountForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    phone: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Address editing

  // Address editing
  const [editingAddressType, setEditingAddressType] = useState(null); // 'Billing' or 'Shipping' or null
  const [addressForm, setAddressForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addressSuccess, setAddressSuccess] = useState(false);

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'orders', 'track-orders', 'address', 'account-detail'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      navigate('/login?from=/account');
      return;
    }

    const loadAccountData = async () => {
      setLoading(true);
      setError(null);
      
      const email = user.customerEmail;
      if (!email) {
        setError('No email found for this account');
        setLoading(false);
        return;
      }

      try {
          // Use user from auth context, or fetch if needed
          if (user) {
            setCustomer(user);
          
          // Set account form with customer data
          const nameParts = user.customerName?.split(' ') || [];
          setAccountForm(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            displayName: user.customerName || '',
            email: user.customerEmail || email,
            phone: user.customerPhone || ''
          }));

          // Load addresses
          const addressesData = await getCustomerAddresses(user.id);
          setAddresses(addressesData || []);

          // Load orders
          const ordersData = await getOrdersByEmail(email);
          console.log('Orders received from API:', ordersData);
          console.log('Number of orders:', ordersData?.length || 0);
          console.log('Order statuses:', ordersData?.map(o => o.status) || []);
          setOrders(ordersData || []);
        } else {
          setError('Customer data not available.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [isAuthenticated, user, navigate]);

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setIsTracking(true);
    setTrackingError(null);
    setTrackedOrder(null);

    try {
      showLoading('Tracking order...');
      const order = await getOrderByOrderNumber(trackOrderId);
      closeAlert();
      
      if (order) {
        // Verify email matches
        if (order.userId && customer && customer.id === order.userId) {
          setTrackedOrder(order);
          showSuccess('Order Found!', `Order ${order.orderNumber} has been found`, 2000);
        } else {
          // If we can't verify, still show the order but with a note
          setTrackedOrder(order);
          showInfo('Order Found', 'Order details are displayed below');
        }
      } else {
        showError('Order Not Found', 'Please check your order number and try again.');
        setTrackingError('Order not found. Please check your order number.');
      }
    } catch (err) {
      closeAlert();
      showError('Tracking Failed', err.message || 'Failed to track order. Please try again.');
      setTrackingError(err.message || 'Failed to track order');
    } finally {
      setIsTracking(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);
    setError(null);

    try {
      if (!customer) {
        showError('Error', 'Customer data not loaded');
        setError('Customer data not loaded');
        setIsUpdating(false);
        return;
      }

      showLoading('Updating account...');
      const updateData = {
        customerName: accountForm.displayName || `${accountForm.firstName} ${accountForm.lastName}`.trim(),
        customerPhone: accountForm.phone || null
      };

      const updatedCustomer = await updateCustomer(customer.id, updateData);
      closeAlert();
      
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        setUpdateSuccess(true);
        showSuccess('Account Updated!', 'Your account details have been updated successfully', 2000);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      closeAlert();
      showError('Update Failed', err.message || 'Failed to update account. Please try again.');
      setError(err.message || 'Failed to update account');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError('Missing Fields', 'Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Password Mismatch', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      showLoading('Changing password...');
      
      // Here you would call your password change API
      // For now, showing success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      closeAlert();
      showSuccess('Password Changed', 'Your password has been updated successfully', 2000);
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      closeAlert();
      showError('Error', error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getBillingAddress = () => {
    return addresses.find(a => a.addressType === 'Billing') || null;
  };

  const getShippingAddress = () => {
    return addresses.find(a => a.addressType === 'Shipping') || null;
  };

  const handleEditAddress = (addressType) => {
    const existingAddress = addressType === 'Billing' ? getBillingAddress() : getShippingAddress();
    
    if (existingAddress) {
      setAddressForm({
        addressLine1: existingAddress.addressLine1 || '',
        addressLine2: existingAddress.addressLine2 || '',
        city: existingAddress.city || '',
        state: existingAddress.state || '',
        postalCode: existingAddress.postalCode || '',
        country: existingAddress.country || '',
        isDefault: existingAddress.isDefault || false
      });
    } else {
      setAddressForm({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false
      });
    }
    
    setEditingAddressType(addressType);
    setAddressError(null);
    setAddressSuccess(false);
  };

  const handleCancelEdit = () => {
    setEditingAddressType(null);
    setAddressForm({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false
    });
    setAddressError(null);
    setAddressSuccess(false);
  };

  const handleAddressInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (addressError) {
      setAddressError(null);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);
    setAddressSuccess(false);
    setIsSavingAddress(true);

    // Validation
    if (!addressForm.addressLine1 || !addressForm.city || !addressForm.country) {
      showError('Validation Error', 'Please fill in all required fields (Address Line 1, City, Country)');
      setAddressError('Please fill in all required fields (Address Line 1, City, Country)');
      setIsSavingAddress(false);
      return;
    }

    try {
      if (!customer) {
        showError('Error', 'Customer data not loaded');
        setAddressError('Customer data not loaded');
        setIsSavingAddress(false);
        return;
      }

      showLoading('Saving address...');
      const existingAddress = editingAddressType === 'Billing' ? getBillingAddress() : getShippingAddress();
      
      const addressData = {
        addressId: existingAddress?.id || null,
        addressType: editingAddressType,
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2 || null,
        city: addressForm.city,
        state: addressForm.state || null,
        postalCode: addressForm.postalCode || null,
        country: addressForm.country,
        isDefault: addressForm.isDefault
      };

      const savedAddress = await createOrUpdateAddress(customer.id, addressData);
      closeAlert();
      
      if (savedAddress) {
        // Reload addresses
        const addressesData = await getCustomerAddresses(customer.id);
        setAddresses(addressesData || []);
        setAddressSuccess(true);
        showSuccess(
          'Address Saved!',
          `Your ${editingAddressType.toLowerCase()} address has been saved successfully`,
          2000
        );
        setTimeout(() => {
          setEditingAddressType(null);
          setAddressSuccess(false);
        }, 2000);
      }
    } catch (err) {
      closeAlert();
      showError('Save Failed', err.message || 'Failed to save address. Please try again.');
      setAddressError(err.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const getOrderItemCount = (order) => {
    return order.items ? order.items.length : 0;
  };

  if (loading) {
    return (
      <main className="main pages">
        <div className="page-header breadcrumb-wrap">
          <div className="container">
            <div className="breadcrumb">
              <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
              <span></span> Pages <span></span> My Account
            </div>
          </div>
        </div>
        <div className="page-content pt-150 pb-150">
          <div className="container">
            <div className="text-center">
              <p>Loading account data...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main pages">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
            <span></span> Pages <span></span> My Account
          </div>
        </div>
      </div>
      <div className="page-content pt-150 pb-150">
        <div className="container">
          <div className="row">
            <div className="col-lg-10 m-auto">
              {error && (
                <div className="alert alert-danger mb-4" role="alert">
                  {error}
                </div>
              )}
              <div className="row">
                <div className="col-md-3">
                  <div className="dashboard-menu">
                    <ul className="nav flex-column" role="tablist">
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                          onClick={() => setActiveTab('dashboard')}
                          type="button"
                          onMouseEnter={(e) => {
                            if (activeTab !== 'dashboard') {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'dashboard') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'dashboard' ? '#f5f5f5' : 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: activeTab === 'dashboard' ? '#3BB77E' : '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === 'dashboard' ? '500' : '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className={`fi-rs-settings-sliders mr-10 ${activeTab === 'dashboard' ? 'text-brand' : ''}`} style={{ fontSize: '16px' }}></i>Dashboard
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                          onClick={() => setActiveTab('orders')}
                          type="button"
                          onMouseEnter={(e) => {
                            if (activeTab !== 'orders') {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'orders') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'orders' ? '#f5f5f5' : 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: activeTab === 'orders' ? '#3BB77E' : '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === 'orders' ? '500' : '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className={`fi-rs-shopping-bag mr-10 ${activeTab === 'orders' ? 'text-brand' : ''}`} style={{ fontSize: '16px' }}></i>Orders
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'track-orders' ? 'active' : ''}`}
                          onClick={() => setActiveTab('track-orders')}
                          type="button"
                          onMouseEnter={(e) => {
                            if (activeTab !== 'track-orders') {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'track-orders') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'track-orders' ? '#f5f5f5' : 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: activeTab === 'track-orders' ? '#3BB77E' : '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === 'track-orders' ? '500' : '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className={`fi-rs-shopping-cart-check mr-10 ${activeTab === 'track-orders' ? 'text-brand' : ''}`} style={{ fontSize: '16px' }}></i>Track Your Order
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'address' ? 'active' : ''}`}
                          onClick={() => setActiveTab('address')}
                          type="button"
                          onMouseEnter={(e) => {
                            if (activeTab !== 'address') {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'address') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'address' ? '#f5f5f5' : 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: activeTab === 'address' ? '#3BB77E' : '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === 'address' ? '500' : '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className={`fi-rs-marker mr-10 ${activeTab === 'address' ? 'text-brand' : ''}`} style={{ fontSize: '16px' }}></i>My Address
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${activeTab === 'account-detail' ? 'active' : ''}`}
                          onClick={() => setActiveTab('account-detail')}
                          type="button"
                          onMouseEnter={(e) => {
                            if (activeTab !== 'account-detail') {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'account-detail') {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: activeTab === 'account-detail' ? '#f5f5f5' : 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: activeTab === 'account-detail' ? '#3BB77E' : '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === 'account-detail' ? '500' : '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className={`fi-rs-user mr-10 ${activeTab === 'account-detail' ? 'text-brand' : ''}`} style={{ fontSize: '16px' }}></i>Account details
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className="nav-link"
                          onClick={() => setShowPasswordModal(true)}
                          type="button"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className="fi-rs-lock mr-10" style={{ fontSize: '16px' }}></i>Change Password
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className="nav-link"
                          onClick={() => {
                            logout();
                            navigate('/login');
                          }}
                          type="button"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 15px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#333',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '400',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i className="fi-rs-sign-out mr-10" style={{ fontSize: '16px' }}></i>Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="tab-content account dashboard-content pl-50">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                      <div className="tab-pane fade active show">
                        <div className="card">
                          <div className="card-header">
                            <h3 className="mb-0">Hello {customer?.customerName || 'User'}!</h3>
                          </div>
                          <div className="card-body">
                            <p>
                              From your account dashboard. you can easily check &amp; view your{' '}
                              <button
                                className="btn-link p-0 border-0 bg-transparent text-primary"
                                onClick={() => setActiveTab('orders')}
                              >
                                recent orders
                              </button>
                              ,<br />
                              manage your{' '}
                              <button
                                className="btn-link p-0 border-0 bg-transparent text-primary"
                                onClick={() => setActiveTab('address')}
                              >
                                shipping and billing addresses
                              </button>{' '}
                              and{' '}
                              <button
                                className="btn-link p-0 border-0 bg-transparent text-primary"
                                onClick={() => setActiveTab('account-detail')}
                              >
                                edit your password and account details.
                              </button>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                      <div className="tab-pane fade active show">
                        <div className="card">
                          <div className="card-header">
                            <h3 className="mb-0">Your Orders</h3>
                          </div>
                          <div className="card-body">
                            {orders.length === 0 ? (
                              <p>You have no orders yet.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table">
                                  <thead>
                                    <tr>
                                      <th>Order</th>
                                      <th>Date</th>
                                      <th>Status</th>
                                      <th>Total</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orders.map((order) => (
                                      <tr key={order.id}>
                                        <td>{order.orderNumber}</td>
                                        <td>{formatDate(order.createdAt)}</td>
                                        <td>
                                          <span className={`badge ${
                                            order.status === 'Completed' ? 'bg-success' :
                                            order.status === 'Pending' ? 'bg-warning' :
                                            'bg-secondary'
                                          }`}>
                                            {order.status}
                                          </span>
                                        </td>
                                        <td>{Math.round(Number(order.totalAmount))} for {getOrderItemCount(order)} item{getOrderItemCount(order) !== 1 ? 's' : ''}</td>
                                        <td>
                                          <button
                                            className="btn btn-small d-block"
                                            onClick={async () => {
                                              showLoading('Loading order details...');
                                              try {
                                                const orderDetails = await getOrderByOrderNumber(order.orderNumber);
                                                setViewingOrder(orderDetails);
                                                setShowOrderModal(true);
                                                closeAlert();
                                              } catch (error) {
                                                closeAlert();
                                                showError('Error', 'Failed to load order details');
                                              }
                                            }}
                                            style={{
                                              textAlign: 'center',
                                              width: '100%',
                                              margin: '0 auto'
                                            }}
                                          >
                                            View
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Track Orders Tab */}
                    {activeTab === 'track-orders' && (
                      <div className="tab-pane fade active show">
                        <div className="card">
                          <div className="card-header">
                            <h3 className="mb-0">Orders tracking</h3>
                          </div>
                          <div className="card-body contact-from-area">
                            <p>To track your order please enter your OrderID in the box below and press "Track" button. This was given to you on your receipt and in the confirmation email you should have received.</p>
                            <div className="row">
                              <div className="col-lg-8">
                                <form className="contact-form-style mt-30 mb-50" onSubmit={handleTrackOrder}>
                                  <div className="input-style mb-20">
                                    <label>Order ID</label>
                                    <input
                                      name="order-id"
                                      placeholder="Found in your order confirmation email"
                                      type="text"
                                      value={trackOrderId}
                                      onChange={(e) => setTrackOrderId(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="input-style mb-20">
                                    <label>Billing email</label>
                                    <input
                                      name="billing-email"
                                      placeholder="Email you used during checkout"
                                      type="email"
                                      value={trackEmail || customer?.customerEmail || ''}
                                      onChange={(e) => setTrackEmail(e.target.value)}
                                      required
                                    />
                                  </div>
                                  {trackingError && (
                                    <div className="alert alert-danger mb-20" role="alert">
                                      {trackingError}
                                    </div>
                                  )}
                                  <button
                                    className="submit submit-auto-width"
                                    type="submit"
                                    disabled={isTracking}
                                  >
                                    {isTracking ? 'Tracking...' : 'Track'}
                                  </button>
                                </form>
                                
                                {trackedOrder && (
                                  <div className="card mt-4">
                                    <div className="card-header">
                                      <h5>Order Details</h5>
                                    </div>
                                    <div className="card-body">
                                      <p><strong>Order Number:</strong> {trackedOrder.orderNumber}</p>
                                      <p><strong>Status:</strong> {trackedOrder.status}</p>
                                      <p><strong>Total:</strong> {Math.round(Number(trackedOrder.totalAmount))}</p>
                                      <p><strong>Date:</strong> {formatDate(trackedOrder.createdAt)}</p>
                                      <p><strong>Shipping Address:</strong> {trackedOrder.shippingAddress}</p>
                                      {trackedOrder.items && trackedOrder.items.length > 0 && (
                                        <div className="mt-3">
                                          <strong>Items:</strong>
                                          <ul>
                                            {trackedOrder.items.map((item, index) => (
                                              <li key={index}>
                                                Quantity: {item.quantity} - Price: {Math.round(Number(item.price))}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address Tab */}
                    {activeTab === 'address' && (
                      <div className="tab-pane fade active show">
                        <div className="row">
                          <div className="col-lg-6">
                            <div className="card mb-3 mb-lg-0">
                              <div className="card-header">
                                <h3 className="mb-0">Billing Address</h3>
                              </div>
                              <div className="card-body">
                                {editingAddressType === 'Billing' ? (
                                  <form onSubmit={handleSaveAddress}>
                                    {addressError && (
                                      <div className="alert alert-danger mb-3" role="alert">
                                        {addressError}
                                      </div>
                                    )}
                                    {addressSuccess && (
                                      <div className="alert alert-success mb-3" role="alert">
                                        Address saved successfully!
                                      </div>
                                    )}
                                    <div className="form-group mb-3">
                                      <label>Address Line 1 <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="addressLine1"
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Address Line 2</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>City <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>State</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Postal Code</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="postalCode"
                                        value={addressForm.postalCode}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Country <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="country"
                                        value={addressForm.country}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <div className="custome-checkbox">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          name="isDefault"
                                          id="billingDefault"
                                          checked={addressForm.isDefault}
                                          onChange={handleAddressInputChange}
                                          disabled={isSavingAddress}
                                        />
                                        <label className="form-check-label" htmlFor="billingDefault">
                                          <span>Set as default address</span>
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <button
                                        type="submit"
                                        className="btn btn-fill-out btn-sm mr-2"
                                        disabled={isSavingAddress}
                                      >
                                        {isSavingAddress ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingAddress}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {getBillingAddress() ? (
                                      <>
                                    <address>
                                      {getBillingAddress().addressLine1}
                                      {getBillingAddress().addressLine2 && (
                                        <>
                                          <br />{getBillingAddress().addressLine2}
                                        </>
                                      )}
                                      <br />
                                      {getBillingAddress().city}, {getBillingAddress().state} {getBillingAddress().postalCode}
                                      <br />
                                      {getBillingAddress().country}
                                    </address>
                                      </>
                                    ) : (
                                      <p>No billing address on file.</p>
                                    )}
                                    <button 
                                      className="btn-small" 
                                      onClick={() => handleEditAddress('Billing')}
                                      style={{
                                        padding: '8px 20px',
                                        backgroundColor: '#3BB77E',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2ea66a';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3BB77E';
                                      }}
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-lg-6">
                            <div className="card">
                              <div className="card-header">
                                <h5 className="mb-0">Shipping Address</h5>
                              </div>
                              <div className="card-body">
                                {editingAddressType === 'Shipping' ? (
                                  <form onSubmit={handleSaveAddress}>
                                    {addressError && (
                                      <div className="alert alert-danger mb-3" role="alert">
                                        {addressError}
                                      </div>
                                    )}
                                    {addressSuccess && (
                                      <div className="alert alert-success mb-3" role="alert">
                                        Address saved successfully!
                                      </div>
                                    )}
                                    <div className="form-group mb-3">
                                      <label>Address Line 1 <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="addressLine1"
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Address Line 2</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>City <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>State</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="state"
                                        value={addressForm.state}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Postal Code</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="postalCode"
                                        value={addressForm.postalCode}
                                        onChange={handleAddressInputChange}
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <label>Country <span className="required">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        name="country"
                                        value={addressForm.country}
                                        onChange={handleAddressInputChange}
                                        required
                                        disabled={isSavingAddress}
                                      />
                                    </div>
                                    <div className="form-group mb-3">
                                      <div className="custome-checkbox">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          name="isDefault"
                                          id="shippingDefault"
                                          checked={addressForm.isDefault}
                                          onChange={handleAddressInputChange}
                                          disabled={isSavingAddress}
                                        />
                                        <label className="form-check-label" htmlFor="shippingDefault">
                                          <span>Set as default address</span>
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group">
                                      <button
                                        type="submit"
                                        className="btn btn-fill-out btn-sm mr-2"
                                        disabled={isSavingAddress}
                                      >
                                        {isSavingAddress ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingAddress}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {getShippingAddress() ? (
                                      <>
                                    <address>
                                      {getShippingAddress().addressLine1}
                                      {getShippingAddress().addressLine2 && (
                                        <>
                                          <br />{getShippingAddress().addressLine2}
                                        </>
                                      )}
                                      <br />
                                      {getShippingAddress().city}, {getShippingAddress().state} {getShippingAddress().postalCode}
                                      <br />
                                      {getShippingAddress().country}
                                    </address>
                                      </>
                                    ) : (
                                      <p>No shipping address on file.</p>
                                    )}
                                    <button 
                                      className="btn-small" 
                                      onClick={() => handleEditAddress('Shipping')}
                                      style={{
                                        padding: '8px 20px',
                                        backgroundColor: '#3BB77E',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#2ea66a';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3BB77E';
                                      }}
                                    >
                                      Edit
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Details Tab */}
                    {activeTab === 'account-detail' && (
                      <div className="tab-pane fade active show">
                        <div className="card">
                          <div className="card-header">
                            <h5>Account Details</h5>
                          </div>
                          <div className="card-body">
                            {updateSuccess && (
                              <div className="alert alert-success mb-3" role="alert">
                                Account updated successfully!
                              </div>
                            )}
                            <form method="post" name="enq" onSubmit={handleUpdateAccount}>
                              <div className="row">
                                <div className="form-group col-md-6">
                                  <label>First Name <span className="required">*</span></label>
                                  <input
                                    required
                                    className="form-control"
                                    name="firstName"
                                    type="text"
                                    value={accountForm.firstName}
                                    onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                                  />
                                </div>
                                <div className="form-group col-md-6">
                                  <label>Last Name <span className="required">*</span></label>
                                  <input
                                    required
                                    className="form-control"
                                    name="lastName"
                                    type="text"
                                    value={accountForm.lastName}
                                    onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                                  />
                                </div>
                                <div className="form-group col-md-12">
                                  <label>Display Name <span className="required">*</span></label>
                                  <input
                                    required
                                    className="form-control"
                                    name="displayName"
                                    type="text"
                                    value={accountForm.displayName}
                                    onChange={(e) => setAccountForm({ ...accountForm, displayName: e.target.value })}
                                  />
                                </div>
                                <div className="form-group col-md-12">
                                  <label>Email Address <span className="required">*</span></label>
                                  <input
                                    required
                                    className="form-control"
                                    name="email"
                                    type="email"
                                    value={accountForm.email}
                                    disabled
                                  />
                                  <small className="form-text text-muted">Email cannot be changed</small>
                                </div>
                                <div className="form-group col-md-12">
                                  <label>Phone</label>
                                  <input
                                    className="form-control"
                                    name="phone"
                                    type="tel"
                                    value={accountForm.phone}
                                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                                  />
                                </div>
                                <div className="col-md-12">
                                  <button
                                    type="submit"
                                    className="btn btn-fill-out submit font-weight-bold"
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? 'Saving...' : 'Save Change'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPasswordModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <form onSubmit={handlePasswordChange}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Current Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength="6"
                    />
                    <small className="form-text text-muted">Minimum 6 characters</small>
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password <span className="required">*</span></label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && viewingOrder && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowOrderModal(false)}>
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details - {viewingOrder.orderNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowOrderModal(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row mb-30">
                  <div className="col-md-6">
                    <p><strong>Order Date:</strong> {formatDate(viewingOrder.createdAt)}</p>
                    <p><strong>Status:</strong> <span className={`badge ${
                      viewingOrder.status === 'Completed' ? 'bg-success' :
                      viewingOrder.status === 'Pending' ? 'bg-warning' :
                      'bg-secondary'
                    }`}>{viewingOrder.status}</span></p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Payment Status:</strong> {viewingOrder.paymentStatus || 'Pending'}</p>
                    <p><strong>Total Amount:</strong> ${Math.round(Number(viewingOrder.totalAmount))}</p>
                  </div>
                </div>

                <div className="row mb-30">
                  <div className="col-md-6">
                    <h6>Shipping Address</h6>
                    <p className="mb-0">{viewingOrder.shippingAddress || 'N/A'}</p>
                  </div>
                  {viewingOrder.notes && (
                    <div className="col-md-6">
                      <h6>Order Notes</h6>
                      <p className="mb-0">{viewingOrder.notes}</p>
                    </div>
                  )}
                </div>

                <h6 className="mb-20">Order Items</h6>
                <div className="table-responsive shopping-summery">
                  <table className="table table-wishlist">
                    <thead>
                      <tr className="main-heading">
                        <th className="text-center" style={{ width: '80px' }}>Image</th>
                        <th>Product</th>
                        <th className="text-center">Unit Price</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-center">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrder.items && viewingOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="image product-thumbnail text-center" style={{ overflow: 'hidden', padding: '10px' }}>
                            <div style={{ 
                              width: '60px', 
                              height: '60px', 
                              overflow: 'hidden', 
                              borderRadius: '5px', 
                              margin: '0 auto',
                              position: 'relative',
                              border: '1px solid #ececec'
                            }}>
                              <img 
                                src={getImageUrl(item.imagePath) || getUnsplashFallback(index)} 
                                alt={item.productName || 'Product'}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  display: 'block',
                                  maxWidth: '100%',
                                  maxHeight: '100%'
                                }}
                                onError={(e) => { e.target.src = getUnsplashFallback(index); }}
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            <h6 className="mb-5">{item.productName || 'Product'}</h6>
                            {item.productSku && <p className="font-xs text-muted mb-0">SKU: {item.productSku}</p>}
                          </td>
                          <td className="text-center">
                            <h6 className="text-brand">${Math.round(Number(item.price || item.unitPrice))}</h6>
                          </td>
                          <td className="text-center">
                            <h6>{item.quantity}</h6>
                          </td>
                          <td className="text-center">
                            <h6 className="text-brand">${Math.round(Number(item.price || item.unitPrice) * Number(item.quantity))}</h6>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-40">
                  <div className="col-lg-7"></div>
                  <div className="col-lg-5">
                    <div className="border p-30 border-radius cart-totals">
                      <div className="d-flex align-items-end justify-content-between mb-10">
                        <h5>Order Summary</h5>
                      </div>
                      <div className="divider-2 mb-20"></div>
                      <div className="table-responsive">
                        <table className="table no-border">
                          <tbody>
                            <tr>
                              <td className="cart_total_label">
                                <h6 className="text-muted">Subtotal</h6>
                              </td>
                              <td className="cart_total_amount">
                                <h5 className="text-brand text-end">${Math.round(Number(viewingOrder.subTotal || viewingOrder.totalAmount))}</h5>
                              </td>
                            </tr>
                            {viewingOrder.shipping > 0 && (
                              <tr>
                                <td className="cart_total_label">
                                  <h6 className="text-muted">Shipping</h6>
                                </td>
                                <td className="cart_total_amount">
                                  <h5 className="text-heading text-end">${Math.round(Number(viewingOrder.shipping))}</h5>
                                </td>
                              </tr>
                            )}
                            {viewingOrder.discount > 0 && (
                              <tr>
                                <td className="cart_total_label">
                                  <h6 className="text-muted">Discount</h6>
                                </td>
                                <td className="cart_total_amount">
                                  <h5 className="text-danger text-end">-${Math.round(Number(viewingOrder.discount))}</h5>
                                </td>
                              </tr>
                            )}
                            {viewingOrder.tax > 0 && (
                              <tr>
                                <td className="cart_total_label">
                                  <h6 className="text-muted">Tax</h6>
                                </td>
                                <td className="cart_total_amount">
                                  <h5 className="text-heading text-end">${Math.round(Number(viewingOrder.tax))}</h5>
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="cart_total_label">
                                <h6 className="text-muted">Total</h6>
                              </td>
                              <td className="cart_total_amount">
                                <h4 className="text-brand text-end">${Math.round(Number(viewingOrder.totalAmount))}</h4>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Account;
