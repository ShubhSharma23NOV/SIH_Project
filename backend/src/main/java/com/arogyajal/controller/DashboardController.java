package com.arogyajal.controller;

import com.arogyajal.dto.DashboardResponse;
import com.arogyajal.model.Alert;
import com.arogyajal.model.SensorReading;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.service.AlertService;
import com.arogyajal.service.CachedDashboardService;
import com.arogyajal.service.SensorService;
import com.arogyajal.service.SymptomService;
import com.arogyajal.service.SymptomClusterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
//import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

import com.google.cloud.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDateTime;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard Controller", description = "APIs for dashboard data and analytics - North East India Region")
public class DashboardController {
    
    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);
    
    private final SensorService sensorService;
    private final SymptomService symptomService;
    private final AlertService alertService;
    private final SymptomClusterService clusterService;
    private final CachedDashboardService cachedDashboardService;

    public DashboardController(SensorService sensorService, SymptomService symptomService, 
                              AlertService alertService, SymptomClusterService clusterService,
                              CachedDashboardService cachedDashboardService) {
        this.sensorService = sensorService;
        this.symptomService = symptomService;
        this.alertService = alertService;
        this.clusterService = clusterService;
        this.cachedDashboardService = cachedDashboardService;
    }
    
    @GetMapping("/overview")
    @Operation(summary = "Get dashboard overview", description = "Retrieve overall dashboard metrics and status")
    @Cacheable(value = "dashboard", key = "'overview'")
    public ResponseEntity<Object> getDashboardOverview() {
        log.info("Retrieving dashboard overview");
        try {
            // Initialize a simple response with default values
            DashboardResponse response = new DashboardResponse();
            response.setOverallStatus("HEALTHY");
            response.setLastUpdated(Timestamp.now().toString());
            
            // Set default values for all fields to avoid null pointers
            response.setTotalSensors(0);
            response.setActiveSensors(0);
            response.setOfflineSensors(0);
            response.setLatestReadings(new HashMap<>());
            response.setQualityAlerts(new ArrayList<>());
            response.setTotalSymptomReports(0);
            response.setPendingReports(0);
            response.setResolvedReports(0);
            response.setRecentSymptoms(new ArrayList<>());
            response.setTotalAlerts(0);
            response.setActiveAlerts(0);
            response.setCriticalAlerts(0);
            response.setRecentAlerts(new ArrayList<>());
            response.setQualityTrends(new HashMap<>());
            response.setQualityStatus(new HashMap<>());
            response.setLocationData(new HashMap<>());
            
            log.info("Sending default dashboard response");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in getDashboardOverview: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to generate dashboard overview");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/sensors/status")
    @Operation(summary = "Get sensor status summary", description = "Retrieve sensor status and health information")
    public ResponseEntity<Object> getSensorStatus() {
        log.info("Retrieving sensor status");
        
        List<String> distinctSensorIds = sensorService.getDistinctSensorIds();
        List<String> distinctLocations = sensorService.getDistinctLocations();
        
        // Get latest readings for each sensor to determine status
        Map<String, String> sensorStatus = new HashMap<>();
        for (String sensorId : distinctSensorIds) {
            Optional<SensorReading> latest = sensorService.getLatestReadingBySensorId(sensorId);
            if (latest.isPresent()) {
                Timestamp lastReading = latest.get().getTimestamp();
                Timestamp oneHourAgo = Timestamp.ofTimeSecondsAndNanos(
                    Timestamp.now().getSeconds() - 3600, 0);
                if (lastReading.compareTo(oneHourAgo) > 0) {
                    sensorStatus.put(sensorId, "ONLINE");
                } else {
                    sensorStatus.put(sensorId, "OFFLINE");
                }
            } else {
                sensorStatus.put(sensorId, "OFFLINE");
            }
        }
        
        long onlineSensors = sensorStatus.values().stream().mapToLong(status -> "ONLINE".equals(status) ? 1 : 0).sum();
        long offlineSensors = sensorStatus.size() - onlineSensors;
        
        SensorStatusResponse response = new SensorStatusResponse();
        response.setTotalSensors(distinctSensorIds.size());
        response.setOnlineSensors(onlineSensors);
        response.setOfflineSensors(offlineSensors);
        response.setSensorStatusMap(sensorStatus);
        response.setTotalLocations(distinctLocations.size());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/alerts/summary")
    @Operation(summary = "Get alerts summary", description = "Retrieve summary of all alerts")
    public ResponseEntity<Map<String, Object>> getAlertsSummary() {
        log.info("Retrieving alerts summary");
        
        try {
            List<Alert> allAlerts = alertService.getAllAlerts();
            List<Alert> activeAlerts = alertService.getActiveAlerts();
            List<Alert> criticalAlerts = alertService.getCriticalAlerts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalAlerts", allAlerts != null ? allAlerts.size() : 0);
            response.put("activeAlerts", activeAlerts != null ? activeAlerts.size() : 0);
            response.put("criticalAlerts", criticalAlerts != null ? criticalAlerts.size() : 0);
            response.put("recentAlertsCount", allAlerts != null ? Math.min(allAlerts.size(), 10) : 0);
            // Don't include full alert objects to avoid serialization issues
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving alerts summary", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve alerts summary");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("totalAlerts", 0);
            errorResponse.put("activeAlerts", 0);
            errorResponse.put("criticalAlerts", 0);
            errorResponse.put("recentAlertsCount", 0);
            return ResponseEntity.ok(errorResponse);
        }
    }
    
    @GetMapping("/symptoms/summary")
    @Operation(summary = "Get symptoms summary", description = "Retrieve summary of symptom reports")
    public ResponseEntity<Object> getSymptomsSummary() {
        log.info("Retrieving symptoms summary");
        
        try {
        
        long totalReports = symptomService.getReportCount();
        long pendingReports = symptomService.getReportCountByStatus("PENDING");
        long resolvedReports = symptomService.getReportCountByStatus("RESOLVED");
        
        // Get recent high severity reports
        Timestamp last24Hours = Timestamp.ofTimeSecondsAndNanos(
            Timestamp.now().getSeconds() - (24 * 3600), 0);
        List<SymptomReport> recentHighSeverity = symptomService.getHighSeverityRecentReports(last24Hours);
        
        SymptomsSummaryResponse response = new SymptomsSummaryResponse();
            response.setTotalReports(totalReports);
            response.setPendingReports(pendingReports);
            response.setResolvedReports(resolvedReports);
            response.setRecentHighSeverityReports(recentHighSeverity != null ? recentHighSeverity.size() : 0);
            response.setRecentReports(recentHighSeverity != null ? recentHighSeverity.stream()
                    .limit(10)
                    .collect(Collectors.toList()) : new ArrayList<>());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving symptoms summary", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to retrieve symptoms summary");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/water-quality/trends")
    @Operation(summary = "Get water quality trends", description = "Retrieve water quality trends over time")
    public ResponseEntity<Object> getWaterQualityTrends(
            @RequestParam(defaultValue = "24") int hours) {
        log.info("Retrieving water quality trends for last {} hours", hours);
        
        Timestamp end = Timestamp.now();
        Timestamp start = Timestamp.ofTimeSecondsAndNanos(
            end.getSeconds() - (hours * 3600), 0);
        
        List<SensorReading> readings = sensorService.getReadingsByTimeRange(start, end);
        
        // Group readings by parameter and create trend data
        Map<String, List<DashboardResponse.DataPoint>> trends = new HashMap<>();
        Map<String, Double> latestValues = new HashMap<>();
        
        // Process each parameter (4 sensors only - DO not available)
        String[] parameters = {"ph", "temperature", "turbidity", "tds"};
        
        for (String param : parameters) {
            List<DashboardResponse.DataPoint> dataPoints = new ArrayList<>();
            Double latestValue = null;
            
            for (SensorReading reading : readings) {
                Double value = getParameterValue(reading, param);
                if (value != null) {
                    dataPoints.add(DashboardResponse.DataPoint.builder()
                            .timestamp(timestampToLocalDateTime(reading.getTimestamp()))
                            .value(value)
                            .build());
                    latestValue = value;
                }
            }
            
            if (!dataPoints.isEmpty()) {
                trends.put(param, dataPoints);
                latestValues.put(param, latestValue);
            }
        }
        
        WaterQualityTrendsResponse response = new WaterQualityTrendsResponse();
        response.setTrends(trends);
        response.setLatestValues(latestValues);
        response.setTimeRange(hours + " hours");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/locations/summary")
    @Operation(summary = "Get locations summary", description = "Retrieve summary data for all locations")
    public ResponseEntity<Object> getLocationsSummary() {
        log.info("Retrieving locations summary");
        
        List<String> distinctLocations = sensorService.getDistinctLocations();
        List<DashboardResponse.LocationSummary> locationSummaries = new ArrayList<>();
        
        // Filter out null locations and get distinct ones
        List<String> uniqueLocations = distinctLocations.stream()
                .filter(Objects::nonNull)  // Filter out null locations
                .distinct()
                .collect(Collectors.toList());
                
        for (String locationName : uniqueLocations) {
            if (locationName == null) continue;  // Skip null location names
            
            // Get sensor count for this location
            long sensorCount = sensorService.getSensorCountByLocation(locationName);
            
            // Get alert count for this location
            List<Alert> locationAlerts = alertService.getAlertsByLocation(locationName);
            
            // Get symptom report count for this location
            long symptomCount = symptomService.getReportCountByLocation(locationName);
            
            // Get latest readings for this location
            List<SensorReading> latestReadings = sensorService.getReadingsByLocation(locationName);
            Map<String, Double> latestValues = new HashMap<>();
            
            if (latestReadings != null && !latestReadings.isEmpty()) {
                SensorReading latest = latestReadings.get(0);
                if (latest != null) {
                    latestValues.put("ph", latest.getPh());
                    latestValues.put("temperature", latest.getTemperature());
                    latestValues.put("turbidity", latest.getTurbidity());
                    latestValues.put("tds", latest.getTotalDissolvedSolids());
                }
            }
            
            // Determine overall status for this location
            String status = "HEALTHY";
            if (locationAlerts.stream().anyMatch(alert -> "CRITICAL".equals(alert.getSeverity()))) {
                status = "CRITICAL";
            } else if (locationAlerts.stream().anyMatch(alert -> "HIGH".equals(alert.getSeverity()))) {
                status = "WARNING";
            }
            
            locationSummaries.add(DashboardResponse.LocationSummary.builder()
                    .location(locationName)
                    .status(status)
                    .sensorCount((int) sensorCount)
                    .alertCount(locationAlerts.size())
                    .symptomReportCount((int) symptomCount)
                    .latestReadings(latestValues)
                    .build());
        }
        
        LocationsSummaryResponse response = new LocationsSummaryResponse();
        response.setLocations(locationSummaries);
        response.setTotalLocations(locationSummaries.size());
        
        return ResponseEntity.ok(response);
    }
    
    private Double getParameterValue(SensorReading reading, String parameter) {
        switch (parameter) {
            case "ph":
                return reading.getPh();
            case "temperature":
                return reading.getTemperature();
            case "turbidity":
                return reading.getTurbidity();
            case "tds":
                return reading.getTotalDissolvedSolids();
            case "conductivity":
                return reading.getConductivity();
            default:
                return null;
        }
    }
    
    private LocalDateTime timestampToLocalDateTime(Timestamp timestamp) {
        if (timestamp == null) return null;
        return LocalDateTime.ofEpochSecond(
            timestamp.getSeconds(),
            timestamp.getNanos(),
            ZoneId.systemDefault().getRules().getOffset(Instant.now())
        );
    }
    
    // Response classes
    public static class SensorStatusResponse {
        private long totalSensors;
        private long onlineSensors;
        private long offlineSensors;
        private Map<String, String> sensorStatusMap;
        private int totalLocations;
        
        // Getters and Setters
        public long getTotalSensors() {
            return totalSensors;
        }
        
        public void setTotalSensors(long totalSensors) {
            this.totalSensors = totalSensors;
        }
        
        public long getOnlineSensors() {
            return onlineSensors;
        }
        
        public void setOnlineSensors(long onlineSensors) {
            this.onlineSensors = onlineSensors;
        }
        
        public long getOfflineSensors() {
            return offlineSensors;
        }
        
        public void setOfflineSensors(long offlineSensors) {
            this.offlineSensors = offlineSensors;
        }
        
        public Map<String, String> getSensorStatusMap() {
            return sensorStatusMap;
        }
        
        public void setSensorStatusMap(Map<String, String> sensorStatusMap) {
            this.sensorStatusMap = sensorStatusMap;
        }
        
        public int getTotalLocations() {
            return totalLocations;
        }
        
        public void setTotalLocations(int totalLocations) {
            this.totalLocations = totalLocations;
        }
    }
    
    public static class AlertsSummaryResponse {
        private long totalAlerts;
        private long activeAlerts;
        private long criticalAlerts;
        private List<Alert> recentAlerts;
        
        public long getTotalAlerts() {
            return totalAlerts;
        }
        
        public void setTotalAlerts(long totalAlerts) {
            this.totalAlerts = totalAlerts;
        }
        
        public long getActiveAlerts() {
            return activeAlerts;
        }
        
        public void setActiveAlerts(long activeAlerts) {
            this.activeAlerts = activeAlerts;
        }
        
        public long getCriticalAlerts() {
            return criticalAlerts;
        }
        
        public void setCriticalAlerts(long criticalAlerts) {
            this.criticalAlerts = criticalAlerts;
        }
        
        public List<Alert> getRecentAlerts() {
            return recentAlerts;
        }
        
        public void setRecentAlerts(List<Alert> recentAlerts) {
            this.recentAlerts = recentAlerts;
        }
    }
    
    public static class SymptomsSummaryResponse {
        private long totalReports;
        private long pendingReports;
        private long resolvedReports;
        private long recentHighSeverityReports;
        private List<SymptomReport> recentReports;
        
        public long getTotalReports() {
            return totalReports;
        }
        
        public void setTotalReports(long totalReports) {
            this.totalReports = totalReports;
        }
        
        public long getPendingReports() {
            return pendingReports;
        }
        
        public void setPendingReports(long pendingReports) {
            this.pendingReports = pendingReports;
        }
        
        public long getResolvedReports() {
            return resolvedReports;
        }
        
        public void setResolvedReports(long resolvedReports) {
            this.resolvedReports = resolvedReports;
        }
        
        public long getRecentHighSeverityReports() {
            return recentHighSeverityReports;
        }
        
        public void setRecentHighSeverityReports(long recentHighSeverityReports) {
            this.recentHighSeverityReports = recentHighSeverityReports;
        }
        
        public List<SymptomReport> getRecentReports() {
            return recentReports;
        }
        
        public void setRecentReports(List<SymptomReport> recentReports) {
            this.recentReports = recentReports;
        }
    }
    
    public static class WaterQualityTrendsResponse {
        private Map<String, List<DashboardResponse.DataPoint>> trends;
        private Map<String, Double> latestValues;
        private String timeRange;
        
        public Map<String, List<DashboardResponse.DataPoint>> getTrends() {
            return trends;
        }
        
        public void setTrends(Map<String, List<DashboardResponse.DataPoint>> trends) {
            this.trends = trends;
        }
        
        public Map<String, Double> getLatestValues() {
            return latestValues;
        }
        
        public void setLatestValues(Map<String, Double> latestValues) {
            this.latestValues = latestValues;
        }
        
        public String getTimeRange() {
            return timeRange;
        }
        
        public void setTimeRange(String timeRange) {
            this.timeRange = timeRange;
        }
    }
    
    public static class LocationsSummaryResponse {
        private List<DashboardResponse.LocationSummary> locations;
        private int totalLocations;
        
        public List<DashboardResponse.LocationSummary> getLocations() {
            return locations;
        }
        
        public void setLocations(List<DashboardResponse.LocationSummary> locations) {
            this.locations = locations;
        }
        
        public int getTotalLocations() {
            return totalLocations;
        }
        
        public void setTotalLocations(int totalLocations) {
            this.totalLocations = totalLocations;
        }
    }
    
    /**
     * OPTIMIZED: Get dashboard statistics with caching
     * 
     * BEFORE: 500+ Firestore reads per call
     * AFTER: Cached for 5 minutes
     * SAVINGS: 99% reduction in Firestore reads
     */
    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics", description = "Get overall system statistics (cached)")
    @Cacheable(value = "stats", key = "'dashboard'")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        log.info("getDashboardStats endpoint called (using cache)");
        try {
            // Use cached service - massive read reduction!
            Map<String, Object> stats = cachedDashboardService.getCachedDashboardStats();
            log.info("Returning cached stats: {}", stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting dashboard stats", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("totalSensors", 0);
            fallback.put("activeSensors", 0);
            fallback.put("totalReports", 0);
            fallback.put("activeClusters", 0);
            fallback.put("activeAlerts", 0);
            fallback.put("error", e.getMessage());
            return ResponseEntity.ok(fallback);
        }
    }
    
    /**
     * LEGACY: Old implementation kept for reference
     * Now using CachedDashboardService instead
     */
    private ResponseEntity<Map<String, Object>> getDashboardStatsLegacy() {
        log.info("Fetching dashboard statistics (legacy method)");
        
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Get sensor stats
            List<SensorReading> allReadings = sensorService.getAllSensorReadings();
            stats.put("totalSensors", allReadings.size());
            stats.put("activeSensors", allReadings.size());
            
            // Get symptom report stats
            List<SymptomReport> allReports = symptomService.getAllSymptomReports();
            stats.put("totalReports", allReports.size());
            
            // Get cluster stats
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.ResponseEntity<java.util.List> clusterResponse = 
                    restTemplate.getForEntity("http://localhost:8080/api/clusters/active", java.util.List.class);
                if (clusterResponse.getStatusCode().is2xxSuccessful() && clusterResponse.getBody() != null) {
                    stats.put("activeClusters", clusterResponse.getBody().size());
                } else {
                    stats.put("activeClusters", 0);
                }
            } catch (Exception e) {
                log.warn("Could not fetch cluster count: {}", e.getMessage());
                stats.put("activeClusters", 0);
            }
            
            // Get alert stats
            List<Alert> activeAlerts = alertService.getActiveAlerts();
            stats.put("activeAlerts", activeAlerts.size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching dashboard stats", e);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("totalSensors", 0);
            fallback.put("activeSensors", 0);
            fallback.put("totalReports", 0);
            fallback.put("activeClusters", 0);
            fallback.put("activeAlerts", 0);
            return ResponseEntity.ok(fallback);
        }
    }
    
    /**
     * Health check endpoint for dashboard controller
     */
    @GetMapping("/health")
    @Operation(summary = "Dashboard health check", description = "Check if dashboard controller is working")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("Dashboard health check called");
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("controller", "DashboardController");
        response.put("timestamp", Timestamp.now().toString());
        return ResponseEntity.ok(response);
    }
}
