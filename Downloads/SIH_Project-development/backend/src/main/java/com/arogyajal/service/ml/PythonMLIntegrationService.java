package com.arogyajal.service.ml;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service to integrate with Python ML models.
 * Calls Python ML API endpoints for predictions and clustering.
 */
@Service
public class PythonMLIntegrationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ml.python.api.url:http://localhost:5000}")
    private String pythonMLApiUrl;

    @Value("${ml.python.api.enabled:false}")
    private boolean pythonMLEnabled;

    public PythonMLIntegrationService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Call Python ML model for outbreak prediction
     */
    public Map<String, Object> predictOutbreak(Map<String, Object> inputData) {
        if (!pythonMLEnabled) {
            throw new IllegalStateException("Python ML API is not enabled. Set ml.python.api.enabled=true");
        }

        String url = pythonMLApiUrl + "/api/ml/predict-outbreak";
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(inputData, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Python ML API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Python ML API: " + e.getMessage(), e);
        }
    }

    /**
     * Call Python ML model for clustering
     */
    public Map<String, Object> performClustering(List<Map<String, Object>> reports) {
        if (!pythonMLEnabled) {
            throw new IllegalStateException("Python ML API is not enabled");
        }

        String url = pythonMLApiUrl + "/api/ml/cluster";
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("reports", reports);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Python ML API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Python ML clustering API: " + e.getMessage(), e);
        }
    }

    /**
     * Call Python ML model for risk assessment
     */
    public Map<String, Object> assessRisk(Map<String, Object> inputData) {
        if (!pythonMLEnabled) {
            throw new IllegalStateException("Python ML API is not enabled");
        }

        String url = pythonMLApiUrl + "/api/ml/assess-risk";
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(inputData, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("Python ML API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Python ML risk assessment API: " + e.getMessage(), e);
        }
    }

    /**
     * Check if Python ML API is available
     */
    public boolean isPythonMLAvailable() {
        if (!pythonMLEnabled) {
            return false;
        }

        String url = pythonMLApiUrl + "/health";
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get Python ML API status
     */
    public Map<String, Object> getMLApiStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", pythonMLEnabled);
        status.put("apiUrl", pythonMLApiUrl);
        status.put("available", isPythonMLAvailable());
        return status;
    }
}
