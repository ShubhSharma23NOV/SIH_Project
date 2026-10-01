package com.arogyajal.service;

import com.arogyajal.model.Alert;
import com.arogyajal.model.OutbreakPrediction;
import com.arogyajal.repository.OutbreakPredictionRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service for OutbreakPrediction business logic.
 * Handles prediction creation, analysis, and management.
 */
@Service
public class OutbreakPredictionService {

    private static final Logger log = LoggerFactory.getLogger(OutbreakPredictionService.class);

    private final OutbreakPredictionRepository predictionRepository;
    private final AlertService alertService;
    private final RestTemplate restTemplate;
    
    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;
    
    @Value("${app.demo-mode:false}")
    private boolean demoMode;

    public OutbreakPredictionService(OutbreakPredictionRepository predictionRepository, 
                                    AlertService alertService,
                                    RestTemplate restTemplate) {
        this.predictionRepository = predictionRepository;
        this.alertService = alertService;
        this.restTemplate = restTemplate;
    }
    
    /**
     * Scheduled method to check for outbreak alerts
     * Runs every hour (3600000 ms)
     */
    @Scheduled(fixedRate = 3600000)
    public void checkForOutbreakAlerts() {
        // Skip in demo mode to prevent Firebase quota exhaustion
        if (demoMode) {
            log.debug("Skipping outbreak alert check (demo mode enabled)");
            return;
        }
        
        log.info("🔍 Running scheduled outbreak alert check...");
        
        try {
            // Call ML service to get outbreak prediction
            String outbreakUrl = mlServiceUrl + "/api/ml/predict-outbreak";
            log.info("Calling ML outbreak prediction at: {}", outbreakUrl);
            
            // Prepare request body (empty for now, ML service will fetch data)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("clusters", new ArrayList<>());
            requestBody.put("water_tests", new ArrayList<>());
            requestBody.put("reports", new ArrayList<>());
            
            // Call ML service
            Map response = restTemplate.postForObject(outbreakUrl, requestBody, Map.class);
            
            if (response != null) {
                String outbreakRisk = (String) response.getOrDefault("outbreak_risk", "LOW");
                Object riskScoreObj = response.get("risk_score");
                double riskScore = riskScoreObj instanceof Number ? ((Number) riskScoreObj).doubleValue() : 0.0;
                
                log.info("📊 ML Outbreak Prediction - Risk: {}, Score: {}", outbreakRisk, riskScore);
                
                // Create alert if risk is HIGH or CRITICAL
                if ("HIGH".equalsIgnoreCase(outbreakRisk) || "CRITICAL".equalsIgnoreCase(outbreakRisk)) {
                    createOutbreakAlert(outbreakRisk, riskScore, response);
                } else {
                    log.info("✅ Outbreak risk is {}, no alert needed", outbreakRisk);
                }
            } else {
                log.warn("⚠️ ML service returned null response");
            }
            
        } catch (Exception e) {
            log.error("❌ Error checking for outbreak alerts: {}", e.getMessage(), e);
            // Don't throw - this is a scheduled task, we don't want it to stop
        }
    }
    
    /**
     * Create an outbreak alert based on ML prediction
     */
    private void createOutbreakAlert(String riskLevel, double riskScore, Map<String, Object> mlResponse) {
        try {
            // Extract affected locations if available
            List<String> affectedLocations = (List<String>) mlResponse.getOrDefault("affected_locations", new ArrayList<>());
            String location = affectedLocations.isEmpty() ? "Multiple Locations" : String.join(", ", affectedLocations);
            
            // Build alert title and description
            String title = String.format("Outbreak Alert - %s Risk Detected", riskLevel);
            String description = String.format(
                "ML model predicts %s outbreak risk with score %.2f. Immediate attention required.",
                riskLevel.toLowerCase(),
                riskScore
            );
            
            // Add risk factors if available
            List<String> riskFactors = (List<String>) mlResponse.getOrDefault("risk_factors", new ArrayList<>());
            if (!riskFactors.isEmpty()) {
                description += " Risk factors: " + String.join(", ", riskFactors);
            }
            
            // Create alert
            Alert alert = Alert.builder()
                    .alertType("OUTBREAK")
                    .severity(riskLevel)
                    .title(title)
                    .description(description)
                    .location(location)
                    .status("ACTIVE")
                    .build();
            
            Alert createdAlert = alertService.createAlert(alert);
            log.info("🚨 Created outbreak alert: {} (ID: {})", title, createdAlert.getId());
            
        } catch (Exception e) {
            log.error("❌ Error creating outbreak alert: {}", e.getMessage(), e);
        }
    }

    /**
     * Create a new outbreak prediction
     */
    public OutbreakPrediction createPrediction(OutbreakPrediction prediction) throws ExecutionException, InterruptedException {
        // Set timestamps
        Timestamp now = Timestamp.now();
        if (prediction.getCreatedAt() == null) {
            prediction = OutbreakPrediction.builder()
                    .id(prediction.getId() != null ? prediction.getId() : UUID.randomUUID().toString())
                    .location(prediction.getLocation())
                    .riskLevel(prediction.getRiskLevel())
                    .riskScore(prediction.getRiskScore())
                    .confidence(prediction.getConfidence())
                    .predictionHorizon(prediction.getPredictionHorizon())
                    .contributingFactors(prediction.getContributingFactors())
                    .affectedPopulation(prediction.getAffectedPopulation())
                    .recommendedActions(prediction.getRecommendedActions())
                    .status(prediction.getStatus() != null ? prediction.getStatus() : "ACTIVE")
                    .modelVersion(prediction.getModelVersion())
                    .predictedDate(prediction.getPredictedDate())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        }

        // Validate prediction
        validatePrediction(prediction);

        // Save to repository
        String id = predictionRepository.save(prediction);
        return predictionRepository.findById(id);
    }

    /**
     * Get prediction by ID
     */
    public OutbreakPrediction getPredictionById(String id) throws ExecutionException, InterruptedException {
        OutbreakPrediction prediction = predictionRepository.findById(id);
        if (prediction == null) {
            throw new IllegalArgumentException("Prediction not found with ID: " + id);
        }
        return prediction;
    }

    /**
     * Get all predictions
     */
    public List<OutbreakPrediction> getAllPredictions() throws ExecutionException, InterruptedException {
        return predictionRepository.findAll();
    }

    /**
     * Get latest prediction (most recent by timestamp)
     */
    public OutbreakPrediction getLatestPrediction() {
        try {
            List<OutbreakPrediction> predictions = getAllPredictions();
            if (predictions.isEmpty()) {
                return null;
            }
            
            // Sort by predictedDate descending and return first
            return predictions.stream()
                .filter(p -> p.getPredictedDate() != null)
                .sorted((a, b) -> b.getPredictedDate().compareTo(a.getPredictedDate()))
                .findFirst()
                .orElse(null);
                
        } catch (Exception e) {
            log.error("Error getting latest prediction", e);
            return null;
        }
    }
    /**
     * Get latest prediction for a specific location
     */
    public OutbreakPrediction getLatestPredictionByLocation(String location) {
        try {
            List<OutbreakPrediction> predictions = getAllPredictions();
            return predictions.stream()
                .filter(p -> p.getPredictedDate() != null && p.getLocation() != null)
                .filter(p -> p.getLocation().toLowerCase().contains(location.toLowerCase()))
                .sorted((a, b) -> b.getPredictedDate().compareTo(a.getPredictedDate()))
                .findFirst().orElse(null);
        } catch (Exception e) {
            log.error("Error getting latest prediction for location: {}", location, e);
            return null;
        }
    }

    /**
     * Store prediction from ML service response with HYBRID FUSION logic
     * Combines rule-based risk (from WQI thresholds) with ML risk
     */
    public void storePredictionFromML(Map<String, Object> mlResult, String location, Map<String, Object> payload) {
        try {
            // ========================================
            // STEP 1: Extract ML prediction
            // ========================================
            Object riskScoreObj = mlResult.get("risk_score");
            Object riskLevelObj = mlResult.get("risk_level");
            Object confidenceObj = mlResult.get("confidence");
            Object factorsObj = mlResult.get("contributing_factors");
            Object recommendationsObj = mlResult.get("recommendations");
            
            double mlRiskScore = riskScoreObj instanceof Number ? 
                ((Number) riskScoreObj).doubleValue() : 0.0;
            String mlRiskLevel = riskLevelObj != null ? riskLevelObj.toString() : "UNKNOWN";
            double mlConfidence = confidenceObj instanceof Number ? 
                ((Number) confidenceObj).doubleValue() : 0.0;
            
            log.info("📊 ML Prediction: risk={:.1f}, level={}, confidence={:.1f}%", 
                    mlRiskScore, mlRiskLevel, mlConfidence);
            
            // ========================================
            // STEP 2: Calculate rule-based risk
            // ========================================
            double ruleRiskScore = 0.0;
            String ruleRiskLevel = "LOW";
            
            try {
                // Extract sensor data from payload
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sensorData = (List<Map<String, Object>>) payload.get("sensors");
                
                log.info("🔍 Payload keys: {}", payload.keySet());
                log.info("🔍 Sensor data from payload: {} sensors", 
                        sensorData != null ? sensorData.size() : "null");
                
                if (sensorData != null && !sensorData.isEmpty()) {
                    // Log first sensor for debugging
                    if (!sensorData.isEmpty()) {
                        Map<String, Object> firstSensor = sensorData.get(0);
                        log.info("🔍 First sensor: id={}, wqi={}, ph={}, turbidity={}, tds={}",
                                firstSensor.get("sensor_id"),
                                firstSensor.get("wqi"),
                                firstSensor.get("ph"),
                                firstSensor.get("turbidity"),
                                firstSensor.get("tds"));
                    }
                    
                    ruleRiskScore = com.arogyajal.util.RuleBasedRiskCalculator.calculateRuleBasedRisk(sensorData);
                    ruleRiskLevel = com.arogyajal.util.RuleBasedRiskCalculator.determineRiskLevel(ruleRiskScore);
                    
                    log.info("📏 Rule-based Risk: risk={:.1f}, level={}", ruleRiskScore, ruleRiskLevel);
                } else {
                    log.warn("⚠️ No sensor data available for rule-based risk calculation (payload has {} keys)",
                            payload.size());
                }
            } catch (Exception e) {
                log.error("❌ Error calculating rule-based risk: {}", e.getMessage(), e);
            }
            
            // ========================================
            // STEP 3: HYBRID FUSION - Take maximum
            // ========================================
            double finalRiskScore = Math.max(mlRiskScore, ruleRiskScore);
            String finalRiskLevel = com.arogyajal.util.RuleBasedRiskCalculator.determineRiskLevel(finalRiskScore);
            
            log.info("🔀 FUSION: ML={:.1f}, Rule={:.1f} → Final={:.1f} ({})", 
                    mlRiskScore, ruleRiskScore, finalRiskScore, finalRiskLevel);
            
            // ========================================
            // STEP 4: Adjust confidence based on fusion
            // ========================================
            double finalConfidence = mlConfidence;
            
            // If rule-based risk is significantly higher, reduce confidence slightly
            if (ruleRiskScore > mlRiskScore + 20) {
                finalConfidence = Math.max(mlConfidence * 0.9, 50.0);
                log.info("⚠️ Rule-based risk much higher than ML, confidence adjusted: {:.1f}% → {:.1f}%",
                        mlConfidence, finalConfidence);
            }
            
            // ========================================
            // STEP 5: Build contributing factors with fusion metadata
            // ========================================
            Map<String, Double> factors = new HashMap<>();
            
            // Add ML factors
            if (factorsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> factorsMap = (Map<String, Object>) factorsObj;
                for (Map.Entry<String, Object> entry : factorsMap.entrySet()) {
                    if (entry.getValue() instanceof Number) {
                        factors.put(entry.getKey(), ((Number) entry.getValue()).doubleValue());
                    }
                }
            }
            
            // Add fusion metadata
            factors.put("ml_risk_score", mlRiskScore);
            factors.put("rule_risk_score", ruleRiskScore);
            factors.put("final_risk_score", finalRiskScore);
            factors.put("fusion_method", 1.0); // 1.0 = max fusion
            
            // ========================================
            // STEP 6: Extract recommendations
            // ========================================
            List<String> recommendations = new ArrayList<>();
            if (recommendationsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> recList = (List<Object>) recommendationsObj;
                for (Object rec : recList) {
                    if (rec != null) {
                        recommendations.add(rec.toString());
                    }
                }
            }
            
            // Default recommendations if none provided
            if (recommendations.isEmpty()) {
                recommendations = Arrays.asList(
                    "Monitor water quality closely",
                    "Increase testing frequency",
                    "Alert health officials"
                );
            }
            
            // Add fusion-specific recommendation if rule-based risk is high
            if (ruleRiskScore >= 60 && ruleRiskScore > mlRiskScore) {
                recommendations.add(0, "⚠️ PRIORITY: Water quality thresholds exceeded - immediate testing required");
            }
            
            // ========================================
            // STEP 7: Build and store fused prediction
            // ========================================
            String predictionId = "pred_" + location.replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis();
            
            OutbreakPrediction prediction = OutbreakPrediction.builder()
                .id(predictionId)
                .location(location)
                .riskScore(finalRiskScore)  // ✅ FUSED RISK
                .riskLevel(finalRiskLevel)  // ✅ FUSED LEVEL
                .confidence(finalConfidence) // ✅ ADJUSTED CONFIDENCE
                .contributingFactors(factors) // ✅ INCLUDES FUSION METADATA
                .recommendedActions(recommendations)
                .status("ACTIVE")
                .modelVersion("1.2.0-FUSION") // Updated version
                .predictionHorizon(7)
                .predictedDate(com.google.cloud.Timestamp.now())
                .build();
            
            // Save to Firestore
            createPrediction(prediction);
            
            log.info("✅ Stored FUSED prediction for {}: Final Risk={:.1f} ({}), Confidence={:.1f}% [ML={:.1f}, Rule={:.1f}]",
                       location, finalRiskScore, finalRiskLevel, finalConfidence, mlRiskScore, ruleRiskScore);
            
        } catch (Exception e) {
            log.error("❌ Error storing fused prediction for {}: {}", location, e.getMessage(), e);
            throw new RuntimeException("Failed to store fused prediction", e);
        }
    }
    
    /**
     * DEPRECATED: Old method without fusion - kept for backward compatibility
     * Use storePredictionFromML(mlResult, location, payload) instead
     */
    @Deprecated
    public void storePredictionFromML(Map<String, Object> mlResult, String location) {
        log.warn("⚠️ Using deprecated storePredictionFromML without payload - fusion logic will not work");
        storePredictionFromML(mlResult, location, new HashMap<>());
    }

    /**
     * Get predictions by location
     */
    public List<OutbreakPrediction> getPredictionsByLocation(String location) throws ExecutionException, InterruptedException {
        return predictionRepository.findByLocation(location);
    }

    /**
     * Get active predictions for location
     */
    public List<OutbreakPrediction> getActivePredictionsByLocation(String location) throws ExecutionException, InterruptedException {
        return predictionRepository.findActiveByLocation(location);
    }

    /**
     * Get high-risk predictions
     */
    public List<OutbreakPrediction> getHighRiskPredictions() throws ExecutionException, InterruptedException {
        return predictionRepository.findHighRiskPredictions();
    }

    /**
     * Get predictions by risk level
     */
    public List<OutbreakPrediction> getPredictionsByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        validateRiskLevel(riskLevel);
        return predictionRepository.findByRiskLevel(riskLevel);
    }

    /**
     * Update prediction status
     */
    public void updatePredictionStatus(String id, String status) throws ExecutionException, InterruptedException {
        validateStatus(status);
        
        // Verify prediction exists
        //OutbreakPrediction prediction = getPredictionById(id);
        
        // Update status
        predictionRepository.updateStatus(id, status);
    }

    /**
     * Update prediction
     */
    public OutbreakPrediction updatePrediction(OutbreakPrediction prediction) throws ExecutionException, InterruptedException {
        // Verify prediction exists
        OutbreakPrediction existing = getPredictionById(prediction.getId());
        
        // Validate updated prediction
        validatePrediction(prediction);
        
        // Update timestamp
        prediction = OutbreakPrediction.builder()
                .id(prediction.getId())
                .location(prediction.getLocation())
                .riskLevel(prediction.getRiskLevel())
                .riskScore(prediction.getRiskScore())
                .confidence(prediction.getConfidence())
                .predictionHorizon(prediction.getPredictionHorizon())
                .contributingFactors(prediction.getContributingFactors())
                .affectedPopulation(prediction.getAffectedPopulation())
                .recommendedActions(prediction.getRecommendedActions())
                .status(prediction.getStatus())
                .modelVersion(prediction.getModelVersion())
                .predictedDate(prediction.getPredictedDate())
                .createdAt(existing.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        predictionRepository.update(prediction);
        return predictionRepository.findById(prediction.getId());
    }

    /**
     * Delete prediction
     */
    public void deletePrediction(String id) throws ExecutionException, InterruptedException {
        // Verify prediction exists
        getPredictionById(id);
        
        predictionRepository.delete(id);
    }

    /**
     * Get prediction statistics by location
     */
    public Map<String, Object> getPredictionStatsByLocation(String location) throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = predictionRepository.findActiveByLocation(location);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPredictions", predictions.size());
        stats.put("highRiskCount", predictions.stream()
                .filter(p -> "HIGH".equals(p.getRiskLevel()) || "CRITICAL".equals(p.getRiskLevel()))
                .count());
        stats.put("averageRiskScore", predictions.stream()
                .mapToDouble(OutbreakPrediction::getRiskScore)
                .average()
                .orElse(0.0));
        stats.put("averageConfidence", predictions.stream()
                .mapToDouble(OutbreakPrediction::getConfidence)
                .average()
                .orElse(0.0));
        
        // Risk level distribution
        Map<String, Long> riskDistribution = predictions.stream()
                .collect(Collectors.groupingBy(OutbreakPrediction::getRiskLevel, Collectors.counting()));
        stats.put("riskDistribution", riskDistribution);
        
        return stats;
    }

    /**
     * Get overall prediction statistics
     */
    public Map<String, Object> getOverallStats() throws ExecutionException, InterruptedException {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("lowRiskCount", predictionRepository.countByRiskLevel("LOW"));
        stats.put("mediumRiskCount", predictionRepository.countByRiskLevel("MEDIUM"));
        stats.put("highRiskCount", predictionRepository.countByRiskLevel("HIGH"));
        stats.put("criticalRiskCount", predictionRepository.countByRiskLevel("CRITICAL"));
        
        List<OutbreakPrediction> allPredictions = predictionRepository.findAll();
        stats.put("totalPredictions", allPredictions.size());
        
        long activeCount = allPredictions.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .count();
        stats.put("activePredictions", activeCount);
        
        return stats;
    }

    /**
     * Archive old predictions
     */
    public int archiveOldPredictions(int daysOld) throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> allPredictions = predictionRepository.findAll();
        Timestamp cutoffDate = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() - (daysOld * 24 * 60 * 60), 0);
        
        int archivedCount = 0;
        for (OutbreakPrediction prediction : allPredictions) {
            if ("ACTIVE".equals(prediction.getStatus()) && 
                prediction.getCreatedAt().compareTo(cutoffDate) < 0) {
                predictionRepository.updateStatus(prediction.getId(), "ARCHIVED");
                archivedCount++;
            }
        }
        
        return archivedCount;
    }

    /**
     * Validate prediction data
     */
    private void validatePrediction(OutbreakPrediction prediction) {
        if (prediction.getLocation() == null || prediction.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Location is required");
        }
        
        if (prediction.getRiskLevel() == null) {
            throw new IllegalArgumentException("Risk level is required");
        }
        validateRiskLevel(prediction.getRiskLevel());
        
        if (prediction.getRiskScore() == null || prediction.getRiskScore() < 0 || prediction.getRiskScore() > 100) {
            throw new IllegalArgumentException("Risk score must be between 0 and 100");
        }
        
        if (prediction.getConfidence() == null || prediction.getConfidence() < 0 || prediction.getConfidence() > 100) {
            throw new IllegalArgumentException("Confidence must be between 0 and 100");
        }
        
        if (prediction.getPredictionHorizon() != null && prediction.getPredictionHorizon() < 1) {
            throw new IllegalArgumentException("Prediction horizon must be at least 1 day");
        }
    }

    /**
     * Validate risk level
     */
    private void validateRiskLevel(String riskLevel) {
        List<String> validLevels = Arrays.asList("LOW", "MEDIUM", "HIGH", "CRITICAL");
        if (!validLevels.contains(riskLevel)) {
            throw new IllegalArgumentException("Invalid risk level. Must be one of: " + validLevels);
        }
    }

    /**
     * Validate status
     */
    private void validateStatus(String status) {
        List<String> validStatuses = Arrays.asList("ACTIVE", "RESOLVED", "ARCHIVED", "EXPIRED");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Invalid status. Must be one of: " + validStatuses);
        }
    }
}

