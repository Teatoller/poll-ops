// src/components/admin/PollManagement.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Poll {
  id: number;
  officeName: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  totalVotes: number;
  candidateCount: number;
  candidates: Array<{
    id: number;
    name: string;
    party: string;
  }>;
}

const PollManagement: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const data = await api.getAdminPolls();
      setPolls(data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (pollData: any) => {
    try {
      await api.createPoll(pollData);
      fetchPolls();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  const handleToggleActive = async (pollId: number, isActive: boolean) => {
    try {
      // You'll need to add this endpoint
      await api.togglePollActive(pollId, !isActive);
      fetchPolls();
    } catch (error) {
      console.error('Error toggling poll:', error);
    }
  };

  const handleDeletePoll = async (pollId: number) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      try {
        // You'll need to add this endpoint
        await api.deletePoll(pollId);
        fetchPolls();
      } catch (error) {
        console.error('Error deleting poll:', error);
      }
    }
  };

  if (loading) return <div>Loading polls...</div>;

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
                <td>{poll.description}</td>
                <td>{new Date(poll.startDate).toLocaleDateString()}</td>
                <td>{new Date(poll.endDate).toLocaleDateString()}</td>
                <td>{poll.candidateCount}</td>
                <td>{poll.totalVotes.toLocaleString()}</td>
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
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggleActive(poll.id, poll.is_active)}
                      className="btn-action btn-toggle"
                    >
                      {poll.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDeletePoll(poll.id)}
                      className="btn-action btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
          onSave={(updatedPoll) => {
            // Implement update logic
            setEditingPoll(null);
            fetchPolls();
          }}
        />
      )}
    </div>
  );
};

// src/components/admin/CreatePollModal.tsx
const CreatePollModal: React.FC<{ onClose: () => void; onSubmit: (data: any) => void }> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    officeName: '',
    description: '',
    startDate: '',
    endDate: '',
    candidates: [{ name: '', party: '' }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addCandidate = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { name: '', party: '' }]
    }));
  };

  const removeCandidate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };

  const updateCandidate = (index: number, field: 'name' | 'party', value: string) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map((candidate, i) => 
        i === index ? { ...candidate, [field]: value } : candidate
      )
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Poll</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Office Name *</label>
            <input
              type="text"
              value={formData.officeName}
              onChange={(e) => setFormData(prev => ({ ...prev, officeName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Candidates *</label>
            {formData.candidates.map((candidate, index) => (
              <div key={index} className="candidate-input-group">
                <input
                  type="text"
                  placeholder="Candidate Name"
                  value={candidate.name}
                  onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Party"
                  value={candidate.party}
                  onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                  required
                />
                {formData.candidates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addCandidate} className="btn-add">
              + Add Candidate
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollManagement;