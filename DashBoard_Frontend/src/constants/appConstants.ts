/**
 * Application Constants
 * Centralized configuration for thresholds, intervals, and system parameters
 */

// Water Quality Thresholds
export const WATER_QUALITY_THRESHOLDS = {
  pH: {
    MIN_SAFE: 6.5,
    MAX_SAFE: 8.5,
    MIN_ACCEPTABLE: 6.0,
    MAX_ACCEPTABLE: 9.0,
  },
  TDS: {
    EXCELLENT: 300,
    GOOD: 600,
    FAIR: 900,
    POOR: 1200,
  },
  TURBIDITY: {
    EXCELLENT: 1,
    GOOD: 5,
    FAIR: 10,
    POOR: 25,
  },
  TEMPERATURE: {
    MIN_SAFE: 10,
    MAX_SAFE: 30,
  },
} as const;

// WQI Grade Boundaries
export const WQI_GRADES = {
  EXCELLENT: { min: 0, max: 25, label: 'Excellent', color: '#10b981' },
  GOOD: { min: 26, max: 50, label: 'Good', color: '#3b82f6' },
  FAIR: { min: 51, max: 75, label: 'Fair', color: '#f59e0b' },
  POOR: { min: 76, max: 90, label: 'Poor', color: '#ef4444' },
  VERY_POOR: { min: 91, max: 100, label: 'Very Poor', color: '#991b1b' },
} as const;

// Refresh Intervals (milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD: 20000,      // 20 seconds
  ALERTS: 30000,         // 30 seconds
  ML_PREDICTIONS: 45000, // 45 seconds
  SENSOR_MAP: 30000,     // 30 seconds
  TRENDS: 60000,         // 60 seconds
} as const;

// Cache TTL (milliseconds)
export const CACHE_TTL = {
  SENSOR_DATA: 30000,    // 30 seconds
  ALERTS: 30000,         // 30 seconds
  PREDICTIONS: 45000,    // 45 seconds
  STATIC_DATA: 300000,   // 5 minutes
} as const;

// Debounce Delays (milliseconds)
export const DEBOUNCE_DELAYS = {
  FILTER_CHANGE: 500,
  SEARCH_INPUT: 400,
  MAP_INTERACTION: 600,
} as const;

// Outbreak Risk Levels
export const RISK_LEVELS = {
  LOW: { min: 0, max: 30, label: 'Low', color: '#10b981' },
  MEDIUM: { min: 31, max: 50, label: 'Medium', color: '#f59e0b' },
  HIGH: { min: 51, max: 75, label: 'High', color: '#ef4444' },
  CRITICAL: { min: 76, max: 100, label: 'Critical', color: '#991b1b' },
} as const;

// Symptom Severity
export const SYMPTOM_SEVERITY = {
  MILD: { label: 'Mild', color: '#10b981' },
  MODERATE: { label: 'Moderate', color: '#f59e0b' },
  SEVERE: { label: 'Severe', color: '#ef4444' },
} as const;

// Alert Severity
export const ALERT_SEVERITY = {
  LOW: { label: 'Low', color: '#3b82f6' },
  MEDIUM: { label: 'Medium', color: '#f59e0b' },
  HIGH: { label: 'High', color: '#ef4444' },
  CRITICAL: { label: 'Critical', color: '#991b1b' },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  VIRTUALIZATION_THRESHOLD: 50, // Enable virtualization if items > 50
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  DEMO_MODE: false,
  SIMULATION_MODE: false,
  DEBUG_UI: false,
  ENABLE_CACHING: true,
  ENABLE_LISTENERS: false, // Use polling for now (safer for quota)
  ENABLE_LAZY_LOADING: true,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  SENSOR_DATA: '/api/sensors/readings',
  SYMPTOM_REPORTS: '/api/symptoms/reports',
  SYMPTOM_CLUSTERS: '/api/symptom-clusters',
  OUTBREAK_PREDICTIONS: '/api/outbreak-predictions/latest',
  ALERTS: '/api/alerts',
  
  // Aggregated endpoints (optimized)
  DASHBOARD_SUMMARY: '/api/aggregated/dashboard-summary',
  ALERTS_SUMMARY: '/api/aggregated/alerts-summary',
  PREDICTION_LATEST: '/api/aggregated/prediction-latest',
  CACHE_STATS: '/api/aggregated/cache-stats',
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 5000,  // 5 seconds
  MAX_DELAY: 10000,     // 10 seconds
  BACKOFF_MULTIPLIER: 1.5,
} as const;

// Log Levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 26.1445, lng: 91.7362 }, // Guwahati
  DEFAULT_ZOOM: 8,
  CLUSTER_RADIUS: 5000, // 5km in meters
  MAX_MARKERS: 100,
} as const;

// Battery Thresholds
export const BATTERY_THRESHOLDS = {
  CRITICAL: 20,
  LOW: 40,
  GOOD: 70,
} as const;

// Signal Strength Thresholds (dBm)
export const SIGNAL_THRESHOLDS = {
  EXCELLENT: -60,
  GOOD: -70,
  FAIR: -80,
  POOR: -90,
} as const;

// Helper function to get WQI grade
export function getWQIGrade(wqi: number) {
  if (wqi <= WQI_GRADES.EXCELLENT.max) return WQI_GRADES.EXCELLENT;
  if (wqi <= WQI_GRADES.GOOD.max) return WQI_GRADES.GOOD;
  if (wqi <= WQI_GRADES.FAIR.max) return WQI_GRADES.FAIR;
  if (wqi <= WQI_GRADES.POOR.max) return WQI_GRADES.POOR;
  return WQI_GRADES.VERY_POOR;
}

// Helper function to get risk level
export function getRiskLevel(score: number) {
  if (score <= RISK_LEVELS.LOW.max) return RISK_LEVELS.LOW;
  if (score <= RISK_LEVELS.MEDIUM.max) return RISK_LEVELS.MEDIUM;
  if (score <= RISK_LEVELS.HIGH.max) return RISK_LEVELS.HIGH;
  return RISK_LEVELS.CRITICAL;
}
