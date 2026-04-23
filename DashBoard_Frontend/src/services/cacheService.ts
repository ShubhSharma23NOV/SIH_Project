/**
 * Enhanced Cache Service
 * Provides in-memory caching with TTL and retry logic
 */

import { CACHE_TTL, RETRY_CONFIG } from '../constants/appConstants';
import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readMetrics: Map<string, number> = new Map();

  /**
   * Get data from cache or fetch with retry logic
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL.SENSOR_DATA
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.cacheHit(key);
      return cached;
    }

    logger.cacheMiss(key);

    // Fetch with retry logic
    const data = await this.fetchWithRetry(fetchFn, key);
    
    // Store in cache
    this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.SENSOR_DATA): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    logger.debug(`Cache set: ${key}`, { ttl });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache invalidated: ${key}`);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
    logger.info('All cache invalidated');
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => this.cache.delete(key));
    logger.debug(`Cache invalidated by pattern: ${pattern}`, { count: matchingKeys.length });
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    context: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      logger.time(`fetch-${context}`);
      const data = await fetchFn();
      logger.timeEnd(`fetch-${context}`);
      
      // Track successful read
      this.trackRead(context);
      
      return data;
    } catch (error) {
      logger.warn(`Fetch attempt ${attempt} failed for ${context}`, { error });

      if (attempt >= RETRY_CONFIG.MAX_ATTEMPTS) {
        logger.error(`Max retry attempts reached for ${context}`, error);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
        RETRY_CONFIG.MAX_DELAY
      );

      logger.info(`Retrying ${context} in ${delay}ms...`);
      await this.sleep(delay);

      return this.fetchWithRetry(fetchFn, context, attempt + 1);
    }
  }

  /**
   * Track read metrics
   */
  private trackRead(key: string): void {
    const current = this.readMetrics.get(key) || 0;
    this.readMetrics.set(key, current + 1);
  }

  /**
   * Get read metrics
   */
  getMetrics() {
    const totalReads = Array.from(this.readMetrics.values()).reduce((a, b) => a + b, 0);
    const cacheSize = this.cache.size;
    
    return {
      totalReads,
      cacheSize,
      readsByKey: Object.fromEntries(this.readMetrics),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.readMetrics.clear();
    logger.info('Cache metrics reset');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    const stats = {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, entry]) => now - entry.timestamp <= entry.ttl).length,
      expiredEntries: entries.filter(([_, entry]) => now - entry.timestamp > entry.ttl).length,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(([_, entry]) => entry.timestamp))
        : null,
    };

    return stats;
  }
}

export const cacheService = new CacheService();
