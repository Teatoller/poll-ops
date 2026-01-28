// src/contexts/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Admin } from '../types';
import { adminAPI } from '../services/api';

interface AdminContextType {
  admin: Admin | null;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  loading: boolean;
  capabilities: Set<string>;
  can: (permission: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [capabilities, setCapabilities] = useState<Set<string>>(new Set());

  // Frontend mirror of backend role capabilities
  const roleCapabilities: Record<string, string[]> = {
    superadmin: [
      'viewPolls',
      'managePolls',
      'viewUsers',
      'manageUsers',
      'manageSurveys',
      'viewAnalytics',
      'exportData',
      'manageAdmins'
    ],
    admin: [
      'viewPolls',
      'managePolls',
      'viewUsers',
      'manageUsers',
      'manageSurveys',
      'viewAnalytics',
      'exportData'
    ],
    editor: [
      'viewPolls',
      'managePolls',
      'manageSurveys',
      'viewAnalytics'
    ],
    viewer: [
      'viewPolls',
      'viewUsers',
      'viewAnalytics'
    ]
  };

  useEffect(() => {
    // Check for admin auth on mount
    const adminToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminData');
    
    if (adminToken && savedAdmin) {
      try {
        const adminData: Admin = JSON.parse(savedAdmin);
        setAdmin(adminData);
        const caps = new Set(roleCapabilities[adminData.role] || []);
        setCapabilities(caps);
      } catch (error) {
        console.error('Error parsing saved admin data:', error);
        adminLogout();
      }
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email: string, password: string): Promise<void> => {
    try {
      const response = await adminAPI.login({ email, password });
      
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminData', JSON.stringify(response.admin));
      setAdmin(response.admin);
      const caps = new Set(roleCapabilities[response.admin.role] || []);
      setCapabilities(caps);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Admin login failed');
    }
  };

  const adminLogout = (): void => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    setCapabilities(new Set());
    adminAPI.logout();
  };

  const value: AdminContextType = React.useMemo(() => ({
    admin,
    adminLogin,
    adminLogout,
    loading,
    capabilities,
    can: (permission: string) => capabilities.has(permission)
  }), [admin, loading, capabilities]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};