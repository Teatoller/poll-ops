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

  useEffect(() => {
    // Check for admin auth on mount
    const adminToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminData');
    
    if (adminToken && savedAdmin) {
      try {
        const adminData: Admin = JSON.parse(savedAdmin);
        setAdmin(adminData);
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
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Admin login failed');
    }
  };

  const adminLogout = (): void => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    adminAPI.logout();
  };

  const value: AdminContextType = {
    admin,
    adminLogin,
    adminLogout,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};