// src/components/admin/PollManagement.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { SurveyPoll } from '../../types';
import EditPollModal from './EditPollModal';
import CreatePollModal from './CreatePollModal';
import CreateSurveyPollModal from './CreateSurveyPollModal';
import '../../styles/pollManagement.css';

interface Poll {
  id: number;
  officeName: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  totalVotes?: number; // Make optional
  candidateCount?: number; // Make optional
  candidates: Array<{
    id: number;
    name: string;
    party: string;
    photoUrl?: string;
    description?: string;
  }>;
}

const PollManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'polls' | 'surveys'>('polls');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [surveys, setSurveys] = useState<SurveyPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'polls') {
      fetchPolls();
    } else {
      fetchSurveys();
    }
  }, [activeTab]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAdminPolls();
      // Transform data if needed
            const transformedPolls = data.map((poll: any) => ({
        ...poll,
        totalVotes: poll.total_votes || poll.totalVotes || 0,
        candidateCount: poll.candidate_count || poll.candidateCount || poll.candidates?.length || 0,
        officeName: poll.office_name || poll.officeName,
        is_active: poll.is_active !== undefined ? poll.is_active : true,
        candidates: poll.candidates
      }));
      setPolls(transformedPolls);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch polls');
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAdminSurveys();
      setSurveys(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch surveys');
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (pollData: any) => {
    try {
      setError('');
      await api.createPoll(pollData);
      fetchPolls();
      setShowCreateModal(false);
    } catch (error: any) {
      setError(error.message || 'Failed to create poll');
      console.error('Error creating poll:', error);
    }
  };

  const handleCreateSurvey = async (surveyData: any) => {
    try {
      setError('');
      await api.createSurvey(surveyData);
      alert('Survey created successfully!');
      setShowCreateSurveyModal(false);
      fetchSurveys();
    } catch (error: any) {
      setError(error.message || 'Failed to create survey');
      console.error('Error creating survey:', error);
    }
  };

  const handleToggleSurveyActive = async (surveyId: number) => {
    try {
      setError('');
      await api.toggleSurveyActive(surveyId);
      fetchSurveys();
    } catch (error: any) {
      setError(error.message || 'Failed to toggle survey status');
      console.error('Error toggling survey:', error);
    }
  };

  const handleDeleteSurvey = async (surveyId: number) => {
    if (window.confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        setError('');
        await api.deleteSurvey(surveyId);
        fetchSurveys();
      } catch (error: any) {
        setError(error.message || 'Failed to delete survey');
        console.error('Error deleting survey:', error);
      }
    }
  };

  const handleToggleActive = async (pollId: number, isActive: boolean) => {
    try {
      setError('');
      await api.togglePollActive(pollId, isActive);
      fetchPolls();
    } catch (error: any) {
      setError(error.message || 'Failed to toggle poll status');
      console.error('Error toggling poll:', error);
    }
  };

  const handleDeletePoll = async (pollId: number) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      try {
        setError('');
        await api.deletePoll(pollId);
        fetchPolls();
      } catch (error: any) {
        setError(error.message || 'Failed to delete poll');
        console.error('Error deleting poll:', error);
      }
    }
  };

  const handleUpdatePoll = async (updatedPoll: any) => {
    if (!editingPoll) return;
    
    try {
      setError('');
      console.log('Updating poll:', editingPoll.id, updatedPoll);
      const response = await api.updatePoll(editingPoll.id, updatedPoll);
      console.log('Update response:', response);
      setEditingPoll(null);
      fetchPolls();
    } catch (error: any) {
      setError(error.message || 'Failed to update poll');
      console.error('Error updating poll:', error);
    }
  };

    // Replace the handleEditPoll click handler
  const handleEditPoll = async (poll: Poll) => {
    try {
      setError('');
      setLoading(true);
      // Fetch full poll details with candidates
      const fullPollDetails = await api.getPoll(poll.id);
      setEditingPoll(fullPollDetails);
    } catch (error: any) {
      setError(error.message || 'Failed to load poll details');
      console.error('Error loading poll:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const pollsContent = (
    <div className="polls-table-container">
      <table className="polls-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Office Name</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Candidates</th>
            <th>Votes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {polls.map(poll => (
            <tr key={poll.id}>
              <td>#{poll.id}</td>
              <td>{poll.officeName}</td>
              <td className="description-cell">
                {poll.description.length > 50 
                  ? `${poll.description.substring(0, 50)}...` 
                  : poll.description}
              </td>
              <td>{new Date(poll.startDate).toLocaleDateString()}</td>
              <td>{new Date(poll.endDate).toLocaleDateString()}</td>
              <td>{poll.candidateCount || poll.candidates?.length || 0}</td>
              <td>{(poll.totalVotes || 0).toLocaleString()}</td>
              <td>
                <span className={`status-badge ${poll.is_active ? 'status-active' : 'status-inactive'}`}>
                  {poll.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    onClick={() => handleEditPoll(poll)}
                    className="btn-action btn-edit"
                    title="Edit poll"
                    type="button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleActive(poll.id, poll.is_active)}
                    className={`btn-action ${poll.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                    title={poll.is_active ? 'Deactivate poll' : 'Activate poll'}
                    type="button"
                  >
                    {poll.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeletePoll(poll.id)}
                    className="btn-action btn-delete"
                    title="Delete poll"
                    disabled={(poll.totalVotes || 0) > 0}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
                {(poll.totalVotes || 0) > 0 && (
                  <div className="delete-hint">
                    Cannot delete poll with votes
                  </div>
                )}
              </td>
            </tr>
          ))}
          {polls.length === 0 && (
            <tr>
              <td colSpan={9} className="no-data">
                No polls found. Create your first poll!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const surveysContent = (
    <div className="polls-table-container">
      <table className="polls-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Question</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Options</th>
            <th>Votes</th>
            <th>Scope</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {surveys.map(survey => (
            <tr key={survey.id}>
              <td>#{survey.id}</td>
              <td>{survey.question}</td>
              <td className="description-cell">
                {survey.description && survey.description.length > 50 
                  ? `${survey.description.substring(0, 50)}...` 
                  : survey.description || '-'}
              </td>
              <td>{new Date(survey.startDate).toLocaleDateString()}</td>
              <td>{new Date(survey.endDate).toLocaleDateString()}</td>
              <td>{survey.options?.length || 0}</td>
              <td>{(survey.totalVotes || 0).toLocaleString()}</td>
              <td>
                <span className="scope-badge">{survey.scope}</span>
              </td>
              <td>
                <span className={`status-badge ${survey.is_active ? 'status-active' : 'status-inactive'}`}>
                  {survey.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    onClick={() => handleToggleSurveyActive(survey.id)}
                    className={`btn-action ${survey.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                    title={survey.is_active ? 'Deactivate survey' : 'Activate survey'}
                    type="button"
                  >
                    {survey.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeleteSurvey(survey.id)}
                    className="btn-action btn-delete"
                    title="Delete survey"
                    disabled={(survey.totalVotes || 0) > 0}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
                {(survey.totalVotes || 0) > 0 && (
                  <div className="delete-hint">
                    Cannot delete survey with votes
                  </div>
                )}
              </td>
            </tr>
          ))}
          {surveys.length === 0 && (
            <tr>
              <td colSpan={10} className="no-data">
                No surveys found. Create your first survey!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="poll-management">
      <div className="page-header">
        <h2>Poll & Survey Management</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            type="button"
          >
            + Create Election Poll
          </button>
          <button 
            onClick={() => setShowCreateSurveyModal(true)}
            className="btn-primary btn-survey"
            type="button"
          >
            + Create Survey Poll
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
          onClick={() => setActiveTab('polls')}
          type="button"
        >
          Election Polls ({polls.length})
        </button>
        <button 
          className={`tab ${activeTab === 'surveys' ? 'active' : ''}`}
          onClick={() => setActiveTab('surveys')}
          type="button"
        >
          Survey Polls ({surveys.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading {activeTab === 'polls' ? 'polls' : 'surveys'}...</p>
        </div>
      ) : activeTab === 'polls' ? pollsContent : surveysContent}

      {showCreateModal && (
        <CreatePollModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePoll}
        />
      )}

      {showCreateSurveyModal && (
        <CreateSurveyPollModal
          onClose={() => setShowCreateSurveyModal(false)}
          onSubmit={handleCreateSurvey}
        />
      )}

      {editingPoll && (
        <EditPollModal
          poll={editingPoll}
          onClose={() => setEditingPoll(null)}
          onSave={handleUpdatePoll}
        />
      )}
    </div>
  );
};

export default PollManagement;