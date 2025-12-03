// src/components/admin/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { user, admin } = useAuth();
  
  // Check authentication
  if (!user && !admin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Check admin privileges if required
  if (requireAdmin) {
    const isAdmin = user?.email === 'admin@pollingapp.com' || admin?.role === 'admin';
    if (!isAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
  }
  
  return <Outlet />;
};

export default ProtectedRoute;