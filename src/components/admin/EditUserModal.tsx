// src/components/admin/EditUserModal.tsx
import React, { useState } from 'react';
import '../../styles/createPollModal.css';

interface User {
  id: number;
  email: string;
  nationalId: string;
  phone?: string;
  county: string;
  division: string;
  pollingStation: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  voteCount: number;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: user.email,
    phone: user.phone || '',
    county: user.county,
    division: user.division,
    pollingStation: user.pollingStation,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  });

  const [errors, setErrors] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.county || !formData.division || !formData.pollingStation) {
      setErrors('Please fill in all required fields');
      return;
    }

    onSave({
      email: formData.email,
      phone: formData.phone || undefined,
      county: formData.county,
      division: formData.division,
      pollingStation: formData.pollingStation,
      isEmailVerified: formData.isEmailVerified,
      isPhoneVerified: formData.isPhoneVerified,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User - {user.nationalId}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {errors}
              </div>
            )}

            <div className="form-section">
              <h4 className="form-section-title">Personal Information</h4>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isEmailVerified}
                    onChange={(e) => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                  />
                  <span>Email Verified</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPhoneVerified}
                    onChange={(e) => setFormData({ ...formData, isPhoneVerified: e.target.checked })}
                  />
                  <span>Phone Verified</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">Location Details</h4>
              
              <div className="form-group">
                <label htmlFor="county">County *</label>
                <input
                  id="county"
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="division">Division *</label>
                <input
                  id="division"
                  type="text"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pollingStation">Polling Station *</label>
                <input
                  id="pollingStation"
                  type="text"
                  value={formData.pollingStation}
                  onChange={(e) => setFormData({ ...formData, pollingStation: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="info-note">
              <strong>Note:</strong> National ID cannot be changed. User registered on{' '}
              {new Date(user.createdAt).toLocaleDateString()} with {user.voteCount} vote(s).
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
