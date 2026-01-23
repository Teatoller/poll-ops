// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, RegisterData } from '../types';
import { api } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Use type-only import for ReactNode
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userData');

    if (token && savedUser) {
      try {
        // Parse saved user data
        const userData: User = JSON.parse(savedUser);
        setUser(userData);

        // Optionally validate token by making a simple API call
        validateToken(token);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        clearAuthData();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string): Promise<void> => {
    try {
      // Actually use the token - for example, set it as Authorization header
      const response = await fetch('/api/validate-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      await api.register(userData);

      // Don't auto-login - user must verify email first
      // The backend sends verification email, user must click link before logging in
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.login({ email, password });

      // Store token and user data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const logout = (): void => {
    clearAuthData();
  };

  const adminLogin = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.login({ email, password });

      // Store token and user data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Admin login failed');
    }
  };

  const adminLogout = (): void => {
    clearAuthData();
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      register,
      login,
      logout,
      loading,
      admin: null,
      adminLogin,
      adminLogout
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};