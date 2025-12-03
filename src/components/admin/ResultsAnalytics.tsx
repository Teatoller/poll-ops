// src/components/admin/ResultsAnalytics.tsx
import React, { useState, useEffect } from 'react';
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
  pollParticipation: Array<{ pollName: string; participation: number }>;
  locationDistribution: Array<{ county: string; votes: number }>;
  userActivity: Array<{ hour: number; activity: number }>;
}

const ResultsAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // You'll need to create this endpoint
      const data = await api.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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
    labels: analytics?.pollParticipation.map(p => p.pollName),
    datasets: [
      {
        label: 'Participation Rate (%)',
        data: analytics?.pollParticipation.map(p => p.participation),
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
            {analytics?.dailyVotes.reduce((sum, day) => sum + day.count, 0).toLocaleString()}
          </p>
        </div>
        <div className="summary-card">
          <h4>Average Daily Votes</h4>
          <p className="summary-number">
            {Math.round(
              analytics?.dailyVotes.reduce((sum, day) => sum + day.count, 0) / 
              (analytics?.dailyVotes.length || 1)
            ).toLocaleString()}
          </p>
        </div>
        <div className="summary-card">
          <h4>Peak Voting Hour</h4>
          <p className="summary-number">
            {analytics?.userActivity.reduce((max, curr, i, arr) => 
              curr.activity > arr[max].activity ? i : max, 0
            )}:00
          </p>
        </div>
        <div className="summary-card">
          <h4>Most Active County</h4>
          <p className="summary-number">
            {analytics?.locationDistribution.reduce((max, curr) => 
              curr.votes > max.votes ? curr : max
            ).county}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultsAnalytics;