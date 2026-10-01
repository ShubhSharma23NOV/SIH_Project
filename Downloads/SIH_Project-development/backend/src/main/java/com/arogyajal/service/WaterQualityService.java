package com.arogyajal.service;

import com.arogyajal.dto.WaterQualityResponse;
import com.arogyajal.dto.DeviceHealth;
import com.arogyajal.model.SensorReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Water Quality Evaluation Service
 * Implements government-standard water quality assessment rules
 */
@Service
public class WaterQualityService {
    
    private static final Logger log = LoggerFactory.getLogger(WaterQualityService.class);
    
    public enum ParameterStatus {
        GOOD, MODERATE, HIGH, CRITICAL, NOT_REPORTING
    }
    
    public enum FinalStatus {
        GOOD, MODERATE, HIGH, CRITICAL, UNKNOWN
    }
    
    /**
     * Evaluate pH level
     * Safe range: 6.5 - 8.5
     */
    public ParameterStatus evaluatePH(Double ph) {
        if (ph == null || ph <= 0 || ph > 14) {
            return ParameterStatus.NOT_REPORTING;
        }
        
        if (ph < 6.5 || ph > 8.5) {
            return ParameterStatus.HIGH;  // Outside safe range
        }
        
        if (ph < 6.8 || ph > 8.2) {
            return ParameterStatus.MODERATE;  // Near boundary
        }
        
        return ParameterStatus.GOOD;
    }
    
    /**
     * Evaluate Total Dissolved Solids (TDS)
     * GOOD: 0-300 ppm
     * MODERATE: 300-600 ppm
     * HIGH: >600 ppm
     */
    public ParameterStatus evaluateTDS(Double tds) {
        if (tds == null || tds < 0 || tds > 5000) {
            return ParameterStatus.NOT_REPORTING;
        }
        
        if (tds > 600) {
            return ParameterStatus.HIGH;
        }
        
        if (tds > 300) {
            return ParameterStatus.MODERATE;
        }
        
        return ParameterStatus.GOOD;
    }
    
    /**
     * Evaluate Turbidity
     * CRITICAL OVERRIDE: >20 NTU
     * HIGH: 10-20 NTU
     * MODERATE: 5-10 NTU
     * GOOD: 0-5 NTU
     */
    public ParameterStatus evaluateTurbidity(Double turbidity) {
        if (turbidity == null || turbidity < 0 || turbidity > 10000) {
            return ParameterStatus.NOT_REPORTING;
        }
        
        if (turbidity > 20) {
            return ParameterStatus.CRITICAL;  // CRITICAL OVERRIDE
        }
        
        if (turbidity > 10) {
            return ParameterStatus.HIGH;
        }
        
        if (turbidity > 5) {
            return ParameterStatus.MODERATE;
        }
        
        return ParameterStatus.GOOD;
    }
    
    /**
     * Evaluate Temperature
     * Soft influence only - never CRITICAL by itself
     * Normal: 15-30°C
     */
    public ParameterStatus evaluateTemperature(Double temp) {
        if (temp == null || temp < -10 || temp > 60) {
            return ParameterStatus.NOT_REPORTING;
        }
        
        if (temp < 15 || temp > 30) {
            return ParameterStatus.MODERATE;  // Outside normal, but not critical
        }
        
        return ParameterStatus.GOOD;
    }
    
    /**
     * Evaluate Battery Status (SEPARATE from water quality)
     * NORMAL: 3.6-4.2V
     * LOW: 3.4-3.6V
     * CRITICAL: <3.4V
     * NOT_REPORTING: invalid or zero
     */
    public String evaluateBatteryStatus(Double voltage) {
        if (voltage == null || voltage <= 0 || voltage > 5.0) {
            return "NOT_REPORTING";
        }
        
        if (voltage < 3.4) {
            return "CRITICAL";
        }
        
        if (voltage < 3.6) {
            return "LOW";
        }
        
        if (voltage > 4.2) {
            return "NOT_REPORTING";  // Likely sensor error
        }
        
        return "NORMAL";
    }
    
    /**
     * Calculate overall water quality status
     * Implements government-standard decision logic
     */
    public WaterQualityResponse calculateWaterQuality(SensorReading reading) {
        log.info("Calculating water quality for device: {}", reading.getSensorId());
        
        Map<String, String> parameterStatus = new HashMap<>();
        
        // Evaluate each parameter
        ParameterStatus phStatus = evaluatePH(reading.getPh());
        ParameterStatus tdsStatus = evaluateTDS(reading.getTotalDissolvedSolids());
        ParameterStatus turbidityStatus = evaluateTurbidity(reading.getTurbidity());
        ParameterStatus tempStatus = evaluateTemperature(reading.getTemperature());
        
        parameterStatus.put("pH", phStatus.toString());
        parameterStatus.put("TDS", tdsStatus.toString());
        parameterStatus.put("Turbidity", turbidityStatus.toString());
        parameterStatus.put("Temperature", tempStatus.toString());
        
        log.debug("Parameter statuses - pH: {}, TDS: {}, Turbidity: {}, Temp: {}", 
                  phStatus, tdsStatus, turbidityStatus, tempStatus);
        
        // Collect valid statuses (exclude NOT_REPORTING)
        List<ParameterStatus> validStatuses = new ArrayList<>();
        if (phStatus != ParameterStatus.NOT_REPORTING) validStatuses.add(phStatus);
        if (tdsStatus != ParameterStatus.NOT_REPORTING) validStatuses.add(tdsStatus);
        if (turbidityStatus != ParameterStatus.NOT_REPORTING) validStatuses.add(turbidityStatus);
        if (tempStatus != ParameterStatus.NOT_REPORTING) validStatuses.add(tempStatus);
        
        // Determine final status with priority rules
        FinalStatus finalStatus;
        String statusReason;
        
        if (validStatuses.isEmpty()) {
            // No valid sensor data
            finalStatus = FinalStatus.UNKNOWN;
            statusReason = "No valid sensor data available";
            log.warn("No valid sensor data for device: {}", reading.getSensorId());
            
        } else if (validStatuses.contains(ParameterStatus.CRITICAL)) {
            // CRITICAL OVERRIDE (only turbidity can be CRITICAL)
            finalStatus = FinalStatus.CRITICAL;
            if (turbidityStatus == ParameterStatus.CRITICAL) {
                statusReason = String.format("Turbidity exceeds safe limit (%.1f NTU > 20 NTU)", 
                                            reading.getTurbidity());
            } else {
                statusReason = "Critical water quality issue detected";
            }
            log.warn("CRITICAL water quality for device: {} - {}", reading.getSensorId(), statusReason);
            
        } else if (validStatuses.contains(ParameterStatus.HIGH)) {
            // HIGH severity
            finalStatus = FinalStatus.HIGH;
            List<String> highReasons = new ArrayList<>();
            
            if (tdsStatus == ParameterStatus.HIGH) {
                highReasons.add(String.format("TDS exceeds limit (%.0f ppm > 600 ppm)", 
                                             reading.getTotalDissolvedSolids()));
            }
            if (phStatus == ParameterStatus.HIGH) {
                highReasons.add(String.format("pH outside safe range (%.1f not in 6.5-8.5)", 
                                             reading.getPh()));
            }
            if (turbidityStatus == ParameterStatus.HIGH) {
                highReasons.add(String.format("High turbidity (%.1f NTU)", reading.getTurbidity()));
            }
            
            statusReason = String.join("; ", highReasons);
            log.warn("HIGH severity for device: {} - {}", reading.getSensorId(), statusReason);
            
        } else if (validStatuses.contains(ParameterStatus.MODERATE)) {
            // MODERATE severity
            finalStatus = FinalStatus.MODERATE;
            statusReason = "One or more parameters need monitoring";
            log.info("MODERATE status for device: {}", reading.getSensorId());
            
        } else {
            // All valid parameters are GOOD
            finalStatus = FinalStatus.GOOD;
            statusReason = "All parameters within safe limits";
            log.info("GOOD water quality for device: {}", reading.getSensorId());
        }
        
        // Battery status (SEPARATE from water quality)
        DeviceHealth deviceHealth = new DeviceHealth();
        Double batteryVoltage = reading.getBatteryVoltage();
        Double batteryLevel = reading.getBatteryLevel();
        
        // Extract battery voltage from notes if not in dedicated field
        if (batteryVoltage == null || batteryVoltage == 0) {
            String notes = reading.getNotes();
            if (notes != null && notes.contains("Battery Voltage:")) {
                try {
                    String voltageStr = notes.substring(notes.indexOf("Battery Voltage:") + 16);
                    voltageStr = voltageStr.substring(0, voltageStr.indexOf("V")).trim();
                    batteryVoltage = Double.parseDouble(voltageStr);
                } catch (Exception e) {
                    log.debug("Could not parse battery voltage from notes");
                }
            }
        }
        
        deviceHealth.setBatteryVoltage(batteryVoltage);
        deviceHealth.setBatteryLevel(batteryLevel);  // Both are Double now
        deviceHealth.setBatteryStatus(evaluateBatteryStatus(batteryVoltage));
        
        log.info("Final water quality assessment - Status: {}, Battery: {}", 
                 finalStatus, deviceHealth.getBatteryStatus());
        
        // Include actual sensor readings
        WaterQualityResponse.LatestReadings latestReadings = new WaterQualityResponse.LatestReadings(
            reading.getPh(),
            reading.getTotalDissolvedSolids(),
            reading.getTurbidity(),
            reading.getTemperature()
        );
        
        return new WaterQualityResponse(
            finalStatus.toString(),
            statusReason,
            parameterStatus,
            deviceHealth,
            reading.getWqi(),
            latestReadings
        );
    }
}
