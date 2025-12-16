// src/components/Results.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Poll } from '../types';

interface PollResults {
  poll: {
    id: number;
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    is_active: boolean;
    totalVotes: number;
    createdBy: string;
  };
  candidates: Array<{
    id: number;
    name: string;
    party: string;
    photoUrl?: string;
    description?: string;
    voteCount: number;
    percentage: number;
  }>;
  locationBreakdown: Array<{
    county: string;
    division: string;
    polling_station: string;
    votes_per_station: number;
  }>;
  summary: {
    totalVotes: number;
    totalCandidates: number;
    votingStations: number;
  };
}

const Results: React.FC = () => {
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pollId } = useParams<{ pollId: string }>();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPollResults();
  }, [user, navigate, pollId]);

  const fetchPollResults = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      let resultsPollId: number;
      
      // Get poll ID from URL params, navigation state, or poll object
      if (pollId) {
        // From URL: /results/:pollId
        resultsPollId = parseInt(pollId);
      } else if (location.state?.pollId) {
        // From navigation state with pollId
        resultsPollId = location.state.pollId;
      } else if (location.state?.poll) {
        // From navigation state with full poll object
        resultsPollId = location.state.poll.id;
      } else {
        throw new Error('No poll specified');
      }

      // Fetch results from API
      const results = await api.getPollResults(resultsPollId);
      setPollResults(results);
      
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load poll results');
      
      // Fallback: Try to get poll from navigation state
      const pollFromState: Poll = location.state?.poll;
      if (pollFromState) {
        // Create a mock results object from the poll
        const totalVotes = pollFromState.totalVotes || pollFromState.candidates?.reduce((sum, c) => sum + (c.voteCount || 0), 0) || 0;
        
        const mockResults: PollResults = {
          poll: {
            id: pollFromState.id,
            officeName: pollFromState.officeName,
            description: pollFromState.description,
            startDate: pollFromState.startDate,
            endDate: pollFromState.endDate,
            is_active: pollFromState.is_active,
            totalVotes: totalVotes,
            createdBy: 'System'
          },
          candidates: (pollFromState.candidates || []).map(candidate => ({
            id: candidate.id,
            name: candidate.name,
            party: candidate.party,
            photoUrl: candidate.photoUrl,
            description: candidate.description,
            voteCount: candidate.voteCount || 0,
            percentage: totalVotes > 0 ? ((candidate.voteCount || 0) / totalVotes) * 100 : 0
          })),
          locationBreakdown: [],
          summary: {
            totalVotes: totalVotes,
            totalCandidates: pollFromState.candidates?.length || 0,
            votingStations: 0
          }
        };
        setPollResults(mockResults);
        setError(''); // Clear error since we have fallback data
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async (): Promise<void> => {
    await fetchPollResults();
  };

  // const calculatePercentage = (voteCount: number, totalVotes: number): number => {
  //   if (totalVotes === 0) return 0;
  //   return (voteCount / totalVotes) * 100;
  // };

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error && !pollResults) {
    return (
      <div className="results-error">
        <h2>Error Loading Results</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/dashboard')} className="action-button">
            Back to Dashboard
          </button>
          <button onClick={refreshResults} className="action-button secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!pollResults) {
    return (
      <div className="no-results">
        <h2>No Results Available</h2>
        <p>No poll data found.</p>
        <div className="no-results-actions">
          <button onClick={() => navigate('/dashboard')} className="action-button">
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/')} className="action-button secondary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { poll, candidates, locationBreakdown, summary } = pollResults;

  return (
    <div className="results">
      <div className="results-header">
        <div className="header-left">
          <h2>Live Results</h2>
          <p className="poll-title">{poll.officeName}</p>
        </div>
        <div className="header-right">
          <button 
            onClick={refreshResults}
            className="refresh-button"
            title="Refresh results"
          >
            ⟳ Refresh
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="results-content">
        <div className="poll-info-card">
          <div className="poll-header">
            <h3>{poll.officeName}</h3>
            <span className={`status-badge ${poll.is_active ? 'active' : 'completed'}`}>
              {poll.is_active ? 'Live' : 'Final Results'}
            </span>
          </div>
          <p className="poll-description">{poll.description}</p>
          <div className="poll-meta">
            <div className="meta-item">
              <span className="meta-label">Total Votes</span>
              <span className="meta-value">{poll.totalVotes.toLocaleString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Candidates</span>
              <span className="meta-value">{candidates.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created By</span>
              <span className="meta-value">{poll.createdBy}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">End Date</span>
              <span className="meta-value">{new Date(poll.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="results-main">
          <div className="results-list">
            <div className="section-header">
              <h4>Results by Candidate</h4>
              <span className="section-info">Sorted by vote count</span>
            </div>
            {candidates
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((candidate, index) => (
                <div key={candidate.id} className="candidate-result">
                  <div className="candidate-rank">
                    <span className="rank-number">#{index + 1}</span>
                    {index === 0 && poll.is_active && (
                      <span className="leading-badge">Leading</span>
                    )}
                  </div>
                  <div className="candidate-info">
                    <div className="candidate-name-party">
                      <strong className="candidate-name">{candidate.name}</strong>
                      <span className="candidate-party">{candidate.party}</span>
                    </div>
                    {candidate.description && (
                      <p className="candidate-description">{candidate.description}</p>
                    )}
                  </div>
                  <div className="vote-stats">
                    <div className="vote-numbers">
                      <span className="vote-count">
                        {candidate.voteCount.toLocaleString()} votes
                      </span>
                      <span className="vote-percentage">
                        {candidate.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="vote-bar-container">
                      <div 
                        className="vote-bar"
                        style={{ width: `${candidate.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {locationBreakdown.length > 0 && (
            <div className="location-breakdown">
              <h4>Votes by Location</h4>
              <div className="location-table">
                <div className="table-header">
                  <div>County</div>
                  <div>Division</div>
                  <div>Polling Station</div>
                  <div>Votes</div>
                </div>
                {locationBreakdown.map((location, idx) => (
                  <div key={idx} className="table-row">
                    <div>{location.county}</div>
                    <div>{location.division}</div>
                    <div>{location.polling_station}</div>
                    <div>{location.votes_per_station}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-summary">
            <h4>Summary</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">{summary.totalVotes.toLocaleString()}</span>
                <span className="stat-label">Total Votes</span>
              </div>
              <div className="stat">
                <span className="stat-value">{summary.totalCandidates}</span>
                <span className="stat-label">Candidates</span>
              </div>
              <div className="stat">
                <span className="stat-value">{summary.votingStations}</span>
                <span className="stat-label">Voting Stations</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {poll.is_active ? 'Live' : 'Final'}
                </span>
                <span className="stat-label">Status</span>
              </div>
            </div>
            
            {poll.is_active && (
              <div className="live-updates">
                <div className="live-indicator"></div>
                <span>Results update in real-time</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;