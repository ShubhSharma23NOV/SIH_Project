import React, { useState, useEffect, useCallback } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { getAllowedDeviceIds } from '../../utils/locationMapper';
import OutbreakPredictionPanel from '../../components/ML/OutbreakPredictionPanel';
import ClusterMap from '../../components/ML/ClusterMap';
import DeviceHealthCard from '../../components/ML/DeviceHealthCard';
import { useReportDownload } from '../../hooks/useReportDownload';
import './MLDashboard.css';

interface SensorReading {
  id: string;
  sensorId: string;
  location: string;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
  wqi?: number;
  qualityStatus?: string;
  timestamp?: string;
}

interface DashboardStats {
  totalSensors: number;
  activeSensors: number;
  totalReports: number;
  activeClusters: number;
  activeAlerts: number;
}

const MLDashboard: React.FC = () => {
  const { filter } = useGlobalFilter();
  const { downloadReport, isGenerating, error, clearError } = useReportDownload();
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [mlServiceOnline, setMlServiceOnline] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSensors: 0,
    activeSensors: 0,
    totalReports: 0,
    activeClusters: 0,
    activeAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    await downloadReport({
      state: filter.state || undefined,
      district: filter.district || undefined,
      city: filter.city || undefined,
      village: filter.village || undefined
    });
  };

  const handleMLSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE}/api/ml/sync/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSyncMessage('✅ ML sync completed successfully!');
        console.log('ML Sync Stats:', data.sync_stats);
        
        // Refresh dashboard data after sync
        setTimeout(() => {
          fetchDashboardData();
          setSyncMessage(null);
        }, 2000);
      } else {
        setSyncMessage('❌ ML sync failed. Please try again.');
      }
    } catch (error) {
      console.error('ML sync error:', error);
      setSyncMessage('❌ ML sync failed. Check if backend is running.');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      // Check ML Service status
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const ML_API_BASE = process.env.REACT_APP_ML_API_URL || 'http://localhost:5000';

      try {
        const mlResponse = await fetch(`${ML_API_BASE}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        setMlServiceOnline(mlResponse.ok);
      } catch (err) {
        setMlServiceOnline(false);
      }

      // Get allowed device IDs based on global filter
      const allowedDeviceIds = await getAllowedDeviceIds({
        state: filter.state,
        district: filter.district,
        city: filter.city,
        village: filter.village
      });

      let filteredSensors: SensorReading[] = [];

      // Fetch sensors
      try {
        const sensorsResponse = await fetch(`${API_BASE}/api/sensors/readings`);
        if (sensorsResponse.ok) {
          const sensorsData = await sensorsResponse.json();
          const sensorArray = Array.isArray(sensorsData) ? sensorsData : [];

          // Filter sensors based on allowed device IDs
          filteredSensors = sensorArray.filter((sensor: SensorReading) => {
            // If no filter, show all
            if (allowedDeviceIds.size === 0 && !filter.state && !filter.district && !filter.city && !filter.village) {
              return true;
            }
            // Check if device is in allowed list
            if (allowedDeviceIds.size > 0 && !allowedDeviceIds.has(sensor.sensorId)) {
              return false;
            }
            // Check specific deviceId filter
            if (filter.deviceId && sensor.sensorId !== filter.deviceId) {
              return false;
            }
            return true;
          });

          setSensors(filteredSensors);
        }
      } catch (err) {
        console.log('Sensors not available:', err);
      }

      // Calculate stats from filtered data
      try {
        // Get unique sensor IDs from filtered sensors
        const uniqueSensorIds = new Set(filteredSensors.map(s => s.sensorId));

        // Fetch all data for stats calculation
        const [alertsResponse, reportsResponse, clustersResponse] = await Promise.all([
          fetch(`${API_BASE}/api/alerts`),
          fetch(`${API_BASE}/api/symptom-reports`),
          fetch(`${API_BASE}/api/clusters/active`)
        ]);

        let filteredStats = {
          totalSensors: uniqueSensorIds.size,
          activeSensors: uniqueSensorIds.size,
          totalReports: 0,
          activeClusters: 0,
          activeAlerts: 0
        };

        // Filter alerts by allowed devices
        if (alertsResponse.ok) {
          const alerts = await alertsResponse.json();
          const filteredAlerts = alerts.filter((alert: any) => {
            if (allowedDeviceIds.size === 0 && !filter.state && !filter.district && !filter.city && !filter.village) {
              return true;
            }
            return allowedDeviceIds.size > 0 && alert.sensorId && allowedDeviceIds.has(alert.sensorId);
          });
          filteredStats.activeAlerts = filteredAlerts.filter((a: any) => a.status === 'ACTIVE').length;
        }

        // Filter symptom reports by location (if needed)
        if (reportsResponse.ok) {
          const reports = await reportsResponse.json();
          // For now, show all reports (can be filtered by location if needed)
          filteredStats.totalReports = reports.length;
        }

        // Filter clusters by location (if needed)
        if (clustersResponse.ok) {
          const clusters = await clustersResponse.json();
          // For now, show all clusters (can be filtered by location if needed)
          filteredStats.activeClusters = clusters.length;
        }

        setStats(filteredStats);
      } catch (err) {
        console.log('Error calculating stats:', err);
        // Fallback to sensor count only
        const uniqueSensorIds = new Set(filteredSensors.map(s => s.sensorId));
        setStats({
          totalSensors: uniqueSensorIds.size,
          activeSensors: uniqueSensorIds.size,
          totalReports: 0,
          activeClusters: 0,
          activeAlerts: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="ml-dashboard loading">
        <div className="loading-spinner">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="ml-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>ArogyaJal ML Dashboard - North East India</h1>
            <p>Real-time Water Quality & Outbreak Monitoring for NER States</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '5px' }}>
              🗺️ Covering: Assam • Meghalaya • Arunachal Pradesh • Nagaland • Manipur • Mizoram • Tripura • Sikkim
            </p>
          </div>

        </div>
        {syncMessage && (
          <div style={{
            marginTop: '10px',
            padding: '10px 15px',
            backgroundColor: syncMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${syncMessage.includes('✅') ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '6px',
            color: syncMessage.includes('✅') ? '#065f46' : '#991b1b',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{syncMessage}</span>
            <button
              onClick={() => setSyncMessage(null)}
              style={{
                background: 'none',
                border: 'none',
                color: syncMessage.includes('✅') ? '#065f46' : '#991b1b',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>
        )}
        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px 15px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ {error}</span>
            <button
              onClick={clearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔬</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSensors}</div>
            <div className="stat-label">Total Sensors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeSensors}</div>
            <div className="stat-label">Active Sensors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalReports}</div>
            <div className="stat-label">Symptom Reports</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeClusters}</div>
            <div className="stat-label">Active Clusters</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeAlerts}</div>
            <div className="stat-label">Active Alerts</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Outbreak Prediction */}
          <OutbreakPredictionPanel />

          {/* Device Health Cards */}
          <div className="devices-section">
            <h2>Device Health Status</h2>
            <div className="devices-grid">
              {sensors.length > 0 ? (
                (() => {
                  // Get unique sensors (latest reading per device)
                  const uniqueSensors = new Map<string, SensorReading>();
                  sensors.forEach((sensor) => {
                    const existing = uniqueSensors.get(sensor.sensorId);
                    if (!existing || new Date(sensor.timestamp || 0) > new Date(existing.timestamp || 0)) {
                      uniqueSensors.set(sensor.sensorId, sensor);
                    }
                  });
                  
                  // Convert to array and take first 4
                  return Array.from(uniqueSensors.values()).slice(0, 4).map((sensor) => (
                    <DeviceHealthCard
                      key={sensor.id}
                      sensorId={sensor.sensorId}
                      location={sensor.location}
                      batteryLevel={sensor.batteryLevel}
                      batteryVoltage={sensor.batteryVoltage}
                      signalStrength={sensor.signalStrength}
                      uptime={sensor.uptime}
                      wqi={sensor.wqi}
                      qualityStatus={sensor.qualityStatus}
                      lastUpdated={sensor.timestamp}
                    />
                  ));
                })()
              ) : (
                <div className="no-data">No sensor data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Cluster Map */}
          <ClusterMap />

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button 
                className="action-btn primary"
                onClick={handleMLSync}
                disabled={isSyncing}
                style={{
                  opacity: isSyncing ? 0.6 : 1,
                  cursor: isSyncing ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{isSyncing ? '⏳' : '🔄'}</span>
                {isSyncing ? 'Syncing ML...' : 'Sync ML Now'}
              </button>
              <button 
                className="action-btn"
                onClick={handleDownloadReport}
                disabled={isGenerating}
                style={{
                  opacity: isGenerating ? 0.6 : 1,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{isGenerating ? '⏳' : '📊'}</span>
                {isGenerating ? 'Generating...' : 'Download Report'}
              </button>
              <button className="action-btn">
                <span>🔔</span>
                View All Alerts
              </button>
              <button className="action-btn">
                <span>⚙️</span>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <p>ML Service: <span className={`status-dot ${mlServiceOnline ? 'online' : 'offline'}`}></span> {mlServiceOnline ? 'Online' : 'Offline'}</p>
      </div>
    </div>
  );
};

export default MLDashboard;
