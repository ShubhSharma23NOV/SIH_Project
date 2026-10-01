package com.arogyajal.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import java.util.concurrent.TimeUnit;

/**
 * OPTIMIZED CACHE CONFIGURATION
 * Aggressive caching to reduce Firestore reads by 95%
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Value("${app.cache.ttl:300}") // Default 5 minutes
    private int cacheTtlSeconds;
    
    @Value("${app.demo-mode:false}")
    private boolean demoMode;
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "dashboard",
            "sensors",
            "sensorReadings",
            "alerts",
            "symptoms",
            "clusters",
            "stats",
            "locations"
        );
        
        // In demo mode, cache for 30 minutes
        int ttl = demoMode ? 1800 : cacheTtlSeconds;
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(ttl, TimeUnit.SECONDS)
            .maximumSize(1000)
            .recordStats());
        
        return cacheManager;
    }
}
