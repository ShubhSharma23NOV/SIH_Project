package com.arogyajal.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Water Quality Index (WQI) Calculator
 * Implements formula-based WQI calculation using 4 core parameters
 * 
 * Formula: WQI = (pH_index × 0.25) + (Turbidity_index × 0.30) + 
 *                (TDS_index × 0.25) + (Temperature_index × 0.20)
 * 
 * Range: 0-100+ (lower is better)
 * Classification:
 * - 0-25: Excellent (GOOD)
 * - 26-50: Good (GOOD)
 * - 51-75: Fair (MODERATE)
 * - 76-90: Poor (HIGH)
 * - >90: Very Poor (CRITICAL)
 */
public class WQICalculator {
    
    private static final Logger logger = LoggerFactory.getLogger(WQICalculator.class);
    
    // Default values for missing parameters
    private static final double DEFAULT_PH = 7.0;
    private static final double DEFAULT_TEMPERATURE = 25.0;
    private static final double DEFAULT_TDS = 300.0;
    private static final double DEFAULT_TURBIDITY = 5.0;
    
    /**
     * Calculate Water Quality Index using weighted formula
     * 
     * @param ph pH level (6.5-8.5 ideal)
     * @param turbidity Turbidity in NTU
     * @param tds Total Dissolved Solids in ppm
     * @param temperature Temperature in Celsius
     * @return WQI score (0-100+, lower is better)
     */
    public static double calculateWQI(Double ph, Double turbidity, Double tds, Double temperature) {
        // Track which parameters are missing
        boolean hasMissingParams = false;
        
        // Use defaults for missing parameters
        double phValue = ph != null ? ph : DEFAULT_PH;
        double turbidityValue = turbidity != null ? turbidity : DEFAULT_TURBIDITY;
        double tdsValue = tds != null ? tds : DEFAULT_TDS;
        double tempValue = temperature != null ? temperature : DEFAULT_TEMPERATURE;
        
        if (ph == null || turbidity == null || tds == null || temperature == null) {
            hasMissingParams = true;
            logger.warn("⚠️ Missing parameters detected. Using defaults: pH={}, Turbidity={}, TDS={}, Temp={}",
                       ph == null ? DEFAULT_PH : "provided",
                       turbidity == null ? DEFAULT_TURBIDITY : "provided",
                       tds == null ? DEFAULT_TDS : "provided",
                       temperature == null ? DEFAULT_TEMPERATURE : "provided");
        }
        
        // Calculate sub-indices
        double phIndex = calculatePHIndex(phValue);
        double turbidityIndex = calculateTurbidityIndex(turbidityValue);
        double tdsIndex = calculateTDSIndex(tdsValue);
        double tempIndex = calculateTemperatureIndex(tempValue);
        
        // Weighted WQI
        double wqi = (phIndex * 0.25) + 
                    (turbidityIndex * 0.30) + 
                    (tdsIndex * 0.25) + 
                    (tempIndex * 0.20);
        
        // Round to 1 decimal place
        wqi = Math.round(wqi * 10.0) / 10.0;
        
        logger.debug("📊 WQI Calculation: pH={} ({}), Turbidity={} ({}), TDS={} ({}), Temp={} ({}) → WQI={}",
                    phValue, phIndex, turbidityValue, turbidityIndex, 
                    tdsValue, tdsIndex, tempValue, tempIndex, wqi);
        
        return wqi;
    }
    
    /**
     * Calculate pH sub-index
     * Ideal range: 6.5-8.5
     */
    private static double calculatePHIndex(double ph) {
        if (ph >= 6.5 && ph <= 8.5) return 0;      // Excellent
        if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) return 25;  // Good
        if ((ph >= 5.5 && ph < 6.0) || (ph > 9.0 && ph <= 9.5)) return 50;  // Fair
        if ((ph >= 5.0 && ph < 5.5) || (ph > 9.5 && ph <= 10.0)) return 75; // Poor
        return 100; // Very Poor
    }
    
    /**
     * Calculate Turbidity sub-index
     * Ideal: < 5 NTU
     */
    private static double calculateTurbidityIndex(double turbidity) {
        if (turbidity <= 1) return 0;      // Excellent
        if (turbidity <= 5) return 25;     // Good
        if (turbidity <= 10) return 50;    // Fair
        if (turbidity <= 25) return 75;    // Poor
        return 100;                         // Very Poor
    }
    
    /**
     * Calculate TDS sub-index
     * Ideal: < 300 ppm
     */
    private static double calculateTDSIndex(double tds) {
        if (tds <= 300) return 0;          // Excellent
        if (tds <= 500) return 25;         // Good
        if (tds <= 900) return 50;         // Fair
        if (tds <= 1200) return 75;        // Poor
        return 100;                         // Very Poor
    }
    
    /**
     * Calculate Temperature sub-index
     * Ideal: 15-25°C
     */
    private static double calculateTemperatureIndex(double temp) {
        if (temp >= 15 && temp <= 25) return 0;                              // Excellent
        if ((temp >= 10 && temp < 15) || (temp > 25 && temp <= 30)) return 25;  // Good
        if ((temp >= 5 && temp < 10) || (temp > 30 && temp <= 35)) return 50;   // Fair
        if ((temp >= 0 && temp < 5) || (temp > 35 && temp <= 40)) return 75;    // Poor
        return 100;                                                              // Very Poor
    }
    
    /**
     * Get quality classification from WQI score
     * Matches frontend legend exactly
     */
    public static String getQualityClassification(double wqi) {
        if (wqi <= 25) return "Excellent";
        if (wqi <= 50) return "Good";
        if (wqi <= 75) return "Fair";
        if (wqi <= 90) return "Poor";
        return "Very Poor";
    }
    
    /**
     * Get severity level from WQI score
     * Matches frontend severity mapping
     */
    public static String getSeverityLevel(double wqi) {
        if (wqi <= 50) return "GOOD";
        if (wqi <= 75) return "MODERATE";
        if (wqi <= 90) return "HIGH";
        return "CRITICAL";
    }
    
    /**
     * Calculate confidence reduction factor for missing parameters
     * Returns 1.0 if all parameters present, lower if some missing
     */
    public static double getConfidenceFactor(Double ph, Double turbidity, Double tds, Double temperature) {
        int presentCount = 0;
        if (ph != null) presentCount++;
        if (turbidity != null) presentCount++;
        if (tds != null) presentCount++;
        if (temperature != null) presentCount++;
        
        return presentCount / 4.0; // 0.25, 0.5, 0.75, or 1.0
    }
    
    /**
     * Validate if WQI indicates poor water quality
     */
    public static boolean isPoorQuality(double wqi) {
        return wqi > 75; // Poor or Very Poor
    }
    
    /**
     * Get color code for WQI (matches frontend)
     */
    public static String getColorCode(double wqi) {
        if (wqi <= 25) return "#10b981";  // Green - Excellent
        if (wqi <= 50) return "#22c55e";  // Green - Good
        if (wqi <= 75) return "#f59e0b";  // Amber - Fair
        if (wqi <= 90) return "#f97316";  // Orange - Poor
        return "#ef4444";                  // Red - Very Poor
    }
}
