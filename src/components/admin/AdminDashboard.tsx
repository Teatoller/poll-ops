// src/components/admin/AdminDashboard.tsx - Fixed for your types
import React, { useState, useEffect } from 'react';
import { api, adminAPI } from '../../services/api';
import type { Poll, DashboardStatistics } from '../../types';

interface DashboardStats {
  totalUsers: number;
  activePolls: number;
  totalVotes: number;
  uniqueVoters: number;
  recentPolls: Array<{
    id: number;
    officeName: string;
    totalVotes?: number;
    candidateCount?: number;
    is_active: boolean;
  }>;
  recentUsers: Array<{
    id: number;
    email: string;
    createdAt: string;
  }>;
  recentActivity?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statistics: DashboardStatistics = await api.getStatistics();
      
      // Fetch recent polls
      const polls: Poll[] = await api.getAdminPolls();
      const recentPolls = polls.slice(0, 5).map(poll => ({
        id: poll.id,
        officeName: poll.officeName,
        totalVotes: poll.totalVotes || 0,
        candidateCount: poll.candidates?.length || 0,
        is_active: poll.is_active || false
      }));
      
      // Fetch recent users using the new endpoint
      let recentUsers: Array<{id: number; email: string; createdAt: string}> = [];
      try {
        // Use any type here since we have conflicting User interfaces
        const users: any[] = await adminAPI.getRecentUsers(5);
        recentUsers = users.map(user => ({
          id: user.id,
          email: user.email,
          createdAt: user.created_at || user.createdAt || new Date().toISOString()
        }));
      } catch (err) {
        console.warn('Could not fetch recent users:', err);
      }
      
      setStats({
        totalUsers: statistics.total_users || 0,
        activePolls: statistics.active_polls || 0,
        totalVotes: statistics.total_votes || 0,
        uniqueVoters: statistics.unique_voters || 0,
        recentPolls,
        recentUsers,
        recentActivity: statistics.recent_activity
      });
    } catch (err: any) {
      setError('Failed to load dashboard data: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vote': return '🗳️';
      case 'registration': return '👤';
      case 'export': return '📊';
      default: return '📝';
    }
  };

  if (loading) return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-alert">
      <p>{error}</p>
      <button onClick={fetchDashboardData} className="btn-retry">
        Retry
      </button>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <div className="header-actions">
          <button 
            onClick={fetchDashboardData} 
            className="btn-refresh"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <span className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats?.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="stat-subtext">Verified accounts</span>
          </div>
        </div>
        
        <div className="stat-card stat-success">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <h3>{stats?.activePolls.toLocaleString()}</h3>
            <p>Active Polls</p>
            <span className="stat-subtext">Currently running</span>
          </div>
        </div>
        
        <div className="stat-card stat-warning">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats?.totalVotes.toLocaleString()}</h3>
            <p>Total Votes</p>
            <span className="stat-subtext">All time</span>
          </div>
        </div>
        
        <div className="stat-card stat-info">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>{stats?.uniqueVoters.toLocaleString()}</h3>
            <p>Unique Voters</p>
            <span className="stat-subtext">Participated</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-header">
            <h3>Recent Polls</h3>
            <a href="/admin/polls" className="view-all">View All →</a>
          </div>
          <div className="polls-table">
            <table>
              <thead>
                <tr>
                  <th>Poll Name</th>
                  <th>Candidates</th>
                  <th>Total Votes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentPolls.map(poll => (
                  <tr key={poll.id}>
                    <td>{poll.officeName}</td>
                    <td>{poll.candidateCount || poll.candidates?.length || 0}</td>
                    <td>{poll.totalVotes?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={`status-badge ${poll.is_active ? 'status-active' : 'status-inactive'}`}>
                        {poll.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-action btn-view">View</button>
                      <button className="btn-action btn-edit">Edit</button>
                    </td>
                  </tr>
                ))}
                {(!stats?.recentPolls || stats.recentPolls.length === 0) && (
                  <tr>
                    <td colSpan={5} className="no-data">
                      No polls found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <span className="activity-count">
              {stats?.recentActivity?.length || 0} activities
            </span>
          </div>
          <div className="activity-list">
            {stats?.recentActivity?.map((activity, index) => (
              <div className="activity-item" key={index}>
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <span className="activity-time">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {stats?.recentUsers.map(user => (
              <div className="activity-item" key={`user-${user.id}`}>
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <p><strong>New user registered:</strong> {user.email}</p>
                  <span className="activity-time">
                    {getTimeAgo(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && 
             (!stats?.recentUsers || stats.recentUsers.length === 0) && (
              <div className="no-activity">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;