// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Poll } from '../types';

const Dashboard: React.FC = () => {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<{ [pollId: number]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    activePolls: 0,
    votedPolls: 0,
    remainingPolls: 0
  });

  console.log("acttive", activePolls)
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      // 1. Fetch active polls from API
      const polls = await api.getActivePolls();
      setActivePolls(polls);
      
      // 2. Check vote status for each poll
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
      
      // 3. Calculate stats
      const votedCount = Object.values(votes).filter(voted => voted).length;
      setStats({
        activePolls: polls.length,
        votedPolls: votedCount,
        remainingPolls: polls.length - votedCount
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
          <h1>Polling Dashboard</h1>
          <div className="user-actions">
            <button onClick={handleRefresh} className="refresh-button">
              Refresh
            </button>
            <div className="user-info">
              <span>Welcome, {user?.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
              <span className="stat-number">{stats.remainingPolls}</span>
              <span className="stat-label">Polls Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;