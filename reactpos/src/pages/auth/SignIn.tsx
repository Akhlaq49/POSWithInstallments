import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper">
          <div className="login-content">
            <div className="login-userset">
              <div className="login-logo logo-normal">
                <img src="/assets/img/logo.svg" alt="Logo" />
              </div>
              <Link to="/" className="login-logo logo-white">
                <img src="/assets/img/logo-white.svg" alt="Logo" />
              </Link>
              <div className="login-userheading">
                <h3>Sign In</h3>
                <h4>Please enter your details</h4>
              </div>
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="form-login">
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>
              <div className="signinform text-center mt-3">
                <span>Don't have an account? </span>
                <Link to="/register">Register</Link>
              </div>
            </div>
          </div>
          <div className="login-img">
            <img src="/assets/img/authentication/login-img.png" alt="Login" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

