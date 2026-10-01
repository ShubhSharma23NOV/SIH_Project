package com.arogyajal.service;

import com.arogyajal.model.Alert;
import com.arogyajal.model.SensorReading;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for monitoring sensor health and generating alerts
 * Tracks sensor status, battery levels, and data quality
 */
@Service
public class SensorHealthMonitorService {
    
    private static final Logger log = LoggerFactory.getLogger(SensorHealthMonitorService.class);
    
    private final AlertService alertService;
    
    @Value("${app.demo-mode:false}")
    private boolean demoMode;
    
    // Track last seen timestamp for each sensor
    private final Map<String, Timestamp> lastSeenMap = new HashMap<>();
    
    // Track battery warnings to avoid duplicate alerts
    private final Map<String, Long> batteryWarningMap = new HashMap<>();
    
    // Constants
    private static final long OFFLINE_THRESHOLD_SECONDS = 3600; // 1 hour
    private static final long BATTERY_WARNING_COOLDOWN_MS = 3600000; // 1 hour cooldown
    
    public SensorHealthMonitorService(AlertService alertService) {
        this.alertService = alertService;
    }
    
    /**
     * Check sensor health and generate alerts if needed
     */
    public void checkSensorHealth(String sensorId, boolean hasSufficientData, SensorReading reading) {
        try {
            // Update last seen timestamp
            lastSeenMap.put(sensorId, Timestamp.now());
            
            // Check for insufficient data
            if (!hasSufficientData) {
                createInsufficientDataAlert(sensorId, reading);
            }
            
            // Check battery level if available
            if (reading.getNotes() != null && reading.getNotes().contains("Battery Voltage:")) {
                checkBatteryLevel(sensorId, reading);
            }
            
        } catch (Exception e) {
            log.error("Error checking sensor health for {}: {}", sensorId, e.getMessage(), e);
        }
    }
    
    /**
     * Check for offline sensors
     * Scheduled to run every 15 minutes
     */
    @Scheduled(fixedRate = 900000)
    public void checkOfflineSensors() {
        // Skip in demo mode to prevent Firebase quota exhaustion
        if (demoMode) {
            log.debug("Skipping offline sensor check (demo mode enabled)");
            return;
        }
        
        log.info("Checking for offline sensors...");
        
        try {
            Timestamp now = Timestamp.now();
            Timestamp offlineThreshold = Timestamp.ofTimeSecondsAndNanos(
                now.getSeconds() - OFFLINE_THRESHOLD_SECONDS, 0);
            
            int offlineCount = 0;
            for (Map.Entry<String, Timestamp> entry : lastSeenMap.entrySet()) {
                String sensorId = entry.getKey();
                Timestamp lastSeen = entry.getValue();
                
                if (lastSeen.compareTo(offlineThreshold) < 0) {
                    createOfflineAlert(sensorId, lastSeen);
                    offlineCount++;
                }
            }
            
            if (offlineCount > 0) {
                log.warn("⚠️ Found {} offline sensors", offlineCount);
            } else {
                log.info("✅ All sensors online");
            }
            
        } catch (Exception e) {
            log.error("Error checking offline sensors: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create alert for insufficient sensor data
     */
    private void createInsufficientDataAlert(String sensorId, SensorReading reading) {
        try {
            String title = String.format("Sensor Data Quality Alert - %s", sensorId);
            String description = String.format(
                "Sensor %s is reporting insufficient data. " +
                "Less than 3 parameters available for water quality assessment. " +
                "Sensor maintenance may be required.",
                sensorId
            );
            
            Alert alert = Alert.builder()
                    .alertType("SENSOR_HEALTH")
                    .severity("MEDIUM")
                    .title(title)
                    .description(description)
                    .location(reading.getLocation())
                    .sensorId(sensorId)
                    .build();
            
            alertService.createAlert(alert);
            log.info("Created insufficient data alert for sensor: {}", sensorId);
            
        } catch (Exception e) {
            log.error("Error creating insufficient data alert: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Check battery level and create alert if low
     */
    private void checkBatteryLevel(String sensorId, SensorReading reading) {
        try {
            // Parse battery voltage from notes
            String notes = reading.getNotes();
            String voltageStr = notes.substring(notes.indexOf(":") + 1, notes.indexOf("V")).trim();
            double voltage = Double.parseDouble(voltageStr);
            
            // Check if battery is low (< 3.3V for typical IoT devices)
            if (voltage < 3.3) {
                // Check cooldown to avoid duplicate alerts
                Long lastWarning = batteryWarningMap.get(sensorId);
                long now = System.currentTimeMillis();
                
                if (lastWarning == null || (now - lastWarning) > BATTERY_WARNING_COOLDOWN_MS) {
                    createBatteryLowAlert(sensorId, voltage, reading);
                    batteryWarningMap.put(sensorId, now);
                }
            }
            
        } catch (Exception e) {
            log.debug("Could not parse battery voltage for sensor {}: {}", sensorId, e.getMessage());
        }
    }
    
    /**
     * Create alert for low battery
     */
    private void createBatteryLowAlert(String sensorId, double voltage, SensorReading reading) {
        try {
            String severity = voltage < 3.0 ? "HIGH" : "MEDIUM";
            
            String title = String.format("Low Battery Alert - %s", sensorId);
            String description = String.format(
                "Sensor %s battery is low (%.2fV). " +
                "Battery replacement or recharging required soon to avoid data loss.",
                sensorId, voltage
            );
            
            Alert alert = Alert.builder()
                    .alertType("SENSOR_HEALTH")
                    .severity(severity)
                    .title(title)
                    .description(description)
                    .location(reading.getLocation())
                    .sensorId(sensorId)
                    .actualValue(voltage)
                    .thresholdValue(3.3)
                    .parameter("Battery Voltage")
                    .build();
            
            alertService.createAlert(alert);
            log.warn("⚠️ Created low battery alert for sensor {}: {}V", sensorId, voltage);
            
        } catch (Exception e) {
            log.error("Error creating battery low alert: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create alert for offline sensor
     */
    private void createOfflineAlert(String sensorId, Timestamp lastSeen) {
        try {
            long offlineMinutes = (Timestamp.now().getSeconds() - lastSeen.getSeconds()) / 60;
            
            String title = String.format("Sensor Offline Alert - %s", sensorId);
            String description = String.format(
                "Sensor %s has been offline for %d minutes. " +
                "Last data received at %s. " +
                "Check sensor connectivity and power supply.",
                sensorId, offlineMinutes, lastSeen.toString()
            );
            
            Alert alert = Alert.builder()
                    .alertType("SENSOR_HEALTH")
                    .severity("HIGH")
                    .title(title)
                    .description(description)
                    .sensorId(sensorId)
                    .build();
            
            alertService.createAlert(alert);
            log.warn("⚠️ Created offline alert for sensor {}: offline for {} minutes", 
                    sensorId, offlineMinutes);
            
        } catch (Exception e) {
            log.error("Error creating offline alert: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Get sensor health statistics
     * Returns overall health metrics for all monitored sensors
     */
    public Map<String, Object> getSensorHealthStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            Timestamp now = Timestamp.now();
            Timestamp offlineThreshold = Timestamp.ofTimeSecondsAndNanos(
                now.getSeconds() - OFFLINE_THRESHOLD_SECONDS, 0);
            
            int totalSensors = lastSeenMap.size();
            int onlineSensors = 0;
            int offlineSensors = 0;
            int lowBatterySensors = batteryWarningMap.size();
            
            // Count online vs offline sensors
            for (Timestamp lastSeen : lastSeenMap.values()) {
                if (lastSeen.compareTo(offlineThreshold) >= 0) {
                    onlineSensors++;
                } else {
                    offlineSensors++;
                }
            }
            
            stats.put("totalSensors", totalSensors);
            stats.put("onlineSensors", onlineSensors);
            stats.put("offlineSensors", offlineSensors);
            stats.put("lowBatterySensors", lowBatterySensors);
            stats.put("healthPercentage", totalSensors > 0 ? 
                (onlineSensors * 100.0 / totalSensors) : 100.0);
            stats.put("lastCheckTime", now.toString());
            
            log.debug("Sensor health stats: {} total, {} online, {} offline", 
                totalSensors, onlineSensors, offlineSensors);
            
        } catch (Exception e) {
            log.error("Error getting sensor health stats: {}", e.getMessage(), e);
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * Get status of a specific sensor
     */
    public String getSensorStatus(String deviceId) {
        try {
            Timestamp lastSeen = lastSeenMap.get(deviceId);
            
            if (lastSeen == null) {
                return "UNKNOWN";
            }
            
            Timestamp now = Timestamp.now();
            Timestamp offlineThreshold = Timestamp.ofTimeSecondsAndNanos(
                now.getSeconds() - OFFLINE_THRESHOLD_SECONDS, 0);
            
            if (lastSeen.compareTo(offlineThreshold) < 0) {
                return "FAULTY";
            }
            
            // Check if sensor has battery warning
            if (batteryWarningMap.containsKey(deviceId)) {
                return "DEGRADED";
            }
            
            return "HEALTHY";
            
        } catch (Exception e) {
            log.error("Error getting sensor status for {}: {}", deviceId, e.getMessage(), e);
            return "UNKNOWN";
        }
    }
    
    /**
     * Get status of all sensors
     */
    public Map<String, String> getAllSensorStatuses() {
        Map<String, String> statuses = new HashMap<>();
        
        try {
            for (String sensorId : lastSeenMap.keySet()) {
                statuses.put(sensorId, getSensorStatus(sensorId));
            }
            
            log.debug("Retrieved statuses for {} sensors", statuses.size());
            
        } catch (Exception e) {
            log.error("Error getting all sensor statuses: {}", e.getMessage(), e);
        }
        
        return statuses;
    }
    
    /**
     * Reset sensor health monitoring history
     */
    public void resetSensorHealth(String deviceId) {
        try {
            lastSeenMap.remove(deviceId);
            batteryWarningMap.remove(deviceId);
            
            log.info("Reset health monitoring history for sensor: {}", deviceId);
            
        } catch (Exception e) {
            log.error("Error resetting sensor health for {}: {}", deviceId, e.getMessage(), e);
        }
    }
}
