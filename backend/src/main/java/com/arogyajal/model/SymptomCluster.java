package com.arogyajal.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.GeoPoint;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents a detected cluster of symptom reports.
 * Used for spatial-temporal analysis and outbreak detection.
 */
public class SymptomCluster {
    
    @DocumentId
    private String id;
    
    private String location; // Primary location name
    private GeoPoint centroid; // Geographic center of the cluster
    private Double radiusKm; // Radius of the cluster in kilometers
    
    // Cluster characteristics
    private Integer reportCount; // Number of reports in cluster
    private List<String> reportIds = new ArrayList<>(); // IDs of symptom reports in cluster
    
    // Temporal information
    private Timestamp firstReportDate; // Earliest report in cluster
    private Timestamp lastReportDate; // Most recent report in cluster
    private Integer durationHours; // Time span of cluster
    
    // Symptom analysis
    private Map<String, Integer> symptomDistribution = new HashMap<>(); // Symptom -> count
    private List<String> dominantSymptoms = new ArrayList<>(); // Most common symptoms
    
    // Severity analysis
    private Map<String, Integer> severityDistribution = new HashMap<>(); // Severity -> count
    private String overallSeverity; // MILD, MODERATE, SEVERE
    
    // Demographics
    private Integer affectedPopulation; // Estimated affected population
    private Map<String, Integer> ageDistribution = new HashMap<>(); // Age group -> count
    private Map<String, Integer> genderDistribution = new HashMap<>(); // Gender -> count
    
    // Water source correlation
    private Map<String, Integer> waterSourceDistribution = new HashMap<>(); // Source -> count
    private String primaryWaterSource; // Most common water source
    
    // Cluster status
    private String status; // ACTIVE, MONITORING, RESOLVED
    private String alertId; // Associated alert ID (if alert was created)
    private Boolean alertGenerated;
    
    // Detection metadata
    private String detectionMethod; // TEMPORAL, SPATIAL, COMBINED
    private Double clusterScore; // Confidence score (0-100)
    
    @ServerTimestamp
    private Timestamp detectedAt;
    
    @ServerTimestamp
    private Timestamp updatedAt;
    
    // Constructors
    public SymptomCluster() {
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public GeoPoint getCentroid() {
        return centroid;
    }
    
    public void setCentroid(GeoPoint centroid) {
        this.centroid = centroid;
    }
    
    public Double getRadiusKm() {
        return radiusKm;
    }
    
    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = radiusKm;
    }
    
    public Integer getReportCount() {
        return reportCount;
    }
    
    public void setReportCount(Integer reportCount) {
        this.reportCount = reportCount;
    }
    
    public List<String> getReportIds() {
        return reportIds;
    }
    
    public void setReportIds(List<String> reportIds) {
        this.reportIds = reportIds;
    }
    
    public Timestamp getFirstReportDate() {
        return firstReportDate;
    }
    
    public void setFirstReportDate(Timestamp firstReportDate) {
        this.firstReportDate = firstReportDate;
    }
    
    public Timestamp getLastReportDate() {
        return lastReportDate;
    }
    
    public void setLastReportDate(Timestamp lastReportDate) {
        this.lastReportDate = lastReportDate;
    }
    
    public Integer getDurationHours() {
        return durationHours;
    }
    
    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }
    
    public Map<String, Integer> getSymptomDistribution() {
        return symptomDistribution;
    }
    
    public void setSymptomDistribution(Map<String, Integer> symptomDistribution) {
        this.symptomDistribution = symptomDistribution;
    }
    
    public List<String> getDominantSymptoms() {
        return dominantSymptoms;
    }
    
    public void setDominantSymptoms(List<String> dominantSymptoms) {
        this.dominantSymptoms = dominantSymptoms;
    }
    
    public Map<String, Integer> getSeverityDistribution() {
        return severityDistribution;
    }
    
    public void setSeverityDistribution(Map<String, Integer> severityDistribution) {
        this.severityDistribution = severityDistribution;
    }
    
    public String getOverallSeverity() {
        return overallSeverity;
    }
    
    public void setOverallSeverity(String overallSeverity) {
        this.overallSeverity = overallSeverity;
    }
    
    public Integer getAffectedPopulation() {
        return affectedPopulation;
    }
    
    public void setAffectedPopulation(Integer affectedPopulation) {
        this.affectedPopulation = affectedPopulation;
    }
    
    public Map<String, Integer> getAgeDistribution() {
        return ageDistribution;
    }
    
    public void setAgeDistribution(Map<String, Integer> ageDistribution) {
        this.ageDistribution = ageDistribution;
    }
    
    public Map<String, Integer> getGenderDistribution() {
        return genderDistribution;
    }
    
    public void setGenderDistribution(Map<String, Integer> genderDistribution) {
        this.genderDistribution = genderDistribution;
    }
    
    public Map<String, Integer> getWaterSourceDistribution() {
        return waterSourceDistribution;
    }
    
    public void setWaterSourceDistribution(Map<String, Integer> waterSourceDistribution) {
        this.waterSourceDistribution = waterSourceDistribution;
    }
    
    public String getPrimaryWaterSource() {
        return primaryWaterSource;
    }
    
    public void setPrimaryWaterSource(String primaryWaterSource) {
        this.primaryWaterSource = primaryWaterSource;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getAlertId() {
        return alertId;
    }
    
    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }
    
    public Boolean getAlertGenerated() {
        return alertGenerated;
    }
    
    public void setAlertGenerated(Boolean alertGenerated) {
        this.alertGenerated = alertGenerated;
    }
    
    public String getDetectionMethod() {
        return detectionMethod;
    }
    
    public void setDetectionMethod(String detectionMethod) {
        this.detectionMethod = detectionMethod;
    }
    
    public Double getClusterScore() {
        return clusterScore;
    }
    
    public void setClusterScore(Double clusterScore) {
        this.clusterScore = clusterScore;
    }
    
    public Timestamp getDetectedAt() {
        return detectedAt;
    }
    
    public void setDetectedAt(Timestamp detectedAt) {
        this.detectedAt = detectedAt;
    }
    
    public Timestamp getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "SymptomCluster{" +
                "id='" + id + '\'' +
                ", location='" + location + '\'' +
                ", reportCount=" + reportCount +
                ", overallSeverity='" + overallSeverity + '\'' +
                ", status='" + status + '\'' +
                ", detectedAt=" + detectedAt +
                '}';
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String id;
        private String location;
        private GeoPoint centroid;
        private Double radiusKm;
        private Integer reportCount;
        private List<String> reportIds = new ArrayList<>();
        private Timestamp firstReportDate;
        private Timestamp lastReportDate;
        private Integer durationHours;
        private Map<String, Integer> symptomDistribution = new HashMap<>();
        private List<String> dominantSymptoms = new ArrayList<>();
        private Map<String, Integer> severityDistribution = new HashMap<>();
        private String overallSeverity;
        private Integer affectedPopulation;
        private Map<String, Integer> ageDistribution = new HashMap<>();
        private Map<String, Integer> genderDistribution = new HashMap<>();
        private Map<String, Integer> waterSourceDistribution = new HashMap<>();
        private String primaryWaterSource;
        private String status = "ACTIVE";
        private String alertId;
        private Boolean alertGenerated = false;
        private String detectionMethod;
        private Double clusterScore;
        private Timestamp detectedAt = Timestamp.now();
        private Timestamp updatedAt = Timestamp.now();
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder location(String location) {
            this.location = location;
            return this;
        }
        
        public Builder centroid(GeoPoint centroid) {
            this.centroid = centroid;
            return this;
        }
        
        public Builder radiusKm(Double radiusKm) {
            this.radiusKm = radiusKm;
            return this;
        }
        
        public Builder reportCount(Integer reportCount) {
            this.reportCount = reportCount;
            return this;
        }
        
        public Builder reportIds(List<String> reportIds) {
            this.reportIds = reportIds;
            return this;
        }
        
        public Builder firstReportDate(Timestamp firstReportDate) {
            this.firstReportDate = firstReportDate;
            return this;
        }
        
        public Builder lastReportDate(Timestamp lastReportDate) {
            this.lastReportDate = lastReportDate;
            return this;
        }
        
        public Builder durationHours(Integer durationHours) {
            this.durationHours = durationHours;
            return this;
        }
        
        public Builder symptomDistribution(Map<String, Integer> symptomDistribution) {
            this.symptomDistribution = symptomDistribution;
            return this;
        }
        
        public Builder dominantSymptoms(List<String> dominantSymptoms) {
            this.dominantSymptoms = dominantSymptoms;
            return this;
        }
        
        public Builder severityDistribution(Map<String, Integer> severityDistribution) {
            this.severityDistribution = severityDistribution;
            return this;
        }
        
        public Builder overallSeverity(String overallSeverity) {
            this.overallSeverity = overallSeverity;
            return this;
        }
        
        public Builder affectedPopulation(Integer affectedPopulation) {
            this.affectedPopulation = affectedPopulation;
            return this;
        }
        
        public Builder ageDistribution(Map<String, Integer> ageDistribution) {
            this.ageDistribution = ageDistribution;
            return this;
        }
        
        public Builder genderDistribution(Map<String, Integer> genderDistribution) {
            this.genderDistribution = genderDistribution;
            return this;
        }
        
        public Builder waterSourceDistribution(Map<String, Integer> waterSourceDistribution) {
            this.waterSourceDistribution = waterSourceDistribution;
            return this;
        }
        
        public Builder primaryWaterSource(String primaryWaterSource) {
            this.primaryWaterSource = primaryWaterSource;
            return this;
        }
        
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        
        public Builder alertId(String alertId) {
            this.alertId = alertId;
            return this;
        }
        
        public Builder alertGenerated(Boolean alertGenerated) {
            this.alertGenerated = alertGenerated;
            return this;
        }
        
        public Builder detectionMethod(String detectionMethod) {
            this.detectionMethod = detectionMethod;
            return this;
        }
        
        public Builder clusterScore(Double clusterScore) {
            this.clusterScore = clusterScore;
            return this;
        }
        
        public Builder detectedAt(Timestamp detectedAt) {
            this.detectedAt = detectedAt;
            return this;
        }
        
        public Builder updatedAt(Timestamp updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public SymptomCluster build() {
            SymptomCluster cluster = new SymptomCluster();
            cluster.setId(id);
            cluster.setLocation(location);
            cluster.setCentroid(centroid);
            cluster.setRadiusKm(radiusKm);
            cluster.setReportCount(reportCount);
            cluster.setReportIds(reportIds);
            cluster.setFirstReportDate(firstReportDate);
            cluster.setLastReportDate(lastReportDate);
            cluster.setDurationHours(durationHours);
            cluster.setSymptomDistribution(symptomDistribution);
            cluster.setDominantSymptoms(dominantSymptoms);
            cluster.setSeverityDistribution(severityDistribution);
            cluster.setOverallSeverity(overallSeverity);
            cluster.setAffectedPopulation(affectedPopulation);
            cluster.setAgeDistribution(ageDistribution);
            cluster.setGenderDistribution(genderDistribution);
            cluster.setWaterSourceDistribution(waterSourceDistribution);
            cluster.setPrimaryWaterSource(primaryWaterSource);
            cluster.setStatus(status);
            cluster.setAlertId(alertId);
            cluster.setAlertGenerated(alertGenerated);
            cluster.setDetectionMethod(detectionMethod);
            cluster.setClusterScore(clusterScore);
            cluster.setDetectedAt(detectedAt);
            cluster.setUpdatedAt(updatedAt);
            return cluster;
        }
    }
}
