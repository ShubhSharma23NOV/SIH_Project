/**
 * Optimized Firestore Hook
 * Replaces direct Firestore queries with cached, aggregated endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FIRESTORE_OPTIMIZATION,
  clientCache,
  readMetrics,
  debounce,
} from '../config/firestoreOptimization';

// Use environment variable or fallback to localhost
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Use optimized dashboard summary
 * Replaces: Multiple Firestore queries
 * With: Single aggregated endpoint + caching
 */
export function useOptimizedDashboard(state: string = 'Assam') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const cacheKey = `dashboard_${state}`;

    // Check cache first
    if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
      const cached = clientCache.get(cacheKey);
      if (cached) {
        console.log('✓ Cache HIT: Dashboard summary');
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('✗ Cache MISS: Fetching dashboard summary');
      const response = await axios.get(
        `${API_BASE_URL}${FIRESTORE_OPTIMIZATION.ENDPOINTS.DASHBOARD_SUMMARY}`,
        { params: { state } }
      );

      setData(response.data);
      setError(null);

      // Cache the result
      if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
        clientCache.set(
          cacheKey,
          response.data,
          FIRESTORE_OPTIMIZATION.CACHE_TTL.PREDICTIONS
        );
      }

      // Track read
      if (FIRESTORE_OPTIMIZATION.FEATURES.LOG_READ_METRICS) {
        readMetrics.trackRead('dashboard_summary', 1);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchDashboard();

    // Poll with optimized interval
    const interval = setInterval(
      fetchDashboard,
      FIRESTORE_OPTIMIZATION.POLLING.DASHBOARD
    );

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

/**
 * Use optimized alerts
 */
export function useOptimizedAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const cacheKey = 'alerts_summary';

    // Check cache
    if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
      const cached = clientCache.get(cacheKey) as any;
      if (cached) {
        console.log('✓ Cache HIT: Alerts');
        setAlerts(cached.alerts || []);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('✗ Cache MISS: Fetching alerts');
      const response = await axios.get(
        `${API_BASE_URL}${FIRESTORE_OPTIMIZATION.ENDPOINTS.ALERTS_SUMMARY}`
      );

      const alertsData = (response.data as any).alerts || [];
      setAlerts(alertsData);
      setError(null);

      // Cache
      if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
        clientCache.set(
          cacheKey,
          response.data,
          FIRESTORE_OPTIMIZATION.CACHE_TTL.ALERTS
        );
      }

      // Track
      if (FIRESTORE_OPTIMIZATION.FEATURES.LOG_READ_METRICS) {
        readMetrics.trackRead('alerts_summary', 1);
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(
      fetchAlerts,
      FIRESTORE_OPTIMIZATION.POLLING.ALERTS
    );

    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
}

/**
 * Use optimized latest prediction
 */
export function useOptimizedPrediction(state: string = 'Assam') {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    const cacheKey = `prediction_${state}`;

    // Check cache
    if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
      const cached = clientCache.get(cacheKey);
      if (cached) {
        console.log('✓ Cache HIT: Prediction');
        setPrediction(cached);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('✗ Cache MISS: Fetching prediction');
      const response = await axios.get(
        `${API_BASE_URL}${FIRESTORE_OPTIMIZATION.ENDPOINTS.PREDICTION_LATEST}`,
        { params: { state } }
      );

      setPrediction(response.data);
      setError(null);

      // Cache
      if (FIRESTORE_OPTIMIZATION.FEATURES.ENABLE_CLIENT_CACHE) {
        clientCache.set(
          cacheKey,
          response.data,
          FIRESTORE_OPTIMIZATION.CACHE_TTL.PREDICTIONS
        );
      }

      // Track
      if (FIRESTORE_OPTIMIZATION.FEATURES.LOG_READ_METRICS) {
        readMetrics.trackRead('prediction_latest', 1);
      }
    } catch (err: any) {
      console.error('Error fetching prediction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchPrediction();

    const interval = setInterval(
      fetchPrediction,
      FIRESTORE_OPTIMIZATION.POLLING.ML_PREDICTIONS
    );

    return () => clearInterval(interval);
  }, [fetchPrediction]);

  return { prediction, loading, error, refetch: fetchPrediction };
}

/**
 * Debounced filter hook
 */
export function useDebouncedFilter<T>(
  initialValue: T,
  delay: number = FIRESTORE_OPTIMIZATION.DEBOUNCE.FILTER_CHANGE
) {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return [debouncedValue, setValue] as const;
}

/**
 * Get cache statistics from backend
 */
export async function getCacheStats() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}${FIRESTORE_OPTIMIZATION.ENDPOINTS.CACHE_STATS}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return null;
  }
}

/**
 * Get client-side read metrics
 */
export function getClientReadMetrics() {
  return readMetrics.getMetrics();
}
