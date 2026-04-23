import React from 'react';
import { Alert } from '../../types/alert.types';
import './Alerts.css';

interface AlertTableProps {
  alerts: Alert[];
  onAcknowledge: (id: number) => void;
  onResolve: (id: number) => void;
}

const AlertTable: React.FC<AlertTableProps> = ({ alerts, onAcknowledge, onResolve }) => {
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open': return 'badge-active';
      case 'acknowledged': return 'badge-acknowledged';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  };

  if (alerts.length === 0) {
    return <div className="no-alerts">No alerts found matching the current filters.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="alerts-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Village</th>
            <th>Alert Type</th>
            <th>Description</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{new Date(alert.timestamp).toLocaleString()}</td>
              <td>{alert.village}</td>
              <td>{alert.type}</td>
              <td className="alert-description">
                <div className="description-text">{alert.description}</div>
                {alert.value && (
                  <div className="metric-info">
                    Value: {alert.value} (Threshold: {alert.threshold})
                  </div>
                )}
              </td>
              <td>
                <span className={`badge ${getSeverityBadgeClass(alert.severity)}`}>
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </span>
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(alert.status)}`}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </span>
              </td>
              <td className="actions">
                {alert.status === 'open' && (
                  <button 
                    className="btn-icon"
                    onClick={() => onAcknowledge(alert.id)}
                    title="Acknowledge"
                  >
                    <i className="fa-solid fa-check"></i>
                  </button>
                )}
                <button 
                  className="btn-icon"
                  onClick={() => onResolve(alert.id)}
                  title="Resolve"
                  disabled={alert.status === 'resolved'}
                >
                  <i className="fa-solid fa-check-double"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertTable;
