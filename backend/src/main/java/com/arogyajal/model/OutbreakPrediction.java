package com.arogyajal.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.google.cloud.Timestamp;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents an ML-based outbreak prediction for a specific location.
 * Core model for SIH PS 25001 outbreak prediction requirement.
 */
public class OutbreakPrediction {
    
    @DocumentId
    private String id;
    
    private String location; // Village/district name
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private Double riskScore; // 0-100
    private Double confidence; // 0-100 (ML model confidence)
    
    @ServerTimestamp
    private Timestamp predictedDate;
    
    private Integer predictionHorizon; // Days (typically 7)
    
    // Contributing factors breakdown
    private Map<String, Double> contributingFactors = new HashMap<>();
    // - waterQualityScore: Double
    // - symptomClusterScore: Double
    // - seasonalScore: Double
    // - historicalScore: Double
    
    private Integer affectedPopulation; // Estimated population at risk
    private List<String> recommendedActions = new ArrayList<>();
    
    @ServerTimestamp
    private Timestamp createdAt;
    
    @ServerTimestamp
    private Timestamp updatedAt;
    
    private String status; // ACTIVE, EXPIRED
    
    // ML model metadata
    private String modelVersion;
    private Map<String, Object> mlMetadata = new HashMap<>();
    
    // Constructors
    public OutbreakPrediction() {
    }
    
    public OutbreakPrediction(String id, String location, String riskLevel, Double riskScore, 
                             Double confidence, Timestamp predictedDate, Integer predictionHorizon,
                             Map<String, Double> contributingFactors, Integer affectedPopulation,
                             List<String> recommendedActions, Timestamp createdAt, Timestamp updatedAt,
                             String status, String modelVersion, Map<String, Object> mlMetadata) {
        this.id = id;
        this.location = location;
        this.riskLevel = riskLevel;
        this.riskScore = riskScore;
        this.confidence = confidence;
        this.predictedDate = predictedDate;
        this.predictionHorizon = predictionHorizon;
        this.contributingFactors = contributingFactors;
        this.affectedPopulation = affectedPopulation;
        this.recommendedActions = recommendedActions;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = status;
        this.modelVersion = modelVersion;
        this.mlMetadata = mlMetadata;
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
    
    public String getRiskLevel() {
        return riskLevel;
    }
    
    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
    
    public Double getRiskScore() {
        return riskScore;
    }
    
    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
    
    public Timestamp getPredictedDate() {
        return predictedDate;
    }
    
    public void setPredictedDate(Timestamp predictedDate) {
        this.predictedDate = predictedDate;
    }
    
    public Integer getPredictionHorizon() {
        return predictionHorizon;
    }
    
    public void setPredictionHorizon(Integer predictionHorizon) {
        this.predictionHorizon = predictionHorizon;
    }
    
    public Map<String, Double> getContributingFactors() {
        return contributingFactors;
    }
    
    public void setContributingFactors(Map<String, Double> contributingFactors) {
        this.contributingFactors = contributingFactors;
    }
    
    public Integer getAffectedPopulation() {
        return affectedPopulation;
    }
    
    public void setAffectedPopulation(Integer affectedPopulation) {
        this.affectedPopulation = affectedPopulation;
    }
    
    public List<String> getRecommendedActions() {
        return recommendedActions;
    }
    
    public void setRecommendedActions(List<String> recommendedActions) {
        this.recommendedActions = recommendedActions;
    }
    
    public Timestamp getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
    
    public Timestamp getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getModelVersion() {
        return modelVersion;
    }
    
    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }
    
    public Map<String, Object> getMlMetadata() {
        return mlMetadata;
    }
    
    public void setMlMetadata(Map<String, Object> mlMetadata) {
        this.mlMetadata = mlMetadata;
    }
    
    @Override
    public String toString() {
        return "OutbreakPrediction{" +
                "id='" + id + '\'' +
                ", location='" + location + '\'' +
                ", riskLevel='" + riskLevel + '\'' +
                ", riskScore=" + riskScore +
                ", confidence=" + confidence +
                ", predictedDate=" + predictedDate +
                ", predictionHorizon=" + predictionHorizon +
                ", affectedPopulation=" + affectedPopulation +
                ", status='" + status + '\'' +
                ", modelVersion='" + modelVersion + '\'' +
                '}';
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String id;
        private String location;
        private String riskLevel;
        private Double riskScore;
        private Double confidence;
        private Timestamp predictedDate;
        private Integer predictionHorizon = 7; // Default 7 days
        private Map<String, Double> contributingFactors = new HashMap<>();
        private Integer affectedPopulation;
        private List<String> recommendedActions = new ArrayList<>();
        private Timestamp createdAt = Timestamp.now();
        private Timestamp updatedAt = Timestamp.now();
        private String status = "ACTIVE";
        private String modelVersion;
        private Map<String, Object> mlMetadata = new HashMap<>();
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder location(String location) {
            this.location = location;
            return this;
        }
        
        public Builder riskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
            return this;
        }
        
        public Builder riskScore(Double riskScore) {
            this.riskScore = riskScore;
            return this;
        }
        
        public Builder confidence(Double confidence) {
            this.confidence = confidence;
            return this;
        }
        
        public Builder predictedDate(Timestamp predictedDate) {
            this.predictedDate = predictedDate;
            return this;
        }
        
        public Builder predictionHorizon(Integer predictionHorizon) {
            this.predictionHorizon = predictionHorizon;
            return this;
        }
        
        public Builder contributingFactors(Map<String, Double> contributingFactors) {
            this.contributingFactors = contributingFactors;
            return this;
        }
        
        public Builder affectedPopulation(Integer affectedPopulation) {
            this.affectedPopulation = affectedPopulation;
            return this;
        }
        
        public Builder recommendedActions(List<String> recommendedActions) {
            this.recommendedActions = recommendedActions;
            return this;
        }
        
        public Builder createdAt(Timestamp createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public Builder updatedAt(Timestamp updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        
        public Builder modelVersion(String modelVersion) {
            this.modelVersion = modelVersion;
            return this;
        }
        
        public Builder mlMetadata(Map<String, Object> mlMetadata) {
            this.mlMetadata = mlMetadata;
            return this;
        }
        
        public OutbreakPrediction build() {
            OutbreakPrediction prediction = new OutbreakPrediction();
            prediction.setId(id);
            prediction.setLocation(location);
            prediction.setRiskLevel(riskLevel);
            prediction.setRiskScore(riskScore);
            prediction.setConfidence(confidence);
            prediction.setPredictedDate(predictedDate);
            prediction.setPredictionHorizon(predictionHorizon);
            prediction.setContributingFactors(contributingFactors);
            prediction.setAffectedPopulation(affectedPopulation);
            prediction.setRecommendedActions(recommendedActions);
            prediction.setCreatedAt(createdAt);
            prediction.setUpdatedAt(updatedAt);
            prediction.setStatus(status);
            prediction.setModelVersion(modelVersion);
            prediction.setMlMetadata(mlMetadata);
            return prediction;
        }
    }
}
