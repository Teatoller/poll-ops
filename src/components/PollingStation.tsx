// src/components/PollingStation.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Poll } from '../types';

interface VoteSelection {
  [pollId: number]: number; // pollId -> candidateId
}

const PollingStation: React.FC = () => {
  const [selectedVotes, setSelectedVotes] = useState<VoteSelection>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get poll data from navigation state or fetch it
  const poll: Poll = location.state?.poll || {
    id: 1,
    officeName: 'President',
    description: 'Presidential Election 2024',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    isActive: true,
    candidates: [
      { id: 1, name: 'John Doe', party: 'Democratic Alliance' },
      { id: 2, name: 'Jane Smith', party: 'National Unity' },
      { id: 3, name: 'Mike Johnson', party: 'Progressive Front' }
    ]
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleVoteSelect = (pollId: number, candidateId: number): void => {
    setSelectedVotes(prev => ({
      ...prev,
      [pollId]: candidateId
    }));
    setError(''); // Clear any previous errors
  };

  const submitVotes = async (): Promise<void> => {
    if (Object.keys(selectedVotes).length === 0) {
      setError('Please select a candidate to vote');
      return;
    }

    setSubmitting(true);
    try {
      // Submit vote via API for each poll
      for (const [pollIdStr, candidateId] of Object.entries(selectedVotes)) {
        const pollId = Number.parseInt(pollIdStr);
        await api.submitVote({
          pollId,
          candidateId
        });
      }
      
      navigate('/dashboard', { 
        state: { message: 'Vote submitted successfully!', refresh: true } 
      });
    } catch (err: any) {
      setError(err?.error || err?.message || 'Error submitting vote');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    return Object.keys(selectedVotes).length > 0;
  };

  return (
    <div className="polling-station">
      <div className="polling-header">
        <h2>Cast Your Vote</h2>
        <p className="poll-description">{poll.officeName} - {poll.description}</p>
        <div className="voter-info">
          <p>Voting as: <strong>{user?.email}</strong></p>
          <p>Polling Station: <strong>{user?.pollingStation}</strong></p>
        </div>
      </div>

      <div className="poll-card">
        <h3>{poll.officeName}</h3>
        <p className="poll-instructions">
          Please select one candidate. You can only vote once per poll.
        </p>

        <div className="candidates-list">
          {poll.candidates.map(candidate => (
            <div 
              key={candidate.id} 
              className={`candidate-item ${
                selectedVotes[poll.id] === candidate.id ? 'selected' : ''
              }`}
            >
              <input
                type="radio"
                name={`poll-${poll.id}`}
                id={`candidate-${candidate.id}`}
                checked={selectedVotes[poll.id] === candidate.id}
                onChange={() => handleVoteSelect(poll.id, candidate.id)}
                className="candidate-radio"
              />
              <label htmlFor={`candidate-${candidate.id}`} className="candidate-label">
                <div className="candidate-info">
                  <strong className="candidate-name">{candidate.name}</strong>
                  <span className="candidate-party">{candidate.party}</span>
                  {candidate.description && (
                    <p className="candidate-description">{candidate.description}</p>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        {error && <div className="error-message submit-error">{error}</div>}

        <div className="vote-actions">
          <button 
            onClick={() => navigate('/dashboard')}
            className="action-button secondary"
          >
            Cancel
          </button>
          <button 
            onClick={submitVotes}
            disabled={!isFormValid() || submitting}
            className="action-button primary"
          >
            {submitting ? 'Submitting Vote...' : 'Submit Vote'}
          </button>
        </div>
      </div>

      <div className="voting-rules">
        <h4>Voting Rules</h4>
        <ul>
          <li>You can only vote once in this poll</li>
          <li>Your vote is anonymous and secure</li>
          <li>You cannot change your vote after submission</li>
          <li>Voting ends on {new Date(poll.endDate).toLocaleDateString()}</li>
        </ul>
      </div>
    </div>
  );
};

export default PollingStation;