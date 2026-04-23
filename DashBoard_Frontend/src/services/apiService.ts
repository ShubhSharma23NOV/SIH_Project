/**
 * API Service
 * Centralized API calls with caching and error handling
 */

import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, CACHE_TTL } from '../constants/appConstants';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    logger.apiCall(config.method?.toUpperCase() || 'GET', config.url || '');
    return config;
  },
  (error) => {
    logger.error('API request error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    logger.apiCall(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status
    );
    return response;
  },
  (error: AxiosError) => {
    logger.error('API response error', error, {
      url: error.config?.url,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

class APIService {
  /**
   * Get dashboard summary (aggregated endpoint)
   */
  async getDashboardSummary(state: string = 'Assam') {
    return cacheService.getOrFetch(
      `dashboard_summary_${state}`,
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.DASHBOARD_SUMMARY, {
          params: { state },
        });
        return response.data;
      },
      CACHE_TTL.PREDICTIONS
    );
  }

  /**
   * Get alerts summary (aggregated endpoint)
   */
  async getAlertsSummary() {
    return cacheService.getOrFetch(
      'alerts_summary',
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.ALERTS_SUMMARY);
        return response.data;
      },
      CACHE_TTL.ALERTS
    );
  }

  /**
   * Get latest prediction (aggregated endpoint)
   */
  async getLatestPrediction(state: string = 'Assam') {
    return cacheService.getOrFetch(
      `prediction_latest_${state}`,
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.PREDICTION_LATEST, {
          params: { state },
        });
        return response.data;
      },
      CACHE_TTL.PREDICTIONS
    );
  }

  /**
   * Get sensor readings
   */
  async getSensorReadings() {
    return cacheService.getOrFetch(
      'sensor_readings',
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.SENSOR_DATA);
        logger.firestoreRead('sensor_readings', response.data.length);
        return response.data;
      },
      CACHE_TTL.SENSOR_DATA
    );
  }

  /**
   * Get symptom reports
   */
  async getSymptomReports() {
    return cacheService.getOrFetch(
      'symptom_reports',
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.SYMPTOM_REPORTS);
        logger.firestoreRead('symptom_reports', response.data.length);
        return response.data;
      },
      CACHE_TTL.SENSOR_DATA
    );
  }

  /**
   * Get symptom clusters
   */
  async getSymptomClusters(state?: string) {
    const cacheKey = state ? `symptom_clusters_${state}` : 'symptom_clusters';
    
    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.SYMPTOM_CLUSTERS, {
          params: state ? { state } : {},
        });
        logger.firestoreRead('symptom_clusters', response.data.length);
        return response.data;
      },
      CACHE_TTL.PREDICTIONS
    );
  }

  /**
   * Get outbreak prediction
   */
  async getOutbreakPrediction(state: string = 'Assam') {
    return cacheService.getOrFetch(
      `outbreak_prediction_${state}`,
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.OUTBREAK_PREDICTIONS, {
          params: { state },
        });
        logger.firestoreRead('outbreak_predictions', 1);
        return response.data;
      },
      CACHE_TTL.PREDICTIONS
    );
  }

  /**
   * Get alerts
   */
  async getAlerts() {
    return cacheService.getOrFetch(
      'alerts',
      async () => {
        const response = await apiClient.get(API_ENDPOINTS.ALERTS);
        logger.firestoreRead('alerts', response.data.length);
        return response.data;
      },
      CACHE_TTL.ALERTS
    );
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.ALERTS}/${alertId}/acknowledge`);
    
    // Invalidate alerts cache
    cacheService.invalidatePattern('alerts');
    
    return response.data;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string) {
    const response = await apiClient.post(`${API_ENDPOINTS.ALERTS}/${alertId}/resolve`);
    
    // Invalidate alerts cache
    cacheService.invalidatePattern('alerts');
    
    return response.data;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CACHE_STATS);
      return response.data;
    } catch (error) {
      logger.warn('Failed to fetch cache stats', { error });
      return null;
    }
  }

  /**
   * Invalidate all caches
   */
  invalidateAllCaches() {
    cacheService.invalidateAll();
    logger.info('All API caches invalidated');
  }

  /**
   * Get client-side cache metrics
   */
  getCacheMetrics() {
    return cacheService.getMetrics();
  }
}

export const apiService = new APIService();
