// src/components/admin/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { admin, loading } = useAdmin();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

export default AdminProtectedRoute;