// src/components/admin/ViewUserModal.tsx
import React from 'react';
import '../../styles/createPollModal.css';

interface User {
  id: number;
  email: string;
  phone?: string;
  countyId?: number;
  countyName?: string;
  subCountyId?: number;
  subCountyName?: string;
  wardId?: number;
  wardName?: string;
  pollingStation?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  voteCount: number;
  voteHistory?: Array<{
    poll_id: number;
    candidate_id: number;
    voted_at: string;
  }>;
}

interface ViewUserModalProps {
  user: User;
  onClose: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ user, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <div className="user-details-grid">
            <div className="detail-section">
              <h4 className="section-title">Personal Information</h4>
              <div className="detail-row">
                <span className="detail-label">User ID:</span>
                <span className="detail-value">#{user.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {user.email}
                  {user.isEmailVerified && (
                    <span className="verified-badge-inline">✓ Verified</span>
                  )}
                </span>
              </div>
              <div className="detail-row">

                <span className="detail-label">Phone:</span>
                <span className="detail-value">
                  {user.phone || 'N/A'}
                  {user.phone && user.isPhoneVerified && (
                    <span className="verified-badge-inline">✓ Verified</span>
                  )}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Location Details</h4>
              <div className="detail-row">
                <span className="detail-label">County:</span>
                <span className="detail-value">{user.countyName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sub-County:</span>
                <span className="detail-value">{user.subCountyName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ward:</span>
                <span className="detail-value">{user.wardName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Polling Station:</span>
                <span className="detail-value">{user.pollingStation || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4 className="section-title">Activity Information</h4>
              <div className="detail-row">
                <span className="detail-label">Registered:</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Votes:</span>
                <span className="detail-value">{user.voteCount}</span>
              </div>
            </div>

            {user.voteHistory && user.voteHistory.length > 0 && (
              <div className="detail-section full-width">
                <h4 className="section-title">Voting History</h4>
                <div className="vote-history-list">
                  {user.voteHistory.map((vote, index) => (
                    <div key={index} className="vote-history-item">
                      <span>Poll #{vote.poll_id} - Candidate #{vote.candidate_id}</span>
                      <span className="vote-date">
                        {new Date(vote.voted_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
