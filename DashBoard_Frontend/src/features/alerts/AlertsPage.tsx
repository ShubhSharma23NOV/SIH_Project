import React, { useState, useEffect } from 'react';
import { useGlobalFilter } from '../../contexts/GlobalFilterContext';
import { useToast } from '../../contexts/ToastContext';
import { coordsToLocation, getAllowedDeviceIds } from '../../utils/locationMapper';
import { getStatusColor } from '../../utils/statusConfig';
import '../../App.css';
import {
  getAllAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAlertStatistics,
  type Alert,
} from '../../services/api.service';

interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const AlertsPage: React.FC = () => {
  const { filter } = useGlobalFilter();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
      fetchStatistics();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  useEffect(() => {
    filterAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, statusFilter, severityFilter, searchQuery]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // Get allowed device IDs based on global filter
      const allowedDeviceIds = await getAllowedDeviceIds({
        state: filter.state,
        district: filter.district,
        city: filter.city,
        village: filter.village
      });

      const data = await getAllAlerts();

      // Filter alerts based on allowed device IDs
      const filteredData = data.filter(alert => {
        // If no filter, show all
        if (allowedDeviceIds.size === 0 && !filter.state && !filter.district && !filter.city && !filter.village) {
          return true;
        }
        // Check if alert's sensor is in allowed list
        if (allowedDeviceIds.size > 0 && alert.sensorId && !allowedDeviceIds.has(alert.sensorId)) {
          return false;
        }
        // Check specific deviceId filter
        if (filter.deviceId && alert.sensorId !== filter.deviceId) {
          return false;
        }
        return true;
      });

      setAlerts(filteredData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please check if the backend is running.');
      addToast('Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await getAlertStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.status === statusFilter.toUpperCase());
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === severityFilter.toUpperCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (alert) =>
          alert.title?.toLowerCase().includes(query) ||
          alert.description?.toLowerCase().includes(query) ||
          alert.location?.toLowerCase().includes(query)
      );
    }

    // Sort by triggered date (newest first)
    filtered.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

    setFilteredAlerts(filtered);
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      await fetchAlerts();
      await fetchStatistics();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      addToast('Failed to acknowledge alert', 'error');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      await fetchAlerts();
      await fetchStatistics();
    } catch (err) {
      console.error('Error resolving alert:', err);
      addToast('Failed to resolve alert', 'error');
    }
  };

  const getSeverityColor = (severity: string): string => {
    return getStatusColor(severity);
  };

  const getAlertStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '#F44336';
      case 'ACKNOWLEDGED':
        return '#FF9800';
      case 'RESOLVED':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (dateString: string | any): string => {
    if (!dateString) return 'N/A';

    try {
      // Handle Firestore Timestamp object (from backend)
      if (dateString.seconds !== undefined) {
        const date = new Date(dateString.seconds * 1000);
        return date.toLocaleString();
      }

      // Handle Firestore Timestamp object (alternative format)
      if (dateString._seconds !== undefined) {
        const date = new Date(dateString._seconds * 1000);
        return date.toLocaleString();
      }

      // Handle regular date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString();
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>System Alerts & Notifications - NER</h1>
        <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
          Water quality alerts across North East India region
        </p>

        {/* Statistics Cards */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Alerts</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>{stats.total}</div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Active</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F44336' }}>{stats.active}</div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Acknowledged</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800' }}>
                {stats.acknowledged}
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Resolved</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.resolved}</div>
            </div>

            <div
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Critical</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F44336' }}>{stats.critical}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          {/* Status Filter */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchAlerts();
              fetchStatistics();
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Auto-refresh Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto-refresh (10s)</span>
          </label>

          {/* Last Updated */}
          <div style={{ fontSize: '14px', color: '#666', marginLeft: 'auto' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '15px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Results Count */}
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>

        {/* Alerts List */}
        {loading && alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
            Loading alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
            No alerts found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Title and Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{alert.title}</h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getSeverityColor(alert.severity),
                          color: 'white',
                        }}
                      >
                        {alert.severity}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: getAlertStatusColor(alert.status),
                          color: 'white',
                        }}
                      >
                        {alert.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ margin: '10px 0', color: '#666' }}>{alert.description}</p>

                    {/* Disease Names - Extract from description */}
                    {(alert.description?.includes('Possible diseases:') || alert.description?.includes('Likely diseases:')) && (
                      <div style={{ 
                        margin: '10px 0', 
                        padding: '10px 15px', 
                        backgroundColor: '#fff3cd', 
                        borderLeft: '4px solid #ffc107',
                        borderRadius: '4px'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '5px', fontSize: '13px' }}>
                          ⚠️ Possible Diseases:
                        </div>
                        <div style={{ color: '#856404', fontSize: '14px', fontWeight: '500' }}>
                          {alert.description.includes('Possible diseases:') 
                            ? alert.description.split('Possible diseases:')[1].trim()
                            : alert.description.split('Likely diseases:')[1].split('.')[0].trim()
                          }
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#999' }}>
                      {alert.location && <span>📍 {coordsToLocation(alert.location)}</span>}
                      {alert.sensorId && <span>🔧 Sensor: {alert.sensorId}</span>}
                      {alert.parameter && <span>📊 {alert.parameter}</span>}
                      {alert.actualValue && (
                        <span>
                          Value: {alert.actualValue.toFixed(2)}
                          {alert.thresholdValue && ` (Threshold: ${alert.thresholdValue.toFixed(2)})`}
                        </span>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      <div>Triggered: {formatDate(alert.triggeredAt)}</div>
                      {alert.acknowledgedAt && <div>Acknowledged: {formatDate(alert.acknowledgedAt)}</div>}
                      {alert.resolvedAt && <div>Resolved: {formatDate(alert.resolvedAt)}</div>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {alert.status === 'ACTIVE' && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#FF9800',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}
                        >
                          Resolve & Delete
                        </button>
                      </>
                    )}
                    {alert.status === 'ACKNOWLEDGED' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}
                      >
                        Resolve & Delete
                      </button>
                    )}
                    {alert.status === 'RESOLVED' && (
                      <span style={{
                        padding: '8px 16px',
                        color: '#4CAF50',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
