package com.arogyajal.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class DashboardResponse {
    
    // Overall system status
    private String overallStatus; // HEALTHY, WARNING, CRITICAL
    private String lastUpdated;
    
    // Sensor statistics
    private Integer totalSensors;
    private Integer activeSensors;
    private Integer offlineSensors;
    
    // Recent sensor readings summary
    private Map<String, Double> latestReadings; // parameter -> value
    private List<String> qualityAlerts;
    
    // Symptom reports summary
    private Integer totalSymptomReports;
    private Integer pendingReports;
    private Integer resolvedReports;
    private List<String> recentSymptoms;
    
    // Alert summary
    private Integer totalAlerts;
    private Integer activeAlerts;
    private Integer criticalAlerts;
    private List<AlertSummary> recentAlerts;
    
    // Water quality trends
    private Map<String, List<DataPoint>> qualityTrends; // parameter -> data points
    private Map<String, String> qualityStatus; // parameter -> status
    
    // Location-based data
    private Map<String, LocationSummary> locationData;

    public DashboardResponse() {
    }

    public DashboardResponse(String overallStatus, String lastUpdated, Integer totalSensors, Integer activeSensors, 
                           Integer offlineSensors, Map<String, Double> latestReadings, List<String> qualityAlerts, 
                           Integer totalSymptomReports, Integer pendingReports, Integer resolvedReports, 
                           List<String> recentSymptoms, Integer totalAlerts, Integer activeAlerts, 
                           Integer criticalAlerts, List<AlertSummary> recentAlerts, 
                           Map<String, List<DataPoint>> qualityTrends, Map<String, String> qualityStatus, 
                           Map<String, LocationSummary> locationData) {
        this.overallStatus = overallStatus;
        this.lastUpdated = lastUpdated;
        this.totalSensors = totalSensors;
        this.activeSensors = activeSensors;
        this.offlineSensors = offlineSensors;
        this.latestReadings = latestReadings;
        this.qualityAlerts = qualityAlerts;
        this.totalSymptomReports = totalSymptomReports;
        this.pendingReports = pendingReports;
        this.resolvedReports = resolvedReports;
        this.recentSymptoms = recentSymptoms;
        this.totalAlerts = totalAlerts;
        this.activeAlerts = activeAlerts;
        this.criticalAlerts = criticalAlerts;
        this.recentAlerts = recentAlerts;
        this.qualityTrends = qualityTrends;
        this.qualityStatus = qualityStatus;
        this.locationData = locationData;
    }

    // Getters and Setters
    public String getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Integer getTotalSensors() {
        return totalSensors;
    }

    public void setTotalSensors(Integer totalSensors) {
        this.totalSensors = totalSensors;
    }

    public Integer getActiveSensors() {
        return activeSensors;
    }

    public void setActiveSensors(Integer activeSensors) {
        this.activeSensors = activeSensors;
    }

    public Integer getOfflineSensors() {
        return offlineSensors;
    }

    public void setOfflineSensors(Integer offlineSensors) {
        this.offlineSensors = offlineSensors;
    }

    public Map<String, Double> getLatestReadings() {
        return latestReadings;
    }

    public void setLatestReadings(Map<String, Double> latestReadings) {
        this.latestReadings = latestReadings;
    }

    public List<String> getQualityAlerts() {
        return qualityAlerts;
    }

    public void setQualityAlerts(List<String> qualityAlerts) {
        this.qualityAlerts = qualityAlerts;
    }

    public Integer getTotalSymptomReports() {
        return totalSymptomReports;
    }

    public void setTotalSymptomReports(Integer totalSymptomReports) {
        this.totalSymptomReports = totalSymptomReports;
    }

    public Integer getPendingReports() {
        return pendingReports;
    }

    public void setPendingReports(Integer pendingReports) {
        this.pendingReports = pendingReports;
    }

    public Integer getResolvedReports() {
        return resolvedReports;
    }

    public void setResolvedReports(Integer resolvedReports) {
        this.resolvedReports = resolvedReports;
    }

    public List<String> getRecentSymptoms() {
        return recentSymptoms;
    }

    public void setRecentSymptoms(List<String> recentSymptoms) {
        this.recentSymptoms = recentSymptoms;
    }

    public Integer getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(Integer totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public Integer getActiveAlerts() {
        return activeAlerts;
    }

    public void setActiveAlerts(Integer activeAlerts) {
        this.activeAlerts = activeAlerts;
    }

    public Integer getCriticalAlerts() {
        return criticalAlerts;
    }

    public void setCriticalAlerts(Integer criticalAlerts) {
        this.criticalAlerts = criticalAlerts;
    }

    public List<AlertSummary> getRecentAlerts() {
        return recentAlerts;
    }

    public void setRecentAlerts(List<AlertSummary> recentAlerts) {
        this.recentAlerts = recentAlerts;
    }

    public Map<String, List<DataPoint>> getQualityTrends() {
        return qualityTrends;
    }

    public void setQualityTrends(Map<String, List<DataPoint>> qualityTrends) {
        this.qualityTrends = qualityTrends;
    }

    public Map<String, String> getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(Map<String, String> qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    public Map<String, LocationSummary> getLocationData() {
        return locationData;
    }

    public void setLocationData(Map<String, LocationSummary> locationData) {
        this.locationData = locationData;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DashboardResponse that = (DashboardResponse) o;
        return Objects.equals(overallStatus, that.overallStatus) &&
               Objects.equals(lastUpdated, that.lastUpdated) &&
               Objects.equals(totalSensors, that.totalSensors) &&
               Objects.equals(activeSensors, that.activeSensors) &&
               Objects.equals(offlineSensors, that.offlineSensors) &&
               Objects.equals(latestReadings, that.latestReadings) &&
               Objects.equals(qualityAlerts, that.qualityAlerts) &&
               Objects.equals(totalSymptomReports, that.totalSymptomReports) &&
               Objects.equals(pendingReports, that.pendingReports) &&
               Objects.equals(resolvedReports, that.resolvedReports) &&
               Objects.equals(recentSymptoms, that.recentSymptoms) &&
               Objects.equals(totalAlerts, that.totalAlerts) &&
               Objects.equals(activeAlerts, that.activeAlerts) &&
               Objects.equals(criticalAlerts, that.criticalAlerts) &&
               Objects.equals(recentAlerts, that.recentAlerts) &&
               Objects.equals(qualityTrends, that.qualityTrends) &&
               Objects.equals(qualityStatus, that.qualityStatus) &&
               Objects.equals(locationData, that.locationData);
    }

    @Override
    public int hashCode() {
        return Objects.hash(overallStatus, lastUpdated, totalSensors, activeSensors, offlineSensors, 
                          latestReadings, qualityAlerts, totalSymptomReports, pendingReports, 
                          resolvedReports, recentSymptoms, totalAlerts, activeAlerts, criticalAlerts, 
                          recentAlerts, qualityTrends, qualityStatus, locationData);
    }

    @Override
    public String toString() {
        return "DashboardResponse{" +
               "overallStatus='" + overallStatus + '\'' +
               ", lastUpdated='" + lastUpdated + '\'' +
               ", totalSensors=" + totalSensors +
               ", activeSensors=" + activeSensors +
               ", offlineSensors=" + offlineSensors +
               ", latestReadings=" + latestReadings +
               ", qualityAlerts=" + qualityAlerts +
               ", totalSymptomReports=" + totalSymptomReports +
               ", pendingReports=" + pendingReports +
               ", resolvedReports=" + resolvedReports +
               ", recentSymptoms=" + recentSymptoms +
               ", totalAlerts=" + totalAlerts +
               ", activeAlerts=" + activeAlerts +
               ", criticalAlerts=" + criticalAlerts +
               ", recentAlerts=" + recentAlerts +
               ", qualityTrends=" + qualityTrends +
               ", qualityStatus=" + qualityStatus +
               ", locationData=" + locationData +
               '}';
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String overallStatus;
        private String lastUpdated;
        private Integer totalSensors;
        private Integer activeSensors;
        private Integer offlineSensors;
        private Map<String, Double> latestReadings;
        private List<String> qualityAlerts;
        private Integer totalSymptomReports;
        private Integer pendingReports;
        private Integer resolvedReports;
        private List<String> recentSymptoms;
        private Integer totalAlerts;
        private Integer activeAlerts;
        private Integer criticalAlerts;
        private List<AlertSummary> recentAlerts;
        private Map<String, List<DataPoint>> qualityTrends;
        private Map<String, String> qualityStatus;
        private Map<String, LocationSummary> locationData;

        public Builder overallStatus(String overallStatus) {
            this.overallStatus = overallStatus;
            return this;
        }

        public Builder lastUpdated(String lastUpdated) {
            this.lastUpdated = lastUpdated;
            return this;
        }

        public Builder totalSensors(Integer totalSensors) {
            this.totalSensors = totalSensors;
            return this;
        }

        public Builder activeSensors(Integer activeSensors) {
            this.activeSensors = activeSensors;
            return this;
        }

        public Builder offlineSensors(Integer offlineSensors) {
            this.offlineSensors = offlineSensors;
            return this;
        }

        public Builder latestReadings(Map<String, Double> latestReadings) {
            this.latestReadings = latestReadings;
            return this;
        }

        public Builder qualityAlerts(List<String> qualityAlerts) {
            this.qualityAlerts = qualityAlerts;
            return this;
        }

        public Builder totalSymptomReports(Integer totalSymptomReports) {
            this.totalSymptomReports = totalSymptomReports;
            return this;
        }

        public Builder pendingReports(Integer pendingReports) {
            this.pendingReports = pendingReports;
            return this;
        }

        public Builder resolvedReports(Integer resolvedReports) {
            this.resolvedReports = resolvedReports;
            return this;
        }

        public Builder recentSymptoms(List<String> recentSymptoms) {
            this.recentSymptoms = recentSymptoms;
            return this;
        }

        public Builder totalAlerts(Integer totalAlerts) {
            this.totalAlerts = totalAlerts;
            return this;
        }

        public Builder activeAlerts(Integer activeAlerts) {
            this.activeAlerts = activeAlerts;
            return this;
        }

        public Builder criticalAlerts(Integer criticalAlerts) {
            this.criticalAlerts = criticalAlerts;
            return this;
        }

        public Builder recentAlerts(List<AlertSummary> recentAlerts) {
            this.recentAlerts = recentAlerts;
            return this;
        }

        public Builder qualityTrends(Map<String, List<DataPoint>> qualityTrends) {
            this.qualityTrends = qualityTrends;
            return this;
        }

        public Builder qualityStatus(Map<String, String> qualityStatus) {
            this.qualityStatus = qualityStatus;
            return this;
        }

        public Builder locationData(Map<String, LocationSummary> locationData) {
            this.locationData = locationData;
            return this;
        }

        public DashboardResponse build() {
            return new DashboardResponse(
                overallStatus, lastUpdated, totalSensors, activeSensors, offlineSensors,
                latestReadings, qualityAlerts, totalSymptomReports, pendingReports,
                resolvedReports, recentSymptoms, totalAlerts, activeAlerts, criticalAlerts,
                recentAlerts, qualityTrends, qualityStatus, locationData
            );
        }
    }

    public static class AlertSummary {
        private String id;
        private String type;
        private String severity;
        private String title;
        private String location;
        private LocalDateTime triggeredAt;

        public AlertSummary() {
        }

        public AlertSummary(String id, String type, String severity, String title, String location, LocalDateTime triggeredAt) {
            this.id = id;
            this.type = type;
            this.severity = severity;
            this.title = title;
            this.location = location;
            this.triggeredAt = triggeredAt;
        }

        // Getters and Setters for AlertSummary
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getSeverity() {
            return severity;
        }

        public void setSeverity(String severity) {
            this.severity = severity;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public LocalDateTime getTriggeredAt() {
            return triggeredAt;
        }

        public void setTriggeredAt(LocalDateTime triggeredAt) {
            this.triggeredAt = triggeredAt;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            AlertSummary that = (AlertSummary) o;
            return Objects.equals(id, that.id) &&
                   Objects.equals(type, that.type) &&
                   Objects.equals(severity, that.severity) &&
                   Objects.equals(title, that.title) &&
                   Objects.equals(location, that.location) &&
                   Objects.equals(triggeredAt, that.triggeredAt);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id, type, severity, title, location, triggeredAt);
        }

        @Override
        public String toString() {
            return "AlertSummary{" +
                   "id='" + id + '\'' +
                   ", type='" + type + '\'' +
                   ", severity='" + severity + '\'' +
                   ", title='" + title + '\'' +
                   ", location='" + location + '\'' +
                   ", triggeredAt=" + triggeredAt +
                   '}';
        }

        // Builder for AlertSummary
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String id;
            private String type;
            private String severity;
            private String title;
            private String location;
            private LocalDateTime triggeredAt;

            public Builder id(String id) {
                this.id = id;
                return this;
            }

            public Builder type(String type) {
                this.type = type;
                return this;
            }

            public Builder severity(String severity) {
                this.severity = severity;
                return this;
            }

            public Builder title(String title) {
                this.title = title;
                return this;
            }

            public Builder location(String location) {
                this.location = location;
                return this;
            }

            public Builder triggeredAt(LocalDateTime triggeredAt) {
                this.triggeredAt = triggeredAt;
                return this;
            }

            public AlertSummary build() {
                return new AlertSummary(id, type, severity, title, location, triggeredAt);
            }
        }
    }

    public static class DataPoint {
        private LocalDateTime timestamp;
        private Double value;

        public DataPoint() {
        }

        public DataPoint(LocalDateTime timestamp, Double value) {
            this.timestamp = timestamp;
            this.value = value;
        }

        // Getters and Setters for DataPoint
        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public Double getValue() {
            return value;
        }

        public void setValue(Double value) {
            this.value = value;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            DataPoint dataPoint = (DataPoint) o;
            return Objects.equals(timestamp, dataPoint.timestamp) &&
                   Objects.equals(value, dataPoint.value);
        }

        @Override
        public int hashCode() {
            return Objects.hash(timestamp, value);
        }

        @Override
        public String toString() {
            return "DataPoint{" +
                   "timestamp=" + timestamp +
                   ", value=" + value +
                   '}';
        }

        // Builder for DataPoint
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private LocalDateTime timestamp;
            private Double value;

            public Builder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public Builder value(Double value) {
                this.value = value;
                return this;
            }

            public DataPoint build() {
                return new DataPoint(timestamp, value);
            }
        }
    }

    public static class LocationSummary {
        private String location;
        private String status;
        private Integer sensorCount;
        private Integer alertCount;
        private Integer symptomReportCount;
        private Map<String, Double> latestReadings;

        public LocationSummary() {
        }

        public LocationSummary(String location, String status, Integer sensorCount, Integer alertCount, 
                              Integer symptomReportCount, Map<String, Double> latestReadings) {
            this.location = location;
            this.status = status;
            this.sensorCount = sensorCount;
            this.alertCount = alertCount;
            this.symptomReportCount = symptomReportCount;
            this.latestReadings = latestReadings;
        }

        // Getters and Setters for LocationSummary
        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Integer getSensorCount() {
            return sensorCount;
        }

        public void setSensorCount(Integer sensorCount) {
            this.sensorCount = sensorCount;
        }

        public Integer getAlertCount() {
            return alertCount;
        }

        public void setAlertCount(Integer alertCount) {
            this.alertCount = alertCount;
        }

        public Integer getSymptomReportCount() {
            return symptomReportCount;
        }

        public void setSymptomReportCount(Integer symptomReportCount) {
            this.symptomReportCount = symptomReportCount;
        }

        public Map<String, Double> getLatestReadings() {
            return latestReadings;
        }

        public void setLatestReadings(Map<String, Double> latestReadings) {
            this.latestReadings = latestReadings;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            LocationSummary that = (LocationSummary) o;
            return Objects.equals(location, that.location) &&
                   Objects.equals(status, that.status) &&
                   Objects.equals(sensorCount, that.sensorCount) &&
                   Objects.equals(alertCount, that.alertCount) &&
                   Objects.equals(symptomReportCount, that.symptomReportCount) &&
                   Objects.equals(latestReadings, that.latestReadings);
        }

        @Override
        public int hashCode() {
            return Objects.hash(location, status, sensorCount, alertCount, symptomReportCount, latestReadings);
        }

        @Override
        public String toString() {
            return "LocationSummary{" +
                   "location='" + location + '\'' +
                   ", status='" + status + '\'' +
                   ", sensorCount=" + sensorCount +
                   ", alertCount=" + alertCount +
                   ", symptomReportCount=" + symptomReportCount +
                   ", latestReadings=" + latestReadings +
                   '}';
        }

        // Builder for LocationSummary
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String location;
            private String status;
            private Integer sensorCount;
            private Integer alertCount;
            private Integer symptomReportCount;
            private Map<String, Double> latestReadings;

            public Builder location(String location) {
                this.location = location;
                return this;
            }

            public Builder status(String status) {
                this.status = status;
                return this;
            }

            public Builder sensorCount(Integer sensorCount) {
                this.sensorCount = sensorCount;
                return this;
            }

            public Builder alertCount(Integer alertCount) {
                this.alertCount = alertCount;
                return this;
            }

            public Builder symptomReportCount(Integer symptomReportCount) {
                this.symptomReportCount = symptomReportCount;
                return this;
            }

            public Builder latestReadings(Map<String, Double> latestReadings) {
                this.latestReadings = latestReadings;
                return this;
            }

            public LocationSummary build() {
                return new LocationSummary(location, status, sensorCount, alertCount, 
                                         symptomReportCount, latestReadings);
            }
        }
    }
}
