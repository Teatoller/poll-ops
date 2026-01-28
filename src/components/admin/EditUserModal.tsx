// src/components/admin/EditUserModal.tsx
import React, { useState } from 'react';
import '../../styles/createPollModal.css';
import LocationSelector from '../client/LocationSelector';

interface User {
  id: number;
  email: string;
  phone?: string;
  countyId?: number | null;
  countyName?: string;
  subCountyId?: number | null;
  subCountyName?: string;
  wardId?: number | null;
  wardName?: string;
  pollingStation?: string;
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
    countyId: user.countyId ?? null,
    countyName: user.countyName || '',
    subCountyId: user.subCountyId ?? null,
    subCountyName: user.subCountyName || '',
    wardId: user.wardId ?? null,
    wardName: user.wardName || '',
    pollingStation: user.pollingStation || '',
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  });

  const [errors, setErrors] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors('Email is required');
      return;
    }

    onSave({
      email: formData.email,
      phone: formData.phone || undefined,
      countyId: formData.countyId,
      countyName: formData.countyName,
      subCountyId: formData.subCountyId,
      subCountyName: formData.subCountyName,
      wardId: formData.wardId,
      wardName: formData.wardName,
      pollingStation: formData.pollingStation,
      isEmailVerified: formData.isEmailVerified,
      isPhoneVerified: formData.isPhoneVerified,
    });
  };

  const handleLocationSelect = (locationData: any) => {
    setFormData(prev => ({ ...prev, ...locationData }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User</h3>
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
              <LocationSelector onSelect={handleLocationSelect} errors={{}} />
            </div>

            <div className="info-note">
              <strong>Note:</strong> User registered on{' '}
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
