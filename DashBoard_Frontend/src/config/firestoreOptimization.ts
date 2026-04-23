/**
 * Firestore Optimization Configuration
 * Centralized settings for polling, caching, and read reduction
 */

export const FIRESTORE_OPTIMIZATION = {
  // Polling intervals (milliseconds)
  POLLING: {
    DASHBOARD: 20000,        // 20s (was ~10s)
    ALERTS: 30000,           // 30s (was ~10s)
    ML_PREDICTIONS: 45000,   // 45s (was ~10s)
    SENSOR_MAP: 30000,       // 30s for map updates
    TRENDS: 60000,           // 60s for trend charts
  },

  // Cache TTL (milliseconds)
  CACHE_TTL: {
    DEVICE_LIST: 60000,      // 1 minute
    ALERTS: 30000,           // 30 seconds
    PREDICTIONS: 45000,      // 45 seconds
    STATIC_DATA: 300000,     // 5 minutes for config/metadata
  },

  // Debounce delays (milliseconds)
  DEBOUNCE: {
    FILTER_CHANGE: 500,      // Wait 500ms after filter change
    SEARCH_INPUT: 400,       // Wait 400ms after search input
    MAP_ZOOM: 600,           // Wait 600ms after map zoom/pan
  },

  // Batch settings
  BATCH: {
    MAX_DEVICES_PER_QUERY: 10,  // Batch device queries
    MAX_ALERTS_PER_PAGE: 20,    // Limit alert pagination
  },

  // Feature flags
  FEATURES: {
    USE_AGGREGATED_ENDPOINTS: true,  // Use /api/aggregated/* endpoints
    ENABLE_CLIENT_CACHE: true,       // Enable browser-side caching
    USE_SNAPSHOT_LISTENERS: false,   // Use polling instead (safer for quota)
    LOG_READ_METRICS: true,          // Track read operations
  },

  // Aggregated endpoint URLs
  ENDPOINTS: {
    DASHBOARD_SUMMARY: '/api/aggregated/dashboard-summary',
    ALERTS_SUMMARY: '/api/aggregated/alerts-summary',
    PREDICTION_LATEST: '/api/aggregated/prediction-latest',
    CACHE_STATS: '/api/aggregated/cache-stats',
  },
};

/**
 * Read metrics tracker
 */
class ReadMetricsTracker {
  private reads: Map<string, number> = new Map();
  private startTime: number = Date.now();

  trackRead(feature: string, count: number = 1) {
    const current = this.reads.get(feature) || 0;
    this.reads.set(feature, current + count);
  }

  getMetrics() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const total = Array.from(this.reads.values()).reduce((a, b) => a + b, 0);
    
    return {
      totalReads: total,
      readsPerMinute: elapsed > 0 ? (total / elapsed).toFixed(2) : 0,
      byFeature: Object.fromEntries(this.reads),
      elapsedMinutes: elapsed.toFixed(2),
    };
  }

  reset() {
    this.reads.clear();
    this.startTime = Date.now();
  }
}

export const readMetrics = new ReadMetricsTracker();

/**
 * Simple in-memory cache with TTL
 */
class SimpleCache<T> {
  private cache: Map<string, { data: T; expires: number }> = new Map();

  set(key: string, data: T, ttl: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const clientCache = new SimpleCache();

/**
 * Debounce utility
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
