package com.arogyajal.model;

import com.google.cloud.Timestamp;

/**
 * Model for storing sensor health status in Firebase
 */
public class SensorHealth {
    private String id;
    private String deviceId;
    private String status;  // HEALTHY, DEGRADED, FAULTY
    private int consecutiveInsufficient;
    private int totalReadings;
    private int sufficientReadings;
    private int insufficientReadings;
    private double dataQualityPercentage;
    private Timestamp lastHealthCheck;
    private Timestamp lastGoodData;
    private Timestamp lastBadData;
    private String notes;
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public int getConsecutiveInsufficient() { return consecutiveInsufficient; }
    public void setConsecutiveInsufficient(int consecutiveInsufficient) { 
        this.consecutiveInsufficient = consecutiveInsufficient; 
    }
    
    public int getTotalReadings() { return totalReadings; }
    public void setTotalReadings(int totalReadings) { this.totalReadings = totalReadings; }
    
    public int getSufficientReadings() { return sufficientReadings; }
    public void setSufficientReadings(int sufficientReadings) { 
        this.sufficientReadings = sufficientReadings; 
    }
    
    public int getInsufficientReadings() { return insufficientReadings; }
    public void setInsufficientReadings(int insufficientReadings) { 
        this.insufficientReadings = insufficientReadings; 
    }
    
    public double getDataQualityPercentage() { return dataQualityPercentage; }
    public void setDataQualityPercentage(double dataQualityPercentage) { 
        this.dataQualityPercentage = dataQualityPercentage; 
    }
    
    public Timestamp getLastHealthCheck() { return lastHealthCheck; }
    public void setLastHealthCheck(Timestamp lastHealthCheck) { 
        this.lastHealthCheck = lastHealthCheck; 
    }
    
    public Timestamp getLastGoodData() { return lastGoodData; }
    public void setLastGoodData(Timestamp lastGoodData) { this.lastGoodData = lastGoodData; }
    
    public Timestamp getLastBadData() { return lastBadData; }
    public void setLastBadData(Timestamp lastBadData) { this.lastBadData = lastBadData; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
