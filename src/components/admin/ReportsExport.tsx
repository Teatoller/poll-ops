// src/components/admin/ReportsExport.tsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
// import '../reportsExport.css';
import '../../styles/reportsExport.css';

const ReportsExport = () => {
  const [exportType, setExportType] = useState('votes');
  const [format, setFormat] = useState('csv');
  const [selectedPoll, setSelectedPoll] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [includeInactive, setIncludeInactive] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recentExports, setRecentExports] = useState([]);
  
  const { admin } = useAuth();

  useEffect(() => {
    fetchPolls();
    fetchRecentExports();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPolls();
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExports = async () => {
    try {
      const exports = JSON.parse(localStorage.getItem('recentExports') || '[]');
      setRecentExports(exports.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent exports:', error);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      let url = `/admin/export/${exportType}?format=${format}`;
      const params = new URLSearchParams();
      
      if (exportType === 'votes' && selectedPoll) {
        params.append('pollId', selectedPoll);
      }
      
      if (dateRange.start) {
        params.append('startDate', dateRange.start);
      }
      
      if (dateRange.end) {
        params.append('endDate', dateRange.end);
      }
      
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `&${queryString}`;
      }

      const response = await adminAPI.get(url, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${exportType}_export_${timestamp}.${format}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Save to recent exports
      const exportRecord = {
        id: Date.now(),
        type: exportType,
        format,
        filename,
        timestamp: new Date().toISOString(),
        exportedBy: admin?.email
      };
      
      const updatedExports = [exportRecord, ...recentExports].slice(0, 10);
      setRecentExports(updatedExports);
      localStorage.setItem('recentExports', JSON.stringify(updatedExports));
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const previewData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get(`/admin/export/${exportType}?format=json`);
      
      // Display preview in modal or new window
      const previewWindow = window.open('', '_blank');
      previewWindow.document.write(`
        <html>
          <head>
            <title>Data Preview</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h2>${exportType.toUpperCase()} Data Preview (First 10 records)</h2>
            <pre>${JSON.stringify(response.data.slice(0, 10), null, 2)}</pre>
          </body>
        </html>
      `);
      previewWindow.document.close();
      
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type) => {
    const templates = {
      users: `email,first_name,last_name,national_id,county,is_email_verified,created_at`,
      votes: `user_id,poll_id,candidate_id,county,created_at`,
      polls: `office_name,description,start_date,end_date,is_active,created_at`
    };
    
    const template = templates[type] || '';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_import_template.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-export-container">
      <div className="export-header">
        <h1>Reports & Data Export</h1>
        <p className="export-subtitle">Export election data in various formats for analysis and reporting</p>
      </div>

      <div className="export-grid">
        <div className="export-controls">
          <div className="export-card">
            <h2>Export Configuration</h2>
            
            <div className="form-group">
              <label>Data Type</label>
              <div className="type-selector">
                {['votes', 'users', 'polls'].map((type) => (
                  <button
                    key={type}
                    className={`type-btn ${exportType === type ? 'active' : ''}`}
                    onClick={() => setExportType(type)}
                  >
                    <i className={`fas fa-${type === 'votes' ? 'vote-yea' : type === 'users' ? 'users' : 'poll'}`}></i>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Export Format</label>
              <div className="format-selector">
                {['csv', 'json'].map((fmt) => (
                  <button
                    key={fmt}
                    className={`format-btn ${format === fmt ? 'active' : ''}`}
                    onClick={() => setFormat(fmt)}
                  >
                    <i className={`fas fa-file-${fmt === 'csv' ? 'csv' : 'code'}`}></i>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {exportType === 'votes' && (
              <div className="form-group">
                <label>Specific Poll (Optional)</label>
                <select 
                  value={selectedPoll}
                  onChange={(e) => setSelectedPoll(e.target.value)}
                  className="poll-select"
                >
                  <option value="">All Polls</option>
                  {polls.map(poll => (
                    <option key={poll.id} value={poll.id}>
                      {poll.office_name} ({poll.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Date Range (Optional)</label>
              <div className="date-range">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  placeholder="Start Date"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />
                <span>Include Inactive/Archived Records</span>
              </label>
            </div>

            <div className="export-actions">
              <button
                onClick={previewData}
                disabled={loading || exporting}
                className="btn btn-secondary"
              >
                <i className="fas fa-eye"></i>
                Preview Data
              </button>
              
              <button
                onClick={() => downloadTemplate(exportType)}
                className="btn btn-outline"
              >
                <i className="fas fa-download"></i>
                Download Template
              </button>
              
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn btn-primary btn-export"
              >
                {exporting ? (
                  <>
                    <span className="spinner"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-export"></i>
                    Export Data
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="export-info">
            <h3>Export Information</h3>
            <ul>
              <li><strong>CSV Format:</strong> Best for spreadsheet applications (Excel, Google Sheets)</li>
              <li><strong>JSON Format:</strong> Best for programming and data analysis</li>
              <li><strong>Data Includes:</strong> All relevant metadata and timestamps</li>
              <li><strong>Export Limit:</strong> No limit on records, but large exports may take longer</li>
            </ul>
          </div>
        </div>

        <div className="export-history">
          <div className="history-card">
            <h2>Recent Exports</h2>
            {recentExports.length > 0 ? (
              <div className="exports-list">
                {recentExports.map(exp => (
                  <div key={exp.id} className="export-item">
                    <div className="export-item-header">
                      <span className="export-type-badge">{exp.type}</span>
                      <span className="export-format">{exp.format}</span>
                      <span className="export-date">
                        {new Date(exp.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="export-item-body">
                      <p className="export-filename">{exp.filename}</p>
                      <p className="export-meta">
                        <i className="fas fa-user"></i>
                        {exp.exportedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-file-export"></i>
                <p>No recent exports</p>
              </div>
            )}
            
            <div className="history-actions">
              <button 
                onClick={() => localStorage.removeItem('recentExports')}
                className="btn btn-clear"
              >
                Clear History
              </button>
            </div>
          </div>

          <div className="quick-export-card">
            <h3>Quick Export Templates</h3>
            <div className="quick-export-grid">
              <button 
                onClick={() => {
                  setExportType('votes');
                  setFormat('csv');
                  handleExport();
                }}
                className="quick-export-btn"
              >
                <i className="fas fa-vote-yea"></i>
                <span>Today's Votes</span>
              </button>
              
              <button 
                onClick={() => {
                  setExportType('users');
                  setFormat('csv');
                  setIncludeInactive(false);
                  handleExport();
                }}
                className="quick-export-btn"
              >
                <i className="fas fa-users"></i>
                <span>Active Users</span>
              </button>
              
              <button 
                onClick={() => {
                  setExportType('polls');
                  setFormat('json');
                  handleExport();
                }}
                className="quick-export-btn"
              >
                <i className="fas fa-poll"></i>
                <span>All Polls</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;