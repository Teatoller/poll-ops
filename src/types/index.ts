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

// export interface User {
//   first_name?: string;
//   last_name?: string;
//   national_id: string;
//   county: string;
//   is_email_verified: boolean;
//   is_phone_verified: boolean;
//   created_at: string;
//   updated_at: string;
//   vote_count?: number;
//   last_vote_date?: string;
// }

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
  admin: Admin | null; // Add admin field
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>; // Add adminLogin
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  adminLogout: () => void; // Add adminLogout
  loading: boolean;
}

export interface Admin {
  id: number;
  email: string;
  role: string;
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



export interface AdminAnalytics {
  summary: {
    total_verified_users: number;
    active_polls: number;
    recent_votes: number;
    recent_voters: number;
  };
  dailyVotes: Array<{
    date: string;
    count: number;
  }>;
  pollParticipation: Array<{
    poll_id: number;
    poll_name: string;
    voter_count: number;
    participation_rate: number;
  }>;
  locationDistribution: Array<{
    county: string;
    votes: number;
    unique_voters: number;
  }>;
  userActivity: Array<{
    hour: number;
    activity: number;
  }>;
}
export interface PollResultDetails {
  poll: Poll;
  candidates: Array<Candidate & { vote_count: number }>;
  breakdown: Array<{
    county: string;
    votes: number;
    unique_voters: number;
  }>;
}

export interface ExportResponse {
  blob: Blob;
  contentType: string;
  filename: string;
}

export type ExportFormat = 'csv' | 'json';

export interface DashboardStatistics {
  total_users: number;
  active_polls: number;
  total_votes: number;
  unique_voters: number;
  recent_activity?: Array<{
    type: 'vote' | 'registration' | 'export';
    description: string;
    timestamp: string;
  }>;
}