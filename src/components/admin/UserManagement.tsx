// src/components/admin/UserManagement.tsx - Updated
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// import type { User } from '../../types';

interface UserManagementProps {
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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserManagementProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use the updated api.getUsers() which returns User[]
      const usersData = await api.getUsers();
      
      // Transform the data to match the UserManagementProps interface
      const transformedUsers: UserManagementProps[] = usersData.map((user: any) => ({
        id: user.id,
        email: user.email,
        nationalId: user.nationalId || user.national_id || '',
        phone: user.phone,
        county: user.county,
        division: user.division || '',
        pollingStation: user.pollingStation || user.polling_station || '',
        isEmailVerified: user.isEmailVerified || user.is_email_verified || false,
        isPhoneVerified: user.isPhoneVerified || user.is_phone_verified || false,
        createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        voteCount: user.voteCount || user.vote_count || 0
      }));
      
      setUsers(transformedUsers);
      setTotalUsers(transformedUsers.length);
      setTotalPages(Math.ceil(transformedUsers.length / 20));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nationalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.pollingStation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteUsers = async () => {
    if (window.confirm(`Delete ${selectedUsers.length} selected users?`)) {
      try {
        await api.deleteUsers(selectedUsers);
        fetchUsers();
        setSelectedUsers([]);
      } catch (error: any) {
        alert(`Error: ${error.message || 'Failed to delete users'}`);
        console.error('Error deleting users:', error);
      }
    }
  };

  const handleExportUsers = () => {
    const csvContent = [
      ['ID', 'Email', 'National ID', 'Phone', 'County', 'Division', 'Polling Station', 'Email Verified', 'Phone Verified', 'Created At', 'Votes'],
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.nationalId,
        user.phone || '',
        user.county,
        user.division,
        user.pollingStation,
        user.isEmailVerified ? 'Yes' : 'No',
        user.isPhoneVerified ? 'Yes' : 'No',
        new Date(user.createdAt).toLocaleDateString(),
        user.voteCount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Calculate paginated users
  const itemsPerPage = 20;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="user-management">
      <div className="page-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search users by email, national ID, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleExportUsers} className="btn-secondary">
            Export CSV
          </button>
          {selectedUsers.length > 0 && (
            <button onClick={handleDeleteUsers} className="btn-danger">
              Delete Selected ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                  disabled={paginatedUsers.length === 0}
                />
              </th>
              <th>ID</th>
              <th>Email</th>
              <th>National ID</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Verification</th>
              <th>Created</th>
              <th>Votes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>#{user.id}</td>
                <td>
                  <div className="user-email">
                    {user.email}
                    {user.isEmailVerified && <span className="verified-badge">✓</span>}
                  </div>
                </td>
                <td>{user.nationalId}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>
                  <div className="user-location">
                    <span>{user.county}</span>
                    <span className="location-detail">{user.division}, {user.pollingStation}</span>
                  </div>
                </td>
                <td>
                  <div className="verification-status">
                    <span className={`status ${user.isEmailVerified ? 'verified' : 'pending'}`}>
                      Email: {user.isEmailVerified ? '✓' : '✗'}
                    </span>
                    <span className={`status ${user.isPhoneVerified ? 'verified' : 'pending'}`}>
                      Phone: {user.isPhoneVerified ? '✓' : '✗'}
                    </span>
                  </div>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.voteCount}</td>
                <td>
                  <button className="btn-action btn-view">View</button>
                  <button className="btn-action btn-edit">Edit</button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={10} className="no-data">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-info">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>
        </div>
        <div className="pagination-buttons">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            Previous
          </button>
          <span className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn-pagination ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;