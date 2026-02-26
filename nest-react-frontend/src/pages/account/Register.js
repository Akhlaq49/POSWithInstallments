import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError, showLoading, closeAlert } from '../../utils/swal';

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityCode: '',
    agreeToTerms: false
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/account');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Validation Error', 'Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match. Please try again.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Security code validation (simple check - in production, use proper CAPTCHA)
    const expectedCode = '8675'; // This should be generated server-side in production
    if (formData.securityCode !== expectedCode) {
      showError('Invalid Security Code', 'Please enter the correct security code');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      showError('Terms Required', 'Please agree to terms & policy to continue');
      setIsLoading(false);
      return;
    }

    try {
      showLoading('Creating your account...');
      const result = await register(
        formData.username,
        formData.email,
        formData.password,
        null // phone - can be added later if needed
      );
      closeAlert();

      if (result.success) {
        showSuccess('Registration Successful!', 'Your account has been created successfully', 2000).then(() => {
          // Redirect to account page after successful registration
          navigate('/account');
        });
      } else {
        showError('Registration Failed', result.error || 'Please try again.');
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      closeAlert();
      showError('Error', err.message || 'An error occurred during registration. Please try again.');
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="col-xl-8 col-lg-10 col-md-12 m-auto">
              <div className="row">
                <div className="col-lg-6 col-md-8">
                  <div className="login_wrap widget-taber-content background-white">
                    <div className="padding_eight_all bg-white">
                      <div className="heading_s1">
                        <h1 className="mb-5">Create an Account</h1>
                        <p className="mb-30">
                          Already have an account ? <Link to="/login">Login</Link>
                        </p>
                      </div>
                      
                      {error && (
                        <div className="alert alert-danger mb-30" role="alert" style={{ padding: '12px 20px', borderRadius: '4px' }}>
                          {error}
                        </div>
                      )}

                      <form method="post" onSubmit={handleSubmit}>
                        <div className="form-group">
                          <input
                            type="text"
                            required
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="email"
                            required
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            required
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            minLength="6"
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <input
                            required
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            minLength="6"
                            className="form-control"
                          />
                        </div>
                        <div className="login_footer form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div className="chek-form" style={{ flex: '1', marginRight: '15px' }}>
                            <input
                              type="text"
                              required
                              name="securityCode"
                              placeholder="Security code *"
                              value={formData.securityCode}
                              onChange={handleInputChange}
                              disabled={isLoading}
                              maxLength="4"
                              className="form-control"
                              style={{ width: '100%' }}
                            />
                          </div>
                          <span className="security-code" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <b className="text-new" style={{ fontSize: '18px', fontWeight: 'bold', color: '#3BB77E' }}>8</b>
                            <b className="text-hot" style={{ fontSize: '18px', fontWeight: 'bold', color: '#F74B81' }}>6</b>
                            <b className="text-sale" style={{ fontSize: '18px', fontWeight: 'bold', color: '#67BCEE' }}>7</b>
                            <b className="text-best" style={{ fontSize: '18px', fontWeight: 'bold', color: '#FDC040' }}>5</b>
                          </span>
                        </div>
                        <div className="login_footer form-group mb-50" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div className="chek-form">
                            <div className="custome-checkbox">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="agreeToTerms"
                                id="exampleCheckbox12"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                disabled={isLoading}
                              />
                              <label className="form-check-label" htmlFor="exampleCheckbox12" style={{ marginLeft: '8px' }}>
                                <span>I agree to terms &amp; Policy.</span>
                              </label>
                            </div>
                          </div>
                          <a href="/privacy-policy" className="text-muted" style={{ textDecoration: 'none', fontSize: '14px' }}>
                            <i className="fi-rs-book-alt mr-5 text-muted"></i>Learn more
                          </a>
                        </div>
                        <div className="form-group mb-30">
                          <button
                            type="submit"
                            className="btn btn-fill-out btn-block hover-up font-weight-bold"
                            name="login"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Registering...' : 'Submit & Register'}
                          </button>
                        </div>
                        <p className="font-xs text-muted">
                          <strong>Note:</strong>Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our privacy policy
                        </p>
                      </form>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 pr-30 d-none d-lg-block">
                  <div className="card-login mt-115">
                    <button 
                      type="button"
                      className="social-login facebook-login" 
                      onClick={() => { 
                        alert('Facebook login coming soon!'); 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#1877f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '15px 20px', 
                        marginBottom: '15px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        border: '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        color: '#333',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <img src="/assets/imgs/theme/icons/logo-facebook.svg" alt="Facebook" style={{ marginRight: '15px', width: '20px', height: '20px' }} />
                      <span>Continue with Facebook</span>
                    </button>
                    <button 
                      type="button"
                      className="social-login google-login" 
                      onClick={() => { 
                        alert('Google login coming soon!'); 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#4285f4';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '15px 20px', 
                        marginBottom: '15px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        border: '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        color: '#333',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <img src="/assets/imgs/theme/icons/logo-google.svg" alt="Google" style={{ marginRight: '15px', width: '20px', height: '20px' }} />
                      <span>Continue with Google</span>
                    </button>
                    <button 
                      type="button"
                      className="social-login apple-login" 
                      onClick={() => { 
                        alert('Apple login coming soon!'); 
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '15px 20px', 
                        marginBottom: '0',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        border: '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        color: '#333',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <img src="/assets/imgs/theme/icons/logo-apple.svg" alt="Apple" style={{ marginRight: '15px', width: '20px', height: '20px' }} />
                      <span>Continue with Apple</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
