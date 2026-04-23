package com.arogyajal.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * Rule-Based Risk Calculator
 * Calculates outbreak risk based on water quality thresholds (WHO/BIS standards)
 * Used in hybrid fusion with ML predictions
 */
public class RuleBasedRiskCalculator {
    
    private static final Logger logger = LoggerFactory.getLogger(RuleBasedRiskCalculator.class);
    
    /**
     * Calculate rule-based risk score from water quality data
     * 
     * @param avgWQI Average WQI across all sensors
     * @param poorSensorCount Number of sensors with WQI > 75
     * @param totalSensors Total number of active sensors
     * @param hasCriticalBreach True if any sensor has critical threshold breach
     * @return Risk score (0-100)
     */
    public static double calculateRuleBasedRisk(
            double avgWQI, 
            int poorSensorCount, 
            int totalSensors,
            boolean hasCriticalBreach) {
        
        double baseRisk = 0.0;
        
        // 1. Base risk from average WQI
        if (avgWQI >= 90) {
            baseRisk += 50; // Very Poor water quality
            logger.info("🔴 Rule-based: Very Poor WQI ({}), base_risk += 50", String.format("%.1f", avgWQI));
        } else if (avgWQI >= 75) {
            baseRisk += 40; // Poor water quality
            logger.info("🟠 Rule-based: Poor WQI ({}), base_risk += 40", String.format("%.1f", avgWQI));
        } else if (avgWQI >= 50) {
            baseRisk += 25; // Fair water quality
            logger.info("🟡 Rule-based: Fair WQI ({}), base_risk += 25", String.format("%.1f", avgWQI));
        } else if (avgWQI >= 25) {
            baseRisk += 10; // Good water quality
            logger.info("🟢 Rule-based: Good WQI ({}), base_risk += 10", String.format("%.1f", avgWQI));
        }
        // Excellent (< 25) adds 0
        
        // 2. Risk from poor sensor ratio
        if (totalSensors > 0) {
            double unsafeRatio = (double) poorSensorCount / totalSensors;
            double ratioRisk = unsafeRatio * 40; // Up to 40 points
            baseRisk += ratioRisk;
            logger.info("📊 Rule-based: Poor sensor ratio {}/{} ({}%), risk += {}",
                       poorSensorCount, totalSensors, 
                       String.format("%.1f", unsafeRatio * 100), 
                       String.format("%.1f", ratioRisk));
        }
        
        // 3. Critical breach override
        if (hasCriticalBreach) {
            baseRisk = Math.max(baseRisk, 60); // Minimum MEDIUM-HIGH risk
            logger.warn("⚠️ Rule-based: Critical threshold breach detected, risk >= 60");
        }
        
        // 4. Clamp to 0-100
        double finalRisk = Math.min(Math.max(baseRisk, 0), 100);
        
        logger.info("🎯 Rule-based risk calculated: {} (avgWQI={}, poor={}/{}, critical={})",
                   String.format("%.1f", finalRisk), 
                   String.format("%.1f", avgWQI), 
                   poorSensorCount, totalSensors, hasCriticalBreach);
        
        return finalRisk;
    }
    
    /**
     * Calculate rule-based risk from sensor data list
     * 
     * @param sensorData List of sensor readings with WQI
     * @return Risk score (0-100)
     */
    public static double calculateRuleBasedRisk(List<Map<String, Object>> sensorData) {
        if (sensorData == null || sensorData.isEmpty()) {
            logger.warn("⚠️ No sensor data available for rule-based risk calculation");
            return 0.0;
        }
        
        // Calculate metrics
        double totalWQI = 0.0;
        int poorCount = 0;
        int validCount = 0;
        boolean hasCritical = false;
        
        for (Map<String, Object> sensor : sensorData) {
            Object wqiObj = sensor.get("wqi");
            if (wqiObj instanceof Number) {
                double wqi = ((Number) wqiObj).doubleValue();
                totalWQI += wqi;
                validCount++;
                
                // Lowered threshold from 75 to 50 for better sensitivity
                // Now counts Fair (51-75), Poor (76-90), and Very Poor (>90) as "poor"
                if (wqi > 50) {
                    poorCount++;
                }
                if (wqi > 90) {
                    hasCritical = true;
                }
            }
        }
        
        if (validCount == 0) {
            logger.warn("⚠️ No valid WQI values found in sensor data");
            return 0.0;
        }
        
        double avgWQI = totalWQI / validCount;
        
        return calculateRuleBasedRisk(avgWQI, poorCount, validCount, hasCritical);
    }
    
    /**
     * Determine risk level from risk score
     * 
     * @param riskScore Risk score (0-100)
     * @return Risk level (LOW/MEDIUM/HIGH/CRITICAL)
     */
    public static String determineRiskLevel(double riskScore) {
        if (riskScore >= 75) {
            return "CRITICAL";
        } else if (riskScore >= 50) {
            return "HIGH";
        } else if (riskScore >= 25) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }
}
