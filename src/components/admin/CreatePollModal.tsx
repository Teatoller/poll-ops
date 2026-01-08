// src/components/admin/CreatePollModal.tsx
import React, { useState } from 'react';
import LocationSelector from '../client/LocationSelector';
import '../../styles/createPollModal.css';

interface CandidateForm {
  name: string;
  party: string;
  photoUrl?: string;
  description?: string;
}

interface CreatePollModalProps {
  onClose: () => void;
  onSubmit: (data: {
    officeName: string;
    description: string;
    startDate: string;
    endDate: string;
    scope?: 'NATIONAL' | 'COUNTY' | 'SUB_COUNTY' | 'WARD' | 'GENERAL';
    countyId?: number | null;
    countyName?: string | null;
    subCountyId?: number | null;
    subCountyName?: string | null;
    wardId?: number | null;
    wardName?: string | null;
    pollingStation?: string | null;
    candidates: CandidateForm[];
  }) => Promise<void>;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    officeName: '',
    description: '',
    startDate: '',
    endDate: '',
    scope: 'GENERAL' as 'NATIONAL' | 'COUNTY' | 'SUB_COUNTY' | 'WARD' | 'GENERAL',
    countyId: null as number | null,
    countyName: '' as string | null,
    subCountyId: null as number | null,
    subCountyName: '' as string | null,
    wardId: null as number | null,
    wardName: '' as string | null,
    pollingStation: '' as string | null,
    candidates: [{ name: '', party: '', photoUrl: '', description: '' }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
        // Scope validation
        if (formData.scope === 'COUNTY' && !formData.countyId) {
          setError('Please select a County for a County-scoped poll');
          return;
        }
        if (formData.scope === 'SUB_COUNTY' && !formData.subCountyId) {
          setError('Please select a Sub-County for a Sub-County-scoped poll');
          return;
        }
        if (formData.scope === 'WARD' && !formData.wardId) {
          setError('Please select a Ward for a Ward-scoped poll');
          return;
        }
    
    // Validation
    if (!formData.officeName.trim()) {
      setError('Office name is required');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Start date and end date are required');
      return;
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) {
      setError('End date must be after start date');
      return;
    }
    
    // Validate candidates
    const validCandidates = formData.candidates.filter(c => 
      c.name.trim() && c.party.trim()
    );
    
    if (validCandidates.length === 0) {
      setError('At least one candidate with name and party is required');
      return;
    }
    
    // Check for duplicate candidate names
    const candidateNames = validCandidates.map(c => c.name.toLowerCase().trim());
    const uniqueNames = new Set(candidateNames);
    if (uniqueNames.size !== candidateNames.length) {
      setError('Candidate names must be unique');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const pollData = {
        officeName: formData.officeName.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        scope: formData.scope,
        countyId: formData.countyId,
        countyName: formData.countyName,
        subCountyId: formData.subCountyId,
        subCountyName: formData.subCountyName,
        wardId: formData.wardId,
        wardName: formData.wardName,
        pollingStation: formData.pollingStation || null,
        candidates: validCandidates.map(candidate => ({
          name: candidate.name.trim(),
          party: candidate.party.trim(),
          photoUrl: candidate.photoUrl?.trim() || undefined,
          description: candidate.description?.trim() || undefined
        }))
      };

      await onSubmit(pollData);
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const addCandidate = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { name: '', party: '', photoUrl: '', description: '' }]
    }));
  };

  const removeCandidate = (index: number) => {
    if (formData.candidates.length <= 1) {
      setError('At least one candidate is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };

  const updateCandidate = (index: number, field: keyof CandidateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map((candidate, i) => 
        i === index ? { ...candidate, [field]: value } : candidate
      )
    }));
  };

  const updateFormData = (field: keyof Omit<typeof formData, 'candidates'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleLocationSelect = (loc: {
    countyId: number | null;
    countyName: string;
    subCountyId: number | null;
    subCountyName: string;
    wardId: number | null;
    wardName: string;
    pollingStation: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      countyId: loc.countyId,
      countyName: loc.countyName || null,
      subCountyId: loc.subCountyId,
      subCountyName: loc.subCountyName || null,
      wardId: loc.wardId,
      wardName: loc.wardName || null,
      pollingStation: loc.pollingStation || null,
    }));
  };

  // Generate default dates (now and 30 days from now)
  const getDefaultStartDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndDate = () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    future.setMinutes(future.getMinutes() - future.getTimezoneOffset());
    return future.toISOString().slice(0, 16);
  };

  // Set default dates on first render
  if (!formData.startDate && !formData.endDate) {
    setFormData(prev => ({
      ...prev,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate()
    }));
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create New Poll</h3>
          <button 
            onClick={onClose} 
            className="modal-close"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="alert-close"
            >
              ×
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="officeName">
              Office Name *
              <span className="required-indicator">*</span>
            </label>
            <input
              id="officeName"
              type="text"
              value={formData.officeName}
              onChange={(e) => updateFormData('officeName', e.target.value)}
              placeholder="e.g., President, Governor, Senator"
              required
              disabled={loading}
              maxLength={100}
            />
            <div className="input-hint">
              Enter the political office for this election
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
              <span className="optional-indicator">(optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief description of this election..."
              rows={3}
              disabled={loading}
              maxLength={500}
            />
            <div className="input-hint">
              {formData.description.length}/500 characters
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                Start Date *
                <span className="required-indicator">*</span>
              </label>
              <input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => updateFormData('startDate', e.target.value)}
                required
                disabled={loading}
              />
              <div className="input-hint">
                When voting begins
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endDate">
                End Date *
                <span className="required-indicator">*</span>
              </label>
              <input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => updateFormData('endDate', e.target.value)}
                required
                disabled={loading}
                min={formData.startDate}
              />
              <div className="input-hint">
                When voting ends
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Scope *</label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as any }))}
              disabled={loading}
            >
              <option value="NATIONAL">National (everyone)</option>
              <option value="COUNTY">County</option>
              <option value="SUB_COUNTY">Sub-County</option>
              <option value="WARD">Ward</option>
              <option value="GENERAL">General (public or selectively restricted)</option>
            </select>
            <div className="input-hint">Choose who should see this poll</div>
          </div>

          {(formData.scope !== 'NATIONAL') && (
            <div className="form-group">
              <label>Target Location {formData.scope !== 'GENERAL' ? '*' : '(optional)'}</label>
              <LocationSelector
                onSelect={handleLocationSelect}
                errors={{}}
              />
              <div className="input-hint">
                {formData.scope === 'COUNTY' && 'Select County'}
                {formData.scope === 'SUB_COUNTY' && 'Select County and Sub-County'}
                {formData.scope === 'WARD' && 'Select County, Sub-County and Ward'}
                {formData.scope === 'GENERAL' && 'Leave empty for public, or select to restrict'}
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="section-header">
              <h4>
                Candidates *
                <span className="required-indicator">*</span>
              </h4>
              <button 
                type="button" 
                onClick={addCandidate}
                className="btn-add-candidate"
                disabled={loading}
              >
                <span className="plus-icon">+</span>
                Add Candidate
              </button>
            </div>
            <div className="section-description">
              Add at least one candidate. Each candidate requires a name and party.
            </div>
            
            {formData.candidates.map((candidate, index) => (
              <div key={index} className="candidate-card">
                <div className="candidate-card-header">
                  <div className="candidate-number">
                    Candidate {index + 1}
                  </div>
                  {formData.candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="btn-remove-candidate"
                      disabled={loading}
                      title="Remove candidate"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="candidate-fields">
                  <div className="form-group">
                    <label htmlFor={`candidate-name-${index}`}>
                      Name *
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id={`candidate-name-${index}`}
                      type="text"
                      value={candidate.name}
                      onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                      placeholder="Candidate full name"
                      required
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`candidate-party-${index}`}>
                      Party *
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id={`candidate-party-${index}`}
                      type="text"
                      value={candidate.party}
                      onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                      placeholder="Political party"
                      required
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`candidate-photo-${index}`}>
                      Photo URL
                      <span className="optional-indicator">(optional)</span>
                    </label>
                    <input
                      id={`candidate-photo-${index}`}
                      type="url"
                      value={candidate.photoUrl || ''}
                      onChange={(e) => updateCandidate(index, 'photoUrl', e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      disabled={loading}
                    />
                    <div className="input-hint">
                      URL to candidate's photo
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`candidate-description-${index}`}>
                      Description
                      <span className="optional-indicator">(optional)</span>
                    </label>
                    <textarea
                      id={`candidate-description-${index}`}
                      value={candidate.description || ''}
                      onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                      placeholder="Brief description of the candidate..."
                      rows={2}
                      disabled={loading}
                      maxLength={300}
                    />
                    <div className="input-hint">
                      {(candidate.description || '').length}/300 characters
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="candidate-count">
              {formData.candidates.length} candidate{formData.candidates.length !== 1 ? 's' : ''} added
            </div>
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
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating Poll...
                </>
              ) : (
                'Create Poll'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePollModal;