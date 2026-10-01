package com.arogyajal.controller;

import com.arogyajal.service.FirestoreCacheService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;

/**
 * Aggregated endpoints to reduce multiple Firestore reads
 * Single endpoint = Single Firestore query
 */
@RestController
@RequestMapping("/api/aggregated")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Tag(name = "Aggregated API", description = "Optimized endpoints with reduced Firestore reads")
public class DashboardAggregatorController {
    
    private static final Logger log = LoggerFactory.getLogger(DashboardAggregatorController.class);
    
    private final Firestore firestore;
    private final FirestoreCacheService cacheService;
    
    public DashboardAggregatorController(FirestoreCacheService cacheService) {
        this.firestore = FirestoreClient.getFirestore();
        this.cacheService = cacheService;
    }
    
    /**
     * Dashboard Summary - Single read with all key metrics
     * Replaces: 3-4 separate Firestore queries
     */
    @GetMapping("/dashboard-summary")
    @Operation(summary = "Get dashboard summary", 
              description = "Single optimized query for dashboard metrics")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            @RequestParam(value = "state", required = false, defaultValue = "Assam") String state) {
        
        log.info("📊 Dashboard summary requested for state: {}", state);
        
        return cacheService.getOrFetch(
            "dashboard_summary_" + state,
            () -> {
                try {
                    Map<String, Object> summary = new HashMap<>();
                    
                    // Get latest prediction (1 read)
                    List<QueryDocumentSnapshot> predictions = firestore.collection("outbreak_predictions")
                            .whereEqualTo("state", state)
                            .orderBy("timestamp", Query.Direction.DESCENDING)
                            .limit(1)
                            .get().get().getDocuments();
                    
                    if (!predictions.isEmpty()) {
                        QueryDocumentSnapshot pred = predictions.get(0);
                        summary.put("riskScore", pred.getDouble("riskScore"));
                        summary.put("riskLevel", pred.getString("riskLevel"));
                        summary.put("confidence", pred.getDouble("confidence"));
                        summary.put("location", pred.getString("location"));
                        summary.put("timestamp", pred.getTimestamp("timestamp").toDate().toInstant().toString());
                    }
                    
                    // Get active clusters count (already in memory from ML sync)
                    List<QueryDocumentSnapshot> clusters = firestore.collection("symptom_clusters")
                            .whereEqualTo("state", state)
                            .get().get().getDocuments();
                    
                    summary.put("activeClusters", clusters.size());
                    
                    // Count sensors by status
                    List<QueryDocumentSnapshot> sensors = firestore.collection("sensor_readings")
                            .limit(50)
                            .get().get().getDocuments();
                    
                    long poorSensors = sensors.stream()
                            .filter(s -> "POOR".equals(s.getString("qualityStatus")) || 
                                        "CRITICAL".equals(s.getString("qualityStatus")))
                            .count();
                    
                    summary.put("totalSensors", sensors.size());
                    summary.put("poorQualitySensors", poorSensors);
                    
                    log.info("✅ Dashboard summary compiled (3 Firestore reads)");
                    return ResponseEntity.ok(summary);
                    
                } catch (Exception e) {
                    log.error("Error fetching dashboard summary", e);
                    return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
                }
            }
        );
    }
    
    /**
     * Alerts Summary - Active alerts only
     * Replaces: Multiple alert queries
     */
    @GetMapping("/alerts-summary")
    @Operation(summary = "Get active alerts summary")
    public ResponseEntity<Map<String, Object>> getAlertsSummary() {
        
        log.info("🚨 Alerts summary requested");
        
        return cacheService.getOrFetch(
            "alerts_summary",
            () -> {
                try {
                    List<QueryDocumentSnapshot> alerts = firestore.collection("water_alerts")
                            .whereEqualTo("active", true)
                            .limit(20)
                            .get().get().getDocuments();
                    
                    List<Map<String, Object>> alertList = new ArrayList<>();
                    for (QueryDocumentSnapshot doc : alerts) {
                        Map<String, Object> alert = new HashMap<>();
                        alert.put("id", doc.getId());
                        alert.put("area", doc.getString("area"));
                        alert.put("severity", doc.getString("severity"));
                        alert.put("message", doc.getString("message"));
                        alert.put("timestamp", doc.getTimestamp("timestamp").toDate().toInstant().toString());
                        alertList.add(alert);
                    }
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("alerts", alertList);
                    response.put("count", alertList.size());
                    
                    log.info("✅ Alerts summary compiled (1 Firestore read, {} alerts)", alertList.size());
                    return ResponseEntity.ok(response);
                    
                } catch (Exception e) {
                    log.error("Error fetching alerts summary", e);
                    return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
                }
            }
        );
    }
    
    /**
     * Latest Prediction - Cached result
     * Replaces: Repeated prediction queries
     */
    @GetMapping("/prediction-latest")
    @Operation(summary = "Get latest outbreak prediction")
    public ResponseEntity<Map<String, Object>> getLatestPrediction(
            @RequestParam(value = "state", required = false, defaultValue = "Assam") String state) {
        
        log.info("🔮 Latest prediction requested for state: {}", state);
        
        return cacheService.getOrFetch(
            "prediction_latest_" + state,
            () -> {
                try {
                    List<QueryDocumentSnapshot> predictions = firestore.collection("outbreak_predictions")
                            .whereEqualTo("state", state)
                            .orderBy("timestamp", Query.Direction.DESCENDING)
                            .limit(1)
                            .get().get().getDocuments();
                    
                    if (predictions.isEmpty()) {
                        return ResponseEntity.notFound().build();
                    }
                    
                    QueryDocumentSnapshot pred = predictions.get(0);
                    Map<String, Object> response = new HashMap<>();
                    response.put("riskScore", pred.getDouble("riskScore"));
                    response.put("riskLevel", pred.getString("riskLevel"));
                    response.put("confidence", pred.getDouble("confidence"));
                    response.put("location", pred.getString("location"));
                    response.put("timestamp", pred.getTimestamp("timestamp").toDate().toInstant().toString());
                    response.put("factors", pred.get("factors"));
                    
                    log.info("✅ Latest prediction fetched (1 Firestore read)");
                    return ResponseEntity.ok(response);
                    
                } catch (Exception e) {
                    log.error("Error fetching latest prediction", e);
                    return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
                }
            }
        );
    }
    
    /**
     * Cache Statistics - Monitor optimization effectiveness
     */
    @GetMapping("/cache-stats")
    @Operation(summary = "Get cache statistics")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        FirestoreCacheService.CacheStats stats = cacheService.getStats();
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalReads", stats.totalReads);
        response.put("cachedReads", stats.cachedReads);
        response.put("firestoreReads", stats.firestoreReads);
        response.put("hitRate", String.format("%.1f%%", stats.hitRate));
        response.put("readReduction", String.format("%.1f%%", stats.readReduction));
        response.put("cacheSize", stats.cacheSize);
        
        log.info("📈 Cache stats: {}", stats);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Reset cache statistics
     */
    @PostMapping("/cache-stats/reset")
    @Operation(summary = "Reset cache statistics")
    public ResponseEntity<Map<String, Object>> resetCacheStats() {
        cacheService.resetStats();
        return ResponseEntity.ok(Map.of("message", "Cache statistics reset"));
    }
}
