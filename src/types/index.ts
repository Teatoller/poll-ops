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

// Survey/Opinion Poll Types
export interface SurveyPoll {
  id: number;
  question: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  scope: 'NATIONAL' | 'COUNTY' | 'SUB_COUNTY' | 'WARD' | 'GENERAL';
  countyId?: number | null;
  countyName?: string | null;
  subCountyId?: number | null;
  subCountyName?: string | null;
  wardId?: number | null;
  wardName?: string | null;
  pollingStation?: string | null;
  options: SurveyOption[];
  totalVotes?: number;
  pollType: 'SURVEY';
}

export interface SurveyOption {
  id: number;
  optionText: string;
  voteCount?: number;
  percentage?: number;
}

export interface SurveyVote {
  id: number;
  userId: number;
  surveyId: number;
  optionId: number;
  createdAt: string;
}

export interface SurveyResults {
  survey: {
    id: number;
    question: string;
    description: string;
    startDate: string;
    endDate: string;
    is_active: boolean;
    totalVotes: number;
    scope: string;
    countyId?: number | null;
    countyName?: string | null;
    subCountyId?: number | null;
    subCountyName?: string | null;
    wardId?: number | null;
    wardName?: string | null;
    pollingStation?: string | null;
    createdAt?: string;
  };
  options: Array<{
    id: number;
    optionText: string;
    voteCount: number;
    percentage: number;
  }>;
  locationBreakdown?: Array<{
    county_name: string;
    sub_county_name: string;
    ward_name: string;
    polling_station: string;
    votes_per_station: number;
  }>;
  summary?: {
    totalVotes: number;
    totalOptions: number;
    votingStations: number;
  };
  totalVotes?: number;
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

// export interface RegisterData {
//   nationalId: string;
//   email: string;
//   phone: string;
//   password: string;
//   confirmPassword: string;
//   county: string;
//   division: string;
//   pollingStation: string;
// }

export interface LocationData {
  countyId: number | null;
  countyName: string;
  subCountyId: number | null;
  subCountyName: string;
  wardId: number | null;
  wardName: string;
  pollingStation: string;
}

export interface RegisterData extends LocationData {
  nationalId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
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

// export interface LocationData {
//   county: string;
//   division: string;
//   pollingStation: string;
// }

export interface VoteData {
  pollId: number;
  candidateId: number;
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

// src/components/admin/Settings.tsx
export interface SystemSettings {
  // Voting Settings
  voting: {
    allowSameDayRegistration: boolean;
    votingHoursStart: string; // "08:00"
    votingHoursEnd: string;   // "17:00"
    maxVotesPerUser: number;
    allowVoteEditing: boolean;
    voteEditingDeadline: number; // hours before poll ends
  };

  // Registration Settings
  registration: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    requireNationalId: boolean;
    allowMultipleRegistrations: boolean;
    registrationDeadline: number; // hours before poll starts
  };

  // Notification Settings
  notifications: {
    sendRegistrationConfirmation: boolean;
    sendVoteConfirmation: boolean;
    sendPollReminders: boolean;
    sendResultsAnnouncement: boolean;
  };

  // Security Settings
  security: {
    requireStrongPasswords: boolean;
    passwordMinLength: number;
    enableTwoFactorAuth: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };

  // Display Settings
  display: {
    showLiveResults: boolean;
    showCandidatePhotos: boolean;
    showVoteCounts: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
}