// src/components/admin/AdminLayout.tsx
import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import '../../styles/admin.css';

const AdminLayout: React.FC = () => {
  const { admin, adminLogout, loading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login', { replace: true });
  };

  const handleRefresh = () => {
    // Soft refresh: Re-navigate to current route to trigger component re-mount
    // Better for mobile - only refetches data, keeps assets cached
    const currentPath = location.pathname;
    navigate('/admin', { replace: true });
    setTimeout(() => navigate(currentPath, { replace: true }), 0);
  };

  // Show loading state (route protection handles redirect)
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  // Defense-in-depth: This shouldn't render since route is protected
  if (!admin) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Polling Admin</h2>
          <p className="admin-email">
            {admin.email || 'Admin User'}
          </p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard')}`}>
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          
          <Link to="/admin/polls" className={`nav-item ${isActive('/admin/polls')}`}>
            <span className="nav-icon">🗳️</span>
            Poll Management
          </Link>
          
          <Link to="/admin/users" className={`nav-item ${isActive('/admin/users')}`}>
            <span className="nav-icon">👥</span>
            User Management
          </Link>
          
          <Link to="/admin/results" className={`nav-item ${isActive('/admin/results')}`}>
            <span className="nav-icon">📈</span>
            Results Analytics
          </Link>
          
          <Link to="/admin/reports" className={`nav-item ${isActive('/admin/reports')}`}>
            <span className="nav-icon">📄</span>
            Reports & Export
          </Link>
          
          <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings')}`}>
            <span className="nav-icon">⚙️</span>
            Settings
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title">
            <h1>Administration Panel</h1>
            <p className="breadcrumb">Manage your polling application</p>
          </div>
          <div className="header-actions">
            <button className="refresh-button" onClick={handleRefresh}>
              ⟳ Refresh
            </button>
            <div className="user-badge">
              <span className="user-avatar">A</span>
              <span>Admin</span>
            </div>
          </div>
        </header>
        
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;