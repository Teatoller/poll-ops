// src/components/admin/Settings.tsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import '../../styles/adminSettings.css';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('voting');
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to default?')) {
      return;
    }
    
    try {
      setLoading(true);
      await adminAPI.resetSettings();
      await fetchSettings();
      alert('Settings reset to default successfully!');
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      alert(error.message || 'Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    const email = prompt('Enter email address to test:');
    if (!email) return;

    try {
      setTestingEmail(true);
      await adminAPI.testEmail(email);
      alert('Test email sent successfully!');
    } catch (error: any) {
      console.error('Error testing email:', error);
      alert(error.message || 'Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSMS = async () => {
    const phone = prompt('Enter phone number to test:');
    if (!phone) return;

    try {
      setTestingSMS(true);
      await adminAPI.testSMS(phone);
      alert('Test SMS sent successfully!');
    } catch (error: any) {
      console.error('Error testing SMS:', error);
      alert(error.message || 'Failed to send test SMS');
    } finally {
      setTestingSMS(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!settings.api?.webhookUrl) {
      alert('Please enter a webhook URL first');
      return;
    }

    try {
      setTestingWebhook(true);
      await adminAPI.testWebhook(settings.api.webhookUrl);
      alert('Test webhook sent successfully!');
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      alert(error.message || 'Failed to send test webhook');
    } finally {
      setTestingWebhook(false);
    }
  };

  const tabs = [
    { id: 'voting', label: 'Voting', icon: '🗳️' },
    { id: 'registration', label: 'Registration', icon: '📝' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'sms', label: 'SMS', icon: '📱' },
    { id: 'api', label: 'API', icon: '🔌' },
  ];

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>System Settings</h2>
        <div className="settings-actions">
          <button onClick={handleReset} className="btn-secondary">
            Reset to Default
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'voting' && (
          <div className="settings-section">
            <h3>Voting Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.voting?.allowSameDayRegistration || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      voting: { ...settings.voting, allowSameDayRegistration: e.target.checked }
                    })}
                  />
                  Allow same-day registration
                </label>
                <p className="setting-description">
                  Users can register and vote on the same day
                </p>
              </div>

              <div className="setting-item">
                <label>Voting Hours Start</label>
                <input
                  type="time"
                  value={settings.voting?.votingHoursStart || '08:00'}
                  onChange={(e) => setSettings({
                    ...settings,
                    voting: { ...settings.voting, votingHoursStart: e.target.value }
                  })}
                />
              </div>

              <div className="setting-item">
                <label>Voting Hours End</label>
                <input
                  type="time"
                  value={settings.voting?.votingHoursEnd || '17:00'}
                  onChange={(e) => setSettings({
                    ...settings,
                    voting: { ...settings.voting, votingHoursEnd: e.target.value }
                  })}
                />
              </div>

              <div className="setting-item">
                <label>Max Votes Per User</label>
                <select
                  value={settings.voting?.maxVotesPerUser || 1}
                  onChange={(e) => setSettings({
                    ...settings,
                    voting: { ...settings.voting, maxVotesPerUser: parseInt(e.target.value) }
                  })}
                >
                  <option value="1">1 vote per poll</option>
                  <option value="2">2 votes per poll</option>
                  <option value="3">3 votes per poll</option>
                  <option value="0">Unlimited (not recommended)</option>
                </select>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.voting?.allowVoteEditing || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      voting: { ...settings.voting, allowVoteEditing: e.target.checked }
                    })}
                  />
                  Allow vote editing
                </label>
                <p className="setting-description">
                  Users can change their vote before deadline
                </p>
              </div>

              {settings.voting?.allowVoteEditing && (
                <div className="setting-item">
                  <label>Vote Editing Deadline (hours before poll ends)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.voting?.voteEditingDeadline || 24}
                    onChange={(e) => setSettings({
                      ...settings,
                      voting: { ...settings.voting, voteEditingDeadline: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="settings-section">
            <h3>Registration Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.registration?.requireEmailVerification || true}
                    onChange={(e) => setSettings({
                      ...settings,
                      registration: { ...settings.registration, requireEmailVerification: e.target.checked }
                    })}
                  />
                  Require email verification
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.registration?.requirePhoneVerification || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      registration: { ...settings.registration, requirePhoneVerification: e.target.checked }
                    })}
                  />
                  Require phone verification
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.registration?.requireNationalId || true}
                    onChange={(e) => setSettings({
                      ...settings,
                      registration: { ...settings.registration, requireNationalId: e.target.checked }
                    })}
                  />
                  Require National ID
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.registration?.allowMultipleRegistrations || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      registration: { ...settings.registration, allowMultipleRegistrations: e.target.checked }
                    })}
                  />
                  Allow multiple registrations per National ID
                </label>
                <p className="setting-description">
                  Warning: Enabling this may allow duplicate voting
                </p>
              </div>

              <div className="setting-item">
                <label>Registration Deadline (hours before poll starts)</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={settings.registration?.registrationDeadline || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    registration: { ...settings.registration, registrationDeadline: parseInt(e.target.value) }
                  })}
                />
                <p className="setting-description">
                  0 = No deadline (register anytime)
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="settings-section">
            <h3>Email Configuration</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Email Service</label>
                <select
                  value={settings.email?.service || 'smtp'}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, service: e.target.value }
                  })}
                >
                  <option value="smtp">SMTP</option>
                  <option value="gmail">Gmail</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="mock">Mock (Development)</option>
                </select>
              </div>

              {settings.email?.service !== 'mock' && (
                <>
                  <div className="setting-item">
                    <label>SMTP Host</label>
                    <input
                      type="text"
                      value={settings.email?.host || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, host: e.target.value }
                      })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="setting-item">
                    <label>SMTP Port</label>
                    <input
                      type="number"
                      value={settings.email?.port || 587}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, port: parseInt(e.target.value) }
                      })}
                    />
                  </div>

                  <div className="setting-item">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={settings.email?.user || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, user: e.target.value }
                      })}
                      placeholder="noreply@yourapp.com"
                    />
                  </div>

                  <div className="setting-item">
                    <label>Password/API Key</label>
                    <input
                      type="password"
                      value={settings.email?.pass || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, pass: e.target.value }
                      })}
                      placeholder="Your email password or API key"
                    />
                  </div>

                  <div className="setting-item">
                    <label>From Name</label>
                    <input
                      type="text"
                      value={settings.email?.fromName || 'Polling App'}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, fromName: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}

              <div className="setting-item">
                <label>Test Email Configuration</label>
                <button
                  onClick={handleTestEmail}
                  className="btn-secondary"
                  disabled={testingEmail}
                >
                  {testingEmail ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="settings-section">
            <h3>API & Integration Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>API Base URL</label>
                <input
                  type="text"
                  value={settings.api?.baseUrl || window.location.origin}
                  readOnly
                  className="readonly"
                />
                <p className="setting-description">
                  Your API endpoint for external integrations
                </p>
              </div>

              <div className="setting-item">
                <label>Enable API Access</label>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.api?.enabled || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      api: { ...settings.api, enabled: e.target.checked }
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <p className="setting-description">
                  Allow external applications to access your API
                </p>
              </div>

              {settings.api?.enabled && (
                <>
                  <div className="setting-item">
                    <label>API Rate Limit (requests per minute)</label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={settings.api?.rateLimit || 100}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, rateLimit: parseInt(e.target.value) }
                      })}
                    />
                  </div>

                  <div className="setting-item">
                    <label>Generate New API Key</label>
                    <button
                      onClick={() => {
                        const newKey = `sk_${Math.random().toString(36).substring(2)}_${Date.now()}`;
                        setSettings({
                          ...settings,
                          api: { ...settings.api, apiKey: newKey }
                        });
                      }}
                      className="btn-secondary"
                    >
                      Generate Key
                    </button>
                  </div>

                  {settings.api?.apiKey && (
                    <div className="setting-item">
                      <label>Current API Key</label>
                      <div className="api-key-display">
                        <code>{settings.api.apiKey}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(settings.api.apiKey)}
                          className="btn-copy"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="setting-warning">
                        ⚠️ Keep this key secret. It provides full access to your API.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="setting-item">
                <label>Webhook URL</label>
                <input
                  type="url"
                  value={settings.api?.webhookUrl || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    api: { ...settings.api, webhookUrl: e.target.value }
                  })}
                  placeholder="https://your-webhook.com/endpoint"
                />
                <p className="setting-description">
                  Receive real-time notifications for votes, registrations, etc.
                </p>
              </div>

              <div className="setting-item">
                <label>Test Webhook</label>
                <button
                  onClick={handleTestWebhook}
                  disabled={!settings.api?.webhookUrl || testingWebhook}
                  className="btn-secondary"
                >
                  {testingWebhook ? 'Testing...' : 'Send Test Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add other tabs similarly... */}
      </div>
    </div>
  );
};

export default AdminSettings;