import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError, showLoading, closeAlert } from '../../utils/swal';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    securityCode: ''
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    // Basic validation
    if (!formData.email || !formData.password) {
      showError('Validation Error', 'Please fill in all required fields');
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

    try {
      showLoading('Logging in...');
      const result = await login(formData.email, formData.password);
      closeAlert();
      
      if (result.success) {
        showSuccess('Login Successful!', 'Welcome back!', 1500).then(() => {
          // Redirect to account page or previous page
          const from = new URLSearchParams(window.location.search).get('from') || '/account';
          navigate(from);
        });
      } else {
        showError('Login Failed', result.error || 'Please check your credentials and try again.');
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      closeAlert();
      showError('Error', err.message || 'An error occurred during login. Please try again.');
      setError(err.message || 'An error occurred during login. Please try again.');
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
                <div className="col-lg-6 pr-30 d-none d-lg-block">
                  <img className="border-radius-15" src="assets/imgs/page/login-1.png" alt="" />
                </div>
                <div className="col-lg-6 col-md-8">
                  <div className="login_wrap widget-taber-content background-white">
                    <div className="padding_eight_all bg-white">
                      <div className="heading_s1">
                        <h1 className="mb-5">Login</h1>
                        <p className="mb-30">
                          Don't have an account? <Link to="/register">Create here</Link>
                        </p>
                      </div>
                      
                      {error && (
                        <div className="alert alert-danger mb-30" role="alert">
                          {error}
                        </div>
                      )}

                      <form method="post" onSubmit={handleSubmit}>
                        <div className="form-group">
                          <input
                            type="text"
                            required
                            name="email"
                            placeholder="Username or Email *"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            required
                            type="password"
                            name="password"
                            placeholder="Your password *"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="login_footer form-group">
                          <div className="chek-form">
                            <input
                              type="text"
                              required
                              name="securityCode"
                              placeholder="Security code *"
                              value={formData.securityCode}
                              onChange={handleInputChange}
                              disabled={isLoading}
                              maxLength="4"
                            />
                          </div>
                          <span className="security-code">
                            <b className="text-new">8</b>
                            <b className="text-hot">6</b>
                            <b className="text-sale">7</b>
                            <b className="text-best">5</b>
                          </span>
                        </div>
                        <div className="login_footer form-group mb-50">
                          <div className="chek-form">
                            <div className="custome-checkbox">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name="rememberMe"
                                id="exampleCheckbox1"
                              />
                              <label className="form-check-label" htmlFor="exampleCheckbox1">
                                <span>Remember me</span>
                              </label>
                            </div>
                          </div>
                          <Link className="text-muted" to="/forgot-password">
                            Forgot password?
                          </Link>
                        </div>
                        <div className="form-group">
                          <button
                            type="submit"
                            className="btn btn-heading btn-block hover-up"
                            name="login"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Logging in...' : 'Log in'}
                          </button>
                        </div>
                      </form>
                    </div>
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

export default Login;
