import React from 'react';
import './DeviceHealthCard.css';
import {
  getWaterQualityClassification,
  getBatteryStatus,
  formatUptime,
  formatLocation,
  isTestDevice
} from '../../utils/waterQuality';

interface DeviceHealthProps {
  sensorId: string;
  location: string;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
  wqi?: number;
  qualityStatus?: string;
  lastUpdated?: string;
}

const DeviceHealthCard: React.FC<DeviceHealthProps> = ({
  sensorId,
  location,
  batteryLevel,
  batteryVoltage,
  signalStrength,
  uptime,
  wqi,
  qualityStatus,
  lastUpdated
}) => {
  // Use centralized utility functions
  const wqiClassification = getWaterQualityClassification(wqi);
  const batteryInfo = getBatteryStatus(batteryLevel, batteryVoltage);
  const uptimeDisplay = formatUptime(uptime, lastUpdated);
  const locationDisplay = formatLocation(location);
  const isTest = isTestDevice(sensorId);

  const getBatteryIcon = (percentage: number | null) => {
    if (percentage === null) return '🔋';
    if (percentage >= 70) return '🔋';
    if (percentage >= 30) return '🔋';
    return '🪫';
  };

  return (
    <div className="device-health-card">
      <div className="device-header">
        <div>
          <h3>
            {sensorId}
            {isTest && <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '8px' }}>(Test Device)</span>}
          </h3>
          <p className="location">{locationDisplay}</p>
        </div>
        {lastUpdated && (
          <span className="last-updated">
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Water Quality */}
      {wqi !== undefined && wqi !== null && (
        <div className="wqi-section">
          <div className="wqi-circle" style={{ borderColor: wqiClassification.color }}>
            <div className="wqi-value">{wqi.toFixed(1)}</div>
            <div className="wqi-label">WQI</div>
          </div>
          <div className="wqi-status" style={{ color: wqiClassification.color }}>
            {wqiClassification.label}
          </div>
        </div>
      )}

      {/* Device Status */}
      <div className="device-status">
        {/* Battery */}
        <div className="status-item">
          <div className="status-icon">{getBatteryIcon(batteryInfo.percentage)}</div>
          <div className="status-info">
            <div className="status-label">Battery</div>
            <div className="status-value" style={{ color: batteryInfo.color }}>
              {batteryInfo.percentage !== null ? `${batteryInfo.percentage.toFixed(0)}%` : batteryInfo.label}
              {batteryVoltage !== undefined && batteryVoltage !== null && <span className="sub-value"> ({batteryVoltage.toFixed(2)}V)</span>}
            </div>
          </div>
          {batteryInfo.percentage !== null && (
            <div className="status-bar">
              <div 
                className="status-fill" 
                style={{ 
                  width: `${batteryInfo.percentage}%`,
                  background: batteryInfo.color
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Uptime */}
        <div className="status-item">
          <div className="status-icon">⏱️</div>
          <div className="status-info">
            <div className="status-label">Uptime</div>
            <div className="status-value">{uptimeDisplay}</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {batteryInfo.warning && (
        <div className="device-alert warning">
          ⚠️ {batteryInfo.warning}
        </div>
      )}
      {wqi !== undefined && wqi !== null && wqi > 75 && (
        <div className="device-alert critical">
          🚨 Poor water quality detected
        </div>
      )}
    </div>
  );
};

export default DeviceHealthCard;
