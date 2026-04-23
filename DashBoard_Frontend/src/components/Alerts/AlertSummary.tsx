import React from 'react';
import { Alert } from '../../types/alert.types';
import './Alerts.css';

interface AlertSummaryProps {
  alerts: Alert[];
}

const AlertSummary: React.FC<AlertSummaryProps> = ({ alerts }) => {
  const totalAlerts = alerts.length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const mediumAlerts = alerts.filter(a => a.severity === 'medium').length;
  const activeAlerts = alerts.filter(a => a.status === 'open').length;
  
  // Calculate changes from yesterday (mock data)
  const yesterdayAlerts = Math.floor(totalAlerts * 0.8); // Mock: 20% fewer alerts than today
  const alertChange = totalAlerts - yesterdayAlerts;
  const changeText = alertChange >= 0 
    ? `+${alertChange} from yesterday` 
    : `${alertChange} from yesterday`;
  
  return (
    <div className="kpi-container">
      <div className="kpi-card">
        <div className="kpi-title">Total Alerts</div>
        <div className="kpi-value">{totalAlerts}</div>
        <div className={`kpi-change ${alertChange >= 0 ? 'positive' : 'negative'}`}>
          {changeText}
        </div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-title">High Priority</div>
        <div className="kpi-value">{highAlerts}</div>
        <div className="kpi-change negative">
          {highAlerts > 0 ? 'Requires immediate attention' : 'No critical issues'}
        </div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-title">Medium Priority</div>
        <div className="kpi-value">{mediumAlerts}</div>
        <div className="kpi-change warning">
          {mediumAlerts > 0 ? 'Monitor closely' : 'Looking good'}
        </div>
      </div>
      
      <div className="kpi-card">
        <div className="kpi-title">Active Alerts</div>
        <div className="kpi-value">{activeAlerts}</div>
        <div className="kpi-change">
          {activeAlerts > 0 ? 'Needs attention' : 'All clear'}
        </div>
      </div>
    </div>
  );
};

export default AlertSummary;
