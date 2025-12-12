// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import PollingStation from './components/PollingStation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Results from './components/Results';
import AdminDashboard from './components/admin/AdminDashboard';
import PollManagement from './components/admin/PollManagement';
import UserManagement from './components/admin/UserManagement';
import ResultsAnalytics from './components/admin/ResultsAnalytics';
import ReportsExport from './components/admin/ReportsExport';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import { AdminProvider } from './contexts/AdminContext';
import AdminSettings from './components/admin/AdminSettings';
import AdminProtectedRoute from './components/admin/ProtectedRoute';
import VerifyEmail from './components/VerifyEmail';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AdminProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/poll"
                element={
                  <ProtectedRoute>
                    <PollingStation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="polls" element={<PollManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="results" element={<ResultsAnalytics />} />
                <Route path="reports" element={<ReportsExport />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

            </Routes>
          </div>
        </Router>
      </AdminProvider>
    </AuthProvider>
  );
};

export default App;
