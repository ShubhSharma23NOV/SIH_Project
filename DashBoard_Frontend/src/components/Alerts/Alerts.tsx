import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertStatus, AlertFilters } from '../../types/alert.types';
import AlertService from '../../services/alert.service';
import AlertTable from './AlertTable';
import AlertFiltersComponent from './AlertFilters';
import AlertSummary from './AlertSummary';
import AlertHistoryChart from './AlertHistoryChart';
import './Alerts.css';

const INITIAL_FILTERS: AlertFilters = {
  severity: 'all',
  village: 'all',
  status: 'all',
  searchQuery: '',
  dateRange: {
    start: null,
    end: null
  }
};

const Alerts: React.FC = () => {
  // State management
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>(INITIAL_FILTERS);
  const [bulkActionInProgress, setBulkActionInProgress] = useState<boolean>(false);
  
  
  // Memoized filter function to prevent unnecessary recalculations
  const filterAlerts = useCallback((alertsList: Alert[], filter: AlertFilters) => {
    return alertsList.filter(alert => {
      // Filter by search query
      const matchesSearch = !filter.searchQuery || 
        (alert.title && alert.title.toLowerCase().includes(filter.searchQuery.toLowerCase())) ||
        (alert.description && alert.description.toLowerCase().includes(filter.searchQuery.toLowerCase()));
      
      // Filter by date range
      const alertDate = new Date(alert.timestamp);
      const matchesDateRange = (
        (!filter.dateRange.start || alertDate >= new Date(filter.dateRange.start)) &&
        (!filter.dateRange.end || alertDate <= new Date(filter.dateRange.end))
      );
      
      // Filter by severity
      const matchesSeverity = filter.severity === 'all' || alert.severity === filter.severity;
      
      // Filter by status
      const matchesStatus = filter.status === 'all' || alert.status === filter.status;
      
      // Filter by village
      const matchesVillage = filter.village === 'all' || alert.village === filter.village;
      
      return matchesSearch && matchesDateRange && matchesSeverity && matchesStatus && matchesVillage;
    });
  }, []);

  // Set up real-time subscription to alerts
  useEffect(() => {
    setIsLoading(true);
    
    // Convert filters to the format expected by AlertService
    const filterParams = {
      status: filters.status !== 'all' ? filters.status : undefined,
      severity: filters.severity !== 'all' ? filters.severity : undefined
    };

    // Subscribe to real-time updates
    const unsubscribe = AlertService.subscribeToAlerts(
      (updatedAlerts: Alert[]) => {
        setAlerts(updatedAlerts);
        setIsLoading(false);
        setError(null);
      },
      filterParams
    );

    // Clean up subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filters.status, filters.severity, setAlerts, setIsLoading, setError]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<AlertFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      dateRange: {
        ...prev.dateRange,
        ...(newFilters.dateRange || {})
      }
    }));
  }, []);

  // Handle alert status update
  const updateAlertStatus = useCallback(async (id: number, status: AlertStatus) => {
    try {
      const updateFn = status === 'acknowledged' 
        ? AlertService.acknowledgeAlert 
        : AlertService.resolveAlert;
      
      await updateFn(id);
      
      setAlerts((prevAlerts: Alert[]) => 
        prevAlerts.map((alert: Alert) => 
          alert.id === id ? { ...alert, status } : alert
        )
      );
      
      return true;
    } catch (err) {
      setError(`Failed to ${status} alert`);
      console.error(`Error ${status} alert:`, err);
      return false;
    }
  }, [setAlerts, setError]);

  // Handle acknowledge action
  const handleAcknowledge = useCallback(async (id: number) => {
    try {
      setBulkActionInProgress(true);
      await updateAlertStatus(id, 'acknowledged');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to acknowledge alert');
    } finally {
      setBulkActionInProgress(false);
    }
  }, [updateAlertStatus, setBulkActionInProgress, setError]);

  // Handle resolve action
  const handleResolve = useCallback(async (id: number) => {
    try {
      setBulkActionInProgress(true);
      await updateAlertStatus(id, 'resolved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to resolve alert');
    } finally {
      setBulkActionInProgress(false);
    }
  }, [updateAlertStatus, setBulkActionInProgress, setError]);

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    return filterAlerts(alerts, filters);
  }, [alerts, filters, filterAlerts]);

  // Group alerts by status for the summary
  // TODO: Uncomment and use alertSummary when needed
  /*
  const alertSummary = useMemo<AlertSummaryData>(() => {
    return (alerts || []).reduce((summary, alert) => {
      // Count by severity
      if (alert.severity === 'high') summary.high++;
      else if (alert.severity === 'medium') summary.medium++;
      else if (alert.severity === 'low') summary.low++;

      // Count by status
      if (alert.status === 'acknowledged') summary.acknowledged++;
      else if (alert.status === 'resolved') summary.resolved++;
      else summary.open++;

      return summary;
    }, {
      total: alerts?.length || 0,
      high: 0,
      medium: 0,
      low: 0,
      acknowledged: 0,
      resolved: 0,
      open: 0
    });
  }, [alerts]);
  */

  // Handle clearing all filters
  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // Handle retry loading alerts
  const handleRetry = useCallback((): void => {
    setError(null);
    // TODO: Implement actual retry logic
    console.log('Retrying to load alerts...');
  }, []);

  // Handle bulk actions
  const handleBulkAcknowledge = useCallback(async () => {
    // TODO: Implement bulk acknowledge functionality
    console.log('Bulk acknowledge clicked');
    /*
    if (!filteredAlerts?.length) return;
    
    try {
      setBulkActionInProgress(true);
      const updatePromises = filteredAlerts
        .filter((alert: Alert) => alert.status !== 'acknowledged')
        .map((alert: Alert) => handleAcknowledge(alert.id));
      
      await Promise.all(updatePromises);
    } catch (err) {
      setError('Failed to acknowledge alerts in bulk');
      console.error('Error in bulk acknowledge:', err);
    } finally {
      setBulkActionInProgress(false);
    }
    */
  }, []);

  const handleBulkResolve = useCallback(async () => {
    // TODO: Implement bulk resolve functionality
    console.log('Bulk resolve clicked');
    /*
    if (!filteredAlerts?.length) return;
    
    try {
      setBulkActionInProgress(true);
      const updatePromises = filteredAlerts
        .filter((alert: Alert) => alert.status !== 'resolved')
        .map((alert: Alert) => handleResolve(alert.id));
      
      await Promise.all(updatePromises);
    } catch (err) {
      setError('Failed to resolve alerts in bulk');
      console.error('Error in bulk resolve:', err);
    } finally {
      setBulkActionInProgress(false);
    }
    */
  }, []);

  if (isLoading && !alerts.length) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <span className="sr-only">Loading alerts...</span>
      </div>
    );
  }
  
  // If there's an error, show error message
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error" role="alert">
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="btn btn-primary"
          disabled={isLoading}
          aria-label="Retry loading alerts"
        >
          {isLoading ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <h1>System Alerts & Notifications</h1>
      
      <AlertSummary alerts={alerts} />
      
      <div className="card">
<AlertFiltersComponent 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onClearFilters={handleClearFilters}
        />
      </div>
      
      <div className="table-container">
        <AlertTable 
          alerts={filteredAlerts} 
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      </div>
      
      {filteredAlerts.length > 0 && (
        <div className="card">
          <div className="bulk-actions">
            <button 
              className="btn btn-warn"
              onClick={handleBulkAcknowledge}
              disabled={bulkActionInProgress || !filteredAlerts.some((alert: Alert) => alert.status !== 'acknowledged')}
              aria-label="Acknowledge all filtered alerts"
            >
              <i className="fa-solid fa-check" aria-hidden="true"></i>
              {bulkActionInProgress ? 'Processing...' : 'Acknowledge All'}
            </button>
            <button 
              className="btn btn-success"
              onClick={handleBulkResolve}
              disabled={bulkActionInProgress || !filteredAlerts.some((alert: Alert) => alert.status !== 'resolved')}
              aria-label="Resolve all filtered alerts"
            >
              <i className="fa-solid fa-check-double" aria-hidden="true"></i>
              {bulkActionInProgress ? 'Processing...' : 'Resolve All'}
            </button>
            <span className="bulk-actions-count" aria-live="polite">
              {filteredAlerts.length} alert(s) selected
            </span>
          </div>
        </div>
      )}
      
      <div className="card" aria-live="polite" aria-atomic="true">
        <h3>Alert History (Last 7 Days)</h3>
        <div className="chart-container">
          {alerts.length > 0 ? (
            <AlertHistoryChart alerts={alerts} />
          ) : (
            <p className="no-data">No alert data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
