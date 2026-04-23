package com.arogyajal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for calling the ML Prediction API
 */
@Service
public class MLPredictionService {
    
    private static final Logger log = LoggerFactory.getLogger(MLPredictionService.class);
    
    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public MLPredictionService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Predict WQI from sensor data (4 sensors only)
     * 
     * @param ph pH value
     * @param temperature Temperature in Celsius
     * @param tds Total Dissolved Solids in ppm
     * @param turbidity Turbidity in NTU
     * @return WQI prediction result
     */
    public WQIPrediction predictWQI(Double ph, Double temperature, Double tds, Double turbidity) {
        try {
            // Check if all required fields are present (4 sensors only)
            if (ph == null || temperature == null || tds == null || turbidity == null) {
                log.warn("Missing required fields for ML prediction. Using fallback.");
                return new WQIPrediction(0.0, "UNKNOWN", false, "Missing required sensor readings");
            }
            
            // Prepare request data (4 sensors only - DO not available)
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("ph", ph);
            requestData.put("temperature", temperature);
            requestData.put("tds", tds);
            requestData.put("turbidity", turbidity);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create request entity
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestData, headers);
            
            // Call ML service
            String url = mlServiceUrl + "/predict";
            log.info("Calling ML service at: {}", url);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                // Parse response
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                
                double wqi = jsonResponse.get("wqi").asDouble();
                String qualityStatus = jsonResponse.get("quality_status").asText();
                
                log.info("ML Prediction - WQI: {}, Status: {}", wqi, qualityStatus);
                
                return new WQIPrediction(wqi, qualityStatus, true, null);
            } else {
                log.error("ML service returned error: {}", response.getStatusCode());
                return new WQIPrediction(0.0, "UNKNOWN", false, "ML service error");
            }
            
        } catch (Exception e) {
            log.error("Error calling ML service: {}", e.getMessage(), e);
            return new WQIPrediction(0.0, "UNKNOWN", false, e.getMessage());
        }
    }
    
    /**
     * Check if ML service is available
     */
    public boolean isMLServiceAvailable() {
        try {
            String url = mlServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.warn("ML service not available: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * WQI Prediction result class
     */
    public static class WQIPrediction {
        private final double wqi;
        private final String qualityStatus;
        private final boolean success;
        private final String errorMessage;
        
        public WQIPrediction(double wqi, String qualityStatus, boolean success, String errorMessage) {
            this.wqi = wqi;
            this.qualityStatus = qualityStatus;
            this.success = success;
            this.errorMessage = errorMessage;
        }
        
        public double getWqi() {
            return wqi;
        }
        
        public String getQualityStatus() {
            return qualityStatus;
        }
        
        public boolean isSuccess() {
            return success;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
    }
}
