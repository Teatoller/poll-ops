// src/services/api.ts
import type { LoginData, RegisterData, VoteData, Poll, Candidate } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');

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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If unauthorized, clear auth data
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // Auth endpoints
  register: async (userData: RegisterData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: LoginData) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
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
  // getPollResults: async (pollId: number) => {
  //   return apiFetch(`/results/${pollId}`);
  // },

  getPollResults: async (pollId: number): Promise<any> => {
    return apiFetch(`/results/${pollId}`);  // Add /poll/
  },

  // In src/services/api.ts
  // getPollResults: async (pollId: number): Promise<PollResults> => {
  //   return apiFetch(`/results/${pollId}`);
  // },

  getAllResults: async () => {
    return apiFetch('/results');
  },

  // Admin endpoints
  adminLogin: async (credentials: LoginData) => {
    return apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  createPoll: async (pollData: {
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    candidates: Omit<Candidate, 'id'>[];
  }) => {
    return apiFetch('/admin/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },

  getAdminPolls: async () => {
    return apiFetch('/admin/polls');
  },
};