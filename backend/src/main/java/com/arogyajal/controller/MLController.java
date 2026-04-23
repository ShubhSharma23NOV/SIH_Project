package com.arogyajal.controller;

import com.arogyajal.model.OutbreakPrediction;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.service.SymptomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Controller for ML-related endpoints
 * Proxies requests to the Python ML service
 */
@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
@RequestMapping("/api")
@Tag(name = "ML Controller", description = "APIs for ML predictions and analysis")
public class MLController {
    
    private static final Logger log = LoggerFactory.getLogger(MLController.class);
    
    @Value("${ml.python.api.url:http://localhost:5000}")
    private String mlServiceUrl;
    
    private final RestTemplate restTemplate;
    private final SymptomService symptomService;
    private final CacheManager cacheManager;
    private final com.arogyajal.service.SymptomClusterService clusterService;
    private final com.arogyajal.service.OutbreakPredictionService outbreakPredictionService;
    private final com.arogyajal.scheduler.MLSyncScheduler mlSyncScheduler;
    
    // Simple cache for symptom clusters (30 second TTL)
    private Map<String, Object> cachedSymptomClusters = null;
    private long clusterCacheTimestamp = 0;
    private static final long CLUSTER_CACHE_TTL_MS = 30000; // 30 seconds
    
    public MLController(RestTemplate restTemplate, SymptomService symptomService, CacheManager cacheManager, 
                       com.arogyajal.service.SymptomClusterService clusterService,
                       com.arogyajal.service.OutbreakPredictionService outbreakPredictionService,
                       com.arogyajal.scheduler.MLSyncScheduler mlSyncScheduler) {
        this.restTemplate = restTemplate;
        this.symptomService = symptomService;
        this.outbreakPredictionService = outbreakPredictionService;
        this.cacheManager = cacheManager;
        this.clusterService = clusterService;
        this.mlSyncScheduler = mlSyncScheduler;
    }
    
    /**
     * Get symptom clusters from ML service
     * Fetches symptom reports from database and sends to ML service for clustering
     * CACHED for 30 seconds to reduce redundant ML calls
     */
    @GetMapping("/symptom-clusters")
    @Operation(summary = "Get symptom clusters", description = "Retrieve symptom clustering analysis from ML service")
    public ResponseEntity<Map<String, Object>> getSymptomClusters() {
        log.info("Fetching symptom clusters from ML service");
        
        // Check cache first
        long now = System.currentTimeMillis();
        if (cachedSymptomClusters != null && (now - clusterCacheTimestamp) < CLUSTER_CACHE_TTL_MS) {
            log.info("✅ Returning cached symptom clusters (age: {}ms)", now - clusterCacheTimestamp);
            return ResponseEntity.ok(cachedSymptomClusters);
        }
        
        try {
            // First check if ML service is available
            String healthUrl = mlServiceUrl + "/health";
            try {
                restTemplate.getForEntity(healthUrl, Map.class);
            } catch (Exception e) {
                log.warn("ML service not available, returning empty response");
                return ResponseEntity.ok(createEmptyClusterResponse());
            }
            
            // Fetch symptom reports from database
            List<SymptomReport> reports = symptomService.getAllSymptomReports();
            
            if (reports.isEmpty()) {
                log.info("No symptom reports available for clustering");
                Map<String, Object> emptyResponse = createEmptyClusterResponse();
                cachedSymptomClusters = emptyResponse;
                clusterCacheTimestamp = now;
                return ResponseEntity.ok(emptyResponse);
            }
            
            log.info("Fetched {} symptom reports for clustering", reports.size());
            
            // Transform reports for ML service
            List<Map<String, Object>> transformedReports = new ArrayList<>();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            
            for (SymptomReport report : reports) {
                Map<String, Object> transformed = new HashMap<>();
                transformed.put("id", report.getId());
                transformed.put("location", report.getLocation());
                transformed.put("symptoms", report.getSymptoms());
                transformed.put("severity", report.getSeverity());
                transformed.put("geoLocation", report.getGeoLocation());
                
                // Convert timestamp to ISO format without timezone
                if (report.getReportedAt() != null) {
                    Instant instant = Instant.ofEpochSecond(report.getReportedAt().getSeconds());
                    transformed.put("reportDate", formatter.format(instant.atZone(ZoneId.systemDefault())));
                } else {
                    transformed.put("reportDate", formatter.format(Instant.now().atZone(ZoneId.systemDefault())));
                }
                
                transformedReports.add(transformed);
            }
            
            // Call ML clustering endpoint
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("reports", transformedReports);
            
            String clusterUrl = mlServiceUrl + "/api/ml/cluster";
            log.info("Calling ML clustering at: {}", clusterUrl);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(clusterUrl, requestBody, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                result.put("total_reports", reports.size());
                log.info("Successfully clustered {} reports into {} clusters", 
                        reports.size(), result.get("cluster_count"));
                
                // Update cache
                cachedSymptomClusters = result;
                clusterCacheTimestamp = now;
                
                // PERMANENT FIX: Save clusters to Firestore (after cache update)
                saveClustersToFirestore(result);
                
                // Evict dashboard stats cache since cluster count changed
                evictDashboardCache();
                
                return ResponseEntity.ok(result);
            } else {
                log.warn("ML clustering returned non-success status");
                Map<String, Object> emptyResponse = createEmptyClusterResponse();
                cachedSymptomClusters = emptyResponse;
                clusterCacheTimestamp = now;
                return ResponseEntity.ok(emptyResponse);
            }
            
        } catch (Exception e) {
            log.error("Error fetching symptom clusters from ML service", e);
            Map<String, Object> emptyResponse = createEmptyClusterResponse();
            // Cache error response too to avoid repeated failures
            cachedSymptomClusters = emptyResponse;
            clusterCacheTimestamp = now;
            return ResponseEntity.ok(emptyResponse);
        }
    }
    
    /**
     * Manually trigger symptom clustering analysis
     * POST endpoint for frontend "Run ML Clustering" button
     * Clears cache to force fresh clustering
     */
    @PostMapping("/symptom-clusters/analyze")
    @Operation(summary = "Trigger clustering analysis", description = "Manually trigger ML clustering analysis")
    public ResponseEntity<Map<String, Object>> triggerClustering() {
        log.info("Manual clustering analysis triggered - clearing cache");
        
        // Clear cache to force fresh clustering
        cachedSymptomClusters = null;
        clusterCacheTimestamp = 0;
        
        ResponseEntity<Map<String, Object>> result = getSymptomClusters();
        
        // Evict dashboard cache after manual clustering
        evictDashboardCache();
        
        return result;
    }
    
    /**
     * Helper method to evict dashboard cache when clusters change
     */
    private void evictDashboardCache() {
        try {
            if (cacheManager.getCache("stats") != null) {
                // Evict both cache keys used by dashboard
                cacheManager.getCache("stats").evict("dashboard");
                cacheManager.getCache("stats").evict("dashboard-stats");
                log.info("✅ Evicted dashboard stats cache after clustering");
            }
        } catch (Exception e) {
            log.warn("Failed to evict dashboard cache: {}", e.getMessage());
        }
    }
    
    /**
     * Get outbreak predictions from ML service
     * Fetches data from database and sends to ML service for prediction
     */
    @GetMapping("/outbreak-predictions")
    @Operation(summary = "Get outbreak predictions", description = "Retrieve outbreak prediction analysis from ML service")
    public ResponseEntity<Map<String, Object>> getOutbreakPredictions() {
        log.info("Fetching outbreak predictions from ML service");
        
        try {
            // Check if ML service is available
            String healthUrl = mlServiceUrl + "/health";
            try {
                restTemplate.getForEntity(healthUrl, Map.class);
            } catch (Exception e) {
                log.warn("ML service not available, returning empty response");
                return ResponseEntity.ok(createEmptyOutbreakResponse());
            }
            
            // Get clusters from ML service
            ResponseEntity<Map<String, Object>> clusterResponse = getSymptomClusters();
            Map<String, Object> clusterData = clusterResponse.getBody();
            
            if (clusterData == null || !clusterData.containsKey("clusters")) {
                log.info("No cluster data available for outbreak prediction");
                return ResponseEntity.ok(createEmptyOutbreakResponse());
            }
            
            // Prepare data for ML outbreak prediction
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("clusters", clusterData.get("clusters"));
            requestBody.put("water_tests", new ArrayList<>());
            requestBody.put("reports", new ArrayList<>());
            
            String outbreakUrl = mlServiceUrl + "/api/ml/predict-outbreak";
            log.info("Calling ML outbreak prediction at: {}", outbreakUrl);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(outbreakUrl, requestBody, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                
                // Check if contributing factors are all zero and calculate fallback
                Object factorsObj = result.get("contributing_factors");
                if (factorsObj == null) {
                    factorsObj = result.get("risk_factors"); // Try alternate key
                }
                
                if (factorsObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> factors = (Map<String, Object>) factorsObj;
                    boolean allZero = factors.values().stream()
                        .allMatch(v -> v instanceof Number && ((Number) v).doubleValue() == 0.0);
                    
                    if (allZero) {
                        log.warn("⚠️ ML service returned zero contributing factors, calculating fallback");
                        double riskScore = result.get("risk_score") instanceof Number 
                            ? ((Number) result.get("risk_score")).doubleValue() 
                            : 0.0;
                        Map<String, Double> calculatedFactors = calculateContributingFactors(clusterData, riskScore);
                        result.put("contributing_factors", calculatedFactors);
                        log.info("✅ Applied fallback contributing factors");
                    }
                }
                
                log.info("Successfully predicted outbreak risk: {}", result.get("risk_level"));
                return ResponseEntity.ok(result);
            } else {
                log.warn("ML outbreak prediction returned non-success status");
                return ResponseEntity.ok(createEmptyOutbreakResponse());
            }
            
        } catch (Exception e) {
            log.error("Error fetching outbreak predictions from ML service", e);
            return ResponseEntity.ok(createEmptyOutbreakResponse());
        }
    }
    
    /**
     * Get risk assessment from ML service
     */
    /**
     * Get latest outbreak predictions from ML service
     * Alias for /outbreak-predictions for frontend compatibility
     */
    @GetMapping("/outbreak-predictions/latest")
    @Operation(summary = "Get latest outbreak predictions", description = "Retrieve latest stored outbreak prediction from Firestore")
    public ResponseEntity<Map<String, Object>> getLatestOutbreakPredictions(
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "district", required = false) String district,
            @RequestParam(value = "city", required = false) String city) {
        
        String filterLocation = location != null ? location : 
                               (city != null ? city : 
                               (district != null ? district : 
                               (state != null ? state : null)));
        
        if (filterLocation != null) {
            log.info("Fetching latest outbreak prediction for location: {}", filterLocation);
        } else {
            log.info("Fetching latest outbreak prediction from Firestore (all locations)");
        }
        
        try {
            OutbreakPrediction latest = filterLocation != null ? 
                outbreakPredictionService.getLatestPredictionByLocation(filterLocation) :
                outbreakPredictionService.getLatestPrediction();
            if (latest == null) {
                log.warn("No predictions found in Firestore, fetching from ML service");
                return getOutbreakPredictions();
            }
            
            // Convert to ML response format for dashboard compatibility
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("risk_score", latest.getRiskScore());
            response.put("risk_level", latest.getRiskLevel());
            response.put("confidence", latest.getConfidence());
            response.put("contributing_factors", latest.getContributingFactors());
            response.put("recommendations", latest.getRecommendedActions());
            
            // Check if contributing factors are all zero and calculate fallback
            Object factorsObj = latest.getContributingFactors();
            if (factorsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> factors = (Map<String, Object>) factorsObj;
                boolean allZero = factors.values().stream()
                    .allMatch(v -> v instanceof Number && ((Number) v).doubleValue() == 0.0);
                
                if (allZero && latest.getRiskScore() != null && latest.getRiskScore() > 0) {
                    log.warn("⚠️ Stored prediction has zero contributing factors, calculating fallback");
                    
                    // Get cluster data for calculation
                    ResponseEntity<Map<String, Object>> clusterResponse = getSymptomClusters();
                    Map<String, Object> clusterData = clusterResponse.getBody();
                    
                    if (clusterData != null) {
                        Map<String, Double> calculatedFactors = calculateContributingFactors(
                            clusterData, 
                            latest.getRiskScore()
                        );
                        response.put("contributing_factors", calculatedFactors);
                        log.info("✅ Applied fallback contributing factors to stored prediction");
                    }
                }
            }
            
            log.info("✅ Returning stored prediction: Risk={} ({}), Confidence={}%", 
                    latest.getRiskScore(), latest.getRiskLevel(), latest.getConfidence());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching latest prediction from Firestore: {}", e.getMessage());
            return getOutbreakPredictions(); // Fallback to ML service
        }
    }
    
    @GetMapping("/risk-assessment")
    @Operation(summary = "Get risk assessment", description = "Retrieve risk assessment analysis from ML service")
    public ResponseEntity<Map<String, Object>> getRiskAssessment(
            @RequestParam(required = false) String location) {
        log.info("Fetching risk assessment from ML service for location: {}", location);
        
        try {
            // Check if ML service is available
            String healthUrl = mlServiceUrl + "/health";
            try {
                restTemplate.getForEntity(healthUrl, Map.class);
            } catch (Exception e) {
                log.warn("ML service not available, returning empty response");
                return ResponseEntity.ok(createEmptyRiskResponse());
            }
            
            // ML service is available but needs data
            // TODO: Fetch reports, clusters, and water tests for the location
            log.info("ML service available but risk assessment requires location data");
            return ResponseEntity.ok(createEmptyRiskResponse());
            
        } catch (Exception e) {
            log.error("Error fetching risk assessment from ML service", e);
            return ResponseEntity.ok(createEmptyRiskResponse());
        }
    }
    
    /**
     * Predict water quality from ML service
     */
    @PostMapping("/predict-wqi")
    @Operation(summary = "Predict water quality", description = "Predict water quality index from sensor parameters")
    public ResponseEntity<Map<String, Object>> predictWQI(@RequestBody Map<String, Object> sensorData) {
        log.info("Predicting WQI from ML service");
        
        try {
            String url = mlServiceUrl + "/predict";
            log.info("Calling ML service at: {}", url);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, sensorData, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Successfully predicted WQI");
                return ResponseEntity.ok((Map<String, Object>) response.getBody());
            } else {
                log.warn("ML service returned non-success status: {}", response.getStatusCode());
                Map<String, Object> fallback = new HashMap<>();
                fallback.put("wqi", 50.0);
                fallback.put("quality_status", "Medium");
                fallback.put("error", "ML service unavailable");
                return ResponseEntity.ok(fallback);
            }
            
        } catch (Exception e) {
            log.error("Error predicting WQI from ML service", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("wqi", 50.0);
            fallback.put("quality_status", "Medium");
            fallback.put("error", e.getMessage());
            return ResponseEntity.ok(fallback);
        }
    }
    
    /**
     * ML service health check
     */
    @GetMapping("/ml/health")
    @Operation(summary = "ML service health check", description = "Check if ML service is available")
    public ResponseEntity<Map<String, Object>> mlHealthCheck() {
        log.info("Checking ML service health");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String url = mlServiceUrl + "/health";
            ResponseEntity<Map> mlResponse = restTemplate.getForEntity(url, Map.class);
            
            if (mlResponse.getStatusCode().is2xxSuccessful()) {
                response.put("status", "UP");
                response.put("mlService", "AVAILABLE");
                response.put("mlServiceUrl", mlServiceUrl);
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "DOWN");
                response.put("mlService", "UNAVAILABLE");
                response.put("mlServiceUrl", mlServiceUrl);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
            }
            
        } catch (Exception e) {
            log.error("ML service health check failed", e);
            response.put("status", "DOWN");
            response.put("mlService", "UNAVAILABLE");
            response.put("mlServiceUrl", mlServiceUrl);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
    
    /**
     * Calculate contributing factors from available data when ML service doesn't provide them
     * This provides a reasonable fallback based on actual data
     */
    private Map<String, Double> calculateContributingFactors(
            Map<String, Object> clusterData,
            double riskScore) {
        
        Map<String, Double> factors = new HashMap<>();
        
        try {
            // Get cluster count and analyze severity
            Object clustersObj = clusterData.get("clusters");
            int clusterCount = 0;
            int highRiskClusters = 0;
            
            if (clustersObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> clusters = (List<Map<String, Object>>) clustersObj;
                clusterCount = clusters.size();
                
                // Count high-risk clusters (score > 75)
                for (Map<String, Object> cluster : clusters) {
                    Object scoreObj = cluster.get("cluster_score");
                    if (scoreObj instanceof Number) {
                        double score = ((Number) scoreObj).doubleValue();
                        if (score > 75) {
                            highRiskClusters++;
                        }
                    }
                }
            }
            
            // Calculate cluster factor (0-100)
            // More clusters = higher risk, high-risk clusters increase factor
            double clusterFactor = 0.0;
            if (clusterCount > 0) {
                double baseClusterRisk = Math.min(100, (clusterCount / 5.0) * 100); // 5+ clusters = 100%
                double severityMultiplier = highRiskClusters > 0 ? (highRiskClusters / (double) clusterCount) : 0.5;
                clusterFactor = baseClusterRisk * severityMultiplier;
            }
            
            // Get report count
            int reportCount = 0;
            Object totalReportsObj = clusterData.get("total_reports");
            if (totalReportsObj instanceof Number) {
                reportCount = ((Number) totalReportsObj).intValue();
            }
            
            // Calculate report factor (0-100)
            // More reports = higher risk
            double reportFactor = Math.min(100, (reportCount / 20.0) * 100); // 20+ reports = 100%
            
            // Calculate quality and water factors based on risk score
            // If risk is high but clusters/reports are low, quality/water must be contributing
            double accountedRisk = (clusterFactor * 0.4) + (reportFactor * 0.3);
            double remainingRisk = Math.max(0, riskScore - accountedRisk);
            
            // Distribute remaining risk between quality and water
            double qualityFactor = Math.min(100, remainingRisk * 0.6);
            double waterFactor = Math.min(100, remainingRisk * 0.4);
            
            // Ensure factors are reasonable (at least some contribution if risk > 0)
            if (riskScore > 0) {
                clusterFactor = Math.max(clusterFactor, riskScore * 0.2);
                reportFactor = Math.max(reportFactor, riskScore * 0.2);
                qualityFactor = Math.max(qualityFactor, riskScore * 0.2);
                waterFactor = Math.max(waterFactor, riskScore * 0.2);
            }
            
            factors.put("cluster_factor", Math.round(clusterFactor * 10.0) / 10.0);
            factors.put("report_factor", Math.round(reportFactor * 10.0) / 10.0);
            factors.put("quality_factor", Math.round(qualityFactor * 10.0) / 10.0);
            factors.put("water_factor", Math.round(waterFactor * 10.0) / 10.0);
            
            log.info("📊 Calculated contributing factors: clusters={} (count={}, high-risk={}), reports={} (count={}), quality={}, water={}",
                    factors.get("cluster_factor"), clusterCount, highRiskClusters,
                    factors.get("report_factor"), reportCount,
                    factors.get("quality_factor"), factors.get("water_factor"));
            
        } catch (Exception e) {
            log.error("Error calculating contributing factors: {}", e.getMessage());
            // Return reasonable defaults based on risk score
            double defaultFactor = riskScore / 4.0; // Distribute evenly
            factors.put("cluster_factor", defaultFactor);
            factors.put("report_factor", defaultFactor);
            factors.put("quality_factor", defaultFactor);
            factors.put("water_factor", defaultFactor);
        }
        
        return factors;
    }
    
    // Helper methods to create empty responses
    
    private Map<String, Object> createEmptyClusterResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("clusters", new ArrayList<>());
        response.put("total_reports", 0);
        response.put("num_clusters", 0);
        response.put("message", "No cluster data available - either ML service is unavailable or no symptom reports exist");
        response.put("status", "empty");
        return response;
    }
    
    private Map<String, Object> createEmptyOutbreakResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("outbreak_risk", "LOW");
        response.put("risk_score", 0.0);
        response.put("confidence", 0);
        response.put("affected_locations", new ArrayList<>());
        
        // Add risk_factors structure for frontend compatibility
        Map<String, Double> riskFactors = new HashMap<>();
        riskFactors.put("cluster_factor", 0.0);
        riskFactors.put("report_factor", 0.0);
        riskFactors.put("quality_factor", 0.0);
        riskFactors.put("water_factor", 0.0);
        response.put("risk_factors", riskFactors);
        
        response.put("recommendations", new ArrayList<>());
        response.put("message", "No outbreak data available - either ML service is unavailable or insufficient data");
        response.put("status", "empty");
        return response;
    }
    
    private Map<String, Object> createEmptyRiskResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("overall_risk", "LOW");
        response.put("risk_score", 0.0);
        
        // Add risk_factors structure
        Map<String, Double> riskFactors = new HashMap<>();
        riskFactors.put("symptom_risk", 0.0);
        riskFactors.put("cluster_risk", 0.0);
        riskFactors.put("water_risk", 0.0);
        response.put("risk_factors", riskFactors);
        
        response.put("message", "No risk data available - either ML service is unavailable or no data for location");
        response.put("status", "empty");
        return response;
    }
    
    /**
     * Save ML clustering results to Firestore for persistence
     * This ensures clusters are available for outbreak prediction
     */
    private void saveClustersToFirestore(Map<String, Object> clusteringResult) {
        try {
            // First, clear old clusters
            try {
                List<com.arogyajal.model.SymptomCluster> oldClusters = clusterService.getActiveClusters();
                for (com.arogyajal.model.SymptomCluster old : oldClusters) {
                    clusterService.deleteCluster(old.getId());
                }
                if (!oldClusters.isEmpty()) {
                    log.info("🗑️ Cleared {} old clusters from Firestore", oldClusters.size());
                }
            } catch (Exception e) {
                log.warn("⚠️ Could not clear old clusters: {}", e.getMessage());
            }
            
            // Extract clusters from ML response
            Object clustersObj = clusteringResult.get("clusters");
            if (!(clustersObj instanceof List)) {
                log.warn("⚠️ No clusters array in ML response");
                return;
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> clusters = (List<Map<String, Object>>) clustersObj;
            
            int savedCount = 0;
            for (Map<String, Object> clusterData : clusters) {
                try {
                    // Create SymptomCluster entity
                    com.arogyajal.model.SymptomCluster cluster = new com.arogyajal.model.SymptomCluster();
                    
                    // Set ID (ML sends "cluster_id")
                    String clusterId = (String) clusterData.get("cluster_id");
                    if (clusterId == null) {
                        clusterId = (String) clusterData.get("id"); // fallback
                    }
                    if (clusterId == null) {
                        clusterId = "cluster_" + System.currentTimeMillis() + "_" + savedCount;
                    }
                    cluster.setId(clusterId);
                    
                    // Set location - extract from first report
                    String location = null;
                    Object reportsObj = clusterData.get("reports");
                    if (reportsObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> reports = (List<Map<String, Object>>) reportsObj;
                        if (!reports.isEmpty()) {
                            location = (String) reports.get(0).get("location");
                        }
                    }
                    if (location == null || location.trim().isEmpty()) {
                        location = "Cluster_" + savedCount;
                    }
                    cluster.setLocation(location);
                    
                    // Set cluster score (ML sends "cluster_score")
                    Object scoreObj = clusterData.get("cluster_score");
                    if (scoreObj == null) {
                        scoreObj = clusterData.get("clusterScore"); // fallback
                    }
                    if (scoreObj instanceof Number) {
                        cluster.setClusterScore(((Number) scoreObj).doubleValue());
                    }
                    
                    // Set report count (ML sends "report_count")
                    Object countObj = clusterData.get("report_count");
                    if (countObj == null) {
                        countObj = clusterData.get("reportCount"); // fallback
                    }
                    if (countObj instanceof Number) {
                        cluster.setReportCount(((Number) countObj).intValue());
                    }
                    
                    // Set report IDs (required for validation)
                    List<String> reportIds = new ArrayList<>();
                    if (reportsObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> reports = (List<Map<String, Object>>) reportsObj;
                        for (Map<String, Object> report : reports) {
                            Object idObj = report.get("id");
                            if (idObj != null) {
                                reportIds.add(idObj.toString());
                            }
                        }
                    }
                    cluster.setReportIds(reportIds);
                    
                    log.info("📋 Cluster {} has {} reportIds: {}", clusterId, reportIds.size(), reportIds);
                    
                    // Set dominant symptoms (ML sends "dominant_symptoms" as [[symptom, count], ...])
                    Object symptomsObj = clusterData.get("dominant_symptoms");
                    if (symptomsObj == null) {
                        symptomsObj = clusterData.get("dominantSymptoms"); // fallback
                    }
                    List<String> dominantSymptoms = new ArrayList<>();
                    if (symptomsObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<?> symptomsList = (List<?>) symptomsObj;
                        for (Object item : symptomsList) {
                            if (item instanceof List) {
                                // ML format: [["DIARRHEA", 6], ["VOMITING", 4]]
                                List<?> symptomPair = (List<?>) item;
                                if (!symptomPair.isEmpty()) {
                                    dominantSymptoms.add(symptomPair.get(0).toString());
                                }
                            } else if (item instanceof String) {
                                // Already string format
                                dominantSymptoms.add((String) item);
                            }
                        }
                    }
                    cluster.setDominantSymptoms(dominantSymptoms);
                    
                    // Set status
                    cluster.setStatus("ACTIVE");
                    
                    // Set overall severity based on cluster score
                    // Valid values: MILD, MODERATE, SEVERE, CRITICAL
                    double score = cluster.getClusterScore() != null ? cluster.getClusterScore() : 0;
                    String severity;
                    if (score >= 90) {
                        severity = "CRITICAL";
                    } else if (score >= 75) {
                        severity = "SEVERE";
                    } else if (score >= 50) {
                        severity = "MODERATE";
                    } else {
                        severity = "MILD";
                    }
                    cluster.setOverallSeverity(severity);
                    
                    // Set detection metadata (valid: SPATIAL, TEMPORAL, HYBRID, MANUAL)
                    cluster.setDetectionMethod("HYBRID"); // ML clustering uses spatial + temporal
                    cluster.setDetectedAt(com.google.cloud.Timestamp.now());
                    
                    // Save to Firestore
                    clusterService.createCluster(cluster);
                    savedCount++;
                    
                    log.info("✅ Saved cluster to Firestore: {} (score: {})", 
                            cluster.getLocation(), cluster.getClusterScore());
                    
                } catch (Exception e) {
                    log.error("❌ Failed to save cluster: {}", e.getMessage());
                }
            }
            
            log.info("💾 Saved {} clusters to Firestore for ML outbreak prediction", savedCount);
            
        } catch (Exception e) {
            log.error("❌ Error saving clusters to Firestore: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual trigger for ML sync
     * Immediately triggers ML service sync instead of waiting for scheduled task
     */
    @PostMapping("/ml/sync/trigger")
    @Operation(summary = "Trigger ML sync manually", description = "Manually trigger ML service sync for outbreak prediction")
    public ResponseEntity<Map<String, Object>> triggerMLSync() {
        log.info("🔄 Manual ML sync triggered via API");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Trigger the sync
            mlSyncScheduler.syncWithMLService();
            
            // Get sync stats
            Map<String, Object> stats = mlSyncScheduler.getSyncStats();
            
            response.put("status", "success");
            response.put("message", "ML sync triggered successfully");
            response.put("sync_stats", stats);
            
            log.info("✅ Manual ML sync completed successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Manual ML sync failed: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "ML sync failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
