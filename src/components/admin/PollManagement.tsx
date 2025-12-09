// src/components/admin/PollManagement.tsx - UPDATED
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// import CreatePollModal from './CreatePollModal'; // Make sure this exists
import EditPollModal from './EditPollModal';
import CreatePollModal from './CreatePollModal';
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
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setError('');
      const data = await api.getAdminPolls();
      console.log("dddtaaaa fetchPolls--->", data)
      // Transform data if needed
            const transformedPolls = data.map((poll: any) => ({
        ...poll,
        totalVotes: poll.total_votes || poll.totalVotes || 0,
        candidateCount: poll.candidate_count || poll.candidateCount || poll.candidates?.length || 0,
        officeName: poll.office_name || poll.officeName,
        is_active: poll.is_active !== undefined ? poll.is_active : true,
        candidates: poll.candidates || [] // <- ensure candidates is an array
      }));
      setPolls(transformedPolls);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch polls');
      console.error('Error fetching polls:', error);
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

  const handleToggleActive = async (pollId: number, isActive: boolean) => {
    try {
      setError('');
      await api.togglePollActive(pollId, !isActive);
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
      await api.updatePoll(editingPoll.id, updatedPoll);
      setEditingPoll(null);
      fetchPolls();
    } catch (error: any) {
      setError(error.message || 'Failed to update poll');
      console.error('Error updating poll:', error);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading polls...</p>
    </div>
  );

  return (
    <div className="poll-management">
      <div className="page-header">
        <h2>Poll Management</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + Create New Poll
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

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
                      onClick={() => setEditingPoll(poll)}
                      className="btn-action btn-edit"
                      title="Edit poll"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleActive(poll.id, poll.is_active)}
                      className={`btn-action ${poll.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                      title={poll.is_active ? 'Deactivate poll' : 'Activate poll'}
                    >
                      {poll.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDeletePoll(poll.id)}
                      className="btn-action btn-delete"
                      title="Delete poll"
                      disabled={(poll.totalVotes || 0) > 0}
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

      {showCreateModal && (
        <CreatePollModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePoll}
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