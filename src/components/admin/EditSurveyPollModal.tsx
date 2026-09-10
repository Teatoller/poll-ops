import React, { useState } from 'react';
import type { SurveyPoll } from '../../types';
import '../../styles/createPollModal.css';

interface EditSurveyPollModalProps {
  survey: SurveyPoll;
  onClose: () => void;
  onSave: (surveyData: {
    question: string;
    description: string;
    startDate: string;
    endDate: string;
    scope: SurveyPoll['scope'];
    countyId?: number | null;
    subCountyId?: number | null;
    wardId?: number | null;
    options: Array<{ optionText: string }>;
  }) => Promise<void>;
}

const EditSurveyPollModal: React.FC<EditSurveyPollModalProps> = ({ survey, onClose, onSave }) => {
  const [question, setQuestion] = useState(survey.question);
  const [description, setDescription] = useState(survey.description || '');
  const [startDate, setStartDate] = useState(survey.startDate.slice(0, 16));
  const [endDate, setEndDate] = useState(survey.endDate.slice(0, 16));
  const [scope, setScope] = useState(survey.scope);
  const [options, setOptions] = useState(
    survey.options.map(option => ({ optionText: option.optionText }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (index: number, optionText: string) => {
    setOptions(current => current.map((option, optionIndex) => (
      optionIndex === index ? { optionText } : option
    )));
  };

  const addOption = () => {
    setOptions(current => [...current, { optionText: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      setError('At least two options are required');
      return;
    }
    setOptions(current => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedOptions = options.map(option => option.optionText.trim());
    const normalizedOptions = trimmedOptions.map(option => option.toLowerCase());

    if (!question.trim()) {
      setError('Question is required');
      return;
    }
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }
    if (scope === 'COUNTY' && !survey.countyId) {
      setError('A county must be selected before using County scope');
      return;
    }
    if (scope === 'SUB_COUNTY' && (!survey.countyId || !survey.subCountyId)) {
      setError('County and Sub-County must be selected before using Sub-County scope');
      return;
    }
    if (scope === 'WARD' && (!survey.countyId || !survey.subCountyId || !survey.wardId)) {
      setError('County, Sub-County, and Ward must be selected before using Ward scope');
      return;
    }
    if (trimmedOptions.length < 2 || trimmedOptions.some(option => !option)) {
      setError('At least two non-empty options are required');
      return;
    }
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      setError('Survey options must be unique');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        question: question.trim(),
        description: description.trim(),
        startDate,
        endDate,
        scope,
        countyId: survey.countyId,
        subCountyId: survey.subCountyId,
        wardId: survey.wardId,
        options: trimmedOptions.map(optionText => ({ optionText }))
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content survey-modal-content">
        <div className="modal-header">
          <h3>Edit Survey/Opinion Poll</h3>
          <button type="button" onClick={onClose} className="modal-close" disabled={loading}>
            ×
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-survey-question">Question</label>
            <input
              id="edit-survey-question"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-survey-description">Description</label>
            <textarea
              id="edit-survey-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-survey-start-date">Start Date</label>
              <input
                id="edit-survey-start-date"
                type="datetime-local"
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-survey-end-date">End Date</label>
              <input
                id="edit-survey-end-date"
                type="datetime-local"
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-survey-scope">Survey Scope</label>
            <select
              id="edit-survey-scope"
              value={scope}
              onChange={event => setScope(event.target.value as SurveyPoll['scope'])}
              disabled={loading}
            >
              <option value="GENERAL">General (All Users)</option>
              <option value="NATIONAL">National</option>
              <option value="COUNTY">County-Specific</option>
              <option value="SUB_COUNTY">Sub-County-Specific</option>
              <option value="WARD">Ward-Specific</option>
            </select>
            <small>Existing location targeting is preserved while editing.</small>
          </div>

          <div className="form-section">
            <div className="section-header-with-action">
              <h4>Survey Options</h4>
              <button type="button" onClick={addOption} className="btn btn-secondary btn-sm" disabled={loading}>
                + Add Option
              </button>
            </div>

            {options.map((option, index) => (
              <div className="form-group" key={`survey-option-${index}`}>
                <label htmlFor={`edit-survey-option-${index}`}>Option {index + 1}</label>
                <div className="survey-edit-option-row">
                  <input
                    id={`edit-survey-option-${index}`}
                    value={option.optionText}
                    onChange={event => updateOption(index, event.target.value)}
                    disabled={loading}
                    required
                  />
                  {options.length > 2 && (
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
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSurveyPollModal;
