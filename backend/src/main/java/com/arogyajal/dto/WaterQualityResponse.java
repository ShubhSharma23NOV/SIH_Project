package com.arogyajal.dto;

import java.util.Map;

/**
 * Water Quality Assessment Response
 * Contains final status, reasons, and per-parameter evaluation
 */
public class WaterQualityResponse {
    
    private String finalStatus;      // GOOD, MODERATE, HIGH, CRITICAL, UNKNOWN
    private String statusReason;     // Human-readable explanation
    private Map<String, String> parameterStatus;  // Per-parameter status
    private DeviceHealth deviceHealth;  // Battery and device info
    private Double wqiScore;         // ML-calculated WQI (optional)
    private LatestReadings latestReadings;  // Actual sensor values
    
    public WaterQualityResponse() {
    }
    
    public WaterQualityResponse(String finalStatus, String statusReason, 
                               Map<String, String> parameterStatus,
                               DeviceHealth deviceHealth, Double wqiScore,
                               LatestReadings latestReadings) {
        this.finalStatus = finalStatus;
        this.statusReason = statusReason;
        this.parameterStatus = parameterStatus;
        this.deviceHealth = deviceHealth;
        this.wqiScore = wqiScore;
        this.latestReadings = latestReadings;
    }
    
    // Getters and Setters
    
    public String getFinalStatus() {
        return finalStatus;
    }
    
    public void setFinalStatus(String finalStatus) {
        this.finalStatus = finalStatus;
    }
    
    public String getStatusReason() {
        return statusReason;
    }
    
    public void setStatusReason(String statusReason) {
        this.statusReason = statusReason;
    }
    
    public Map<String, String> getParameterStatus() {
        return parameterStatus;
    }
    
    public void setParameterStatus(Map<String, String> parameterStatus) {
        this.parameterStatus = parameterStatus;
    }
    
    public DeviceHealth getDeviceHealth() {
        return deviceHealth;
    }
    
    public void setDeviceHealth(DeviceHealth deviceHealth) {
        this.deviceHealth = deviceHealth;
    }
    
    public Double getWqiScore() {
        return wqiScore;
    }
    
    public void setWqiScore(Double wqiScore) {
        this.wqiScore = wqiScore;
    }
    
    public LatestReadings getLatestReadings() {
        return latestReadings;
    }
    
    public void setLatestReadings(LatestReadings latestReadings) {
        this.latestReadings = latestReadings;
    }
    
    @Override
    public String toString() {
        return "WaterQualityResponse{" +
               "finalStatus='" + finalStatus + '\'' +
               ", statusReason='" + statusReason + '\'' +
               ", parameterStatus=" + parameterStatus +
               ", deviceHealth=" + deviceHealth +
               ", wqiScore=" + wqiScore +
               ", latestReadings=" + latestReadings +
               '}';
    }
    
    /**
     * Inner class for actual sensor readings
     */
    public static class LatestReadings {
        private Double pH;
        private Double TDS;
        private Double Turbidity;
        private Double Temperature;
        
        public LatestReadings() {
        }
        
        public LatestReadings(Double pH, Double TDS, Double Turbidity, Double Temperature) {
            this.pH = pH;
            this.TDS = TDS;
            this.Turbidity = Turbidity;
            this.Temperature = Temperature;
        }
        
        // Use @JsonProperty to ensure correct JSON field names
        @com.fasterxml.jackson.annotation.JsonProperty("pH")
        public Double getPH() {
            return pH;
        }
        
        public void setPH(Double pH) {
            this.pH = pH;
        }
        
        @com.fasterxml.jackson.annotation.JsonProperty("TDS")
        public Double getTDS() {
            return TDS;
        }
        
        public void setTDS(Double TDS) {
            this.TDS = TDS;
        }
        
        @com.fasterxml.jackson.annotation.JsonProperty("Turbidity")
        public Double getTurbidity() {
            return Turbidity;
        }
        
        public void setTurbidity(Double Turbidity) {
            this.Turbidity = Turbidity;
        }
        
        @com.fasterxml.jackson.annotation.JsonProperty("Temperature")
        public Double getTemperature() {
            return Temperature;
        }
        
        public void setTemperature(Double Temperature) {
            this.Temperature = Temperature;
        }
        
        @Override
        public String toString() {
            return "LatestReadings{" +
                   "pH=" + pH +
                   ", TDS=" + TDS +
                   ", Turbidity=" + Turbidity +
                   ", Temperature=" + Temperature +
                   '}';
        }
    }
}
