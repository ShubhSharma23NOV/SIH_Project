import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Government Header */}
        <div className="login-header">
          <div className="gov-emblem">
            <img src="/logo/1285px-Emblem_of_India_(navy_blue).svg.png" alt="Government of India" />
          </div>
          <h1 className="login-title">ArogyaJal</h1>
          <p className="login-subtitle">Water Quality & Health Surveillance System</p>
          <p className="login-tagline">Ministry of Jal Shakti | Government of India</p>
        </div>

        {/* Login Form */}
        <div className="login-card">
          <h2 className="login-card-title">Official Login</h2>
          <p className="login-card-subtitle">For Government Officials Only</p>

          {error && (
            <div className="login-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your official email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-help">
              For technical support, contact your system administrator
            </p>
          </div>
        </div>

        {/* Government Footer */}
        <div className="login-page-footer">
          <p>AROGYAJAL for © 2025 Smart India Hackathon.</p>
          <p className="footer-links">
            <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Help</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
