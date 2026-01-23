// src/components/client/SurveyResults.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { SurveyResults as SurveyResultsType } from '../../types';
import { api } from '../../services/api';

const SurveyResults: React.FC = () => {
  const [surveyResults, setSurveyResults] = useState<SurveyResultsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const message = location.state?.message;
    if (message) {
      setSuccessMessage(message);
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    fetchSurveyResults();
  }, [user, navigate, location.state]);

  const fetchSurveyResults = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const surveyId = location.state?.surveyId;
      
      if (!surveyId) {
        throw new Error('No survey specified');
      }

      const results = await api.getSurveyResults(surveyId);
      setSurveyResults(results);
    } catch (err) {
      console.error('Error fetching survey results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load survey results');
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async (): Promise<void> => {
    await fetchSurveyResults();
  };

  const getBarColor = (index: number): string => {
    const colors = [
      '#1e3c72', // Dark blue
      '#2a5298', // Medium blue
      '#3a6bb5', // Light blue
      '#7e8ba3', // Gray blue
      '#5c7393', // Muted blue
      '#4a5d7f', // Deep blue
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="survey-results-loading">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error && !surveyResults) {
    return (
      <div className="survey-results-error">
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

  if (!surveyResults) {
    return (
      <div className="no-survey-results">
        <h2>No Results Available</h2>
        <button onClick={() => navigate('/dashboard')} className="action-button">
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  const { survey, options, totalVotes } = surveyResults;
  const safeVoteCount = totalVotes ?? 0;

  return (
    <div className="survey-results">
      <div className="survey-results-header">
        <div 
        className="kenya-flag-banner"
        >
          <img src="/kenyaFlag.jpeg" alt="Kenya Flag" className="flag-banner" />
          <div className="flag-overlay"></div>
        </div>
        <div className="header-content">
          <button 
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <button 
            onClick={refreshResults}
            className="refresh-button"
            title="Refresh results"
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      <div className="survey-results-content">
        <div className="survey-info-section">
          <h1 className="survey-question">{survey.question}</h1>
          {survey.description && (
            <p className="survey-description">{survey.description}</p>
          )}
          
          <div className="survey-meta-info">
            <div className="meta-badge">
              <span className="meta-label">Total Responses:</span>
              <span className="meta-value">{safeVoteCount.toLocaleString()}</span>
            </div>
            <div className="meta-badge">
              <span className="meta-label">Status:</span>
              <span className={`status-badge ${survey.is_active ? 'active' : 'closed'}`}>
                {survey.is_active ? 'Active' : 'Closed'}
              </span>
            </div>
            <div className="meta-badge">
              <span className="meta-label">Period:</span>
              <span className="meta-value">
                {new Date(survey.startDate).toLocaleDateString()} - {new Date(survey.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="results-visualization">
          <h2 className="results-title">Survey Results</h2>
          
          <div className="options-results">
            {options
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((option, index) => (
                <div key={option.id} className="option-result-card">
                  <div className="option-header">
                    <div className="option-info">
                      <span className="option-rank">#{index + 1}</span>
                      <h3 className="option-text">{option.optionText}</h3>
                    </div>
                    <div className="option-stats">
                      <span className="percentage-large">{option.percentage.toFixed(1)}%</span>
                      <span className="vote-count-small">{option.voteCount.toLocaleString()} votes</span>
                    </div>
                  </div>
                  
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${option.percentage}%`,
                        backgroundColor: getBarColor(index)
                      }}
                    >
                      <span className="progress-label">
                        {option.percentage > 5 ? `${option.percentage.toFixed(1)}%` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {survey.is_active && (
            <div className="live-indicator-section">
              <div className="live-pulse"></div>
              <span className="live-text">Live Results - Updates automatically</span>
            </div>
          )}
        </div>

        <div className="survey-scope-info">
          <h3>Survey Scope</h3>
          <div className="scope-details">
            <div className="scope-item">
              <span className="scope-label">Scope:</span>
              <span className="scope-value">{survey.scope}</span>
            </div>
            {survey.countyName && (
              <div className="scope-item">
                <span className="scope-label">County:</span>
                <span className="scope-value">{survey.countyName}</span>
              </div>
            )}
            {survey.subCountyName && (
              <div className="scope-item">
                <span className="scope-label">Sub-County:</span>
                <span className="scope-value">{survey.subCountyName}</span>
              </div>
            )}
            {survey.wardName && (
              <div className="scope-item">
                <span className="scope-label">Ward:</span>
                <span className="scope-value">{survey.wardName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;
