package com.arogyajal.scheduler;

import com.arogyajal.service.MLPayloadService;
import com.arogyajal.service.OutbreakPredictionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Scheduled task for syncing with ML service
 * Runs every 60 seconds to update outbreak predictions
 */
@Component
public class MLSyncScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(MLSyncScheduler.class);
    
    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;
    
    @Value("${ml.sync.enabled:true}")
    private boolean syncEnabled;
    
    private final MLPayloadService payloadService;
    private final OutbreakPredictionService predictionService;
    private final RestTemplate restTemplate;
    
    private double lastRiskScore = 0.0;
    private int syncCount = 0;
    private int failureCount = 0;
    
    public MLSyncScheduler(MLPayloadService payloadService,
                          OutbreakPredictionService predictionService) {
        this.payloadService = payloadService;
        this.predictionService = predictionService;
        this.restTemplate = new RestTemplate();
        restTemplate.setErrorHandler(new org.springframework.web.client.DefaultResponseErrorHandler());
    }
    
    /**
     * Sync with ML service every 5 minutes (300 seconds)
     * Fetches sensor + symptom data, sends to ML, stores prediction
     * OPTIMIZATION: Reduced frequency to save Firestore reads (was 45s)
     */
    @Scheduled(fixedRate = 900000, initialDelay = 10000) // 15 minutes (900 seconds), 10s initial delay
    public void syncWithMLService() {
        if (!syncEnabled) {
            logger.debug("ML sync disabled via configuration");
            return;
        }
        
        syncCount++;
        logger.info("🔄 ML Sync #{} starting...", syncCount);
        
        try {
            // 1. Assemble payload
            Map<String, Object> payload = payloadService.assembleMLPayload();
            
            int sensorCount = (int) payload.getOrDefault("sensor_count", 0);
            int reportCount = (int) payload.getOrDefault("report_count", 0);
            int poorSensors = (int) payload.getOrDefault("poor_sensors", 0);
            
            logger.info("📦 Payload: {} sensors ({} poor), {} reports",
                       sensorCount, poorSensors, reportCount);
            
            // 2. Send to ML service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "ArogyaJal-Backend/1.1.0");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String mlEndpoint = mlServiceUrl + "/api/ml/predict-outbreak";
            logger.debug("📡 Sending request to: {}", mlEndpoint);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                mlEndpoint,
                request,
                Map.class
            );
            
            // 3. Process response
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> mlResult = response.getBody();
                
                // Extract values
                Object riskScoreObj = mlResult.get("risk_score");
                Object riskLevelObj = mlResult.get("risk_level");
                Object confidenceObj = mlResult.get("confidence");
                
                double riskScore = riskScoreObj instanceof Number ? 
                    ((Number) riskScoreObj).doubleValue() : 0.0;
                String riskLevel = riskLevelObj != null ? riskLevelObj.toString() : "UNKNOWN";
                double confidence = confidenceObj instanceof Number ? 
                    ((Number) confidenceObj).doubleValue() : 0.0;
                
                logger.info("✅ ML Response: Risk={} ({}), Confidence={}%",
                           riskScore, riskLevel, confidence);
                
                // Check for significant risk change
                double riskDelta = Math.abs(riskScore - lastRiskScore);
                if (riskDelta >= 10.0 && lastRiskScore > 0) {
                    logger.warn("⚠️ SIGNIFICANT RISK CHANGE: {} → {} (Δ{:+.1f})",
                               lastRiskScore, riskScore, riskScore - lastRiskScore);
                }
                lastRiskScore = riskScore;
                
                // 4. Store prediction in Firestore with FUSION logic
                // Extract dominant location from payload (highest risk area)
                String location = extractDominantLocation(payload);
                
                // ✅ PASS PAYLOAD FOR FUSION LOGIC
                predictionService.storePredictionFromML(mlResult, location, payload);
                logger.info("💾 FUSED prediction stored successfully for location: {}", location);
                
                // Reset failure count on success
                failureCount = 0;
                
            } else {
                logger.error("❌ ML service returned unexpected status: {}", 
                           response.getStatusCode());
                failureCount++;
            }
            
        } catch (org.springframework.web.client.ResourceAccessException e) {
            failureCount++;
            logger.error("❌ ML service connection failed (attempt {}): Cannot connect to {}",
                        failureCount, mlServiceUrl);
            logger.error("   Error: {}", e.getMessage());
            
            if (failureCount >= 5) {
                logger.error("⚠️ ML service has been unreachable for {} attempts. " +
                           "Please check if ML service is running at {}", 
                           failureCount, mlServiceUrl);
            }
            
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            failureCount++;
            logger.error("❌ ML service returned client error: {} - {}",
                        e.getStatusCode(), e.getResponseBodyAsString());
            
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            failureCount++;
            logger.error("❌ ML service returned server error: {} - {}",
                        e.getStatusCode(), e.getResponseBodyAsString());
            
        } catch (Exception e) {
            failureCount++;
            logger.error("❌ ML sync failed with unexpected error: {}", e.getMessage(), e);
        }
        
        logger.info("🔄 ML Sync #{} completed (Success rate: {}/{})",
                   syncCount, syncCount - failureCount, syncCount);
    }
    
    /**
     * Extract dominant location from payload (location with highest risk)
     */
    private String extractDominantLocation(Map<String, Object> payload) {
        try {
            // Check symptom clusters first (highest priority)
            Object clustersObj = payload.get("symptom_clusters");
            if (clustersObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> clusters = (List<Map<String, Object>>) clustersObj;
                
                // Find cluster with highest severity
                String highestRiskLocation = null;
                double highestSeverity = 0.0;
                
                for (Map<String, Object> cluster : clusters) {
                    Object locationObj = cluster.get("location");
                    Object severityObj = cluster.get("severity_score");
                    
                    if (locationObj != null && severityObj instanceof Number) {
                        double severity = ((Number) severityObj).doubleValue();
                        if (severity > highestSeverity) {
                            highestSeverity = severity;
                            highestRiskLocation = locationObj.toString();
                        }
                    }
                }
                
                if (highestRiskLocation != null) {
                    logger.info("📍 Dominant location from clusters: {} (severity: {})",
                               highestRiskLocation, highestSeverity);
                    return highestRiskLocation;
                }
            }
            
            // Fallback: Check sensor data for poor quality locations
            Object sensorDataObj = payload.get("sensor_data");
            if (sensorDataObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sensors = (List<Map<String, Object>>) sensorDataObj;
                
                for (Map<String, Object> sensor : sensors) {
                    Object locationObj = sensor.get("location");
                    Object wqiObj = sensor.get("wqi");
                    
                    if (locationObj != null && wqiObj instanceof Number) {
                        double wqi = ((Number) wqiObj).doubleValue();
                        if (wqi > 75) { // Poor quality
                            String location = locationObj.toString();
                            logger.info("📍 Dominant location from poor WQI sensor: {} (WQI: {})",
                                       location, wqi);
                            return location;
                        }
                    }
                }
            }
            
            // Default: North East India (overall region)
            logger.info("📍 No specific high-risk location found, using overall region");
            return "North East India";
            
        } catch (Exception e) {
            logger.error("Error extracting dominant location: {}", e.getMessage());
            return "North East India";
        }
    }
    
    /**
     * Get sync statistics
     */
    public Map<String, Object> getSyncStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_syncs", syncCount);
        stats.put("failures", failureCount);
        stats.put("success_rate", syncCount > 0 ? 
            (double)(syncCount - failureCount) / syncCount * 100 : 0);
        stats.put("last_risk_score", lastRiskScore);
        stats.put("ml_service_url", mlServiceUrl);
        stats.put("sync_enabled", syncEnabled);
        return stats;
    }
}
