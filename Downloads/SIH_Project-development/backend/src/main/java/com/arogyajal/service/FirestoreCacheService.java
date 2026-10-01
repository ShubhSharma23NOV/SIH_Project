package com.arogyajal.service;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Firestore Cache Service - Reduces repeated reads with TTL-based caching
 * Tracks read reduction metrics
 */
@Service
public class FirestoreCacheService {
    
    private static final Logger log = LoggerFactory.getLogger(FirestoreCacheService.class);
    
    // Cache with 60-second TTL for frequently accessed data
    private final Cache<String, Object> cache = CacheBuilder.newBuilder()
            .expireAfterWrite(60, TimeUnit.SECONDS)
            .maximumSize(100)
            .recordStats()
            .build();
    
    // Metrics tracking
    private long totalReads = 0;
    private long cachedReads = 0;
    private long firestoreReads = 0;
    
    /**
     * Get data from cache or fetch from Firestore
     */
    public <T> T getOrFetch(String key, Supplier<T> firestoreSupplier) {
        totalReads++;
        
        @SuppressWarnings("unchecked")
        T cached = (T) cache.getIfPresent(key);
        
        if (cached != null) {
            cachedReads++;
            log.debug("✓ Cache HIT: {} (saved Firestore read)", key);
            return cached;
        }
        
        // Cache miss - fetch from Firestore
        firestoreReads++;
        log.debug("✗ Cache MISS: {} (Firestore read)", key);
        T data = firestoreSupplier.get();
        
        if (data != null) {
            cache.put(key, data);
        }
        
        return data;
    }
    
    /**
     * Invalidate specific cache entry
     */
    public void invalidate(String key) {
        cache.invalidate(key);
        log.debug("Cache invalidated: {}", key);
    }
    
    /**
     * Invalidate all cache entries
     */
    public void invalidateAll() {
        cache.invalidateAll();
        log.info("All cache entries invalidated");
    }
    
    /**
     * Get cache statistics
     */
    public CacheStats getStats() {
        double hitRate = totalReads > 0 ? (cachedReads * 100.0 / totalReads) : 0;
        double reduction = totalReads > 0 ? (cachedReads * 100.0 / totalReads) : 0;
        
        return new CacheStats(
                totalReads,
                cachedReads,
                firestoreReads,
                hitRate,
                reduction,
                cache.size()
        );
    }
    
    /**
     * Reset metrics
     */
    public void resetStats() {
        totalReads = 0;
        cachedReads = 0;
        firestoreReads = 0;
        log.info("Cache statistics reset");
    }
    
    public static class CacheStats {
        public final long totalReads;
        public final long cachedReads;
        public final long firestoreReads;
        public final double hitRate;
        public final double readReduction;
        public final long cacheSize;
        
        public CacheStats(long totalReads, long cachedReads, long firestoreReads, 
                         double hitRate, double readReduction, long cacheSize) {
            this.totalReads = totalReads;
            this.cachedReads = cachedReads;
            this.firestoreReads = firestoreReads;
            this.hitRate = hitRate;
            this.readReduction = readReduction;
            this.cacheSize = cacheSize;
        }
        
        @Override
        public String toString() {
            return String.format(
                "CacheStats{total=%d, cached=%d, firestore=%d, hitRate=%.1f%%, reduction=%.1f%%, size=%d}",
                totalReads, cachedReads, firestoreReads, hitRate, readReduction, cacheSize
            );
        }
    }
}
