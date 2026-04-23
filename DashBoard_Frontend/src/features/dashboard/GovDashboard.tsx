import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { DeviceInfo, getDevicesByLocation } from '../../services/waterQuality.service';
import WaterQualityCard from '../../components/WaterQualityCard';
import PageTitleBar from '../../components/common/PageTitleBar';
import NotificationBanner from '../../components/common/NotificationBanner';
import './GovDashboard.css';

const GovDashboard: React.FC = () => {
    const { filter } = useGlobalFilter();
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedDevices = await getDevicesByLocation(
                filter.state || undefined,
                filter.district || undefined,
                filter.city || undefined,
                filter.village || undefined
            );
            setDevices(fetchedDevices);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    }, [filter.state, filter.district, filter.city, filter.village]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // Calculate KPI metrics
    const activeStations = devices.filter(d => d.verified).length;
    const inactiveStations = devices.filter(d => !d.verified).length;
    
    const kpiData = {
        totalStations: devices.length,
        activeStations: activeStations,
        criticalAlerts: inactiveStations // Inactive stations need attention
    };

    // Calculate alerts for notification banner
    const criticalSources = inactiveStations;

    return (
        <div className="gov-dashboard">
            {/* Notification Banner */}
            {criticalSources > 0 && (
                <NotificationBanner 
                    message={`${criticalSources} water ${criticalSources === 1 ? 'source is' : 'sources are'} currently non-functional — No recent data transmission`}
                    severity="warning"
                    actionText="View Details"
                    actionLink="#data-table"
                />
            )}

            {/* Page Title Bar */}
            <PageTitleBar 
                title="Water Quality Monitoring Dashboard — North East India"
                subtitle="Real-time monitoring and analysis of water quality parameters across monitoring stations"
                breadcrumbs={['India', 'North East', filter.state || 'All Regions']}
            />

            {/* KPI Metrics */}
            <div className="kpi-metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                        </svg>
                        <span className="metric-label">Total Monitoring Stations</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{kpiData.totalStations}</div>
                        <div className="metric-unit">stations</div>
                    </div>
                    <div className={`metric-status ${kpiData.totalStations > 10 ? 'good' : 'warning'}`}></div>
                    <div className="metric-description">Active monitoring network coverage</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Functional Sources</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{kpiData.activeStations}</div>
                        <div className="metric-unit">sources</div>
                    </div>
                    <div className={`metric-status ${kpiData.activeStations > 0 ? 'good' : 'critical'}`}></div>
                    <div className="metric-description">Currently transmitting data</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <svg className="metric-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        <span className="metric-label">Water Safety Incidents</span>
                    </div>
                    <div className="metric-value-section">
                        <div className="metric-value">{kpiData.criticalAlerts}</div>
                        <div className="metric-unit">incidents</div>
                    </div>
                    <div className={`metric-status ${kpiData.criticalAlerts === 0 ? 'good' : 'critical'}`}></div>
                    <div className="metric-description">Requires immediate attention</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="analysis-card" id="data-table">
                <div className="card-header">
                    <h2 className="card-title">Water Sources ({devices.length})</h2>
                    <p className="card-description">Complete list of water quality monitoring sources with current operational status</p>
                </div>
                <div className="card-body">
                {loading ? (
                    <div className="loading-state">Loading water sources...</div>
                ) : (
                    <table className="gov-table">
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>Source ID</th>
                                <th>Location</th>
                                <th>Source Type</th>
                                <th>Operational Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.length > 0 ? (
                                devices.map((device, index) => (
                                    <tr key={device.deviceId}>
                                        <td>{index + 1}</td>
                                        <td className="device-id-cell">{device.deviceId}</td>
                                        <td>{device.village}, {device.district}, {device.state}</td>
                                        <td>{device.waterSourceType}</td>
                                        <td>
                                            <span className={`status-badge ${device.verified ? 'active' : 'inactive'}`}>
                                                {device.verified ? 'Functional' : 'Non-Functional'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="view-btn"
                                                onClick={() => setSelectedDevice(device)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No water sources found. Please adjust filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {/* Modal for Device Details */}
            {selectedDevice && (
                <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Water Quality Details — {selectedDevice.deviceId}</h2>
                            <button className="close-btn" onClick={() => setSelectedDevice(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <WaterQualityCard deviceId={selectedDevice.deviceId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovDashboard;
