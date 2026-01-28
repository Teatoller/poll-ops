// src/components/admin/ResultsAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { api } from '../../services/api';
import { useAdmin } from '../../contexts/AdminContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  dailyVotes: Array<{ date: string; count: number }>;
  pollParticipation: Array<{
    poll_id: number;
    poll_name: string;
    voter_count: number;
    participation_rate: number;
  }>;
  locationDistribution: Array<{ county: string; votes: number }>;
  userActivity: Array<{ hour: number; activity: number }>;
}

const ResultsAnalytics: React.FC = () => {
  const location = useLocation();
  const { can } = useAdmin();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('7d');
  const [selectedPollId, setSelectedPollId] = useState<number | null>(
    location.state?.pollId || null
  );
  const [polls, setPolls] = useState<Array<{ id: number; officeName: string }>>([]);

  useEffect(() => {
    if (location.state?.pollId) {
      setSelectedPollId(location.state.pollId);
    }
  }, [location.state]);

  useEffect(() => {
    if (can('viewAnalytics')) {
      fetchPolls();
    }
  }, [can]);

  useEffect(() => {
    if (can('viewAnalytics')) {
      fetchAnalytics();
    }
  }, [timeRange, selectedPollId, can]);

  const fetchPolls = async () => {
    try {
      const data = await api.getAdminPolls();
      setPolls(data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalytics(timeRange, selectedPollId || undefined);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!can('viewAnalytics')) {
    return (
      <div className="results-analytics">
        <div className="page-header">
          <h2>Results Analytics</h2>
        </div>
        <div className="alert alert-error">You don't have permission to view analytics.</div>
      </div>
    );
  }

  if (loading) return <div>Loading analytics...</div>;

  const dailyVotesData = {
    labels: analytics?.dailyVotes.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Votes',
        data: analytics?.dailyVotes.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };

  const pollParticipationData = {
    labels: analytics?.pollParticipation.map(p => p.poll_name),
    datasets: [
      {
        label: 'Participation Rate (%)',
        data: analytics?.pollParticipation.map(p => p.participation_rate),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ]
      }
    ]
  };

  const locationData = {
    labels: analytics?.locationDistribution.map(l => l.county),
    datasets: [
      {
        label: 'Votes by County',
        data: analytics?.locationDistribution.map(l => l.votes),
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    ]
  };

  const userActivityData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'User Activity',
        data: analytics?.userActivity.map(a => a.activity),
        backgroundColor: 'rgba(255, 159, 64, 0.8)'
      }
    ]
  };

  return (
    <div className="results-analytics">
      <div className="page-header">
        <h2>Results Analytics</h2>
        <div className="filters-container">
          <div className="poll-filter">
            <label htmlFor="poll-select">Filter by Poll:</label>
            <select 
              id="poll-select"
              value={selectedPollId || ''} 
              onChange={(e) => setSelectedPollId(e.target.value ? Number(e.target.value) : null)}
              className="poll-selector"
            >
              <option value="">All Polls</option>
              {polls.map(poll => (
                <option key={poll.id} value={poll.id}>
                  {poll.officeName}
                </option>
              ))}
            </select>
          </div>
          <div className="time-range-selector">
            <button 
              onClick={() => setTimeRange('7d')} 
              className={timeRange === '7d' ? 'active' : ''}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTimeRange('30d')} 
              className={timeRange === '30d' ? 'active' : ''}
            >
              30 Days
            </button>
            <button 
              onClick={() => setTimeRange('90d')} 
              className={timeRange === '90d' ? 'active' : ''}
            >
              90 Days
            </button>
            <button 
              onClick={() => setTimeRange('1y')} 
              className={timeRange === '1y' ? 'active' : ''}
            >
              1 Year
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3>Daily Vote Trends</h3>
          <Line data={dailyVotesData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Poll Participation Rates</h3>
          <Bar data={pollParticipationData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Votes by County</h3>
          <Pie data={locationData} options={{ responsive: true }} />
        </div>

        <div className="chart-card">
          <h3>Hourly User Activity</h3>
          <Bar data={userActivityData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <h4>Total Votes</h4>
          <p className="summary-number">
            {analytics ? analytics.dailyVotes.reduce((sum, day) => sum + day.count, 0).toLocaleString() : '0'}
          </p>
        </div>
        <div className="summary-card">
          <h4>Average Daily Votes</h4>
          <p className="summary-number">
            {analytics 
              ? Math.round(
                  analytics.dailyVotes.reduce((sum, day) => sum + day.count, 0) / 
                  (analytics.dailyVotes.length || 1)
                ).toLocaleString()
              : '0'}
          </p>
        </div>
        <div className="summary-card">
          <h4>Peak Voting Hour</h4>
          <p className="summary-number">
            {analytics
              ? analytics.userActivity.reduce((max, curr, i, arr) => 
                  curr.activity > arr[max].activity ? i : max, 0
                ) + ':00'
              : 'N/A'}
          </p>
        </div>
        <div className="summary-card">
          <h4>Most Active County</h4>
          <p className="summary-number">
            {analytics && analytics.locationDistribution.length > 0
              ? analytics.locationDistribution.reduce((max, curr) => 
                  curr.votes > max.votes ? curr : max,
                  analytics.locationDistribution[0]
                ).county
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsAnalytics;