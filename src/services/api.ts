// src/services/api.ts - Fixed version
import type {
  LoginData,
  RegisterData,
  VoteData,
  Poll,
  Candidate,
  User,
  AdminAnalytics,
  ExportFormat,
  DashboardStatistics
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle blob responses for file downloads
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const isCsv = contentType?.includes('text/csv');

    if (isCsv || isJson) {
      const data = isJson ? await response.json() : await response.blob();

      if (!response.ok) {
        if (isJson && data.error) {
          throw new Error(data.error);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return data;
    } else {
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || 'Unknown error' };
      }

      if (!response.ok) {
        // If unauthorized, clear auth data
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('adminData');
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    }
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    throw error;
  }
};

// Helper for admin API calls
const adminApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    throw new Error('Admin authentication required');
  }

  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Admin-specific API service
export const adminAPI = {
  // Auth endpoints
  login: async (credentials: LoginData) => {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data.admin));
    }

    return data;
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  },

  getCurrentAdmin: () => {
    const adminData = localStorage.getItem('adminData');
    return adminData ? JSON.parse(adminData) : null;
  },

  // Poll management endpoints
  createPoll: async (pollData: {
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    candidates: Omit<Candidate, 'id' | 'poll_id'>[];
  }) => {
    return adminApiFetch('/admin/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },

  getPolls: async (detailed: boolean = false): Promise<Poll[]> => {
    return adminApiFetch(`/admin/polls${detailed ? '?detailed=true' : ''}`);
  },

  getPollDetails: async (pollId: number) => {
    return adminApiFetch(`/admin/polls/${pollId}/results`);
  },

  updatePoll: async (pollId: number, pollData: Partial<{
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    is_active: boolean;
  }>) => {
    return adminApiFetch(`/admin/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },

  togglePollStatus: async (pollId: number) => {
    return adminApiFetch(`/admin/polls/${pollId}/toggle`, {
      method: 'PATCH',
    });
  },

  // User management endpoints
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return adminApiFetch(`/admin/users?${queryParams.toString()}`);
  },

  getUser: async (userId: number): Promise<User> => {
    return adminApiFetch(`/admin/users/${userId}`);
  },

  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    return adminApiFetch(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUsers: async (userIds: number[]): Promise<{ message: string }> => {
    return adminApiFetch('/admin/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  getRecentUsers: async (limit: number = 10): Promise<User[]> => {
    return adminApiFetch(`/admin/users/recent?limit=${limit}`);
  },

  // Analytics & Statistics endpoints
  getAnalytics: async (range: '7d' | '30d' | '90d' | '1y' = '7d'): Promise<AdminAnalytics> => {
    return adminApiFetch(`/admin/analytics?range=${range}`);
  },

  getStatistics: async (): Promise<DashboardStatistics> => {
    return adminApiFetch('/admin/statistics');
  },

  // Export endpoints
  exportData: async (type: 'users' | 'votes' | 'polls', params?: {
    format?: ExportFormat;
    pollId?: number;
    startDate?: string;
    endDate?: string;
    includeInactive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', params?.format || 'csv');
    if (params?.pollId) queryParams.append('pollId', params.pollId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.includeInactive) queryParams.append('includeInactive', 'true');

    const response = await fetch(`${API_BASE_URL}/admin/export/${type}?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type');

    return {
      blob,
      contentType,
      filename: response.headers.get('content-disposition')?.split('filename=')[1] || `${type}_export.${params?.format || 'csv'}`
    };
  },

  // Quick export functions
  exportUsers: async (format: ExportFormat = 'csv') => {
    return adminAPI.exportData('users', { format });
  },

  exportVotes: async (pollId?: number, format: ExportFormat = 'csv') => {
    return adminAPI.exportData('votes', { format, pollId });
  },

  exportPolls: async (format: ExportFormat = 'csv') => {
    return adminAPI.exportData('polls', { format });
  },
};

// Main API service for regular users
export const api = {
  // Auth endpoints
  register: async (userData: RegisterData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: LoginData) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
    }

    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  verifyEmail: async (token: string) => {
    return apiFetch(`/auth/verify-email/${token}`, {
      method: 'GET',
    });
  },

  verifyPhone: async (phone: string, code: string) => {
    return apiFetch('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  // Poll endpoints
  getActivePolls: async (): Promise<Poll[]> => {
    return apiFetch('/polls/active');
  },

  submitVote: async (voteData: VoteData) => {
    return apiFetch('/polls/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  },

  checkVoteStatus: async (pollId: number): Promise<{ hasVoted: boolean }> => {
    return apiFetch(`/polls/has-voted/${pollId}`);
  },

  // Results endpoints
  getPollResults: async (pollId: number): Promise<any> => {
    return apiFetch(`/results/${pollId}`);
  },

  getAllResults: async () => {
    return apiFetch('/results');
  },

  // Admin endpoints (kept for backward compatibility)
  adminLogin: async (credentials: LoginData) => {
    return adminAPI.login(credentials);
  },

  createPoll: async (pollData: {
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    candidates: Omit<Candidate, 'id'>[];
  }) => {
    return adminAPI.createPoll(pollData);
  },

  getAdminPolls: async () => {
    return adminAPI.getPolls();
  },

  // Statistics function for backward compatibility
  getStatistics: async (): Promise<DashboardStatistics> => {
    return adminAPI.getStatistics();
  },

  // User management functions for backward compatibility
  getUsers: async (): Promise<any[]> => {
    // Call the paginated endpoint with default parameters
    const response = await adminAPI.getUsers({ page: 1, limit: 1000 });
    return response.users;
  },

  deleteUsers: async (userIds: number[]): Promise<{ message: string }> => {
    return adminAPI.deleteUsers(userIds);
  },
};

// Export types
export type {
  LoginData,
  RegisterData,
  VoteData,
  Poll,
  Candidate,
  User,
  AdminAnalytics,
  ExportFormat,
  DashboardStatistics
};