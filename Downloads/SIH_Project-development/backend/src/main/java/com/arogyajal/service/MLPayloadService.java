package com.arogyajal.service;

import com.arogyajal.model.*;
import com.arogyajal.util.WQICalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service for assembling unified ML payloads
 * Merges sensor data, symptom reports, and geographic metadata
 */
@Service
public class MLPayloadService {
    
    private static final Logger logger = LoggerFactory.getLogger(MLPayloadService.class);
    private static final double PROXIMITY_RADIUS_KM = 5.0;
    
    private final SensorService sensorService;
    private final SymptomService symptomService;
    private final SymptomClusterService clusterService;
    private final HistoricalDataService historicalDataService;
    private final AlertService alertService;
    
    public MLPayloadService(SensorService sensorService, 
                           SymptomService symptomService, 
                           SymptomClusterService clusterService,
                           HistoricalDataService historicalDataService,
                           AlertService alertService) {
        this.sensorService = sensorService;
        this.symptomService = symptomService;
        this.clusterService = clusterService;
        this.historicalDataService = historicalDataService;
        this.alertService = alertService;
    }
    
    /**
     * Assemble unified payload for ML service
     * Includes sensors, symptoms, and calculated metrics
     */
    public Map<String, Object> assembleMLPayload() {
        logger.info("📦 Assembling ML payload...");
        
        Map<String, Object> payload = new HashMap<>();
        
        try {
            // 1. Get latest sensor readings (deduplicated)
            List<Map<String, Object>> sensorData = getLatestSensorReadings();
            payload.put("sensors", sensorData);
            payload.put("sensor_count", sensorData.size());
            
            // 2. Get symptom reports from last 7 days
            List<Map<String, Object>> symptomData = getRecentSymptomReports(7);
            payload.put("symptom_reports", symptomData);
            payload.put("report_count", symptomData.size());
            
            // 3. Calculate poor sensors count (WQI > 50 = Fair or worse)
            // Lowered threshold from 75 to 50 for better sensitivity
            long poorSensors = sensorData.stream()
                .filter(s -> {
                    Object wqiObj = s.get("wqi");
                    if (wqiObj instanceof Number) {
                        double wqi = ((Number) wqiObj).doubleValue();
                        return wqi > 50; // Fair (51-75), Poor (76-90), Very Poor (>90)
                    }
                    return false;
                })
                .count();
            
            payload.put("poor_sensors", (int) poorSensors);
            payload.put("total_sensors", sensorData.size());
            
            // 4. Calculate contaminated sources (estimate based on poor sensors)
            int totalSources = Math.max(sensorData.size() / 2, 1); // Estimate
            int contaminatedSources = (int) Math.ceil(poorSensors * 0.7); // 70% of poor sensors
            payload.put("contaminated_sources", contaminatedSources);
            payload.put("total_sources", totalSources);
            
            // 5. Merge sensor-symptom data with proximity
            Map<String, Object> mergedData = mergeSensorSymptomData(sensorData, symptomData);
            payload.put("merged_analysis", mergedData);
            
            // 6. Get actual symptom clusters with severity scores
            List<Map<String, Object>> symptomClusters = getSymptomClusters();
            payload.put("symptom_clusters", symptomClusters);
            payload.put("cluster_count", symptomClusters.size());
            
            // 7. Calculate current metrics for trend analysis
            double currentAvgWQI = sensorData.stream()
                .mapToDouble(s -> {
                    Object wqiObj = s.get("wqi");
                    return wqiObj instanceof Number ? ((Number) wqiObj).doubleValue() : 0.0;
                })
                .average()
                .orElse(0.0);
            
            int currentReports24h = symptomData.size();
            int currentClusters = symptomClusters.size();
            
            // 8. Get active alerts count (NEW FEATURE)
            int activeAlerts24h = 0;
            try {
                activeAlerts24h = (int) alertService.getAllAlerts().stream()
                    .filter(a -> "ACTIVE".equals(a.getStatus()))
                    .count();
                logger.info("🚨 Active alerts: {}", activeAlerts24h);
            } catch (Exception e) {
                logger.warn("⚠️ Could not fetch active alerts: {}", e.getMessage());
            }
            
            payload.put("active_alerts_24h", activeAlerts24h);
            
            // 9. Calculate temporal trends (NEW FEATURE)
            HistoricalDataService.TrendData trends = historicalDataService.calculateTrends(
                currentAvgWQI,
                currentReports24h,
                activeAlerts24h,
                currentClusters
            );
            
            // Add trend features to payload
            payload.put("wqi_trend_24h", trends.wqiTrend24h);
            payload.put("report_trend_24h", trends.reportTrend24h);
            payload.put("alert_trend_24h", trends.alertTrend24h);
            payload.put("cluster_growth_rate_7d", trends.clusterGrowthRate7d);
            payload.put("trend_direction", trends.trendDirection);
            payload.put("has_trend_data", trends.hasTrendData);
            
            logger.info("📈 Trends: WQI Δ{:.1f}, Reports Δ{}, Alerts Δ{}, Direction: {}",
                       trends.wqiTrend24h, (int)trends.reportTrend24h, (int)trends.alertTrend24h, trends.trendDirection);
            
            // 10. Add metadata
            payload.put("timestamp", LocalDateTime.now().toString());
            payload.put("region", "North East India");
            payload.put("data_recency_hours", 24);
            payload.put("geographic_coverage", 0.8);
            payload.put("current_avg_wqi", currentAvgWQI);
            
            logger.info("✅ Payload assembled: {} sensors ({} poor), {} reports, {} clusters, {} alerts, trend: {}",
                       sensorData.size(), poorSensors, symptomData.size(), symptomClusters.size(), 
                       activeAlerts24h, trends.trendDirection);
            
        } catch (Exception e) {
            logger.error("❌ Error assembling ML payload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to assemble ML payload", e);
        }
        
        return payload;
    }
    
    /**
     * Get latest sensor readings (deduplicated by sensor ID)
     */
    private List<Map<String, Object>> getLatestSensorReadings() {
        try {
            List<SensorReading> allReadings = sensorService.getAllSensorReadings();
            
            // Deduplicate: keep only latest per sensor
            Map<String, SensorReading> latestBySensor = new HashMap<>();
            for (SensorReading reading : allReadings) {
                String sensorId = reading.getSensorId();
                SensorReading existing = latestBySensor.get(sensorId);
                
                if (existing == null || 
                    (reading.getTimestamp() != null && existing.getTimestamp() != null &&
                     reading.getTimestamp().compareTo(existing.getTimestamp()) > 0)) {
                    latestBySensor.put(sensorId, reading);
                }
            }
            
            logger.info("📊 Deduplicated {} readings to {} unique sensors", 
                       allReadings.size(), latestBySensor.size());
            
            // Convert to ML format
            List<Map<String, Object>> result = new ArrayList<>();
            for (SensorReading reading : latestBySensor.values()) {
                Map<String, Object> sensorData = convertSensorToMLFormat(reading);
                result.add(sensorData);
            }
            
            return result;
            
        } catch (Exception e) {
            logger.error("❌ Error getting sensor readings: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Convert sensor reading to ML format with WQI calculation
     */
    private Map<String, Object> convertSensorToMLFormat(SensorReading reading) {
        Map<String, Object> data = new HashMap<>();
        
        // Basic info
        data.put("sensor_id", reading.getSensorId());
        data.put("location", reading.getLocation());
        
        // Parameters - convert 0.0 to null for proper WQI calculation
        Double ph = (reading.getPh() != null && reading.getPh() > 0) ? reading.getPh() : null;
        Double temperature = (reading.getTemperature() != null && reading.getTemperature() > 0) ? reading.getTemperature() : null;
        Double turbidity = (reading.getTurbidity() != null && reading.getTurbidity() > 0) ? reading.getTurbidity() : null;
        Double tds = (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 0) ? reading.getTotalDissolvedSolids() : null;
        
        data.put("ph", ph);
        data.put("temperature", temperature);
        data.put("turbidity", turbidity);
        data.put("tds", tds);
        
        // Calculate WQI using formula (will use defaults for null values)
        double wqi = WQICalculator.calculateWQI(ph, turbidity, tds, temperature);
        
        data.put("wqi", wqi);
        data.put("quality_status", WQICalculator.getQualityClassification(wqi));
        data.put("severity", WQICalculator.getSeverityLevel(wqi));
        
        logger.debug("📊 Sensor {}: pH={}, Turb={}, TDS={}, Temp={} → WQI={:.1f}",
                    reading.getSensorId(), ph, turbidity, tds, temperature, wqi);
        
        // Parse location to coordinates if available
        String location = reading.getLocation();
        if (location != null && location.contains(",")) {
            String[] parts = location.split(",");
            if (parts.length >= 2) {
                try {
                    data.put("latitude", Double.parseDouble(parts[0].trim()));
                    data.put("longitude", Double.parseDouble(parts[1].trim()));
                } catch (NumberFormatException e) {
                    // Not coordinates, skip
                }
            }
        }
        
        // Timestamp
        if (reading.getTimestamp() != null) {
            data.put("timestamp", reading.getTimestamp().toString());
        }
        
        return data;
    }
    
    /**
     * Get symptom reports from last N days
     */
    private List<Map<String, Object>> getRecentSymptomReports(int days) {
        try {
            // Get all symptom reports
            List<SymptomReport> allReports = symptomService.getAllSymptomReports();
            
            // Filter by date (last N days)
            LocalDateTime cutoff = LocalDateTime.now().minus(days, ChronoUnit.DAYS);
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (SymptomReport report : allReports) {
                // Check if report is recent
                if (report.getReportedAt() != null) {
                    LocalDateTime reportTime = report.getReportedAt().toDate().toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    
                    if (reportTime.isAfter(cutoff)) {
                        Map<String, Object> reportData = convertSymptomToMLFormat(report);
                        result.add(reportData);
                    }
                }
            }
            
            logger.info("📋 Found {} symptom reports in last {} days", result.size(), days);
            return result;
            
        } catch (Exception e) {
            logger.error("❌ Error getting symptom reports: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Convert symptom report to ML format
     */
    private Map<String, Object> convertSymptomToMLFormat(SymptomReport report) {
        Map<String, Object> data = new HashMap<>();
        
        data.put("id", report.getId());
        data.put("location", report.getLocation());
        data.put("symptoms", report.getSymptoms());
        data.put("severity", report.getSeverity());
        data.put("water_source", report.getWaterSource());
        
        if (report.getReportedAt() != null) {
            data.put("reported_at", report.getReportedAt().toString());
        }
        
        // Parse location to coordinates if available
        String location = report.getLocation();
        if (location != null && location.contains(",")) {
            String[] parts = location.split(",");
            if (parts.length >= 2) {
                try {
                    data.put("latitude", Double.parseDouble(parts[0].trim()));
                    data.put("longitude", Double.parseDouble(parts[1].trim()));
                } catch (NumberFormatException e) {
                    // Not coordinates, skip
                }
            }
        }
        
        return data;
    }
    
    /**
     * Merge sensor and symptom data by 5km proximity
     */
    private Map<String, Object> mergeSensorSymptomData(
            List<Map<String, Object>> sensors, 
            List<Map<String, Object>> symptoms) {
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> mergedData = new ArrayList<>();
        
        int symptomsWithSensors = 0;
        
        for (Map<String, Object> symptom : symptoms) {
            Double symptomLat = getDouble(symptom, "latitude");
            Double symptomLon = getDouble(symptom, "longitude");
            
            if (symptomLat == null || symptomLon == null) continue;
            
            // Find nearby sensors within 5km
            List<Map<String, Object>> nearbySensors = new ArrayList<>();
            double totalWQI = 0;
            int wqiCount = 0;
            
            for (Map<String, Object> sensor : sensors) {
                Double sensorLat = getDouble(sensor, "latitude");
                Double sensorLon = getDouble(sensor, "longitude");
                
                if (sensorLat == null || sensorLon == null) continue;
                
                double distance = haversineDistance(symptomLat, symptomLon, sensorLat, sensorLon);
                
                if (distance <= PROXIMITY_RADIUS_KM) {
                    Map<String, Object> nearbyInfo = new HashMap<>();
                    nearbyInfo.put("sensor_id", sensor.get("sensor_id"));
                    nearbyInfo.put("distance_km", Math.round(distance * 100.0) / 100.0);
                    nearbyInfo.put("wqi", sensor.get("wqi"));
                    nearbyInfo.put("quality_status", sensor.get("quality_status"));
                    
                    nearbySensors.add(nearbyInfo);
                    
                    Double wqi = getDouble(sensor, "wqi");
                    if (wqi != null) {
                        totalWQI += wqi;
                        wqiCount++;
                    }
                }
            }
            
            if (!nearbySensors.isEmpty()) {
                Map<String, Object> merged = new HashMap<>(symptom);
                merged.put("nearby_sensors", nearbySensors);
                merged.put("nearby_sensor_count", nearbySensors.size());
                merged.put("avg_nearby_wqi", wqiCount > 0 ? totalWQI / wqiCount : null);
                
                mergedData.add(merged);
                symptomsWithSensors++;
            }
        }
        
        result.put("merged_data", mergedData);
        result.put("total_symptoms", symptoms.size());
        result.put("symptoms_with_sensors", symptomsWithSensors);
        
        logger.info("🔗 Merged data: {}/{} symptoms have nearby sensors within {}km",
                   symptomsWithSensors, symptoms.size(), PROXIMITY_RADIUS_KM);
        
        return result;
    }
    
    /**
     * Estimate cluster count from symptom density
     */
    private int estimateClusterCount(List<Map<String, Object>> symptoms) {
        if (symptoms.size() < 3) return 0;
        
        // Simple estimation: every 5 symptoms might form 1 cluster
        return Math.max(symptoms.size() / 5, 1);
    }
    
    /**
     * Calculate distance between two points using Haversine formula
     * @return distance in kilometers
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Earth radius in km
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Safely get Double from map
     */
    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }
    
    /**
     * Get symptom clusters with severity scores for ML prediction
     * Uses direct Firestore query to get latest clusters
     */
    private List<Map<String, Object>> getSymptomClusters() {
        try {
            // Try to get clusters from service
            List<SymptomCluster> clusters = null;
            try {
                clusters = clusterService.getActiveClusters();
            } catch (Exception e) {
                logger.warn("⚠️ Could not fetch clusters from service: {}", e.getMessage());
            }
            
            // If no clusters from service, return empty list
            if (clusters == null || clusters.isEmpty()) {
                logger.info("📊 Found 0 active symptom clusters from Firestore");
                // Return empty list - ML will use count-based calculation
                return new ArrayList<>();
            }
            
            // Convert clusters to ML format
            List<Map<String, Object>> result = new ArrayList<>();
            for (SymptomCluster cluster : clusters) {
                Map<String, Object> clusterData = new HashMap<>();
                
                Double clusterScore = cluster.getClusterScore() != null ? cluster.getClusterScore() : 0.0;
                
                clusterData.put("id", cluster.getId());
                clusterData.put("location", cluster.getLocation());
                clusterData.put("severity_score", clusterScore);
                clusterData.put("report_count", cluster.getReportCount() != null ? cluster.getReportCount() : 0);
                clusterData.put("dominant_symptoms", cluster.getDominantSymptoms());
                clusterData.put("status", cluster.getStatus());
                
                logger.info("📊 Cluster {}: location={}, severity={}, reports={}", 
                           cluster.getId(), cluster.getLocation(), clusterScore, cluster.getReportCount());
                
                result.add(clusterData);
            }
            
            logger.info("📊 Found {} active symptom clusters with severity scores", result.size());
            return result;
            
        } catch (Exception e) {
            logger.error("❌ Error getting symptom clusters: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}
