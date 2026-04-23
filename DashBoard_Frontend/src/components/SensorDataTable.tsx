import React from 'react';
import './SensorDataTable.css';
import {
  getWaterQualityClassification,
  getBatteryStatus,
  getSignalStatus,
  formatUptime
} from '../utils/waterQuality';

export interface SensorReading {
  sensorId: string;
  location?: {
    lat: number;
    lon: number;
  };
  timestamp?: Date | string;
  wqi?: number;
  batteryLevel?: number;
  batteryVoltage?: number;
  signalStrength?: number;
  uptime?: number;
}

interface SensorDataTableProps {
  readings: SensorReading[];
  onRowClick?: (reading: SensorReading) => void;
}

const SensorDataTable: React.FC<SensorDataTableProps> = ({ readings, onRowClick }) => {
  const formatTimestamp = (timestamp?: Date | string) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short'
    });
  };

  const formatLocation = (location?: { lat: number; lon: number }) => {
    if (!location) return 'Unknown';
    return `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`;
  };

  return (
    <div className="sensor-data-table-container">
      <table className="sensor-data-table">
        <thead>
          <tr>
            <th>Sensor ID</th>
            <th>Location</th>
            <th>Timestamp</th>
            <th>WQI</th>
            <th>Status</th>
            <th>Battery</th>
            <th>Signal</th>
            <th>Uptime</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading, index) => {
            const wqiInfo = getWaterQualityClassification(reading.wqi);
            const batteryInfo = getBatteryStatus(reading.batteryLevel, reading.batteryVoltage);
            const signalInfo = getSignalStatus(reading.signalStrength);
            const uptimeDisplay = formatUptime(reading.uptime);

            return (
              <tr
                key={`${reading.sensorId}-${index}`}
                onClick={() => onRowClick?.(reading)}
                className={onRowClick ? 'clickable' : ''}
              >
                <td className="sensor-id">{reading.sensorId}</td>
                <td className="location">{formatLocation(reading.location)}</td>
                <td className="timestamp">{formatTimestamp(reading.timestamp)}</td>
                <td className="wqi-value">
                  {reading.wqi !== undefined && reading.wqi !== null ? reading.wqi.toFixed(1) : 'N/A'}
                </td>
                <td className="wqi-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: wqiInfo.color }}
                  >
                    {wqiInfo.label}
                  </span>
                </td>
                <td className="battery">
                  <div className="status-cell">
                    <span className="icon">🔋</span>
                    <span style={{ color: batteryInfo.color }}>
                      {batteryInfo.percentage !== null
                        ? `${batteryInfo.percentage.toFixed(0)}%`
                        : batteryInfo.label}
                    </span>
                  </div>
                </td>
                <td className="signal">
                  <div className="status-cell">
                    <span className="icon">📶</span>
                    <span style={{ color: signalInfo.color }}>
                      {signalInfo.label}
                    </span>
                  </div>
                </td>
                <td className="uptime">
                  <div className="status-cell">
                    <span className="icon">⏱️</span>
                    <span>{uptimeDisplay}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {readings.length === 0 && (
        <div className="no-data">
          <p>No sensor readings available</p>
        </div>
      )}
    </div>
  );
};

export default SensorDataTable;
