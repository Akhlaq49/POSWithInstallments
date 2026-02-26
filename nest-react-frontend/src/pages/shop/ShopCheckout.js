import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getCustomerByEmail, getCustomerAddresses, createOrUpdateAddress } from '../../utils/api';
import { showSuccess, showError, showLoading, closeAlert } from '../../utils/swal';
import { getUnsplashFallback, getImageUrl } from '../../utils/imageUtils';
import './ShopCheckout.css';

const ShopCheckout = () => {
  const { cartItems, getCartTotals, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const totals = getCartTotals();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Login
    email: '',
    password: '',
    rememberMe: false,
    
    // Billing Details
    firstName: '',
    lastName: '',
    billingAddress: '',
    billingAddress2: '',
    country: '',
    city: '',
    zipcode: '',
    phone: '',
    companyName: '',
    emailAddress: '',
    additionalInfo: '',
    createAccount: false,
    accountPassword: '',
    
    // Shipping
    shipToDifferent: false,
    shipFirstName: '',
    shipLastName: '',
    shipCompanyName: '',
    shipCountry: '',
    shipAddress: '',
    shipAddress2: '',
    shipState: '',
    shipCity: '',
    shipZipcode: '',
    
    // Payment
    paymentMethod: 'cash_on_delivery',
    
    // Coupon
    couponCode: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Implement login functionality
    console.log('Login:', { email: formData.email, password: formData.password });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    // TODO: Implement coupon functionality
    console.log('Apply coupon:', formData.couponCode);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [, setError] = useState(null);
  const [, setIsSavingAddress] = useState(false);
  
  // Track loaded addresses and customer
  const [loadedCustomer, setLoadedCustomer] = useState(null);
  const [loadedBillingAddress, setLoadedBillingAddress] = useState(null);
  const [loadedShippingAddress, setLoadedShippingAddress] = useState(null);
  const [shouldSaveAddressToProfile, setShouldSaveAddressToProfile] = useState(true); // Default to saving addresses

  // Helper function to populate form data from customer
  const populateFormData = async (customer) => {
    // Populate form with customer data
    const nameParts = (customer.customerName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setFormData(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName,
      emailAddress: customer.customerEmail || '',
      phone: customer.customerPhone || '',
    }));

    // Store customer for address updates
    setLoadedCustomer(customer);

    // Load addresses
    const addresses = await getCustomerAddresses(customer.id);
    if (addresses && addresses.length > 0) {
      const billingAddress = addresses.find(a => a.addressType === 'Billing');
      const shippingAddress = addresses.find(a => a.addressType === 'Shipping');

      if (billingAddress) {
        setLoadedBillingAddress(billingAddress);
        setFormData(prev => ({
          ...prev,
          billingAddress: billingAddress.addressLine1 || '',
          billingAddress2: billingAddress.addressLine2 || '',
          city: billingAddress.city || '',
          country: billingAddress.country || '',
          zipcode: billingAddress.postalCode || '',
        }));
      }

      if (shippingAddress) {
        setLoadedShippingAddress(shippingAddress);
        setFormData(prev => ({
          ...prev,
          shipToDifferent: true,
          shipAddress: shippingAddress.addressLine1 || '',
          shipAddress2: shippingAddress.addressLine2 || '',
          shipCity: shippingAddress.city || '',
          shipCountry: shippingAddress.country || '',
          shipZipcode: shippingAddress.postalCode || '',
          shipState: shippingAddress.state || '',
        }));
      }
    }
  };

  // Load customer profile data when logged in
  useEffect(() => {
    const loadCustomerProfile = async () => {
      if (isAuthenticated && user) {
        setIsLoadingProfile(true);
        try {
          // Use customerEmail from user object (user object from AuthContext has customerEmail property)
          const userEmail = user.customerEmail || user.email;
          
          if (!userEmail) {
            // Try to get email from localStorage as fallback
            const storedEmail = localStorage.getItem('customerEmail');
            if (storedEmail) {
              const customer = await getCustomerByEmail(storedEmail);
              if (customer) {
                await populateFormData(customer);
                return;
              }
            }
            setIsLoadingProfile(false);
            return;
          }
          
          const customer = await getCustomerByEmail(userEmail);
          if (customer) {
            await populateFormData(customer);
          }
        } catch (err) {
          console.error('Error loading customer profile:', err);
          // Don't show error to user, just continue with empty form
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    loadCustomerProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.customerEmail, user?.id]);

  // Save addresses to profile if user is logged in and wants to save
  const saveAddressesToProfile = async () => {
    // Check if we should save addresses
    if (!isAuthenticated || !loadedCustomer || !shouldSaveAddressToProfile) {
      return;
    }

    setIsSavingAddress(true);
    try {
      // Save billing address
      if (formData.billingAddress && formData.city && formData.country) {
        const billingData = {
          addressId: loadedBillingAddress?.id || null,
          addressType: 'Billing',
          addressLine1: formData.billingAddress,
          addressLine2: formData.billingAddress2 || null,
          city: formData.city,
          state: formData.country || null,
          postalCode: formData.zipcode || null,
          country: formData.country,
          isDefault: false
        };
        await createOrUpdateAddress(loadedCustomer.id, billingData);
      }

      // Save shipping address if different
      if (formData.shipToDifferent && formData.shipAddress && formData.shipCity && formData.shipCountry) {
        const shippingData = {
          addressId: loadedShippingAddress?.id || null,
          addressType: 'Shipping',
          addressLine1: formData.shipAddress,
          addressLine2: formData.shipAddress2 || null,
          city: formData.shipCity,
          state: formData.shipState || null,
          postalCode: formData.shipZipcode || null,
          country: formData.shipCountry,
          isDefault: false
        };
        await createOrUpdateAddress(loadedCustomer.id, shippingData);
      }
    } catch (err) {
      console.error('Error saving addresses to profile:', err);
      // Don't block order placement if address save fails
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validate required fields
    const errors = {};
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.billingAddress) errors.billingAddress = 'Address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.zipcode) errors.zipcode = 'Postcode/ZIP is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.emailAddress) errors.emailAddress = 'Email address is required';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showError('Validation Error', 'Please fill in all required fields');
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    if (cartItems.length === 0) {
      showError('Empty Cart', 'Your cart is empty. Please add items before checkout.');
      setError('Your cart is empty');
      return;
    }

    setIsSubmitting(true);

    try {
      showLoading('Placing your order...');
      
      // Save addresses to profile if user wants to
      if (isAuthenticated && shouldSaveAddressToProfile) {
        await saveAddressesToProfile();
      }
      // Prepare order data
      const orderData = {
        customerId: (user && (user.id || user.Id)) || null, // Include customer ID if logged in (handle both id and Id)
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.emailAddress,
        customerPhone: formData.phone,
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.billingAddress,
          addressLine2: formData.billingAddress2 || '',
          city: formData.city,
          state: formData.country, // Using country as state for now
          postalCode: formData.zipcode,
          country: formData.country,
          companyName: formData.companyName || '',
          email: formData.emailAddress,
          phone: formData.phone
        },
        shippingAddress: formData.shipToDifferent ? {
          firstName: formData.shipFirstName,
          lastName: formData.shipLastName,
          addressLine1: formData.shipAddress,
          addressLine2: formData.shipAddress2 || '',
          city: formData.shipCity,
          state: formData.shipState,
          postalCode: formData.shipZipcode,
          country: formData.shipCountry,
          companyName: formData.shipCompanyName || ''
        } : null,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: Number(item.price) || 0
        })),
        paymentMethod: formData.paymentMethod,
        subTotal: totals.subtotal,
        shipping: totals.shipping,
        discount: 0,
        tax: 0,
        grandTotal: totals.total,
        notes: formData.additionalInfo || '',
        additionalInfo: formData.additionalInfo || '',
        createAccount: formData.createAccount,
        accountPassword: formData.createAccount ? formData.accountPassword : null
      };

      // Call API
      const result = await createOrder(orderData);
      closeAlert();
      
      // Save customer email to localStorage for account page access
      if (formData.emailAddress) {
        localStorage.setItem('customerEmail', formData.emailAddress);
      }
      
      // Success - clear cart and redirect
      clearCart(false); // Don't show alert since we'll show success message
      showSuccess(
        'Order Placed Successfully!',
        `Your order has been placed. Order Number: ${result.orderNumber || 'N/A'}`,
        3000
      ).then(() => {
        navigate('/');
      });
    } catch (err) {
      closeAlert();
      console.error('Error placing order:', err);
      showError('Order Failed', err.message || 'Failed to place order. Please try again.');
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="main-content-inner">
        <div className="page-header breadcrumb-wrap">
          <div className="container">
            <div className="breadcrumb">
              <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
              <span></span> Shop
              <span></span> Checkout
            </div>
          </div>
        </div>
        <div className="container mb-80 mt-50">
          <div className="row">
            <div className="col-lg-12 text-center py-5">
              <h3 className="mb-20">Your cart is empty</h3>
              <Link to="/shop" className="btn">
                <i className="fi-rs-arrow-left mr-10"></i>Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner">
      <div className="page-header breadcrumb-wrap">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/" rel="nofollow"><i className="fi-rs-home mr-5"></i>Home</Link>
            <span></span> Shop
            <span></span> Checkout
          </div>
        </div>
      </div>

      <div className="container mb-80 mt-50">
        <div className="row">
          <div className="col-lg-8 mb-40">
            <h1 className="heading-2 mb-10">Checkout</h1>
            <div className="d-flex justify-content-between">
              <h6 className="text-body">
                There are <span className="text-brand">{cartItems.length}</span> product{cartItems.length !== 1 ? 's' : ''} in your cart
              </h6>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-7">
            <div className="row mb-50">
              <div className="col-lg-6 mb-sm-15 mb-lg-0 mb-md-3">
                <div className="toggle_info">
                  <span>
                    <i className="fi-rs-user mr-10"></i>
                    <span className="text-muted font-lg">Already have an account? </span>
                    <a 
                      href="#loginform" 
                      data-bs-toggle="collapse" 
                      className="collapsed font-lg" 
                      aria-expanded="false"
                      onClick={(e) => {
                        e.preventDefault();
                        const collapse = document.getElementById('loginform');
                        if (collapse) {
                          collapse.classList.toggle('show');
                        }
                      }}
                    >
                      Click here to login
                    </a>
                  </span>
                </div>
                <div className="panel-collapse collapse login_form" id="loginform">
                  <div className="panel-body">
                    <p className="mb-30 font-sm">
                      If you have shopped with us before, please enter your details below. 
                      If you are a new customer, please proceed to the Billing &amp; Shipping section.
                    </p>
                    <form method="post" onSubmit={handleLogin}>
                      <div className="form-group">
                        <input 
                          type="text" 
                          name="email" 
                          placeholder="Username Or Email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <input 
                          type="password" 
                          name="password" 
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="login_footer form-group">
                        <div className="chek-form">
                          <div className="custome-checkbox">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              name="rememberMe" 
                              id="remember" 
                              checked={formData.rememberMe}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="remember">
                              <span>Remember me</span>
                            </label>
                          </div>
                        </div>
                        <Link to="/forgot-password">Forgot password?</Link>
                      </div>
                      <div className="form-group">
                        <button className="btn btn-md" type="submit" name="login">Log in</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="toggle_info">
                  <span>
                    <i className="fi-rs-label mr-10"></i>
                    <span className="text-muted font-lg">Have a coupon? </span>
                    <button 
                      type="button"
                      className="font-lg border-0 bg-transparent p-0" 
                      onClick={() => {
                        const collapse = document.getElementById('couponform');
                        if (collapse) {
                          collapse.classList.toggle('show');
                        }
                      }}
                    >
                      Click here to enter your code
                    </button>
                  </span>
                </div>
                <div className="panel-collapse collapse coupon_form" id="couponform">
                  <div className="panel-body">
                    <p className="mb-30 font-sm">
                      If you have a coupon code, please apply it below.
                    </p>
                    <form method="post" className="apply-coupon" onSubmit={handleApplyCoupon}>
                      <div className="form-group">
                        <input 
                          type="text" 
                          name="couponCode"
                          placeholder="Enter Coupon Code..."
                          value={formData.couponCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <button className="btn btn-md" type="submit" name="applyCoupon">Apply Coupon</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <h4 className="mb-30">Billing Details</h4>
              {isLoadingProfile && (
                <div className="alert alert-info mb-30" role="alert" style={{ padding: '12px 15px', backgroundColor: '#d1ecf1', color: '#0c5460', borderRadius: '4px' }}>
                  <i className="fi-rs-loading mr-10"></i>
                  Loading your profile information...
                </div>
              )}
              {isAuthenticated && loadedCustomer && (loadedBillingAddress || loadedShippingAddress) && (
                <div className="alert alert-success mb-30" role="alert" style={{ padding: '12px 15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
                  <i className="fi-rs-info mr-10"></i>
                  <strong>Addresses loaded from your profile.</strong> You can edit them below. Changes will be saved to your profile when you place the order.
                </div>
              )}
              <form method="post" onSubmit={handlePlaceOrder}>
                {isAuthenticated && loadedBillingAddress && (
                  <div className="mb-20" style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '13px', color: '#6c757d' }}>
                    <i className="fi-rs-marker mr-5"></i>
                    <strong>Billing address loaded from profile</strong> - You can edit it below
                  </div>
                )}
                <div className="row">
                  <div className="form-group col-lg-6">
                    <input 
                      type="text" 
                      required 
                      name="firstName" 
                      placeholder="First name *"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={fieldErrors.firstName ? 'error' : ''}
                    />
                    {fieldErrors.firstName && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.firstName}
                      </span>
                    )}
                  </div>
                  <div className="form-group col-lg-6">
                    <input 
                      type="text" 
                      required 
                      name="lastName" 
                      placeholder="Last name *"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={fieldErrors.lastName ? 'error' : ''}
                    />
                    {fieldErrors.lastName && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="form-group col-lg-6">
                    <input 
                      type="text" 
                      name="billingAddress" 
                      required 
                      placeholder="Address *"
                      value={formData.billingAddress}
                      onChange={handleInputChange}
                      className={fieldErrors.billingAddress ? 'error' : ''}
                    />
                    {fieldErrors.billingAddress && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.billingAddress}
                      </span>
                    )}
                  </div>
                  <div className="form-group col-lg-6">
                    <input 
                      type="text" 
                      name="billingAddress2" 
                      required 
                      placeholder="Address line2"
                      value={formData.billingAddress2}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="row shipping_calculator">
                  <div className="form-group col-lg-6">
                    <div className="custom_select">
                      <select 
                        className="form-control select-active"
                        name="country"
                        required
                        value={formData.country}
                        onChange={handleInputChange}
                      >
                        <option value="">Select an option...</option>
                        <option value="US">USA (US)</option>
                        <option value="GB">United Kingdom (UK)</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="PK">Pakistan</option>
                        {/* Add more countries as needed */}
                      </select>
                    </div>
                  </div>
                  <div className="form-group col-lg-6">
                    <input 
                      required 
                      type="text" 
                      name="city" 
                      placeholder="City / Town *"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={fieldErrors.city ? 'error' : ''}
                    />
                    {fieldErrors.city && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="form-group col-lg-6">
                    <input 
                      required 
                      type="text" 
                      name="zipcode" 
                      placeholder="Postcode / ZIP *"
                      value={formData.zipcode}
                      onChange={handleInputChange}
                      className={fieldErrors.zipcode ? 'error' : ''}
                    />
                    {fieldErrors.zipcode && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.zipcode}
                      </span>
                    )}
                  </div>
                  <div className="form-group col-lg-6">
                    <input 
                      required 
                      type="text" 
                      name="phone" 
                      placeholder="Phone *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={fieldErrors.phone ? 'error' : ''}
                    />
                    {fieldErrors.phone && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="form-group col-lg-6">
                    <input 
                      required 
                      type="text" 
                      name="companyName" 
                      placeholder="Company Name"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group col-lg-6">
                    <input 
                      required 
                      type="text" 
                      name="emailAddress" 
                      placeholder="Email address *"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      className={fieldErrors.emailAddress ? 'error' : ''}
                    />
                    {fieldErrors.emailAddress && (
                      <span className="text-danger" style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        {fieldErrors.emailAddress}
                      </span>
                    )}
                  </div>
                </div>
                <div className="form-group mb-30">
                  <textarea 
                    rows="5" 
                    name="additionalInfo"
                    placeholder="Additional information"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                {!isAuthenticated && (
                  <>
                    <div className="form-group">
                      <div className="checkbox">
                        <div className="custome-checkbox">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="createAccount" 
                            id="createaccount"
                            checked={formData.createAccount}
                            onChange={handleInputChange}
                          />
                          <label 
                            className="form-check-label label_info" 
                            htmlFor="createaccount"
                            onClick={(e) => {
                              const collapse = document.getElementById('collapsePassword');
                              if (collapse) {
                                collapse.classList.toggle('show');
                              }
                            }}
                          >
                            <span>Create an account?</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div 
                      id="collapsePassword" 
                      className={`form-group create-account collapse ${formData.createAccount ? 'show' : ''}`}
                    >
                      <div className="row">
                        <div className="col-lg-6">
                          <input 
                            required={formData.createAccount}
                            type="password" 
                            name="accountPassword"
                            placeholder="Password" 
                            value={formData.accountPassword}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {isAuthenticated && (
                  <div className="mb-30">
                    <div className="alert alert-info mb-20" role="alert" style={{ padding: '12px 15px', backgroundColor: '#d1ecf1', color: '#0c5460', borderRadius: '4px' }}>
                      <i className="fi-rs-user mr-10"></i>
                      You are logged in as {user?.customerName || user?.customerEmail || 'User'}. Your order will be linked to your account.
                    </div>
                    {loadedCustomer && (loadedBillingAddress || loadedShippingAddress) && (
                      <div className="form-group">
                        <div className="custome-checkbox">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="saveAddressToProfile"
                            checked={shouldSaveAddressToProfile}
                            onChange={(e) => setShouldSaveAddressToProfile(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="saveAddressToProfile">
                            <span>Save address changes to my profile</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="ship_detail">
                  <div className="form-group">
                    <div className="chek-form">
                      <div className="custome-checkbox">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          name="shipToDifferent" 
                          id="differentaddress"
                          checked={formData.shipToDifferent}
                          onChange={handleInputChange}
                        />
                        <label 
                          className="form-check-label label_info" 
                          htmlFor="differentaddress"
                          onClick={(e) => {
                            const collapse = document.getElementById('collapseAddress');
                            if (collapse) {
                              collapse.classList.toggle('show');
                            }
                          }}
                        >
                          <span>Ship to a different address?</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div 
                    id="collapseAddress" 
                    className={`different_address collapse ${formData.shipToDifferent ? 'show' : ''}`}
                  >
                    {isAuthenticated && loadedShippingAddress && formData.shipToDifferent && (
                      <div className="mb-20" style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '13px', color: '#6c757d' }}>
                        <i className="fi-rs-marker mr-5"></i>
                        <strong>Shipping address loaded from profile</strong> - You can edit it below
                      </div>
                    )}
                    <div className="row">
                      <div className="form-group col-lg-6">
                        <input 
                          type="text" 
                          required={formData.shipToDifferent}
                          name="shipFirstName" 
                          placeholder="First name *"
                          value={formData.shipFirstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group col-lg-6">
                        <input 
                          type="text" 
                          required={formData.shipToDifferent}
                          name="shipLastName" 
                          placeholder="Last name *"
                          value={formData.shipLastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="row shipping_calculator">
                      <div className="form-group col-lg-6">
                        <input 
                          required={formData.shipToDifferent}
                          type="text" 
                          name="shipCompanyName" 
                          placeholder="Company Name"
                          value={formData.shipCompanyName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group col-lg-6">
                        <div className="custom_select w-100">
                          <select 
                            className="form-control select-active"
                            name="shipCountry"
                            required={formData.shipToDifferent}
                            value={formData.shipCountry}
                            onChange={handleInputChange}
                          >
                            <option value="">Select an option...</option>
                            <option value="US">USA (US)</option>
                            <option value="GB">United Kingdom (UK)</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="IN">India</option>
                            <option value="PK">Pakistan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="form-group col-lg-6">
                        <input 
                          type="text" 
                          name="shipAddress" 
                          required={formData.shipToDifferent}
                          placeholder="Address *"
                          value={formData.shipAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group col-lg-6">
                        <input 
                          type="text" 
                          name="shipAddress2" 
                          required={formData.shipToDifferent}
                          placeholder="Address line2"
                          value={formData.shipAddress2}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="form-group col-lg-6">
                        <input 
                          required={formData.shipToDifferent}
                          type="text" 
                          name="shipState" 
                          placeholder="State / County *"
                          value={formData.shipState}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group col-lg-6">
                        <input 
                          required={formData.shipToDifferent}
                          type="text" 
                          name="shipCity" 
                          placeholder="City / Town *"
                          value={formData.shipCity}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="form-group col-lg-6">
                        <input 
                          required={formData.shipToDifferent}
                          type="text" 
                          name="shipZipcode" 
                          placeholder="Postcode / ZIP *"
                          value={formData.shipZipcode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="border p-40 cart-totals ml-30 mb-50">
              <div className="d-flex align-items-end justify-content-between mb-30">
                <h4>Your Order</h4>
                <h6 className="text-muted">Subtotal</h6>
              </div>
              <div className="divider-2 mb-30"></div>
              <div className="table-responsive order_table checkout">
                <table className="table no-border">
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="image product-thumbnail">
                          <img 
                            src={getImageUrl(item.image) || item.image || getUnsplashFallback(0)}
                            onError={(e) => { e.target.src = getUnsplashFallback(0); }} 
                            alt={item.productName || item.name} 
                          />
                        </td>
                        <td>
                          <h6 className="w-160 mb-5">
                            <Link 
                              to={`/shop-product-right?id=${item.id}`} 
                              className="text-heading"
                            >
                              {item.productName || item.name}
                            </Link>
                          </h6>
                          <div className="product-rate-cover">
                            <div className="product-rate d-inline-block">
                              <div className="product-rating" style={{ width: '90%' }}></div>
                            </div>
                            <span className="font-small ml-5 text-muted"> (4.0)</span>
                          </div>
                        </td>
                        <td>
                          <h6 className="text-muted pl-20 pr-20">x {item.quantity}</h6>
                        </td>
                        <td>
                          <h4 className="text-brand">{Math.round((Number(item.price) || 0) * (Number(item.quantity) || 0))}</h4>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divider-2 mb-30"></div>
              <div className="table-responsive order_table checkout">
                <table className="table no-border">
                  <tbody>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Subtotal</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h4 className="text-brand text-end">{Math.round(Number(totals.subtotal) || 0)}</h4>
                      </td>
                    </tr>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Shipping</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h5 className="text-heading text-end">
                          {Number(totals.shipping) === 0 ? 'Free' : `${Math.round(Number(totals.shipping) || 0)}`}
                        </h5>
                      </td>
                    </tr>
                    <tr>
                      <td className="cart_total_label">
                        <h6 className="text-muted">Total</h6>
                      </td>
                      <td className="cart_total_amount">
                        <h4 className="text-brand text-end">{Math.round(Number(totals.total) || 0)}</h4>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="payment ml-30">
              <h4 className="mb-30">Payment</h4>
              <div className="payment_option">
                <div className="custome-radio">
                  <input 
                    className="form-check-input" 
                    required 
                    type="radio" 
                    name="paymentMethod" 
                    id="bankTransfer"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="bankTransfer">
                    Direct Bank Transfer
                  </label>
                </div>
                <div className="custome-radio">
                  <input 
                    className="form-check-input" 
                    required 
                    type="radio" 
                    name="paymentMethod" 
                    id="cashOnDelivery"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === 'cash_on_delivery'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="cashOnDelivery">
                    Cash on delivery
                  </label>
                </div>
                <div className="custome-radio">
                  <input 
                    className="form-check-input" 
                    required 
                    type="radio" 
                    name="paymentMethod" 
                    id="onlineGateway"
                    value="online_gateway"
                    checked={formData.paymentMethod === 'online_gateway'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="onlineGateway">
                    Online Getway
                  </label>
                </div>
              </div>
              <div className="payment-logo d-flex">
                <img className="mr-15" src="/assets/imgs/theme/icons/payment-paypal.svg" alt="PayPal" />
                <img className="mr-15" src="/assets/imgs/theme/icons/payment-visa.svg" alt="Visa" />
                <img className="mr-15" src="/assets/imgs/theme/icons/payment-master.svg" alt="Mastercard" />
                <img src="/assets/imgs/theme/icons/payment-zapper.svg" alt="Zapper" />
              </div>
              <button 
                type="button"
                className="btn btn-fill-out btn-block mt-30"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : 'Place an Order'}
                <i className="fi-rs-sign-out ml-15"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCheckout;
