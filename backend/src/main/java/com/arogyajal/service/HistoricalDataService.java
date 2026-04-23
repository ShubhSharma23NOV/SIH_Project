package com.arogyajal.service;

import com.arogyajal.model.SensorReading;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.model.Alert;
import com.arogyajal.util.WQICalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Historical Data Service
 * Manages historical snapshots for trend analysis
 * Enables detection of spike vs sustained patterns
 */
@Service
public class HistoricalDataService {
    
    private static final Logger logger = LoggerFactory.getLogger(HistoricalDataService.class);
    
    // In-memory cache for historical snapshots (last 7 days)
    // In production, this should be stored in Firestore
    private final Map<String, List<HistoricalSnapshot>> snapshotCache = new HashMap<>();
    private static final int MAX_SNAPSHOTS = 168; // 7 days * 24 hours
    
    private final SensorService sensorService;
    private final SymptomService symptomService;
    private final AlertService alertService;
    
    public HistoricalDataService(SensorService sensorService, 
                                 SymptomService symptomService,
                                 AlertService alertService) {
        this.sensorService = sensorService;
        this.symptomService = symptomService;
        this.alertService = alertService;
    }
    
    /**
     * Historical snapshot data structure
     */
    public static class HistoricalSnapshot {
        public LocalDateTime timestamp;
        public double avgWQI;
        public int totalReports;
        public int activeClusters;
        public int activeAlerts;
        public int poorSensors;
        public int totalSensors;
        
        public HistoricalSnapshot(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
    
    /**
     * Trend data structure
     */
    public static class TrendData {
        public double wqiTrend24h;
        public double reportTrend24h;
        public double alertTrend24h;
        public double clusterGrowthRate7d;
        public boolean hasTrendData;
        public String trendDirection; // "IMPROVING", "STABLE", "WORSENING"
        
        public TrendData() {
            this.hasTrendData = false;
            this.trendDirection = "STABLE";
        }
    }
    
    /**
     * Get historical data from N hours ago
     * 
     * @param hoursAgo Number of hours in the past
     * @return Historical snapshot or null if not available
     */
    public HistoricalSnapshot getHistoricalSnapshot(int hoursAgo) {
        LocalDateTime targetTime = LocalDateTime.now().minus(hoursAgo, ChronoUnit.HOURS);
        
        try {
            // Calculate historical metrics
            HistoricalSnapshot snapshot = new HistoricalSnapshot(targetTime);
            
            // 1. Calculate historical WQI
            List<SensorReading> historicalReadings = getReadingsNearTime(targetTime, 1); // ±1 hour window
            if (!historicalReadings.isEmpty()) {
                double totalWQI = 0.0;
                int validCount = 0;
                int poorCount = 0;
                
                for (SensorReading reading : historicalReadings) {
                    double wqi = WQICalculator.calculateWQI(
                        reading.getPh(),
                        reading.getTurbidity(),
                        reading.getTotalDissolvedSolids(),
                        reading.getTemperature()
                    );
                    
                    if (wqi > 0) {
                        totalWQI += wqi;
                        validCount++;
                        if (wqi > 75) poorCount++;
                    }
                }
                
                snapshot.avgWQI = validCount > 0 ? totalWQI / validCount : 0.0;
                snapshot.poorSensors = poorCount;
                snapshot.totalSensors = validCount;
            }
            
            // 2. Count historical symptom reports
            snapshot.totalReports = getReportCountNearTime(targetTime, 24); // Last 24h from that point
            
            // 3. Count historical active alerts
            snapshot.activeAlerts = getAlertCountNearTime(targetTime, 24);
            
            // 4. Estimate historical clusters (simplified)
            snapshot.activeClusters = Math.max(snapshot.totalReports / 5, 0);
            
            logger.debug("📊 Historical snapshot ({}h ago): WQI={:.1f}, Reports={}, Alerts={}",
                        hoursAgo, snapshot.avgWQI, snapshot.totalReports, snapshot.activeAlerts);
            
            return snapshot;
            
        } catch (Exception e) {
            logger.error("❌ Error getting historical snapshot: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Calculate trend data by comparing current with historical
     * 
     * @param currentWQI Current average WQI
     * @param currentReports Current report count (24h)
     * @param currentAlerts Current alert count (24h)
     * @param currentClusters Current cluster count
     * @return Trend data with deltas
     */
    public TrendData calculateTrends(double currentWQI, int currentReports, 
                                     int currentAlerts, int currentClusters) {
        TrendData trends = new TrendData();
        
        try {
            // Get historical snapshots
            HistoricalSnapshot snapshot24h = getHistoricalSnapshot(24);
            HistoricalSnapshot snapshot7d = getHistoricalSnapshot(168);
            
            if (snapshot24h != null) {
                // Calculate 24h trends
                trends.wqiTrend24h = currentWQI - snapshot24h.avgWQI;
                trends.reportTrend24h = currentReports - snapshot24h.totalReports;
                trends.alertTrend24h = currentAlerts - snapshot24h.activeAlerts;
                
                trends.hasTrendData = true;
                
                logger.info("📈 24h Trends: WQI Δ{:.1f}, Reports Δ{}, Alerts Δ{}",
                           trends.wqiTrend24h, (int)trends.reportTrend24h, (int)trends.alertTrend24h);
            } else {
                logger.warn("⚠️ No 24h historical data available for trend calculation");
            }
            
            if (snapshot7d != null) {
                // Calculate 7-day cluster growth rate
                double clusterDelta = currentClusters - snapshot7d.activeClusters;
                trends.clusterGrowthRate7d = clusterDelta / 7.0; // Per day
                
                logger.info("📈 7d Trend: Cluster growth {:.2f} per day", trends.clusterGrowthRate7d);
            }
            
            // Determine overall trend direction
            trends.trendDirection = determineTrendDirection(trends);
            
            logger.info("🎯 Overall trend direction: {}", trends.trendDirection);
            
        } catch (Exception e) {
            logger.error("❌ Error calculating trends: {}", e.getMessage());
        }
        
        return trends;
    }
    
    /**
     * Determine overall trend direction
     */
    private String determineTrendDirection(TrendData trends) {
        if (!trends.hasTrendData) return "STABLE";
        
        int worseningCount = 0;
        int improvingCount = 0;
        
        // WQI trend (higher is worse)
        if (trends.wqiTrend24h > 10) worseningCount++;
        else if (trends.wqiTrend24h < -10) improvingCount++;
        
        // Report trend (higher is worse)
        if (trends.reportTrend24h > 5) worseningCount++;
        else if (trends.reportTrend24h < -5) improvingCount++;
        
        // Alert trend (higher is worse)
        if (trends.alertTrend24h > 3) worseningCount++;
        else if (trends.alertTrend24h < -3) improvingCount++;
        
        // Cluster growth (positive is worse)
        if (trends.clusterGrowthRate7d > 0.5) worseningCount++;
        else if (trends.clusterGrowthRate7d < -0.5) improvingCount++;
        
        if (worseningCount >= 2) return "WORSENING";
        if (improvingCount >= 2) return "IMPROVING";
        return "STABLE";
    }
    
    /**
     * Get sensor readings near a specific time (±window hours)
     */
    private List<SensorReading> getReadingsNearTime(LocalDateTime targetTime, int windowHours) {
        try {
            List<SensorReading> allReadings = sensorService.getAllSensorReadings();
            List<SensorReading> nearReadings = new ArrayList<>();
            
            LocalDateTime startTime = targetTime.minus(windowHours, ChronoUnit.HOURS);
            LocalDateTime endTime = targetTime.plus(windowHours, ChronoUnit.HOURS);
            
            for (SensorReading reading : allReadings) {
                if (reading.getTimestamp() != null) {
                    LocalDateTime readingTime = reading.getTimestamp().toDate().toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    
                    if (readingTime.isAfter(startTime) && readingTime.isBefore(endTime)) {
                        nearReadings.add(reading);
                    }
                }
            }
            
            return nearReadings;
            
        } catch (Exception e) {
            logger.error("❌ Error getting readings near time: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Get symptom report count near a specific time (last N hours from that point)
     */
    private int getReportCountNearTime(LocalDateTime targetTime, int hoursWindow) {
        try {
            List<SymptomReport> allReports = symptomService.getAllSymptomReports();
            int count = 0;
            
            LocalDateTime startTime = targetTime.minus(hoursWindow, ChronoUnit.HOURS);
            
            for (SymptomReport report : allReports) {
                if (report.getReportedAt() != null) {
                    LocalDateTime reportTime = report.getReportedAt().toDate().toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    
                    if (reportTime.isAfter(startTime) && reportTime.isBefore(targetTime)) {
                        count++;
                    }
                }
            }
            
            return count;
            
        } catch (Exception e) {
            logger.error("❌ Error getting report count near time: {}", e.getMessage());
            return 0;
        }
    }
    
    /**
     * Get alert count near a specific time
     */
    private int getAlertCountNearTime(LocalDateTime targetTime, int hoursWindow) {
        try {
            List<Alert> allAlerts = alertService.getAllAlerts();
            int count = 0;
            
            LocalDateTime startTime = targetTime.minus(hoursWindow, ChronoUnit.HOURS);
            
            for (Alert alert : allAlerts) {
                if (alert.getTriggeredAt() != null) {
                    LocalDateTime alertTime = alert.getTriggeredAt().toDate().toInstant()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    
                    if (alertTime.isAfter(startTime) && alertTime.isBefore(targetTime) &&
                        "ACTIVE".equals(alert.getStatus())) {
                        count++;
                    }
                }
            }
            
            return count;
            
        } catch (Exception e) {
            logger.error("❌ Error getting alert count near time: {}", e.getMessage());
            return 0;
        }
    }
    
    /**
     * Save current snapshot for future trend analysis
     * Should be called periodically (e.g., every hour)
     */
    public void saveCurrentSnapshot(String region) {
        try {
            HistoricalSnapshot snapshot = new HistoricalSnapshot(LocalDateTime.now());
            
            // Calculate current metrics
            List<SensorReading> currentReadings = sensorService.getAllSensorReadings();
            if (!currentReadings.isEmpty()) {
                double totalWQI = 0.0;
                int validCount = 0;
                int poorCount = 0;
                
                for (SensorReading reading : currentReadings) {
                    double wqi = WQICalculator.calculateWQI(
                        reading.getPh(),
                        reading.getTurbidity(),
                        reading.getTotalDissolvedSolids(),
                        reading.getTemperature()
                    );
                    
                    if (wqi > 0) {
                        totalWQI += wqi;
                        validCount++;
                        if (wqi > 75) poorCount++;
                    }
                }
                
                snapshot.avgWQI = validCount > 0 ? totalWQI / validCount : 0.0;
                snapshot.poorSensors = poorCount;
                snapshot.totalSensors = validCount;
            }
            
            snapshot.totalReports = symptomService.getAllSymptomReports().size();
            snapshot.activeAlerts = (int) alertService.getAllAlerts().stream()
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .count();
            
            // Save to cache
            List<HistoricalSnapshot> snapshots = snapshotCache.getOrDefault(region, new ArrayList<>());
            snapshots.add(snapshot);
            
            // Keep only last MAX_SNAPSHOTS
            if (snapshots.size() > MAX_SNAPSHOTS) {
                snapshots.remove(0);
            }
            
            snapshotCache.put(region, snapshots);
            
            logger.info("💾 Saved historical snapshot for {}: WQI={:.1f}, Reports={}, Alerts={}",
                       region, snapshot.avgWQI, snapshot.totalReports, snapshot.activeAlerts);
            
        } catch (Exception e) {
            logger.error("❌ Error saving snapshot: {}", e.getMessage());
        }
    }
}
