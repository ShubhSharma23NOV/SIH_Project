package com.arogyajal.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
@RequestMapping("/api/cache")
@Tag(name = "Cache Controller", description = "APIs for cache management")
public class CacheController {
    
    private static final Logger log = LoggerFactory.getLogger(CacheController.class);
    private final CacheManager cacheManager;
    
    public CacheController(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }
    
    @PostMapping("/clear")
    @Operation(summary = "Clear all caches", description = "Clear all cached data to force fresh data from Firestore")
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        log.info("Clearing all caches...");
        
        Map<String, Object> response = new HashMap<>();
        int clearedCount = 0;
        
        try {
            for (String cacheName : cacheManager.getCacheNames()) {
                var cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                    clearedCount++;
                    log.info("Cleared cache: {}", cacheName);
                }
            }
            
            response.put("success", true);
            response.put("message", "All caches cleared successfully");
            response.put("cachesCleared", clearedCount);
            response.put("cacheNames", cacheManager.getCacheNames());
            
            log.info("Successfully cleared {} caches", clearedCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error clearing caches: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error clearing caches: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/clear/{cacheName}")
    @Operation(summary = "Clear specific cache", description = "Clear a specific cache by name")
    public ResponseEntity<Map<String, Object>> clearCache(@PathVariable String cacheName) {
        log.info("Clearing cache: {}", cacheName);
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                response.put("success", true);
                response.put("message", "Cache cleared: " + cacheName);
                log.info("Successfully cleared cache: {}", cacheName);
            } else {
                response.put("success", false);
                response.put("message", "Cache not found: " + cacheName);
                log.warn("Cache not found: {}", cacheName);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error clearing cache {}: {}", cacheName, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error clearing cache: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/info")
    @Operation(summary = "Get cache info", description = "Get information about all caches")
    public ResponseEntity<Map<String, Object>> getCacheInfo() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            response.put("cacheNames", cacheManager.getCacheNames());
            response.put("totalCaches", cacheManager.getCacheNames().size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting cache info: {}", e.getMessage(), e);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
