import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageTitleBar from '../../components/common/PageTitleBar';
import NotificationBanner from '../../components/common/NotificationBanner';
import './DiseaseSurveillance.css';

interface SymptomReport {
    id: string;
    location: string;
    symptoms: string[];
    severity: string;
    reportedAt: any;
    patientAge?: number;
    patientGender?: string;
}

interface ClusterData {
    location: string;
    reportCount: number;
    severity: string;
    lastUpdated: any;
}

const DiseaseSurveillance: React.FC = () => {
    const [symptomReports, setSymptomReports] = useState<SymptomReport[]>([]);
    const [clusters, setClusters] = useState<ClusterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
            
            // Fetch symptom reports
            const reportsResponse = await axios.get(`${apiUrl}/api/symptoms`);
            const reportsData = reportsResponse.data;
            
            console.log('Raw symptom reports response:', reportsData);
            console.log('Type:', typeof reportsData, 'Is Array:', Array.isArray(reportsData));
            
            // Convert to array if it's an object
            if (Array.isArray(reportsData)) {
                console.log('Setting symptom reports as array:', reportsData.length, 'reports');
                setSymptomReports(reportsData);
            } else if (reportsData && typeof reportsData === 'object') {
                // Convert object to array (Firebase often returns objects with IDs as keys)
                const reportsArray = Object.values(reportsData).filter(item => item && typeof item === 'object') as SymptomReport[];
                console.log('Converted symptom reports object to array:', reportsArray.length, 'reports');
                setSymptomReports(reportsArray);
            } else {
                console.warn('Symptom reports data is invalid:', reportsData);
                setSymptomReports([]);
            }

            // Fetch clusters
            const clustersResponse = await axios.get(`${apiUrl}/api/symptom-clusters`);
            const clustersData = clustersResponse.data;
            
            console.log('Raw clusters response:', clustersData);
            
            // Convert to array if it's an object
            if (Array.isArray(clustersData)) {
                setClusters(clustersData);
            } else if (clustersData && typeof clustersData === 'object') {
                // Convert object to array
                const clustersArray = Object.values(clustersData).filter(item => item && typeof item === 'object') as ClusterData[];
                console.log('Converted clusters object to array:', clustersArray.length, 'clusters');
                setClusters(clustersArray);
            } else {
                console.warn('Clusters data is invalid:', clustersData);
                setClusters([]);
            }
        } catch (error: any) {
            console.error('Error fetching surveillance data:', error);
            setError(error.message || 'Failed to fetch surveillance data');
            setSymptomReports([]);
            setClusters([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate risk metrics
    const calculateRiskMetrics = () => {
        const locationGroups: { [key: string]: SymptomReport[] } = {};
        
        // Ensure symptomReports is an array and has data
        if (!symptomReports || !Array.isArray(symptomReports) || symptomReports.length === 0) {
            return { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
        }
        
        symptomReports.forEach(report => {
            const loc = report.location || 'Unknown';
            if (!locationGroups[loc]) {
                locationGroups[loc] = [];
            }
            locationGroups[loc].push(report);
        });

        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;

        Object.values(locationGroups).forEach(reports => {
            const count = reports.length;
            const severeCount = reports.filter(r => r.severity === 'SEVERE').length;
            
            if (count >= 10 || severeCount >= 5) {
                highRisk++;
            } else if (count >= 5 || severeCount >= 2) {
                mediumRisk++;
            } else if (count > 0) {
                lowRisk++;
            }
        });

        return { highRisk, mediumRisk, lowRisk };
    };

    const { highRisk, mediumRisk, lowRisk } = calculateRiskMetrics();
    const totalReports = symptomReports.length;
    const hasOutbreaks = highRisk > 0 || mediumRisk > 0;

    // Group reports by location for table display
    const getLocationSummary = () => {
        const locationGroups: { [key: string]: SymptomReport[] } = {};
        
        // Ensure symptomReports is an array and has data
        if (!symptomReports || !Array.isArray(symptomReports) || symptomReports.length === 0) {
            return [];
        }
        
        symptomReports.forEach(report => {
            const loc = report.location || 'Unknown';
            if (!locationGroups[loc]) {
                locationGroups[loc] = [];
            }
            locationGroups[loc].push(report);
        });

        return Object.entries(locationGroups).map(([location, reports]) => {
            const count = reports.length;
            const severeCount = reports.filter(r => r.severity === 'SEVERE').length;
            const symptomsSet = new Set(reports.flatMap(r => r.symptoms || []));
            const symptoms = Array.from(symptomsSet);
            const lastReport = reports.sort((a, b) => {
                const aTime = a.reportedAt?.seconds || 0;
                const bTime = b.reportedAt?.seconds || 0;
                return bTime - aTime;
            })[0];

            let riskLevel = 'Low';
            if (count >= 10 || severeCount >= 5) {
                riskLevel = 'High';
            } else if (count >= 5 || severeCount >= 2) {
                riskLevel = 'Medium';
            }

            // Format symptoms nicely
            const formattedSymptoms = symptoms.length > 0 
                ? symptoms.map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(', ')
                : 'Not specified';
            
            return {
                location,
                count,
                symptoms: formattedSymptoms,
                riskLevel,
                lastUpdated: lastReport?.reportedAt
            };
        }).sort((a, b) => b.count - a.count);
    };

    const locationSummary = getLocationSummary();

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        
        try {
            // Handle Firestore Timestamp format
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
            
            // Handle ISO string or Date object
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

    return (
        <div className="disease-surveillance">
            {hasOutbreaks ? (
                <NotificationBanner 
                    message={`${highRisk + mediumRisk} surveillance ${highRisk + mediumRisk === 1 ? 'zone requires' : 'zones require'} attention — ${totalReports} symptom reports detected`}
                    severity="warning"
                    actionText="View Details"
                    actionLink="#surveillance-table"
                />
            ) : (
                <NotificationBanner 
                    message={totalReports > 0 ? `${totalReports} symptom ${totalReports === 1 ? 'report' : 'reports'} under normal surveillance` : "No disease outbreaks detected — All surveillance zones operating normally"}
                    severity="success"
                    dismissible={false}
                />
            )}

            <PageTitleBar 
                title="Disease Surveillance & Outbreak Monitoring"
                subtitle="Real-time monitoring of waterborne disease outbreaks and symptom clustering"
                breadcrumbs={['India', 'North East', 'All Regions', 'Disease Surveillance']}
            />

            <div className="surveillance-content">
                <div className="kpi-metrics-grid">
                    <div className="metric-card">
                        <div className="metric-header">
                            <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            <span className="metric-label">High Risk Areas</span>
                        </div>
                        <div className="metric-value-section">
                            <div className="metric-value">{highRisk}</div>
                            <div className="metric-unit">zones</div>
                        </div>
                        <div className={`metric-status ${highRisk === 0 ? 'good' : 'critical'}`}></div>
                        <div className="metric-description">Immediate attention required</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            <span className="metric-label">Medium Risk Areas</span>
                        </div>
                        <div className="metric-value-section">
                            <div className="metric-value">{mediumRisk}</div>
                            <div className="metric-unit">zones</div>
                        </div>
                        <div className={`metric-status ${mediumRisk === 0 ? 'good' : 'warning'}`}></div>
                        <div className="metric-description">Monitoring required</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="metric-label">Low Risk Areas</span>
                        </div>
                        <div className="metric-value-section">
                            <div className="metric-value">{lowRisk}</div>
                            <div className="metric-unit">zones</div>
                        </div>
                        <div className="metric-status good"></div>
                        <div className="metric-description">Normal surveillance</div>
                    </div>
                </div>

                <div className="analysis-card" id="surveillance-table">
                    <div className="card-header">
                        <h2 className="card-title">Active Surveillance Zones ({locationSummary.length})</h2>
                        <p className="card-description">Real-time monitoring of disease outbreak zones and risk assessment</p>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading surveillance data...</div>
                        ) : (
                            <table className="gov-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>Location</th>
                                    <th>Symptoms Reported</th>
                                    <th>Cases Reported</th>
                                    <th>Risk Level</th>
                                    <th>Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {locationSummary.length > 0 ? (
                                    locationSummary.map((zone, index) => (
                                        <tr key={zone.location}>
                                            <td>{index + 1}</td>
                                            <td>{zone.location}</td>
                                            <td>{zone.symptoms}</td>
                                            <td>{zone.count}</td>
                                            <td>
                                                <span className={`status-badge ${
                                                    zone.riskLevel === 'High' ? 'inactive' : 
                                                    zone.riskLevel === 'Medium' ? '' : 'active'
                                                }`}>
                                                    {zone.riskLevel}
                                                </span>
                                            </td>
                                            <td>{formatDate(zone.lastUpdated)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                            No symptom reports found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiseaseSurveillance;
