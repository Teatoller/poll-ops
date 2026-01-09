// src/components/admin/ReportsExport.tsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

import '../../styles/reportsExport.css';

interface ExportRecord {
  id: number;
  type: string;
  format: string;
  filename: string;
  timestamp: string;
  exportedBy: string;
}

interface Poll {
  id: number;
  officeName?: string;
  office_name?: string;
}

const ReportsExport = () => {
  const [exportType, setExportType] = useState('votes');
  const [format, setFormat] = useState('csv');
  const [selectedPoll, setSelectedPoll] = useState(''); 
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [includeInactive, setIncludeInactive] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recentExports, setRecentExports] = useState<ExportRecord[]>([]);
  
  const { admin } = useAuth();

  useEffect(() => {
    fetchPolls();
    fetchRecentExports();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPolls();
      setPolls(response || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setPolls([]);
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
      
      const params: any = {
        format,
        includeInactive
      };
      
      if (exportType === 'votes' && selectedPoll) {
        params.pollId = parseInt(selectedPoll);
      }
      
      if (dateRange.start) {
        params.startDate = dateRange.start;
      }
      
      if (dateRange.end) {
        params.endDate = dateRange.end;
      }

      const response = await adminAPI.exportData(
        exportType as 'users' | 'votes' | 'polls',
        params
      );
      
      // Handle the response properly - it returns an object with blob, contentType, filename
      let blob: Blob;
      let filename: string;
      
      if (response && typeof response === 'object' && 'blob' in response) {
        blob = response.blob;
        filename = response.filename || `${exportType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      } else {
        // Fallback if response is already text
        blob = new Blob([typeof response === 'string' ? response : JSON.stringify(response)], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        filename = `${exportType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      }
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      
      // Save to recent exports
      const exportRecord = {
        id: Date.now(),
        type: exportType,
        format,
        filename,
        timestamp: new Date().toISOString(),
        exportedBy: admin?.email || 'Admin'
      };
      
      const updatedExports = [exportRecord, ...recentExports].slice(0, 10);
      setRecentExports(updatedExports);
      localStorage.setItem('recentExports', JSON.stringify(updatedExports));
      
      alert('Export completed successfully!');
      
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(error.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const previewData = async () => {
    try {
      setLoading(true);
      
      let data: any[] = [];
      
      switch (exportType) {
        case 'users': {
          const usersResponse = await adminAPI.getUsers();
          data = usersResponse.users.slice(0, 10);
          break;
        }
        case 'votes': {
          alert('Vote preview is not available. Please export the data to view it.');
          setLoading(false);
          return;
        }
        case 'polls': {
          const pollsResponse = await adminAPI.getPolls();
          data = pollsResponse.slice(0, 10);
          break;
        }
        default:
          data = [];
      }
      
      // Display preview in modal or new window
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>Data Preview</title>
              <style>
                body { font-family: monospace; padding: 20px; background: #f5f5f5; }
                pre { background: white; padding: 20px; border-radius: 8px; overflow: auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h2 { color: #333; }
              </style>
            </head>
            <body>
              <h2>${exportType.toUpperCase()} Data Preview (First 10 records)</h2>
              <pre>${JSON.stringify(data, null, 2)}</pre>
            </body>
          </html>
        `);
        previewWindow.document.close();
      } else {
        alert('Please allow pop-ups to preview data');
      }
      
    } catch (error: any) {
      console.error('Preview failed:', error);
      alert(error.message || 'Preview failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      users: `email,firstName,lastName,nationalId,countyId,countyName,subCountyId,subCountyName,wardId,wardName,pollingStation,isEmailVerified,createdAt`,
      votes: `userId,pollId,candidateId,countyName,createdAt`,
      polls: `officeName,description,startDate,endDate,isActive,createdAt`
    };
    
    const template = templates[type] || '';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_import_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
                  disabled={loading}
                >
                  <option value="">All Polls</option>
                  {Array.isArray(polls) && polls.map((poll: any) => (
                    <option key={poll.id} value={poll.id}>
                      {poll.officeName || poll.office_name} ({poll.id})
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