import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import PageTitleBar from '../../components/common/PageTitleBar';
import NotificationBanner from '../../components/common/NotificationBanner';
import './SymptomReportsPage.css';

interface SymptomReport {
    id: string;
    userId: string;
    location: string;
    geoLocation?: {
        latitude: number;
        longitude: number;
    };
    waterSource?: string;
    reporterType?: string;
    reporterId?: string;
    patientName?: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone?: string;
    symptoms: string[];
    severity: string;
    duration?: string;
    waterConsumption?: number;
    additionalNotes?: string;
    contactInfo?: string;
    reportedAt?: {
        seconds: number;
        nanos: number;
    };
    status: string;
    investigationNotes?: string;
}

const SymptomReportsPage: React.FC = () => {
    const { filter } = useGlobalFilter();
    const [reports, setReports] = useState<SymptomReport[]>([]);
    const [filteredReports, setFilteredReports] = useState<SymptomReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<SymptomReport | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

    // Fetch all symptom reports
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/symptoms/reports`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched symptom reports:', data);
                
                // Handle both array and object responses
                if (Array.isArray(data)) {
                    // Ensure symptoms is always an array
                    const normalizedData = data.map(report => ({
                        ...report,
                        symptoms: Array.isArray(report.symptoms) 
                            ? report.symptoms 
                            : typeof report.symptoms === 'string' 
                                ? [report.symptoms] 
                                : []
                    }));
                    setReports(normalizedData);
                } else if (data && typeof data === 'object') {
                    const reportsArray = Object.values(data)
                        .filter(item => item && typeof item === 'object') as SymptomReport[];
                    // Ensure symptoms is always an array
                    const normalizedData = reportsArray.map(report => ({
                        ...report,
                        symptoms: Array.isArray(report.symptoms) 
                            ? report.symptoms 
                            : typeof report.symptoms === 'string' 
                                ? [report.symptoms] 
                                : []
                    }));
                    setReports(normalizedData);
                } else {
                    setReports([]);
                }
            } else {
                console.error('Failed to fetch symptom reports:', response.status);
                setReports([]);
            }
        } catch (error) {
            console.error('Error fetching symptom reports:', error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Apply global filter and local filters
    useEffect(() => {
        let filtered = [...reports];

        // Apply global location filter
        if (filter.state) {
            filtered = filtered.filter(report => 
                report.location?.toLowerCase().includes(filter.state!.toLowerCase())
            );
        }
        if (filter.district) {
            filtered = filtered.filter(report => 
                report.location?.toLowerCase().includes(filter.district!.toLowerCase())
            );
        }
        if (filter.city) {
            filtered = filtered.filter(report => 
                report.location?.toLowerCase().includes(filter.city!.toLowerCase())
            );
        }
        if (filter.village) {
            filtered = filtered.filter(report => 
                report.location?.toLowerCase().includes(filter.village!.toLowerCase())
            );
        }

        // Apply status filter
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(report => report.status === filterStatus);
        }

        // Apply severity filter
        if (filterSeverity !== 'ALL') {
            filtered = filtered.filter(report => report.severity === filterSeverity);
        }

        setFilteredReports(filtered);
    }, [reports, filter, filterStatus, filterSeverity]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Format timestamp
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        
        try {
            if (timestamp.seconds !== undefined) {
                const date = new Date(timestamp.seconds * 1000);
                return date.toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Error formatting date:', error);
        }
        
        return 'N/A';
    };

    // Calculate statistics
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'PENDING').length,
        investigated: reports.filter(r => r.status === 'INVESTIGATED').length,
        resolved: reports.filter(r => r.status === 'RESOLVED').length,
        severe: reports.filter(r => r.severity === 'SEVERE').length,
        moderate: reports.filter(r => r.severity === 'MODERATE').length,
        mild: reports.filter(r => r.severity === 'MILD').length
    };

    const hasCriticalReports = stats.severe > 0 || stats.pending > 5;

    return (
        <div className="symptom-reports-page">
            {/* Notification Banner */}
            {hasCriticalReports && (
                <NotificationBanner 
                    message={`${stats.severe} severe ${stats.severe === 1 ? 'case' : 'cases'} and ${stats.pending} pending ${stats.pending === 1 ? 'report' : 'reports'} require attention`}
                    severity="warning"
                    actionText="View Details"
                    actionLink="#reports-table"
                />
            )}

            {/* Page Title */}
            <PageTitleBar 
                title="Symptom Reports Management"
                subtitle="Comprehensive tracking and management of waterborne disease symptom reports"
                breadcrumbs={['India', 'North East', filter.state || 'All Regions', 'Symptom Reports']}
            />

            {/* Statistics Cards */}
            <div className="kpi-metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Total Reports</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{stats.total}</div>
                        <div className="metric-unit">reports</div>
                    </div>
                    <div className="metric-status good"></div>
                    <div className="metric-description">All symptom reports submitted</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Pending Investigation</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{stats.pending}</div>
                        <div className="metric-unit">reports</div>
                    </div>
                    <div className={`metric-status ${stats.pending > 5 ? 'critical' : 'warning'}`}></div>
                    <div className="metric-description">Awaiting investigation</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Severe Cases</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{stats.severe}</div>
                        <div className="metric-unit">cases</div>
                    </div>
                    <div className={`metric-status ${stats.severe === 0 ? 'good' : 'critical'}`}></div>
                    <div className="metric-description">High priority cases</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Resolved Cases</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{stats.resolved}</div>
                        <div className="metric-unit">cases</div>
                    </div>
                    <div className="metric-status good"></div>
                    <div className="metric-description">Successfully resolved</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Status:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="INVESTIGATED">Investigated</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Severity:</label>
                    <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
                        <option value="ALL">All Severity</option>
                        <option value="SEVERE">Severe</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="MILD">Mild</option>
                    </select>
                </div>
            </div>

            {/* Reports Table */}
            <div className="analysis-card" id="reports-table">
                <div className="card-header">
                    <h2 className="card-title">Symptom Reports ({filteredReports.length})</h2>
                    <p className="card-description">Detailed list of all symptom reports with patient information and investigation status</p>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading symptom reports...</div>
                    ) : (
                        <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Report ID</th>
                                    <th>Location</th>
                                    <th>Patient Info</th>
                                    <th>Symptoms</th>
                                    <th>Severity</th>
                                    <th>Water Source</th>
                                    <th>Reporter</th>
                                    <th>Reported At</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report, index) => (
                                        <tr key={report.id}>
                                            <td>{index + 1}</td>
                                            <td className="report-id-cell">{report.id?.substring(0, 8) || 'N/A'}</td>
                                            <td>{report.location || 'Unknown'}</td>
                                            <td>
                                                <div className="patient-info">
                                                    <div>{report.patientName || 'N/A'}</div>
                                                    <div className="patient-details">
                                                        {report.patientAge && `${report.patientAge}y`}
                                                        {report.patientAge && report.patientGender && ', '}
                                                        {report.patientGender}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="symptoms-list">
                                                    {Array.isArray(report.symptoms) ? (
                                                        <>
                                                            {report.symptoms.slice(0, 3).map(s => 
                                                                s.charAt(0) + s.slice(1).toLowerCase()
                                                            ).join(', ')}
                                                            {report.symptoms.length > 3 && ` +${report.symptoms.length - 3} more`}
                                                        </>
                                                    ) : (
                                                        typeof report.symptoms === 'string' ? report.symptoms : 'N/A'
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`severity-badge ${report.severity?.toLowerCase()}`}>
                                                    {report.severity}
                                                </span>
                                            </td>
                                            <td>{report.waterSource || 'N/A'}</td>
                                            <td>
                                                <div className="reporter-info">
                                                    <div>{report.reporterType || 'N/A'}</div>
                                                    {report.reporterId && (
                                                        <div className="reporter-id">{report.reporterId}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{formatDate(report.reportedAt)}</td>
                                            <td>
                                                <span className={`status-badge ${
                                                    report.status === 'RESOLVED' ? 'active' : 
                                                    report.status === 'INVESTIGATED' ? '' : 'inactive'
                                                }`}>
                                                    {report.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="view-btn"
                                                    onClick={() => setSelectedReport(report)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} style={{ textAlign: 'center', padding: '2rem' }}>
                                            No symptom reports found. Adjust filters to see more results.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal for Report Details */}
            {selectedReport && (
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Symptom Report Details</h2>
                            <button className="close-btn" onClick={() => setSelectedReport(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>Patient Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Name:</span>
                                        <span className="detail-value">{selectedReport.patientName || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Age:</span>
                                        <span className="detail-value">{selectedReport.patientAge || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Gender:</span>
                                        <span className="detail-value">{selectedReport.patientGender || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{selectedReport.patientPhone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Location & Water Source</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Location:</span>
                                        <span className="detail-value">{selectedReport.location}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Coordinates:</span>
                                        <span className="detail-value">
                                            {selectedReport.geoLocation ? 
                                                `${selectedReport.geoLocation.latitude}, ${selectedReport.geoLocation.longitude}` : 
                                                'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Water Source:</span>
                                        <span className="detail-value">{selectedReport.waterSource || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Water Consumption:</span>
                                        <span className="detail-value">
                                            {selectedReport.waterConsumption ? `${selectedReport.waterConsumption} L/day` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Symptoms & Severity</h3>
                                <div className="detail-grid">
                                    <div className="detail-item full-width">
                                        <span className="detail-label">Symptoms:</span>
                                        <span className="detail-value">
                                            {Array.isArray(selectedReport.symptoms) ? (
                                                selectedReport.symptoms.map(s => 
                                                    s.charAt(0) + s.slice(1).toLowerCase()
                                                ).join(', ')
                                            ) : (
                                                typeof selectedReport.symptoms === 'string' ? 
                                                    selectedReport.symptoms : 'N/A'
                                            )}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Severity:</span>
                                        <span className={`severity-badge ${selectedReport.severity?.toLowerCase()}`}>
                                            {selectedReport.severity}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Duration:</span>
                                        <span className="detail-value">{selectedReport.duration || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Reporter Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Reporter Type:</span>
                                        <span className="detail-value">{selectedReport.reporterType || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Reporter ID:</span>
                                        <span className="detail-value">{selectedReport.reporterId || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Contact:</span>
                                        <span className="detail-value">{selectedReport.contactInfo || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Reported At:</span>
                                        <span className="detail-value">{formatDate(selectedReport.reportedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedReport.additionalNotes && (
                                <div className="detail-section">
                                    <h3>Additional Notes</h3>
                                    <p className="notes-text">{selectedReport.additionalNotes}</p>
                                </div>
                            )}

                            <div className="detail-section">
                                <h3>Investigation Status</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Status:</span>
                                        <span className={`status-badge ${
                                            selectedReport.status === 'RESOLVED' ? 'active' : 
                                            selectedReport.status === 'INVESTIGATED' ? '' : 'inactive'
                                        }`}>
                                            {selectedReport.status || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                                {selectedReport.investigationNotes && (
                                    <p className="notes-text">{selectedReport.investigationNotes}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SymptomReportsPage;
