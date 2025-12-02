// src/types/index.ts
export interface User {
  id: number;
  email: string;
  nationalId: string;
  phone?: string;
  county: string;
  division: string;
  pollingStation: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface Poll {
  id: number;
  officeName: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  candidates: Candidate[];
  totalVotes?: number;
}

export interface Candidate {
  id: number;
  name: string;
  party: string;
  photoUrl?: string;
  description?: string;
  voteCount?: number;
}

export interface Vote {
  id: number;
  userId: number;
  pollId: number;
  candidateId: number;
  pollingStation: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  nationalId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  county: string;
  division: string;
  pollingStation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface LocationData {
  county: string;
  division: string;
  pollingStation: string;
}

export interface VoteData {
  userId: number;
  votes: { [pollId: number]: number };
  pollingStation: string;
}