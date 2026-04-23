package com.arogyajal.dto;

import java.util.List;
import java.util.Map;

public class ReportData {
    
    // Metadata
    private ReportMetadata metadata;
    
    // Water quality summary
    private WaterQualitySummary waterQualitySummary;
    
    // Sensor history
    private List<SensorHistory> sensorHistory;
    
    // Alerts
    private List<AlertSummary> alerts;
    
    // Historical/archived alerts (not used for prediction)
    private List<AlertSummary> historicalAlerts;
    
    // ML prediction
    private MLPredictionSummary mlPrediction;
    
    // Clarification message for empty reports
    private String clarificationMessage;
    
    // Report generation summary (metadata for validation)
    private ReportGenerationSummary generationSummary;
    
    // Constructors
    public ReportData() {}
    
    // Getters and Setters
    public ReportMetadata getMetadata() { return metadata; }
    public void setMetadata(ReportMetadata metadata) { this.metadata = metadata; }
    
    public WaterQualitySummary getWaterQualitySummary() { return waterQualitySummary; }
    public void setWaterQualitySummary(WaterQualitySummary waterQualitySummary) { 
        this.waterQualitySummary = waterQualitySummary; 
    }
    
    public List<SensorHistory> getSensorHistory() { return sensorHistory; }
    public void setSensorHistory(List<SensorHistory> sensorHistory) { 
        this.sensorHistory = sensorHistory; 
    }
    
    public List<AlertSummary> getAlerts() { return alerts; }
    public void setAlerts(List<AlertSummary> alerts) { this.alerts = alerts; }
    
    public List<AlertSummary> getHistoricalAlerts() { return historicalAlerts; }
    public void setHistoricalAlerts(List<AlertSummary> historicalAlerts) { 
        this.historicalAlerts = historicalAlerts; 
    }
    
    public MLPredictionSummary getMlPrediction() { return mlPrediction; }
    public void setMlPrediction(MLPredictionSummary mlPrediction) { 
        this.mlPrediction = mlPrediction; 
    }
    
    public String getClarificationMessage() { return clarificationMessage; }
    public void setClarificationMessage(String clarificationMessage) { 
        this.clarificationMessage = clarificationMessage; 
    }
    
    public ReportGenerationSummary getGenerationSummary() { return generationSummary; }
    public void setGenerationSummary(ReportGenerationSummary generationSummary) { 
        this.generationSummary = generationSummary; 
    }
    
    // Inner classes
    public static class ReportMetadata {
        private String regionName;
        private String timeRange;
        private String generatedAt;
        private String reportType;
        private String scope;
        private int configuredDevices;
        private int reportingDevices24h;
        private boolean fallbackMode;
        private String dataModeMessage;
        private String coverageMessage;
        private String reportMode;  // FULL, PARTIAL, NO_DATA
        private int offlineSensors;
        private int staleSensors;
        
        public ReportMetadata() {}
        
        public String getRegionName() { return regionName; }
        public void setRegionName(String regionName) { this.regionName = regionName; }
        
        public String getTimeRange() { return timeRange; }
        public void setTimeRange(String timeRange) { this.timeRange = timeRange; }
        
        public String getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
        
        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        
        public int getConfiguredDevices() { return configuredDevices; }
        public void setConfiguredDevices(int configuredDevices) { this.configuredDevices = configuredDevices; }
        
        public int getReportingDevices24h() { return reportingDevices24h; }
        public void setReportingDevices24h(int reportingDevices24h) { this.reportingDevices24h = reportingDevices24h; }
        
        public boolean isFallbackMode() { return fallbackMode; }
        public void setFallbackMode(boolean fallbackMode) { this.fallbackMode = fallbackMode; }
        
        public String getDataModeMessage() { return dataModeMessage; }
        public void setDataModeMessage(String dataModeMessage) { this.dataModeMessage = dataModeMessage; }
        
        public String getCoverageMessage() { return coverageMessage; }
        public void setCoverageMessage(String coverageMessage) { this.coverageMessage = coverageMessage; }
        
        public String getReportMode() { return reportMode; }
        public void setReportMode(String reportMode) { this.reportMode = reportMode; }
        
        public int getOfflineSensors() { return offlineSensors; }
        public void setOfflineSensors(int offlineSensors) { this.offlineSensors = offlineSensors; }
        
        public int getStaleSensors() { return staleSensors; }
        public void setStaleSensors(int staleSensors) { this.staleSensors = staleSensors; }
    }
    
    public static class WaterQualitySummary {
        private ParameterStats ph;
        private ParameterStats tds;
        private ParameterStats turbidity;
        private ParameterStats temperature;
        private int totalSensors;
        private int activeSensors;
        private ValidationMetrics validationMetrics;
        
        public WaterQualitySummary() {}
        
        public ParameterStats getPh() { return ph; }
        public void setPh(ParameterStats ph) { this.ph = ph; }
        
        public ParameterStats getTds() { return tds; }
        public void setTds(ParameterStats tds) { this.tds = tds; }
        
        public ParameterStats getTurbidity() { return turbidity; }
        public void setTurbidity(ParameterStats turbidity) { this.turbidity = turbidity; }
        
        public ParameterStats getTemperature() { return temperature; }
        public void setTemperature(ParameterStats temperature) { this.temperature = temperature; }
        
        public int getTotalSensors() { return totalSensors; }
        public void setTotalSensors(int totalSensors) { this.totalSensors = totalSensors; }
        
        public int getActiveSensors() { return activeSensors; }
        public void setActiveSensors(int activeSensors) { this.activeSensors = activeSensors; }
        
        public ValidationMetrics getValidationMetrics() { return validationMetrics; }
        public void setValidationMetrics(ValidationMetrics validationMetrics) { 
            this.validationMetrics = validationMetrics; 
        }
    }
    
    public static class ValidationMetrics {
        private int totalReadings;
        private int validReadings;
        private int discardedReadings;
        private int missingReadings;
        private double confidencePercentage;
        private String dataQualityMessage;
        private SensorStatusSummary sensorStatus;
        
        public ValidationMetrics() {}
        
        public int getTotalReadings() { return totalReadings; }
        public void setTotalReadings(int totalReadings) { this.totalReadings = totalReadings; }
        
        public int getValidReadings() { return validReadings; }
        public void setValidReadings(int validReadings) { this.validReadings = validReadings; }
        
        public int getDiscardedReadings() { return discardedReadings; }
        public void setDiscardedReadings(int discardedReadings) { this.discardedReadings = discardedReadings; }
        
        public int getMissingReadings() { return missingReadings; }
        public void setMissingReadings(int missingReadings) { this.missingReadings = missingReadings; }
        
        public double getConfidencePercentage() { return confidencePercentage; }
        public void setConfidencePercentage(double confidencePercentage) { 
            this.confidencePercentage = confidencePercentage; 
        }
        
        public String getDataQualityMessage() { return dataQualityMessage; }
        public void setDataQualityMessage(String dataQualityMessage) { 
            this.dataQualityMessage = dataQualityMessage; 
        }
        
        public SensorStatusSummary getSensorStatus() { return sensorStatus; }
        public void setSensorStatus(SensorStatusSummary sensorStatus) { 
            this.sensorStatus = sensorStatus; 
        }
    }
    
    public static class SensorStatusSummary {
        private int installedSensors;
        private int reportingSensors;
        private int notReportingSensors;
        private List<String> offlineSensorIds;
        
        public SensorStatusSummary() {}
        
        public int getInstalledSensors() { return installedSensors; }
        public void setInstalledSensors(int installedSensors) { 
            this.installedSensors = installedSensors; 
        }
        
        public int getReportingSensors() { return reportingSensors; }
        public void setReportingSensors(int reportingSensors) { 
            this.reportingSensors = reportingSensors; 
        }
        
        public int getNotReportingSensors() { return notReportingSensors; }
        public void setNotReportingSensors(int notReportingSensors) { 
            this.notReportingSensors = notReportingSensors; 
        }
        
        public List<String> getOfflineSensorIds() { return offlineSensorIds; }
        public void setOfflineSensorIds(List<String> offlineSensorIds) { 
            this.offlineSensorIds = offlineSensorIds; 
        }
    }
    
    public static class ParameterStats {
        private double min;
        private double max;
        private double avg;
        
        public ParameterStats() {}
        
        public ParameterStats(double min, double max, double avg) {
            this.min = min;
            this.max = max;
            this.avg = avg;
        }
        
        public double getMin() { return min; }
        public void setMin(double min) { this.min = min; }
        
        public double getMax() { return max; }
        public void setMax(double max) { this.max = max; }
        
        public double getAvg() { return avg; }
        public void setAvg(double avg) { this.avg = avg; }
    }
    
    public static class SensorHistory {
        private String deviceId;
        private String location;
        private List<TimeSeriesData> readings;
        private String chartWarning;
        
        public SensorHistory() {}
        
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
        
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        
        public List<TimeSeriesData> getReadings() { return readings; }
        public void setReadings(List<TimeSeriesData> readings) { this.readings = readings; }
        
        public String getChartWarning() { return chartWarning; }
        public void setChartWarning(String chartWarning) { this.chartWarning = chartWarning; }
    }
    
    public static class TimeSeriesData {
        private String timestamp;
        private double ph;
        private double tds;
        private double turbidity;
        private double temperature;
        private double wqi;
        private String ageTag;
        
        public TimeSeriesData() {}
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        
        public double getPh() { return ph; }
        public void setPh(double ph) { this.ph = ph; }
        
        public double getTds() { return tds; }
        public void setTds(double tds) { this.tds = tds; }
        
        public double getTurbidity() { return turbidity; }
        public void setTurbidity(double turbidity) { this.turbidity = turbidity; }
        
        public double getTemperature() { return temperature; }
        public void setTemperature(double temperature) { this.temperature = temperature; }
        
        public double getWqi() { return wqi; }
        public void setWqi(double wqi) { this.wqi = wqi; }
        
        public String getAgeTag() { return ageTag; }
        public void setAgeTag(String ageTag) { this.ageTag = ageTag; }
    }
    
    public static class AlertSummary {
        private String alertId;
        private String type;
        private String severity;
        private String timestamp;
        private String status;
        private String description;
        private String deviceId;
        
        public AlertSummary() {}
        
        public String getAlertId() { return alertId; }
        public void setAlertId(String alertId) { this.alertId = alertId; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    }
    
    public static class MLPredictionSummary {
        private Double riskScore;  // Changed to Double to allow null
        private String riskLevel;
        private Double confidence;  // Changed to Double to allow null
        private Map<String, Double> contributingFactors;
        private List<String> recommendations;
        private String explanation;
        private boolean predictionSuppressed;
        private String suppressionReason;
        
        public MLPredictionSummary() {}
        
        public Double getRiskScore() { return riskScore; }
        public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }
        
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        
        public Double getConfidence() { return confidence; }
        public void setConfidence(Double confidence) { this.confidence = confidence; }
        
        public Map<String, Double> getContributingFactors() { return contributingFactors; }
        public void setContributingFactors(Map<String, Double> contributingFactors) { 
            this.contributingFactors = contributingFactors; 
        }
        
        public List<String> getRecommendations() { return recommendations; }
        public void setRecommendations(List<String> recommendations) { 
            this.recommendations = recommendations; 
        }
        
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        
        public boolean isPredictionSuppressed() { return predictionSuppressed; }
        public void setPredictionSuppressed(boolean predictionSuppressed) { 
            this.predictionSuppressed = predictionSuppressed; 
        }
        
        public String getSuppressionReason() { return suppressionReason; }
        public void setSuppressionReason(String suppressionReason) { 
            this.suppressionReason = suppressionReason; 
        }
    }
    
    public static class ReportGenerationSummary {
        private String status;  // PASS, PARTIAL_FIX, REBUILD_REQUIRED
        private String reportMode;  // FULL, PARTIAL, NO_DATA
        private int sensorsReported;
        private int sensorsOffline;
        private int invalidValuesFilteredCount;
        private int chartsGeneratedCount;
        private String predictionStatus;  // COMPUTED, SUPPRESSED, UNCERTAIN
        private boolean validationPassed;
        private String validationMessage;
        
        public ReportGenerationSummary() {}
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getReportMode() { return reportMode; }
        public void setReportMode(String reportMode) { this.reportMode = reportMode; }
        
        public int getSensorsReported() { return sensorsReported; }
        public void setSensorsReported(int sensorsReported) { 
            this.sensorsReported = sensorsReported; 
        }
        
        public int getSensorsOffline() { return sensorsOffline; }
        public void setSensorsOffline(int sensorsOffline) { 
            this.sensorsOffline = sensorsOffline; 
        }
        
        public int getInvalidValuesFilteredCount() { return invalidValuesFilteredCount; }
        public void setInvalidValuesFilteredCount(int invalidValuesFilteredCount) { 
            this.invalidValuesFilteredCount = invalidValuesFilteredCount; 
        }
        
        public int getChartsGeneratedCount() { return chartsGeneratedCount; }
        public void setChartsGeneratedCount(int chartsGeneratedCount) { 
            this.chartsGeneratedCount = chartsGeneratedCount; 
        }
        
        public String getPredictionStatus() { return predictionStatus; }
        public void setPredictionStatus(String predictionStatus) { 
            this.predictionStatus = predictionStatus; 
        }
        
        public boolean isValidationPassed() { return validationPassed; }
        public void setValidationPassed(boolean validationPassed) { 
            this.validationPassed = validationPassed; 
        }
        
        public String getValidationMessage() { return validationMessage; }
        public void setValidationMessage(String validationMessage) { 
            this.validationMessage = validationMessage; 
        }
    }
}
