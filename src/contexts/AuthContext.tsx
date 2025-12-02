// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, RegisterData, LoginData } from '../types';
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
      // Try to fetch active polls to validate token
      await api.getActivePolls();
      // If successful, token is valid
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
      const response = await api.register(userData);
      
      // Store token and user data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      setUser(response.user);
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

  const value: AuthContextType = {
    user,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};