import React, { useState } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { useReportDownload } from '../../hooks/useReportDownload';
import PageTitleBar from '../../components/common/PageTitleBar';
import NotificationBanner from '../../components/common/NotificationBanner';
import './ReportsPage.css';

const ReportsPage: React.FC = () => {
    const { filter } = useGlobalFilter();
    const { downloadReport, isGenerating, error } = useReportDownload();
    const [reportType] = useState('water-quality');
    const [dateRange, setDateRange] = useState('24h');

    const handleDownloadReport = async (format: 'pdf' | 'excel' | 'csv-compliance' | 'csv-alerts') => {
        await downloadReport({
            type: reportType,
            state: filter.state || undefined,
            district: filter.district || undefined,
            city: filter.city || undefined,
            village: filter.village || undefined,
            range: dateRange,
            format,
            useGovernmentFormat: true
        });
    };

    const getRegionText = () => {
        const parts = [filter.state, filter.district, filter.city, filter.village].filter(Boolean);
        return parts.length > 0 ? parts.join(' → ') : 'All Regions';
    };

    return (
        <div className="reports-page">
            <NotificationBanner 
                message="Reports are generated based on current filter selection and date range"
                severity="info"
                dismissible={false}
            />

            <PageTitleBar 
                title="Reports and Downloads"
                subtitle="Generate government-standard water quality and compliance reports"
                breadcrumbs={['India', 'Reports', getRegionText()]}
            />

            <div className="reports-content">
                {/* Date Range Selection */}
                <div className="report-controls">
                    <div className="control-group">
                        <label htmlFor="dateRange">Report Period:</label>
                        <select 
                            id="dateRange" 
                            value={dateRange} 
                            onChange={(e) => setDateRange(e.target.value)}
                            disabled={isGenerating}
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>
                    <div className="control-info">
                        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px', marginRight: '4px' }}>
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        <span>Current Region: {getRegionText()}</span>
                    </div>
                </div>

                {/* Government Standard Reports */}
                <div className="report-section">
                    <h2 className="section-title">Government Standard Reports</h2>
                    <p className="section-description">BIS IS 10500:2012 compliant reports with bilingual headers and QR codes</p>
                    
                    <div className="reports-grid">
                        <div className="report-card">
                            <div className="card-icon">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <h3>Water Quality Assessment Report</h3>
                            <p>Comprehensive PDF report with executive summary, compliance overview, parameter-level results, trends, alerts, and recommendations</p>
                            <div className="report-features">
                                <span>✓ Bilingual (Hindi/English)</span>
                                <span>✓ BIS 10500:2012 Standards</span>
                                <span>✓ QR Code Verification</span>
                                <span>✓ Government Emblem</span>
                            </div>
                            <button 
                                className="download-btn primary" 
                                onClick={() => handleDownloadReport('pdf')} 
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Download PDF Report'}
                            </button>
                        </div>

                        <div className="report-card">
                            <div className="card-icon">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <h3>Excel Workbook Report</h3>
                            <p>Multi-sheet Excel workbook with summary, compliance overview, parameter details, and alerts tables</p>
                            <div className="report-features">
                                <span>✓ Multiple Sheets</span>
                                <span>✓ Formatted Tables</span>
                                <span>✓ Easy Data Analysis</span>
                                <span>✓ Pivot-Ready</span>
                            </div>
                            <button 
                                className="download-btn secondary" 
                                onClick={() => handleDownloadReport('excel')} 
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Download Excel Report'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Exports */}
                <div className="report-section">
                    <h2 className="section-title">Data Exports</h2>
                    <p className="section-description">Export specific data tables in CSV format for analysis</p>
                    
                    <div className="reports-grid">
                        <div className="report-card compact">
                            <div className="card-icon small">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <h3>Compliance Data (CSV)</h3>
                            <p>Source-wise compliance status with all parameters</p>
                            <button 
                                className="download-btn tertiary" 
                                onClick={() => handleDownloadReport('csv-compliance')} 
                                disabled={isGenerating}
                            >
                                Export CSV
                            </button>
                        </div>

                        <div className="report-card compact">
                            <div className="card-icon small">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <h3>Water Safety Incidents (CSV)</h3>
                            <p>Complete alert history with timestamps and status</p>
                            <button 
                                className="download-btn tertiary" 
                                onClick={() => handleDownloadReport('csv-alerts')} 
                                disabled={isGenerating}
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Information */}
                <div className="report-info-section">
                    <h3>Report Information</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <strong>File Naming Convention:</strong>
                            <code>ArogyaJal_Report_&lt;Region&gt;_&lt;YYYY-MM-DD&gt;_&lt;HHMM&gt;.pdf</code>
                        </div>
                        <div className="info-item">
                            <strong>Standards Reference:</strong>
                            <span>BIS IS 10500:2012 - Drinking Water Specification</span>
                        </div>
                        <div className="info-item">
                            <strong>Report Version:</strong>
                            <span>1.2.1</span>
                        </div>
                        <div className="info-item">
                            <strong>Language:</strong>
                            <span>Bilingual (Hindi | English)</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
