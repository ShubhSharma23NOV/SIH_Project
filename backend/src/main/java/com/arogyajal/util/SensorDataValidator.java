package com.arogyajal.util;

import com.arogyajal.model.SensorReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates sensor readings against acceptable ranges
 * Filters out invalid/anomalous data before aggregation
 */
public class SensorDataValidator {
    
    private static final Logger log = LoggerFactory.getLogger(SensorDataValidator.class);
    
    // Validation ranges - Physical possible ranges
    private static final double PH_MIN = 1.0;  // pH < 1 considered missing/invalid
    private static final double PH_MAX = 14.0;
    private static final double TDS_MIN = 0.0;
    private static final double TDS_MAX = 2000.0;
    private static final double TURBIDITY_MIN = 0.0;
    private static final double TURBIDITY_MAX = 300.0;  // Extended max for detection
    private static final double TEMPERATURE_MIN = 0.0;
    private static final double TEMPERATURE_MAX = 80.0;
    
    // Threshold for detecting "missing" values (0.00 or very close to 0)
    private static final double ZERO_THRESHOLD = 0.001;
    
    public static class ValidationResult {
        private List<SensorReading> validReadings = new ArrayList<>();
        private List<RejectedReading> rejectedReadings = new ArrayList<>();
        private List<MissingReading> missingReadings = new ArrayList<>();
        private int totalCount = 0;
        private int validCount = 0;
        private int discardedCount = 0;
        private int missingCount = 0;
        
        public List<SensorReading> getValidReadings() { return validReadings; }
        public List<RejectedReading> getRejectedReadings() { return rejectedReadings; }
        public List<MissingReading> getMissingReadings() { return missingReadings; }
        public int getTotalCount() { return totalCount; }
        public int getValidCount() { return validCount; }
        public int getDiscardedCount() { return discardedCount; }
        public int getMissingCount() { return missingCount; }
        public double getConfidencePercentage() {
            return totalCount > 0 ? (validCount * 100.0 / totalCount) : 0.0;
        }
        
        public void addValid(SensorReading reading) {
            validReadings.add(reading);
            validCount++;
            totalCount++;
        }
        
        public void addRejected(SensorReading reading, String reason) {
            rejectedReadings.add(new RejectedReading(reading, reason));
            discardedCount++;
            totalCount++;
        }
        
        public void addMissing(SensorReading reading, String parameter, String reason) {
            missingReadings.add(new MissingReading(reading, parameter, reason));
            missingCount++;
        }
    }
    
    public static class MissingReading {
        private String sensorId;
        private String parameter;
        private String reason;
        private String timestamp;
        
        public MissingReading(SensorReading reading, String parameter, String reason) {
            this.sensorId = reading.getSensorId();
            this.parameter = parameter;
            this.reason = reason;
            this.timestamp = reading.getTimestamp() != null ? reading.getTimestamp().toString() : "unknown";
        }
        
        public String getSensorId() { return sensorId; }
        public String getParameter() { return parameter; }
        public String getReason() { return reason; }
        public String getTimestamp() { return timestamp; }
    }
    
    public static class RejectedReading {
        private String sensorId;
        private String parameter;
        private Double value;
        private String reason;
        private String timestamp;
        
        public RejectedReading(SensorReading reading, String reason) {
            this.sensorId = reading.getSensorId();
            this.reason = reason;
            this.timestamp = reading.getTimestamp() != null ? reading.getTimestamp().toString() : "unknown";
            
            // Determine which parameter was invalid
            if (reason.contains("pH")) {
                this.parameter = "pH";
                this.value = reading.getPh();
            } else if (reason.contains("TDS")) {
                this.parameter = "TDS";
                this.value = reading.getTotalDissolvedSolids();
            } else if (reason.contains("Turbidity")) {
                this.parameter = "Turbidity";
                this.value = reading.getTurbidity();
            } else if (reason.contains("Temperature")) {
                this.parameter = "Temperature";
                this.value = reading.getTemperature();
            }
        }
        
        public String getSensorId() { return sensorId; }
        public String getParameter() { return parameter; }
        public Double getValue() { return value; }
        public String getReason() { return reason; }
        public String getTimestamp() { return timestamp; }
    }
    
    /**
     * Validate a list of sensor readings
     */
    public static ValidationResult validateReadings(List<SensorReading> readings) {
        ValidationResult result = new ValidationResult();
        
        for (SensorReading reading : readings) {
            String validationError = validateReading(reading);
            
            if (validationError == null) {
                result.addValid(reading);
            } else {
                result.addRejected(reading, validationError);
                log.warn("Rejected reading from sensor {}: {}", reading.getSensorId(), validationError);
            }
        }
        
        log.info("Validation complete: {} valid, {} discarded out of {} total ({}% confidence)",
                result.getValidCount(), result.getDiscardedCount(), result.getTotalCount(),
                String.format("%.1f", result.getConfidencePercentage()));
        
        return result;
    }
    
    /**
     * Validate a single sensor reading
     * @return null if valid, error message if invalid
     */
    private static String validateReading(SensorReading reading) {
        // Validate pH
        if (reading.getPh() != null) {
            // Check for missing/uninstalled sensor (0.00 or very close to 0)
            if (Math.abs(reading.getPh()) < ZERO_THRESHOLD) {
                return "pH: Missing - Sensor not installed or disconnected";
            }
            // Check for negative values
            if (reading.getPh() < 0) {
                return String.format("pH negative: %.2f (sensor malfunction)", reading.getPh());
            }
            // Check physical possible range
            if (reading.getPh() < PH_MIN || reading.getPh() > PH_MAX) {
                return String.format("pH out of range: %.2f (valid: %.1f-%.1f)", 
                        reading.getPh(), PH_MIN, PH_MAX);
            }
        }
        
        // Validate TDS
        if (reading.getTotalDissolvedSolids() != null) {
            // Check for missing/uninstalled sensor
            if (Math.abs(reading.getTotalDissolvedSolids()) < ZERO_THRESHOLD) {
                return "TDS: Missing - Sensor not installed or disconnected";
            }
            // Check for negative values
            if (reading.getTotalDissolvedSolids() < 0) {
                return String.format("TDS negative: %.2f ppm (sensor malfunction)", 
                        reading.getTotalDissolvedSolids());
            }
            // Check physical possible range
            if (reading.getTotalDissolvedSolids() > TDS_MAX) {
                return String.format("TDS out of range: %.2f ppm (valid: %.0f-%.0f)", 
                        reading.getTotalDissolvedSolids(), TDS_MIN, TDS_MAX);
            }
        }
        
        // Validate Turbidity
        if (reading.getTurbidity() != null) {
            // Check for missing/uninstalled sensor
            if (Math.abs(reading.getTurbidity()) < ZERO_THRESHOLD) {
                return "Turbidity: Missing - Sensor not installed or disconnected";
            }
            // Check for negative values
            if (reading.getTurbidity() < 0) {
                return String.format("Turbidity negative: %.2f NTU (sensor malfunction)", 
                        reading.getTurbidity());
            }
            // Check physical possible range
            if (reading.getTurbidity() > TURBIDITY_MAX) {
                return String.format("Turbidity out of range: %.2f NTU (valid: %.0f-%.0f)", 
                        reading.getTurbidity(), TURBIDITY_MIN, TURBIDITY_MAX);
            }
        }
        
        // Validate Temperature
        if (reading.getTemperature() != null) {
            // Check for missing/uninstalled sensor
            if (Math.abs(reading.getTemperature()) < ZERO_THRESHOLD) {
                return "Temperature: Missing - Sensor not installed or disconnected";
            }
            // Check for negative values
            if (reading.getTemperature() < 0) {
                return String.format("Temperature negative: %.2f°C (sensor malfunction)", 
                        reading.getTemperature());
            }
            // Check physical possible range
            if (reading.getTemperature() > TEMPERATURE_MAX) {
                return String.format("Temperature out of range: %.2f°C (valid: %.0f-%.0f)", 
                        reading.getTemperature(), TEMPERATURE_MIN, TEMPERATURE_MAX);
            }
        }
        
        return null; // Valid
    }
    
    /**
     * Check if a value is missing (null, 0.00, NaN, or undefined)
     */
    public static boolean isMissingValue(Double value) {
        if (value == null) return true;
        if (Double.isNaN(value)) return true;
        if (Math.abs(value) < ZERO_THRESHOLD) return true;
        return false;
    }
    
    /**
     * Get display text for missing sensor value
     */
    public static String getMissingValueDisplay() {
        return "⚠ No Reading — Sensor Not Installed or Disconnected";
    }
    
    /**
     * Normalize region string for consistent matching
     */
    public static String normalizeRegion(String region) {
        if (region == null || region.isEmpty()) {
            return null;
        }
        
        return region.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
