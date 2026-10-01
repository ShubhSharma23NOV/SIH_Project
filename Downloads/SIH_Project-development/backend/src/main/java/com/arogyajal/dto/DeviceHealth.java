package com.arogyajal.dto;

/**
 * Device Health Information
 * Separate from water quality assessment
 */
public class DeviceHealth {
    
    private Double batteryVoltage;   // Battery voltage in volts
    private Double batteryLevel;     // Battery level percentage (0-100)
    private String batteryStatus;    // NORMAL, LOW, CRITICAL, NOT_REPORTING
    
    public DeviceHealth() {
    }
    
    public DeviceHealth(Double batteryVoltage, String batteryStatus) {
        this.batteryVoltage = batteryVoltage;
        this.batteryStatus = batteryStatus;
        // Calculate battery level from voltage if available
        if (batteryVoltage != null) {
            this.batteryLevel = calculateBatteryLevel(batteryVoltage);
        }
    }
    
    public DeviceHealth(Double batteryVoltage, Double batteryLevel, String batteryStatus) {
        this.batteryVoltage = batteryVoltage;
        this.batteryLevel = batteryLevel;
        this.batteryStatus = batteryStatus;
    }
    
    /**
     * Calculate battery percentage from voltage (Li-ion: 3.0V-4.2V)
     */
    private Double calculateBatteryLevel(Double voltage) {
        if (voltage == null) return null;
        double minVoltage = 3.0;
        double maxVoltage = 4.2;
        double percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }
    
    // Getters and Setters
    
    public Double getBatteryVoltage() {
        return batteryVoltage;
    }
    
    public void setBatteryVoltage(Double batteryVoltage) {
        this.batteryVoltage = batteryVoltage;
        // Auto-calculate level when voltage is set
        if (batteryVoltage != null && batteryLevel == null) {
            this.batteryLevel = calculateBatteryLevel(batteryVoltage);
        }
    }
    
    public Double getBatteryLevel() {
        return batteryLevel;
    }
    
    public void setBatteryLevel(Double batteryLevel) {
        this.batteryLevel = batteryLevel;
    }
    
    public String getBatteryStatus() {
        return batteryStatus;
    }
    
    public void setBatteryStatus(String batteryStatus) {
        this.batteryStatus = batteryStatus;
    }
    
    @Override
    public String toString() {
        return "DeviceHealth{" +
               "batteryVoltage=" + batteryVoltage +
               ", batteryLevel=" + batteryLevel +
               ", batteryStatus='" + batteryStatus + '\'' +
               '}';
    }
}
