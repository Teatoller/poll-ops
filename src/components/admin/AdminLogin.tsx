import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/adminLogin.css';
import { useAdmin } from '../../contexts/AdminContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { adminLogin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Admin Portal</h1>
          <p className="login-subtitle">Election Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign in to Admin Panel'
            )}
          </button>
          
          <div className="login-footer">
            <p className="security-notice">
              <i className="fas fa-shield-alt"></i>
              Secure admin access only. Unauthorized access is prohibited.
            </p>
          </div>
        </form>
        
        <div className="login-help">
          <details>
            <summary>Having trouble signing in?</summary>
            <div className="help-content">
              <p>• Ensure you're using the correct admin credentials</p>
              <p>• Check that your account has admin privileges</p>
              <p>• Contact system administrator for assistance</p>
            </div>
          </details>
        </div>
      </div>
      
      <div className="admin-login-sidebar">
        <div className="sidebar-content">
          <h2>Admin Features</h2>
          <ul className="features-list">
            <li>
              <i className="fas fa-poll"></i>
              <span>Manage Polls & Elections</span>
            </li>
            <li>
              <i className="fas fa-users-cog"></i>
              <span>User Management</span>
            </li>
            <li>
              <i className="fas fa-chart-bar"></i>
              <span>Real-time Analytics</span>
            </li>
            <li>
              <i className="fas fa-file-export"></i>
              <span>Data Export & Reports</span>
            </li>
            <li>
              <i className="fas fa-cogs"></i>
              <span>System Configuration</span>
            </li>
          </ul>
          
          <div className="system-status">
            <h3>System Status</h3>
            <div className="status-indicators">
              <div className="status-item online">
                <span className="status-dot"></span>
                <span>Database: Online</span>
              </div>
              <div className="status-item online">
                <span className="status-dot"></span>
                <span>Authentication: Active</span>
              </div>
              <div className="status-item online">
                <span className="status-dot"></span>
                <span>API: Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;