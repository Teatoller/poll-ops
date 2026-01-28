// src/components/admin/AdminsManagement.tsx
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminItem {
  id: number;
  email: string;
  role: string;
}

const ROLE_OPTIONS = ['superadmin', 'admin', 'editor', 'viewer'] as const;

const AdminsManagement: React.FC = () => {
  const { can } = useAdmin();
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Create form state
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('viewer');
  const [creating, setCreating] = useState<boolean>(false);

  // Edit inline state
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('viewer');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (can('manageAdmins')) {
      fetchAdmins();
    }
  }, [can]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewEmail('');
    setNewPassword('');
    setNewRole('viewer');
  };

  const handleCreateAdmin = async () => {
    if (!can('manageAdmins')) {
      alert("You don't have permission to create admins.");
      return;
    }
    if (!newEmail || !newPassword) {
      alert('Email and password are required');
      return;
    }
    try {
      setCreating(true);
      setError('');
      await adminAPI.createAdmin({ email: newEmail, password: newPassword, role: newRole });
      resetCreateForm();
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (adm: AdminItem) => {
    setEditRow(adm.id);
    setEditEmail(adm.email);
    setEditRole(adm.role);
  };

  const cancelEdit = () => {
    setEditRow(null);
    setEditEmail('');
    setEditRole('viewer');
  };

  const saveEdit = async (id: number) => {
    if (!can('manageAdmins')) {
      alert("You don't have permission to update admins.");
      return;
    }
    try {
      setSaving(true);
      setError('');
      await adminAPI.updateAdmin(id, { email: editEmail, role: editRole });
      cancelEdit();
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const deleteAdmin = async (id: number) => {
    if (!can('manageAdmins')) {
      alert("You don't have permission to delete admins.");
      return;
    }
    if (!globalThis.confirm('Delete this admin?')) return;
    try {
      setError('');
      await adminAPI.deleteAdmin(id);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin');
    }
  };

  if (!can('manageAdmins')) {
    return (
      <div className="admin-management">
        <div className="page-header">
          <h2>Admin Management</h2>
        </div>
        <div className="alert alert-error">You don't have permission to manage admins.</div>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <h2>Admin Management</h2>
        <p>Create, update, and remove admin accounts.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="create-admin-card">
        <h3>Create New Admin</h3>
        <div className="form-row">
          <label htmlFor="newEmail">Email</label>
          <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="form-row">
          <label htmlFor="newPassword">Password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter password" />
        </div>
        <div className="form-row">
          <label htmlFor="newRole">Role</label>
          <select id="newRole" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {ROLE_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button onClick={handleCreateAdmin} disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </div>

      <div className="admins-table-container">
        {loading ? (
          <div className="loading">Loading admins…</div>
        ) : (
          <table className="admins-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(adm => (
                <tr key={adm.id}>
                  <td>#{adm.id}</td>
                  <td>
                    {editRow === adm.id ? (
                      <input
                        type="email"
                        value={editEmail}
                        placeholder="email"
                        onChange={(e) => setEditEmail(e.target.value)}
                        title="Edit email"
                        aria-label="Edit admin email"
                      />
                    ) : (
                      adm.email
                    )}
                  </td>
                  <td>
                    {editRow === adm.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        title="Edit role"
                        aria-label="Edit admin role"
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      adm.role
                    )}
                  </td>
                  <td>
                    {editRow === adm.id ? (
                      <>
                        <button className="btn-action btn-save" onClick={() => saveEdit(adm.id)} disabled={saving}>Save</button>
                        <button className="btn-action btn-cancel" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-action btn-edit" onClick={() => startEdit(adm)}>Edit</button>
                        <button className="btn-action btn-delete" onClick={() => deleteAdmin(adm.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="no-data">No admins found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminsManagement;
