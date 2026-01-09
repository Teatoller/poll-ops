// src/components/admin/CreateSurveyPollModal.tsx
import React, { useState } from 'react';
import LocationSelector from '../client/LocationSelector';

interface SurveyOptionForm {
  optionText: string;
}

interface CreateSurveyPollModalProps {
  onClose: () => void;
  onSubmit: (data: {
    question: string;
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
    options: SurveyOptionForm[];
  }) => Promise<void>;
}

const CreateSurveyPollModal: React.FC<CreateSurveyPollModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    question: '',
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
    options: [{ optionText: '' }, { optionText: '' }] // Start with 2 options
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Scope validation
    if (formData.scope === 'COUNTY' && !formData.countyId) {
      setError('Please select a County for a County-scoped survey');
      return;
    }
    if (formData.scope === 'SUB_COUNTY' && !formData.subCountyId) {
      setError('Please select a Sub-County for a Sub-County-scoped survey');
      return;
    }
    if (formData.scope === 'WARD' && !formData.wardId) {
      setError('Please select a Ward for a Ward-scoped survey');
      return;
    }
    
    // Validation
    if (!formData.question.trim()) {
      setError('Question is required');
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
    
    // Validate options
    const validOptions = formData.options.filter(o => o.optionText.trim());
    
    if (validOptions.length < 2) {
      setError('At least two options are required for a survey');
      return;
    }
    
    // Check for duplicate option texts
    const optionTexts = validOptions.map(o => o.optionText.toLowerCase().trim());
    const uniqueTexts = new Set(optionTexts);
    if (uniqueTexts.size !== optionTexts.length) {
      setError('Survey options must be unique');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for API
      const surveyData = {
        question: formData.question.trim(),
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
        options: validOptions.map(option => ({
          optionText: option.optionText.trim()
        }))
      };

      await onSubmit(surveyData);
    } catch (err: any) {
      setError(err.message || 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { optionText: '' }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      setError('At least two options are required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { optionText: value } : option
      )
    }));
  };

  const updateFormData = (field: keyof Omit<typeof formData, 'options'>, value: string) => {
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
          <h3>Create New Survey/Opinion Poll</h3>
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
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Survey Details</h4>
            
            <div className="form-group">
              <label htmlFor="question">
                Question <span className="required">*</span>
              </label>
              <input
                type="text"
                id="question"
                value={formData.question}
                onChange={(e) => updateFormData('question', e.target.value)}
                placeholder="e.g., Issues Kenyans Will Look At"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Additional context for this survey"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  End Date <span className="required">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => updateFormData('endDate', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="scope">Survey Scope</label>
              <select
                id="scope"
                value={formData.scope}
                onChange={(e) => updateFormData('scope', e.target.value)}
                disabled={loading}
              >
                <option value="GENERAL">General (All Users)</option>
                <option value="NATIONAL">National</option>
                <option value="COUNTY">County-Specific</option>
                <option value="SUB_COUNTY">Sub-County-Specific</option>
                <option value="WARD">Ward-Specific</option>
              </select>
              <small>Determines who can participate in this survey</small>
            </div>

            {(formData.scope === 'COUNTY' || formData.scope === 'SUB_COUNTY' || formData.scope === 'WARD') && (
              <div className="form-group">
                <label>Location Selection</label>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  disabled={loading}
                  required={true}
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="section-header-with-action">
              <h4>Survey Options <span className="required">*</span></h4>
              <button
                type="button"
                onClick={addOption}
                className="btn btn-secondary btn-sm"
                disabled={loading}
              >
                + Add Option
              </button>
            </div>
            <small className="form-helper">Add at least 2 options for voters to choose from</small>

            <div className="options-list">
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <div className="option-header">
                    <span className="option-number">Option {index + 1}</span>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="btn btn-danger btn-sm"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor={`option-text-${index}`}>
                      Option Text <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id={`option-text-${index}`}
                      value={option.optionText}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder="e.g., Cost of living - 46%"
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSurveyPollModal;
