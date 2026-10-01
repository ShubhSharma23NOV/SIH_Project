package com.arogyajal.controller;

import com.arogyajal.service.EmergencyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Emergency Controller for Mobile App
 * Handles water safety risk detection, emergency alerts, symptom reporting, and photo uploads
 */
@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Tag(name = "Emergency API", description = "Mobile app emergency endpoints for water safety and health alerts")
public class EmergencyController {
    
    private static final Logger log = LoggerFactory.getLogger(EmergencyController.class);
    
    private final EmergencyService emergencyService;
    
    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }
    
    /**
     * Detect water safety risk level based on sensor data, lab reports, and alerts
     * POST /api/emergency/detect-risk
     */
    @PostMapping("/detect-risk")
    @Operation(summary = "Detect water safety risk", 
              description = "Analyze water safety risk based on nearby sensors, lab reports, and active alerts")
    public ResponseEntity<Map<String, Object>> detectRisk(@RequestBody Map<String, Object> request) {
        log.info("Risk detection requested for location: {}, {}", 
                request.get("latitude"), request.get("longitude"));
        
        try {
            // Validate request
            if (request.get("latitude") == null || request.get("longitude") == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing latitude or longitude in request body"));
            }
            
            double latitude = ((Number) request.get("latitude")).doubleValue();
            double longitude = ((Number) request.get("longitude")).doubleValue();
            
            // Validate coordinates
            if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid latitude or longitude values"));
            }
            
            Map<String, Object> riskAssessment = emergencyService.detectWaterRisk(latitude, longitude);
            
            log.info("Risk assessment complete: {} (score: {})", 
                    riskAssessment.get("riskLevel"), riskAssessment.get("riskScore"));
            
            return ResponseEntity.ok(riskAssessment);
            
        } catch (Exception e) {
            log.error("Error detecting risk", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to detect risk: " + e.getMessage()));
        }
    }
    
    /**
     * Send emergency SOS alert to officials
     * POST /api/emergency/send-alert
     */
    @PostMapping("/send-alert")
    @Operation(summary = "Send emergency alert", 
              description = "Send SOS alert to ASHA workers, supervisors, and health officials")
    public ResponseEntity<Map<String, Object>> sendAlert(@RequestBody Map<String, Object> request) {
        log.info("Emergency alert from user: {}", request.get("userId"));
        
        try {
            Map<String, Object> result = emergencyService.sendEmergencyAlert(request);
            
            log.info("Emergency alert sent successfully: {}", result.get("alertId"));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error sending emergency alert", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Escalate alert to supervisor
     * POST /api/emergency/escalate
     */
    @PostMapping("/escalate")
    @Operation(summary = "Escalate alert", 
              description = "Escalate emergency alert to supervisor level")
    public ResponseEntity<Map<String, Object>> escalateAlert(@RequestBody Map<String, String> request) {
        String alertId = request.get("alertId");
        log.info("Escalating alert: {}", alertId);
        
        try {
            emergencyService.escalateAlert(alertId);
            
            return ResponseEntity.ok(Map.of("success", true));
            
        } catch (Exception e) {
            log.error("Error escalating alert", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Submit symptom report for outbreak detection
     * POST /api/emergency/submit-symptoms
     */
    @PostMapping("/submit-symptoms")
    @Operation(summary = "Submit symptom report", 
              description = "Submit health symptoms for community outbreak detection")
    public ResponseEntity<Map<String, Object>> submitSymptoms(@RequestBody Map<String, Object> request) {
        log.info("Symptom report from user: {}", request.get("userId"));
        
        try {
            Map<String, Object> result = emergencyService.submitSymptomReport(request);
            
            log.info("Symptom report saved: {} (outbreak: {})", 
                    result.get("reportId"), result.get("outbreakDetected"));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error submitting symptom report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Upload photo evidence
     * POST /api/emergency/upload-photos
     */
    @PostMapping("/upload-photos")
    @Operation(summary = "Upload photo evidence", 
              description = "Upload photos of water contamination or health issues")
    public ResponseEntity<Map<String, Object>> uploadPhotos(
            @RequestParam("userId") String userId,
            @RequestParam("userPhone") String userPhone,
            @RequestParam("description") String description,
            @RequestParam("latitude") double latitude,
            @RequestParam("longitude") double longitude,
            @RequestParam("photos") List<MultipartFile> photos) {
        
        log.info("Photo upload from user: {} ({} photos)", userId, photos.size());
        
        try {
            Map<String, Object> result = emergencyService.uploadPhotos(
                    userId, userPhone, description, latitude, longitude, photos);
            
            log.info("Photos uploaded successfully: {}", result.get("reportId"));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error uploading photos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Get nearest PHC with occupancy status
     * GET /api/emergency/nearest-phc
     */
    @GetMapping("/nearest-phc")
    @Operation(summary = "Get nearest PHC", 
              description = "Find nearest Primary Health Center with current occupancy data")
    public ResponseEntity<Map<String, Object>> getNearestPHC(
            @RequestParam(value = "lat", required = false) Double latitude,
            @RequestParam(value = "lon", required = false) Double longitude) {
        
        log.info("Finding nearest PHC for location: {}, {}", latitude, longitude);
        
        try {
            // Validate parameters
            if (latitude == null || longitude == null || Double.isNaN(latitude) || Double.isNaN(longitude)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing or invalid lat/lon query parameters"));
            }
            
            Map<String, Object> phc = emergencyService.findNearestPHC(latitude, longitude);
            
            if (phc == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No PHC found nearby"));
            }
            
            return ResponseEntity.ok(phc);
            
        } catch (Exception e) {
            log.error("Error finding nearest PHC", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get district health advisories
     * GET /api/emergency/advisories
     */
    @GetMapping("/advisories")
    @Operation(summary = "Get health advisories", 
              description = "Retrieve active health advisories for district")
    public ResponseEntity<List<Map<String, Object>>> getAdvisories(
            @RequestParam("district") String district) {
        
        log.info("Fetching advisories for district: {}", district);
        
        try {
            List<Map<String, Object>> advisories = emergencyService.getDistrictAdvisories(district);
            
            return ResponseEntity.ok(advisories);
            
        } catch (Exception e) {
            log.error("Error fetching advisories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
    
    /**
     * Get water distribution updates
     * GET /api/emergency/water-updates
     */
    @GetMapping("/water-updates")
    @Operation(summary = "Get water updates", 
              description = "Retrieve water distribution and maintenance updates for area")
    public ResponseEntity<List<Map<String, Object>>> getWaterUpdates(
            @RequestParam("lat") double latitude,
            @RequestParam("lon") double longitude) {
        
        log.info("Fetching water updates for location: {}, {}", latitude, longitude);
        
        try {
            List<Map<String, Object>> updates = emergencyService.getWaterUpdates(latitude, longitude);
            
            return ResponseEntity.ok(updates);
            
        } catch (Exception e) {
            log.error("Error fetching water updates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }
    
    /**
     * Get emergency contacts for user
     * GET /api/emergency/contacts
     */
    @GetMapping("/contacts")
    @Operation(summary = "Get emergency contacts", 
              description = "Retrieve assigned ASHA worker, supervisor, and emergency contacts")
    public ResponseEntity<List<Map<String, Object>>> getEmergencyContacts(
            @RequestParam("userId") String userId) {
        
        log.info("Fetching emergency contacts for user: {}", userId);
        
        try {
            List<Map<String, Object>> contacts = emergencyService.getEmergencyContacts(userId);
            
            return ResponseEntity.ok(contacts);
            
        } catch (Exception e) {
            log.error("Error fetching emergency contacts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }


    
    /**
     * Get active emergency alerts
     * GET /api/emergency/alerts/active
     */
    @GetMapping("/alerts/active")
    @Operation(summary = "Get active alerts", 
              description = "Get all active emergency alerts")
    public ResponseEntity<Map<String, Object>> getActiveAlerts() {
        
        log.info("Getting active emergency alerts");
        
        try {
            List<Map<String, Object>> alerts = emergencyService.getActiveAlerts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("alerts", alerts);
            response.put("count", alerts.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting active alerts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("alerts", List.of(), "count", 0));
        }
    }
    }
    
