// src/components/admin/EditPollModal.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';

interface Candidate {
  id?: number;
  name: string;
  party: string;
  photoUrl?: string;
  description?: string;
}

interface Poll {
  id: number;
  officeName: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  candidates: Candidate[];
}

interface EditPollModalProps {
  poll: Poll;
  onClose: () => void;
  onSave: (updatedPoll: any) => void;
}

interface FormData {
  officeName: string;
  description: string;
  startDate: string;
  endDate: string;
  is_active: boolean;
  candidates: Array<{
    id?: number;
    name: string;
    party: string;
    photoUrl: string;
    description: string;
  }>;
}

const EditPollModal: React.FC<EditPollModalProps> = ({ poll, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormData>({
    officeName: '',
    description: '',
    startDate: '',
    endDate: '',
    is_active: true,
    candidates: []
  });

  console.log("edi poll modal---poll+++", poll)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize form data when poll changes
    const formattedCandidates = poll.candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name || '',
      party: candidate.party || '',
      photoUrl: candidate.photoUrl || '',
      description: candidate.description || ''
    }));

    setFormData({
      officeName: poll.officeName,
      description: poll.description,
      startDate: new Date(poll.startDate).toISOString().slice(0, 16),
      endDate: new Date(poll.endDate).toISOString().slice(0, 16),
      is_active: poll.is_active,
      candidates: formattedCandidates
    });
  }, [poll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data for API - filter out empty candidates
      const updatedPoll = {
        officeName: formData.officeName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        is_active: formData.is_active,
        candidates: formData.candidates
          .filter(c => c.name.trim() && c.party.trim())
          .map(candidate => ({
            id: candidate.id,
            name: candidate.name.trim(),
            party: candidate.party.trim(),
            photoUrl: candidate.photoUrl?.trim() || undefined,
            description: candidate.description?.trim() || undefined
          }))
      };

      onSave(updatedPoll);
    } catch (err: any) {
      setError(err.message || 'Failed to update poll');
    } finally {
      setLoading(false);
    }
  };

  const addCandidate = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [
        ...prev.candidates, 
        { 
          id: undefined, 
          name: '', 
          party: '', 
          photoUrl: '', 
          description: '' 
        }
      ]
    }));
  };

  const removeCandidate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };

  const updateCandidate = (index: number, field: keyof Candidate, value: string) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map((candidate, i) => 
        i === index ? { ...candidate, [field]: value } : candidate
      )
    }));
  };

  const updateFormData = (field: keyof Omit<FormData, 'candidates'>, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Poll #{poll.id}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Office Name *</label>
            <input
              type="text"
              value={formData.officeName}
              onChange={(e) => updateFormData('officeName', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => updateFormData('startDate', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => updateFormData('endDate', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateFormData('is_active', e.target.checked)}
                disabled={loading}
              />
              <span>Active Poll</span>
            </label>
          </div>

          <div className="form-group">
            <div className="section-header">
              <label>Candidates *</label>
              <button 
                type="button" 
                onClick={addCandidate}
                className="btn-text"
                disabled={loading}
              >
                + Add Candidate
              </button>
            </div>
            
            {formData.candidates.map((candidate, index) => (
              <div key={index} className="candidate-card">
                <div className="candidate-header">
                  <h4>Candidate {index + 1}</h4>
                  {formData.candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="btn-remove"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="candidate-fields">
                  <input
                    type="text"
                    placeholder="Candidate Name *"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                    required
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="Party *"
                    value={candidate.party}
                    onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                    required
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="Photo URL (optional)"
                    value={candidate.photoUrl || ''}
                    onChange={(e) => updateCandidate(index, 'photoUrl', e.target.value)}
                    disabled={loading}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={candidate.description || ''}
                    onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                    rows={2}
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPollModal;