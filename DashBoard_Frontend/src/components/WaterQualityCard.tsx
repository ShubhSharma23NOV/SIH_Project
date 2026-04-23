import React, { useEffect, useState } from 'react';
import { getWaterQuality, getBatteryConfig, WaterQualityResponse } from '../services/waterQuality.service';
import { getStatusConfig } from '../utils/statusConfig';
import './WaterQualityCard.css';
// Updated to include latestReadings from backend

interface WaterQualityCardProps {
  deviceId: string;
}

const WaterQualityCard: React.FC<WaterQualityCardProps> = ({ deviceId }) => {
  const [waterQuality, setWaterQuality] = useState<WaterQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaterQuality = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWaterQuality(deviceId);
      setWaterQuality(data);
      setError(null);
    } catch (err) {
      setError('Failed to load water quality data');
      console.error('Error fetching water quality:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchWaterQuality();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWaterQuality, 30000);
    return () => clearInterval(interval);
  }, [fetchWaterQuality]);

  if (loading) {
    return (
      <div className="water-quality-card loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error || !waterQuality) {
    return (
      <div className="water-quality-card error">
        <p>{error || 'No data available'}</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(waterQuality.finalStatus);
  const batteryConfig = getBatteryConfig(waterQuality.deviceHealth.batteryStatus);

  return (
    <div className="water-quality-card">
      {/* Overall Status */}
      <div className="overall-status" style={{ borderColor: statusConfig.color }}>
        <div className="status-badge" style={{ backgroundColor: statusConfig.color }}>
          {statusConfig.label}
        </div>
        <p className="status-reason">{waterQuality.statusReason}</p>
        {waterQuality.wqiScore && (
          <div className="wqi-score">
            <span className="wqi-label">WQI Score:</span>
            <span className="wqi-value">{waterQuality.wqiScore.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Parameter Cards - ONLY 5 SENSORS */}
      <div className="parameters-grid">
        {/* pH Level */}
        <ParameterCard
          title="pH Level"
          icon="🧪"
          status={waterQuality.parameterStatus.pH}
          optimalRange="6.5 - 8.5"
          value={waterQuality.latestReadings?.pH}
        />

        {/* TDS */}
        <ParameterCard
          title="Total Dissolved Solids"
          icon="💧"
          status={waterQuality.parameterStatus.TDS}
          optimalRange="0 - 300 ppm"
          unit="ppm"
          value={waterQuality.latestReadings?.TDS}
        />

        {/* Turbidity */}
        <ParameterCard
          title="Turbidity"
          icon="🌫️"
          status={waterQuality.parameterStatus.Turbidity}
          optimalRange="0 - 5 NTU"
          unit="NTU"
          value={waterQuality.latestReadings?.Turbidity}
        />

        {/* Temperature */}
        <ParameterCard
          title="Temperature"
          icon="🌡️"
          status={waterQuality.parameterStatus.Temperature}
          optimalRange="15 - 30°C"
          unit="°C"
          value={waterQuality.latestReadings?.Temperature}
        />

        {/* Battery Status - SEPARATE FROM WATER QUALITY */}
        <div className="parameter-card battery-card">
          <div className="parameter-header">
            <span className="parameter-icon">🔋</span>
            <h4>Battery Status</h4>
          </div>
          <div className="parameter-content">
            <div
              className="parameter-status-badge"
              style={{ backgroundColor: batteryConfig.color }}
            >
              {batteryConfig.label}
            </div>
            {waterQuality.deviceHealth.batteryLevel !== undefined && waterQuality.deviceHealth.batteryLevel !== null ? (
              <div className="parameter-value">
                {waterQuality.deviceHealth.batteryLevel.toFixed(0)}%
                {waterQuality.deviceHealth.batteryVoltage && (
                  <span style={{ fontSize: '0.8em', color: '#6b7280', marginLeft: '0.5rem' }}>
                    ({waterQuality.deviceHealth.batteryVoltage.toFixed(2)}V)
                  </span>
                )}
              </div>
            ) : waterQuality.deviceHealth.batteryVoltage ? (
              <div className="parameter-value">
                {waterQuality.deviceHealth.batteryVoltage.toFixed(2)} V
              </div>
            ) : (
              <div className="parameter-value" style={{ color: '#6b7280' }}>
                Not reported
              </div>
            )}
            <div className="parameter-range">Normal: 3.6 - 4.2V</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ParameterCardProps {
  title: string;
  icon: string;
  status: string;
  optimalRange: string;
  unit?: string;
  value?: number | null;
}

const ParameterCard: React.FC<ParameterCardProps> = ({ title, icon, status, optimalRange, unit, value }) => {
  const statusConfig = getStatusConfig(status);

  return (
    <div className="parameter-card">
      <div className="parameter-header">
        <span className="parameter-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="parameter-content">
        <div
          className="parameter-status-badge"
          style={{ backgroundColor: statusConfig.color }}
        >
          {statusConfig.label}
        </div>
        {value !== null && value !== undefined && (
          <div className="parameter-value">
            {value.toFixed(title === 'pH Level' ? 2 : title === 'Temperature' ? 1 : 0)} {unit || ''}
          </div>
        )}
        <div className="parameter-range">
          Optimal: {optimalRange}
        </div>
      </div>
    </div>
  );
};

export default WaterQualityCard;
