package com.arogyajal.controller;

import com.arogyajal.model.SymptomCluster;
import com.arogyajal.service.SymptomClusterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Symptom Clusters.
 * Provides endpoints for symptom clustering analysis.
 */
@RestController
@RequestMapping("/api/clusters")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
public class SymptomClusterController {

    private static final Logger log = LoggerFactory.getLogger(SymptomClusterController.class);
    
    private final SymptomClusterService clusterService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    // Simple cache for active clusters (30 second TTL)
    private List<Map<String, Object>> cachedActiveClusters = null;
    private long cacheTimestamp = 0;
    private static final long CACHE_TTL_MS = 30000; // 30 seconds

    public SymptomClusterController(SymptomClusterService clusterService) {
        this.clusterService = clusterService;
    }

    /**
     * Create a new symptom cluster
     * POST /api/clusters
     */
    @PostMapping
    public ResponseEntity<?> createCluster(@RequestBody SymptomCluster cluster) {
        try {
            SymptomCluster created = clusterService.createCluster(cluster);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create cluster: " + e.getMessage()));
        }
    }

    /**
     * Get cluster by ID
     * GET /api/clusters/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getClusterById(@PathVariable String id) {
        try {
            SymptomCluster cluster = clusterService.getClusterById(id);
            return ResponseEntity.ok(cluster);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve cluster: " + e.getMessage()));
        }
    }

    /**
     * Get all clusters
     * GET /api/clusters
     */
    @GetMapping
    public ResponseEntity<?> getAllClusters() {
        try {
            List<SymptomCluster> clusters = clusterService.getAllClusters();
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters: " + e.getMessage()));
        }
    }

    /**
     * Get clusters by location
     * GET /api/clusters/location/{location}
     */
    @GetMapping("/location/{location}")
    public ResponseEntity<?> getClustersByLocation(@PathVariable String location) {
        try {
            List<SymptomCluster> clusters = clusterService.getClustersByLocation(location);
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters: " + e.getMessage()));
        }
    }

    /**
     * Get active clusters from ML service
     * GET /api/clusters/active
     * Fetches real-time clusters from ML clustering analysis
     * CACHED for 30 seconds to reduce redundant ML calls
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveClusters() {
        log.info("Fetching active clusters for map display");
        
        // Check cache first
        long now = System.currentTimeMillis();
        if (cachedActiveClusters != null && (now - cacheTimestamp) < CACHE_TTL_MS) {
            log.info("✅ Returning cached active clusters ({} clusters, age: {}ms)", 
                    cachedActiveClusters.size(), now - cacheTimestamp);
            return ResponseEntity.ok(cachedActiveClusters);
        }
        
        try {
            // Get clusters from backend's ML controller (which handles ML service communication)
            String mlUrl = "http://localhost:8080/api/symptom-clusters";
            ResponseEntity<Map> response = restTemplate.getForEntity(mlUrl, Map.class);
            Map<String, Object> clusterData = response.getBody();
            
            if (clusterData == null || !clusterData.containsKey("clusters")) {
                cachedActiveClusters = new ArrayList<>();
                cacheTimestamp = now;
                return ResponseEntity.ok(cachedActiveClusters);
            }
            
            List<Map<String, Object>> mlClusters = (List<Map<String, Object>>) clusterData.get("clusters");
            List<Map<String, Object>> transformedClusters = new ArrayList<>();
            
            for (Map<String, Object> cluster : mlClusters) {
                Map<String, Object> transformed = new HashMap<>();
                
                // Extract centroid
                Map<String, Object> centroid = (Map<String, Object>) cluster.get("centroid");
                double lat = ((Number) centroid.get("lat")).doubleValue();
                double lon = ((Number) centroid.get("lon")).doubleValue();
                
                // Get first report location as cluster location name
                List<Map<String, Object>> reports = (List<Map<String, Object>>) cluster.get("reports");
                String location = reports.isEmpty() ? "Unknown" : (String) reports.get(0).get("location");
                
                // Determine severity based on cluster score
                int score = ((Number) cluster.get("cluster_score")).intValue();
                String severity;
                if (score >= 75) {
                    severity = "HIGH";
                } else if (score >= 50) {
                    severity = "MODERATE";
                } else {
                    severity = "LOW";
                }
                
                transformed.put("id", cluster.get("cluster_id"));
                transformed.put("latitude", lat);
                transformed.put("longitude", lon);
                transformed.put("location", location);
                transformed.put("reportCount", cluster.get("report_count"));
                transformed.put("overallSeverity", severity);
                transformed.put("status", "ACTIVE");
                transformed.put("clusterScore", score);
                transformed.put("reports", reports); // CRITICAL: Include reports array for Firestore save
                
                // Add state/region for frontend filtering
                // Guwahati, Kamrup are in Assam
                String state = "Assam"; // Default for NER
                if (location != null) {
                    String locationLower = location.toLowerCase();
                    if (locationLower.contains("guwahati") || locationLower.contains("kamrup") || 
                        locationLower.contains("kamakhya") || locationLower.contains("assam")) {
                        state = "Assam";
                    } else if (locationLower.contains("shillong") || locationLower.contains("meghalaya")) {
                        state = "Meghalaya";
                    } else if (locationLower.contains("arunachal")) {
                        state = "Arunachal Pradesh";
                    } else if (locationLower.contains("nagaland")) {
                        state = "Nagaland";
                    } else if (locationLower.contains("manipur")) {
                        state = "Manipur";
                    } else if (locationLower.contains("mizoram")) {
                        state = "Mizoram";
                    } else if (locationLower.contains("tripura")) {
                        state = "Tripura";
                    } else if (locationLower.contains("sikkim")) {
                        state = "Sikkim";
                    }
                }
                transformed.put("state", state);
                transformed.put("region", "North East India");
                
                // Extract dominant symptoms from ML response
                List<List<Object>> dominantSymptoms = (List<List<Object>>) cluster.get("dominant_symptoms");
                if (dominantSymptoms != null && !dominantSymptoms.isEmpty()) {
                    List<String> symptomNames = new ArrayList<>();
                    for (List<Object> symptom : dominantSymptoms) {
                        if (symptom.size() >= 1) {
                            symptomNames.add((String) symptom.get(0));
                        }
                    }
                    transformed.put("dominantSymptoms", symptomNames);
                } else {
                    transformed.put("dominantSymptoms", new ArrayList<>());
                }
                
                transformedClusters.add(transformed);
            }
            
            // Update cache
            cachedActiveClusters = transformedClusters;
            cacheTimestamp = now;
            
            log.info("Transformed {} clusters for map display (cached for 30s)", transformedClusters.size());
            return ResponseEntity.ok(transformedClusters);
            
        } catch (Exception e) {
            log.error("Error fetching active clusters from ML service", e);
            // Fallback to database clusters if ML service fails
            try {
                List<SymptomCluster> clusters = clusterService.getActiveClusters();
                return ResponseEntity.ok(clusters);
            } catch (Exception ex) {
                return ResponseEntity.ok(new ArrayList<>());
            }
        }
    }

    /**
     * Get active clusters by location
     * GET /api/clusters/location/{location}/active
     */
    @GetMapping("/location/{location}/active")
    public ResponseEntity<?> getActiveClustersByLocation(@PathVariable String location) {
        try {
            List<SymptomCluster> clusters = clusterService.getActiveClustersByLocation(location);
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve active clusters: " + e.getMessage()));
        }
    }

    /**
     * Get high-severity clusters
     * GET /api/clusters/high-severity
     */
    @GetMapping("/high-severity")
    public ResponseEntity<?> getHighSeverityClusters() {
        try {
            List<SymptomCluster> clusters = clusterService.getHighSeverityClusters();
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve high-severity clusters: " + e.getMessage()));
        }
    }

    /**
     * Get clusters by severity
     * GET /api/clusters/severity/{severity}
     */
    @GetMapping("/severity/{severity}")
    public ResponseEntity<?> getClustersBySeverity(@PathVariable String severity) {
        try {
            List<SymptomCluster> clusters = clusterService.getClustersBySeverity(severity);
            return ResponseEntity.ok(clusters);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters: " + e.getMessage()));
        }
    }

    /**
     * Get clusters by detection method
     * GET /api/clusters/detection-method/{method}
     */
    @GetMapping("/detection-method/{method}")
    public ResponseEntity<?> getClustersByDetectionMethod(@PathVariable String method) {
        try {
            List<SymptomCluster> clusters = clusterService.getClustersByDetectionMethod(method);
            return ResponseEntity.ok(clusters);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters: " + e.getMessage()));
        }
    }

    /**
     * Get clusters with alerts
     * GET /api/clusters/alerts
     */
    @GetMapping("/alerts")
    public ResponseEntity<?> getClustersWithAlerts() {
        try {
            List<SymptomCluster> clusters = clusterService.getClustersWithAlerts();
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters with alerts: " + e.getMessage()));
        }
    }

    /**
     * Get clusters by water source
     * GET /api/clusters/water-source/{waterSource}
     */
    @GetMapping("/water-source/{waterSource}")
    public ResponseEntity<?> getClustersByWaterSource(@PathVariable String waterSource) {
        try {
            List<SymptomCluster> clusters = clusterService.getClustersByWaterSource(waterSource);
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve clusters: " + e.getMessage()));
        }
    }

    /**
     * Get high-score clusters
     * GET /api/clusters/high-score
     */
    @GetMapping("/high-score")
    public ResponseEntity<?> getHighScoreClusters(@RequestParam(defaultValue = "75.0") double minScore) {
        try {
            List<SymptomCluster> clusters = clusterService.getHighScoreClusters(minScore);
            return ResponseEntity.ok(clusters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve high-score clusters: " + e.getMessage()));
        }
    }

    /**
     * Update cluster
     * PUT /api/clusters/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCluster(@PathVariable String id, @RequestBody SymptomCluster cluster) {
        try {
            cluster = SymptomCluster.builder()
                    .id(id)
                    .location(cluster.getLocation())
                    .centroid(cluster.getCentroid())
                    .radiusKm(cluster.getRadiusKm())
                    .reportCount(cluster.getReportCount())
                    .reportIds(cluster.getReportIds())
                    .firstReportDate(cluster.getFirstReportDate())
                    .lastReportDate(cluster.getLastReportDate())
                    .durationHours(cluster.getDurationHours())
                    .symptomDistribution(cluster.getSymptomDistribution())
                    .dominantSymptoms(cluster.getDominantSymptoms())
                    .severityDistribution(cluster.getSeverityDistribution())
                    .overallSeverity(cluster.getOverallSeverity())
                    .affectedPopulation(cluster.getAffectedPopulation())
                    .ageDistribution(cluster.getAgeDistribution())
                    .genderDistribution(cluster.getGenderDistribution())
                    .waterSourceDistribution(cluster.getWaterSourceDistribution())
                    .primaryWaterSource(cluster.getPrimaryWaterSource())
                    .status(cluster.getStatus())
                    .detectionMethod(cluster.getDetectionMethod())
                    .build();
            
            SymptomCluster updated = clusterService.updateCluster(cluster);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update cluster: " + e.getMessage()));
        }
    }

    /**
     * Update cluster status
     * PATCH /api/clusters/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateClusterStatus(@PathVariable String id, 
                                                 @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            clusterService.updateClusterStatus(id, status);
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update status: " + e.getMessage()));
        }
    }

    /**
     * Add report to cluster
     * POST /api/clusters/{clusterId}/reports/{reportId}
     */
    @PostMapping("/{clusterId}/reports/{reportId}")
    public ResponseEntity<?> addReportToCluster(@PathVariable String clusterId, 
                                                @PathVariable String reportId) {
        try {
            clusterService.addReportToCluster(clusterId, reportId);
            return ResponseEntity.ok(Map.of("message", "Report added to cluster successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add report to cluster: " + e.getMessage()));
        }
    }

    /**
     * Delete cluster
     * DELETE /api/clusters/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCluster(@PathVariable String id) {
        try {
            clusterService.deleteCluster(id);
            return ResponseEntity.ok(Map.of("message", "Cluster deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete cluster: " + e.getMessage()));
        }
    }

    /**
     * Get cluster statistics by location
     * GET /api/clusters/stats/location/{location}
     */
    @GetMapping("/stats/location/{location}")
    public ResponseEntity<?> getClusterStatsByLocation(@PathVariable String location) {
        try {
            Map<String, Object> stats = clusterService.getClusterStatsByLocation(location);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Get overall cluster statistics
     * GET /api/clusters/stats/overall
     */
    @GetMapping("/stats/overall")
    public ResponseEntity<?> getOverallStats() {
        try {
            Map<String, Object> stats = clusterService.getOverallStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Resolve old clusters
     * POST /api/clusters/resolve-old
     */
    @PostMapping("/resolve-old")
    public ResponseEntity<?> resolveOldClusters(@RequestParam(defaultValue = "7") int daysOld) {
        try {
            int resolvedCount = clusterService.resolveOldClusters(daysOld);
            return ResponseEntity.ok(Map.of(
                    "message", "Old clusters resolved successfully",
                    "resolvedCount", resolvedCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to resolve old clusters: " + e.getMessage()));
        }
    }
}
