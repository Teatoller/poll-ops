// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Poll, SurveyPoll } from '../../types';
import { api } from '../../services/api';

const Dashboard: React.FC = () => {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [activeSurveys, setActiveSurveys] = useState<SurveyPoll[]>([]);
  const [userVotes, setUserVotes] = useState<{ [pollId: number]: boolean }>({});
  const [userSurveyVotes, setUserSurveyVotes] = useState<{ [surveyId: number]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [stats, setStats] = useState({
    activePolls: 0,
    activeSurveys: 0,
    votedPolls: 0,
    votedSurveys: 0,
    remainingPolls: 0,
    remainingSurveys: 0
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    
    // Check if returning from voting with success message
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [user, navigate]);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      // 1. Fetch active polls from API
      const polls = await api.getActivePolls();
      setActivePolls(polls);
      
      // 2. Fetch active surveys
      const surveys = await api.getSurveys({ isActive: true });
      setActiveSurveys(surveys);
      
      // 3. Check vote status for each poll
      const votes: { [pollId: number]: boolean } = {};
      for (const poll of polls) {
        try {
          const status = await api.checkVoteStatus(poll.id);
          votes[poll.id] = status.hasVoted;
        } catch (error) {
          console.error(`Error checking vote status for poll ${poll.id}:`, error);
          votes[poll.id] = false;
        }
      }
      setUserVotes(votes);

      // 4. Check vote status for each survey
      const surveyVotes: { [surveyId: number]: boolean } = {};
      for (const survey of surveys) {
        try {
          const status = await api.checkSurveyVoteStatus(survey.id);
          surveyVotes[survey.id] = status.hasVoted;
        } catch (error) {
          console.error(`Error checking survey vote status for survey ${survey.id}:`, error);
          surveyVotes[survey.id] = false;
        }
      }
      setUserSurveyVotes(surveyVotes);
      
      // 5. Calculate stats
      const votedCount = Object.values(votes).filter(Boolean).length;
      const votedSurveyCount = Object.values(surveyVotes).filter(Boolean).length;
      setStats({
        activePolls: polls.length,
        activeSurveys: surveys.length,
        votedPolls: votedCount,
        votedSurveys: votedSurveyCount,
        remainingPolls: polls.length - votedCount,
        remainingSurveys: surveys.length - votedSurveyCount
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (poll: Poll): void => {
    if (userVotes[poll.id]) {
      navigate('/results', { state: { pollId: poll.id } });
    } else {
      navigate('/poll', { state: { poll } });
    }
  };

  const handleViewResults = (poll: Poll): void => {
    navigate('/results', { state: { poll } });
  };

  const handleSurveyClick = (survey: SurveyPoll): void => {
    if (userSurveyVotes[survey.id]) {
      navigate('/survey-results', { state: { surveyId: survey.id } });
    } else {
      navigate('/survey-voting', { state: { survey } });
    }
  };

  const handleViewSurveyResults = (survey: SurveyPoll): void => {
    navigate('/survey-results', { state: { surveyId: survey.id } });
  };

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const handleRefresh = (): void => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img src="/siteLogo.jpeg" width="50px" height="50px" alt="Site Logo" className="site-logo" />
            <h1>Polling Dashboard</h1>
          </div>
          <div className="user-actions">
            <button type="button" onClick={handleRefresh} className="refresh-button">
              Refresh
            </button>
            <div className="user-info">
              <span>Welcome, {user?.email}</span>
              <button type="button" onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      <div className="dashboard-content">
        <div className="user-profile-card">
          <h3>Your Profile</h3>
          <div className="profile-details">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>National ID:</strong> {user?.nationalId}</p>
            <p><strong>Polling Station:</strong> {user?.pollingStation}</p>
            <p><strong>Location:</strong> {user?.county}, {user?.division}</p>
            <div className="verification-status">
              <span className={`status ${user?.isEmailVerified ? 'verified' : 'pending'}`}>
                Email: {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
              <span className={`status ${user?.isPhoneVerified ? 'verified' : 'pending'}`}>
                Phone: {user?.isPhoneVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="polls-section">
          <div className="section-header">
            <h2>Active Polls</h2>
            <span className="polls-count">{activePolls.length} polls</span>
          </div>
          
          {activePolls.length === 0 ? (
            <div className="no-polls">
              <p>No active polls at the moment.</p>
              <p>Please check back later or contact an administrator.</p>
            </div>
          ) : (
            <div className="polls-grid">
              {activePolls.map(poll => (
                <div key={poll.id} className="poll-card">
                  <div className="poll-header">
                    <h3>{poll.officeName}</h3>
                    <span className={`status-badge ${poll.is_active ? 'active' : 'ended'}`}>
                      {poll.is_active ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  
                  <p className="poll-description">{poll.description}</p>
                  
                  <div className="poll-meta">
                    <span>Candidates: {poll.candidates?.length || 0}</span>
                    <span>Total Votes: {(poll.totalVotes || 0).toLocaleString()}</span>
                  </div>

                  <div className="poll-actions">
                    <button
                      onClick={() => handleVoteClick(poll)}
                      className={`action-button ${
                        userVotes[poll.id] ? 'view-results' : 'vote-now'
                      }`}
                      disabled={!poll.is_active}
                    >
                      {userVotes[poll.id] ? 'View Your Vote' : 'Vote Now'}
                    </button>
                    
                    <button
                      onClick={() => handleViewResults(poll)}
                      className="action-button secondary"
                    >
                      Live Results
                    </button>
                  </div>

                  {userVotes[poll.id] && (
                    <div className="voted-badge">
                      ✓ You have voted in this poll
                    </div>
                  )}

                  {!poll.is_active && (
                    <div className="ended-badge">
                      Poll has ended
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="polls-section">
          <div className="section-header">
            <h2>Active Surveys</h2>
            <span className="polls-count">{activeSurveys.length} surveys</span>
          </div>
          
          {activeSurveys.length === 0 ? (
            <div className="no-polls">
              <p>No active surveys at the moment.</p>
            </div>
          ) : (
            <div className="polls-grid">
              {activeSurveys.map(survey => (
                <div key={survey.id} className="poll-card survey-card">
                  <div className="poll-header">
                    <h3>{survey.question}</h3>
                    <span className={`poll-status ${survey.is_active ? 'active' : 'ended'}`}>
                      {survey.is_active ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  
                  {survey.description && (
                    <p className="poll-description">{survey.description}</p>
                  )}
                  
                  <div className="poll-details">
                    <div className="detail-item">
                      <span className="label">Scope:</span>
                      <span className="value">{survey.scope}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Options:</span>
                      <span className="value">{survey.options.length}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Total Votes:</span>
                      <span className="value">{survey.totalVotes || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">End Date:</span>
                      <span className="value">{new Date(survey.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="poll-actions">
                    <button
                      onClick={() => handleSurveyClick(survey)}
                      className="action-button primary"
                      disabled={!survey.is_active}
                    >
                      {userSurveyVotes[survey.id] ? 'View Your Response' : 'Participate'}
                    </button>
                    
                    <button
                      onClick={() => handleViewSurveyResults(survey)}
                      className="action-button secondary"
                      disabled={!userSurveyVotes[survey.id]}
                    >
                      View Results
                    </button>
                  </div>

                  {userSurveyVotes[survey.id] && (
                    <div className="voted-badge">
                      ✓ You have participated in this survey
                    </div>
                  )}

                  {!survey.is_active && (
                    <div className="ended-badge">
                      Survey has ended
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-stats">
          <h3>Quick Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.activePolls}</span>
              <span className="stat-label">Active Polls</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.votedPolls}</span>
              <span className="stat-label">Polls Voted In</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.activeSurveys}</span>
              <span className="stat-label">Active Surveys</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.votedSurveys}</span>
              <span className="stat-label">Surveys Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;