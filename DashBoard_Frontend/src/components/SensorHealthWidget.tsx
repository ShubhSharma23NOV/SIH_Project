import React, { useEffect, useState } from 'react';
import './SensorHealthWidget.css';

interface SensorHealthStats {
  totalSensors: number;
  healthySensors: number;
  degradedSensors: number;
  faultySensors: number;
  sensorStatuses: { [key: string]: string };
}

interface SensorHealthDetail {
  deviceId: string;
  status: string;
  consecutiveInsufficient: number;
  totalReadings: number;
  sufficientReadings: number;
  insufficientReadings: number;
  dataQualityPercentage: number;
  lastHealthCheck: string;
  notes: string;
}

const SensorHealthWidget: React.FC = () => {
  const [stats, setStats] = useState<SensorHealthStats | null>(null);
  const [details, setDetails] = useState<SensorHealthDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSensorHealth();
    // OPTIMIZED: Refresh every 5 minutes instead of 30 seconds (saves 90% reads)
    const interval = setInterval(fetchSensorHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensorHealth = async () => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      
      // Fetch stats
      const statsResponse = await fetch(`${API_BASE}/api/sensor-health/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch detailed health from Firebase
      const healthResponse = await fetch(`${API_BASE}/api/sensor-health/all-details`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setDetails(healthData);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sensor health data');
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return '🟢';
      case 'DEGRADED':
        return '🟡';
      case 'FAULTY':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return '#4caf50';
      case 'DEGRADED':
        return '#ff9800';
      case 'FAULTY':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  if (loading) {
    return <div className="sensor-health-widget">Loading sensor health...</div>;
  }

  if (error) {
    return <div className="sensor-health-widget error">{error}</div>;
  }

  return (
    <div className="sensor-health-widget">
      <h2>🏥 Sensor Health Monitor</h2>

      {/* Summary Cards */}
      <div className="health-summary">
        <div className="health-card total">
          <div className="health-number">{stats?.totalSensors || 0}</div>
          <div className="health-label">Total Sensors</div>
        </div>
        <div className="health-card healthy">
          <div className="health-number">🟢 {stats?.healthySensors || 0}</div>
          <div className="health-label">Healthy</div>
        </div>
        <div className="health-card degraded">
          <div className="health-number">🟡 {stats?.degradedSensors || 0}</div>
          <div className="health-label">Degraded</div>
        </div>
        <div className="health-card faulty">
          <div className="health-number">🔴 {stats?.faultySensors || 0}</div>
          <div className="health-label">Faulty</div>
        </div>
      </div>

      {/* Sensor List */}
      <div className="sensor-list">
        <h3>Sensor Status Details</h3>
        {stats && Object.entries(stats.sensorStatuses).map(([deviceId, status]) => (
          <div key={deviceId} className="sensor-item" style={{ borderLeft: `4px solid ${getStatusColor(status)}` }}>
            <div className="sensor-header">
              <span className="sensor-icon">{getStatusIcon(status)}</span>
              <span className="sensor-id">{deviceId}</span>
              <span className="sensor-status" style={{ color: getStatusColor(status) }}>
                {status}
              </span>
            </div>
            {details.find(d => d.deviceId === deviceId) && (
              <div className="sensor-details">
                <div className="detail-row">
                  <span>Data Quality:</span>
                  <span className="detail-value">
                    {details.find(d => d.deviceId === deviceId)?.dataQualityPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="detail-row">
                  <span>Total Readings:</span>
                  <span className="detail-value">
                    {details.find(d => d.deviceId === deviceId)?.totalReadings}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Consecutive Issues:</span>
                  <span className="detail-value">
                    {details.find(d => d.deviceId === deviceId)?.consecutiveInsufficient}
                  </span>
                </div>
                <div className="detail-notes">
                  {details.find(d => d.deviceId === deviceId)?.notes}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health Chart */}
      {stats && stats.totalSensors > 0 && (
        <div className="health-chart">
          <h3>Health Distribution</h3>
          <div className="chart-bar">
            <div 
              className="chart-segment healthy" 
              style={{ width: `${(stats.healthySensors / stats.totalSensors) * 100}%` }}
              title={`Healthy: ${stats.healthySensors}`}
            />
            <div 
              className="chart-segment degraded" 
              style={{ width: `${(stats.degradedSensors / stats.totalSensors) * 100}%` }}
              title={`Degraded: ${stats.degradedSensors}`}
            />
            <div 
              className="chart-segment faulty" 
              style={{ width: `${(stats.faultySensors / stats.totalSensors) * 100}%` }}
              title={`Faulty: ${stats.faultySensors}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorHealthWidget;
