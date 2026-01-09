// src/components/client/SurveyVoting.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { SurveyPoll } from '../../types';
import { api } from '../../services/api';

const SurveyVoting: React.FC = () => {
  const [survey, setSurvey] = useState<SurveyPoll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const surveyFromState = location.state?.survey;
    if (surveyFromState) {
      setSurvey(surveyFromState);
      checkVoteStatus(surveyFromState.id);
    } else {
      setError('No survey data provided');
      setLoading(false);
    }
  }, [user, navigate, location.state]);

  const checkVoteStatus = async (surveyId: number): Promise<void> => {
    try {
      const status = await api.checkSurveyVoteStatus(surveyId);
      setHasVoted(status.hasVoted);
      
      if (status.hasVoted) {
        // Redirect to results if already voted
        setTimeout(() => {
          navigate('/survey-results', { 
            state: { surveyId },
            replace: true 
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking vote status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionId: number): void => {
    if (!hasVoted && !submitting) {
      setSelectedOption(optionId);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!selectedOption || !survey) {
      setError('Please select an option');
      return;
    }

    if (hasVoted) {
      setError('You have already voted in this survey');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submitSurveyVote({
        surveyId: survey.id,
        optionId: selectedOption
      });

      // Navigate to results
      navigate('/survey-results', {
        state: { 
          surveyId: survey.id,
          message: 'Thank you for participating in this survey!'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit your response');
      setSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="survey-voting-loading">
        <div className="loading-spinner"></div>
        <p>Loading survey...</p>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="survey-voting-container">
        <div className="already-voted-message">
          <div className="success-icon">✓</div>
          <h2>Already Participated</h2>
          <p>You have already responded to this survey.</p>
          <p>Redirecting to results...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="survey-voting-error">
        <h2>Survey Not Found</h2>
        <p>{error || 'Unable to load survey'}</p>
        <button onClick={handleCancel} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="survey-voting-container">
      <div className="survey-voting-card">
        <div className="survey-header">
          <div className="kenya-flag-banner">
            <img src="/kenyaFlag.jpeg" alt="Kenya Flag" className="flag-image" />
          </div>
          <h2 className="survey-question">{survey.question}</h2>
          {survey.description && (
            <p className="survey-description">{survey.description}</p>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="survey-form">
          <div className="survey-options">
            <h3 className="options-title">Please select one option:</h3>
            
            {survey.options.map((option) => (
              <div
                key={option.id}
                className={`survey-option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="option-radio">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name="survey-option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => handleOptionSelect(option.id)}
                    disabled={submitting}
                  />
                  <label htmlFor={`option-${option.id}`}>
                    {option.optionText}
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="survey-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedOption || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>

        <div className="survey-meta">
          <p className="meta-info">
            <strong>Survey Period:</strong> {new Date(survey.startDate).toLocaleDateString()} - {new Date(survey.endDate).toLocaleDateString()}
          </p>
          <p className="meta-info">
            <strong>Status:</strong> <span className={survey.is_active ? 'status-active' : 'status-closed'}>
              {survey.is_active ? 'Active' : 'Closed'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SurveyVoting;
