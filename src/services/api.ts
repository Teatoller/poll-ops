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
  DashboardStatistics,
  SurveyPoll,
  SurveyResults
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

// Normalize location fields from camelCase to snake_case for backend
const mapLocationToSnake = (data: any) => {
  const payload: any = { ...data };

  if ('countyId' in data) payload.county_id = data.countyId;
  if ('countyName' in data) payload.county_name = data.countyName;
  if ('subCountyId' in data) payload.sub_county_id = data.subCountyId;
  if ('subCountyName' in data) payload.sub_county_name = data.subCountyName;
  if ('wardId' in data) payload.ward_id = data.wardId;
  if ('wardName' in data) payload.ward_name = data.wardName;
  if ('pollingStation' in data) payload.polling_station = data.pollingStation;

  // keep camelCase keys as well so backend middleware that expects camelCase still receives them

  return payload;
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
    scope?: 'NATIONAL' | 'COUNTY' | 'SUB_COUNTY' | 'WARD' | 'GENERAL';
    countyId?: number | null;
    countyName?: string | null;
    subCountyId?: number | null;
    subCountyName?: string | null;
    wardId?: number | null;
    wardName?: string | null;
    pollingStation?: string | null;
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

  // In adminAPI object, add this method:
  getPoll: async (pollId: number): Promise<Poll> => {
    return adminApiFetch(`/admin/polls/${pollId}`);
  },

  getPollDetails: async (pollId: number) => {
    return adminApiFetch(`/admin/polls/${pollId}/results`);
  },

  // UPDATE poll with candidates support - ENHANCE existing method
  updatePoll: async (pollId: number, pollData: {
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    is_active?: boolean;
    scope?: 'NATIONAL' | 'COUNTY' | 'SUB_COUNTY' | 'WARD' | 'GENERAL';
    countyId?: number | null;
    countyName?: string | null;
    subCountyId?: number | null;
    subCountyName?: string | null;
    wardId?: number | null;
    wardName?: string | null;
    pollingStation?: string | null;
    candidates?: Array<{
      id?: number;
      name: string;
      party: string;
      photoUrl?: string;
      description?: string;
    }>;
  }): Promise<{ message: string; pollId: number }> => {
    return adminApiFetch(`/admin/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },

  deletePoll: async (pollId: number): Promise<{ message: string }> => {
    return adminApiFetch(`/admin/polls/${pollId}`, {
      method: 'DELETE',
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
    // Normalize location fields to snake_case for backend
    const payload = mapLocationToSnake(userData || {});

    // Also map some common camelCase fields if present
    if ((userData as any).isEmailVerified !== undefined) payload.is_email_verified = (userData as any).isEmailVerified;
    if ((userData as any).isPhoneVerified !== undefined) payload.is_phone_verified = (userData as any).isPhoneVerified;

    return adminApiFetch(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteUser: async (userId: number): Promise<{ message: string; user: any }> => {
    return adminApiFetch(`/admin/users/${userId}`, {
      method: 'DELETE',
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
  getAnalytics: async (range: '7d' | '30d' | '90d' | '1y' = '7d', pollId?: number): Promise<AdminAnalytics> => {
    const params = new URLSearchParams({ range });
    if (pollId) {
      params.append('pollId', pollId.toString());
    }
    return adminApiFetch(`/admin/analytics?${params.toString()}`);
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

  // Settings endpoints
  getSettings: async (): Promise<any> => {
    return adminApiFetch('/settings');
  },

  updateSettings: async (settings: any): Promise<{ message: string }> => {
    return adminApiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  resetSettings: async (): Promise<{ message: string }> => {
    return adminApiFetch('/settings/reset', {
      method: 'POST',
    });
  },

  testEmail: async (email: string): Promise<{ message: string }> => {
    return adminApiFetch('/settings/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  testSMS: async (phone: string): Promise<{ message: string }> => {
    return adminApiFetch('/settings/test-sms', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  testWebhook: async (webhookUrl: string): Promise<{ message: string }> => {
    return adminApiFetch('/settings/test-webhook', {
      method: 'POST',
      body: JSON.stringify({ webhookUrl }),
    });
  },

  // Admin management endpoints
  getAdmins: async (): Promise<Array<{ id: number; email: string; role: string }>> => {
    return adminApiFetch('/admin/admins');
  },

  createAdmin: async (adminData: { email: string; password: string; role: string }): Promise<{ id: number; email: string; role: string }> => {
    return adminApiFetch('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  },

  updateAdmin: async (id: number, update: { email?: string; password?: string; role?: string }): Promise<{ id: number; email: string; role: string }> => {
    return adminApiFetch(`/admin/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  },

  deleteAdmin: async (id: number): Promise<{ message: string }> => {
    return adminApiFetch(`/admin/admins/${id}`, {
      method: 'DELETE',
    });
  },
};

// Survey API methods - MUST be defined before main api object
export const surveyAPI = {
  // Admin: Get all surveys (with optional filters)
  getAdminSurveys: async (filters?: {
    scope?: string;
    isActive?: boolean;
  }): Promise<SurveyPoll[]> => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));

    const queryString = params.toString();
    return adminApiFetch(`/admin/surveys${queryString ? `?${queryString}` : ''}`);
  },

  // Create a new survey (admin only)
  createSurvey: async (surveyData: {
    question: string;
    description?: string;
    startDate: string;
    endDate: string;
    scope: string;
    countyId?: number;
    subCountyId?: number;
    wardId?: number;
    options: Array<{ optionText: string }>;
  }): Promise<SurveyPoll> => {
    return adminApiFetch('/admin/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData),
    });
  },

  // Get all surveys (with optional filters)
  getSurveys: async (filters?: {
    scope?: string;
    isActive?: boolean;
    countyId?: number;
  }): Promise<SurveyPoll[]> => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.isActive !== undefined) params.append('is_active', String(filters.isActive));
    if (filters?.countyId) params.append('county_id', String(filters.countyId));
    
    const queryString = params.toString();
    return apiFetch(`/surveys${queryString ? `?${queryString}` : ''}`);
  },

  // Get survey by ID
  getSurveyById: async (surveyId: number): Promise<SurveyPoll> => {
    return apiFetch(`/surveys/${surveyId}`);
  },

  // Check if user has already voted in a survey
  checkSurveyVoteStatus: async (surveyId: number): Promise<{ hasVoted: boolean; optionId?: number }> => {
    return apiFetch(`/surveys/${surveyId}/vote-status`);
  },

  // Submit a survey vote
  submitSurveyVote: async (voteData: {
    surveyId: number;
    optionId: number;
  }): Promise<{ message: string; vote: any }> => {
    return apiFetch('/surveys/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  },

  // Get survey results
  getSurveyResults: async (surveyId: number): Promise<SurveyResults> => {
    return apiFetch(`/surveys/${surveyId}/results`);
  },

  // Admin: Update survey
  updateSurvey: async (surveyId: number, surveyData: Partial<SurveyPoll>): Promise<SurveyPoll> => {
    return adminApiFetch(`/admin/surveys/${surveyId}`, {
      method: 'PUT',
      body: JSON.stringify(surveyData),
    });
  },

  // Admin: Toggle survey active status
  toggleSurveyStatus: async (surveyId: number): Promise<{ message: string; is_active: boolean }> => {
    return adminApiFetch(`/admin/surveys/${surveyId}/toggle`, {
      method: 'PATCH',
    });
  },

  // Admin: Delete survey
  deleteSurvey: async (surveyId: number): Promise<{ message: string }> => {
    return adminApiFetch(`/admin/surveys/${surveyId}`, {
      method: 'DELETE',
    });
  },
};

// Main API service for regular users
export const api = {
  // Auth endpoints
  register: async (userData: RegisterData) => {
    // Send registration payload using camelCase keys expected by backend validation
    const payload: any = {
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      countyId: userData.countyId,
      countyName: userData.countyName,
      subCountyId: userData.subCountyId,
      subCountyName: userData.subCountyName,
      wardId: userData.wardId,
      wardName: userData.wardName,
      pollingStation: userData.pollingStation
    };

    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  // Survey endpoints
  getSurveys: surveyAPI.getSurveys,
  getSurveyById: surveyAPI.getSurveyById,
  checkSurveyVoteStatus: surveyAPI.checkSurveyVoteStatus,
  submitSurveyVote: surveyAPI.submitSurveyVote,
  getSurveyResults: surveyAPI.getSurveyResults,
  createSurvey: surveyAPI.createSurvey,
  getAdminSurveys: surveyAPI.getAdminSurveys,
  updateSurvey: surveyAPI.updateSurvey,
  toggleSurveyStatus: surveyAPI.toggleSurveyStatus,
  toggleSurveyActive: surveyAPI.toggleSurveyStatus, // alias for clarity in admin UI
  deleteSurvey: surveyAPI.deleteSurvey,

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

  getPoll: async (pollId: number): Promise<Poll> => {
    return adminAPI.getPoll(pollId);
  },

  // Statistics function for backward compatibility
  getStatistics: async (): Promise<DashboardStatistics> => {
    return adminAPI.getStatistics();
  },

  // Analytics function for backward compatibility
  getAnalytics: async (range: '7d' | '30d' | '90d' | '1y' = '7d', pollId?: number): Promise<AdminAnalytics> => {
    return adminAPI.getAnalytics(range, pollId);
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

  // In the api object, add this if it doesn't exist:
  updatePoll: async (pollId: number, pollData: any): Promise<any> => {
    return adminAPI.updatePoll(pollId, pollData);
  },

  // Toggle poll active status - MISSING
  togglePollActive: async (pollId: number, _isActive: boolean): Promise<any> => {
    // Note: The backend endpoint doesn't need the isActive parameter
    // It toggles whatever the current state is
    return adminAPI.togglePollStatus(pollId);
  },

  // Delete poll - MISSING
  deletePoll: async (pollId: number): Promise<{ message: string }> => {
    return adminAPI.deletePoll(pollId);
  },

  // Settings functions for backward compatibility
  getSettings: async (): Promise<any> => {
    return adminAPI.getSettings();
  },

  updateSettings: async (settings: any): Promise<{ message: string }> => {
    return adminAPI.updateSettings(settings);
  },

  // ssss
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    return apiFetch(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
};

// Resources API
export const resourcesAPI = {
  getCounties: async (): Promise<Array<{ id: number; name: string; code?: string }>> => {
    return apiFetch('/resources/counties');
  },
  getSubCounties: async (countyId?: number): Promise<Array<{ id: number; countyId: number; name: string; code?: string }>> => {
    const qp = countyId ? `?countyId=${countyId}` : '';
    return apiFetch(`/resources/sub-counties${qp}`);
  },
  getWards: async (subCountyId?: number): Promise<Array<{ id: number; subCountyId: number; name: string; code?: string }>> => {
    const qp = subCountyId ? `?subCountyId=${subCountyId}` : '';
    return apiFetch(`/resources/wards${qp}`);
  },
  getPollingStations: async (wardId?: number): Promise<Array<{ id: number; wardId: number; name: string; code?: string }>> => {
    const qp = wardId ? `?wardId=${wardId}` : '';
    return apiFetch(`/resources/polling-stations${qp}`);
  },
  getCountryTree: async (): Promise<Array<{ id: number; name: string; subCounties: any[] }>> => {
    return apiFetch('/resources/country-tree');
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
  DashboardStatistics,
  SurveyPoll,
  SurveyResults
};