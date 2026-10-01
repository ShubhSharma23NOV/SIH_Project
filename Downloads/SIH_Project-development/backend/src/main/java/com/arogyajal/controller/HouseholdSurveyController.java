package com.arogyajal.controller;

import com.arogyajal.model.HouseholdSurvey;
import com.arogyajal.service.HouseholdSurveyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mobile/household-surveys")
@CrossOrigin(origins = "*")
public class HouseholdSurveyController {
    
    private static final Logger log = LoggerFactory.getLogger(HouseholdSurveyController.class);
    private final HouseholdSurveyService householdSurveyService;
    
    public HouseholdSurveyController(HouseholdSurveyService householdSurveyService) {
        this.householdSurveyService = householdSurveyService;
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadHouseholdSurvey(@RequestBody HouseholdSurvey survey) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate required fields
            if (survey.getId() == null || survey.getId().isEmpty()) {
                response.put("success", false);
                response.put("error", createError("VALIDATION_ERROR", "ID is required", null));
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check for duplicate
            HouseholdSurvey existing = householdSurveyService.getHouseholdSurveyById(survey.getId());
            if (existing != null) {
                response.put("success", false);
                response.put("error", createError("DUPLICATE_ERROR", "Household survey with this ID already exists", null));
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Save household survey
            String id = householdSurveyService.saveHouseholdSurvey(survey);
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("uploadedAt", java.time.Instant.now().toString());
            
            response.put("success", true);
            response.put("message", "Household survey uploaded successfully");
            response.put("data", data);
            
            log.info("Household survey uploaded successfully: {}", id);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error uploading household survey", e);
            response.put("success", false);
            response.put("error", createError("SERVER_ERROR", "Internal server error: " + e.getMessage(), null));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping
    public ResponseEntity<List<HouseholdSurvey>> getAllHouseholdSurveys() {
        try {
            List<HouseholdSurvey> surveys = householdSurveyService.getAllHouseholdSurveys();
            return ResponseEntity.ok(surveys);
        } catch (Exception e) {
            log.error("Error fetching household surveys", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<HouseholdSurvey> getHouseholdSurveyById(@PathVariable String id) {
        try {
            HouseholdSurvey survey = householdSurveyService.getHouseholdSurveyById(id);
            if (survey == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(survey);
        } catch (Exception e) {
            log.error("Error fetching household survey", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/village/{village}")
    public ResponseEntity<List<HouseholdSurvey>> getHouseholdSurveysByVillage(@PathVariable String village) {
        try {
            List<HouseholdSurvey> surveys = householdSurveyService.getHouseholdSurveysByVillage(village);
            return ResponseEntity.ok(surveys);
        } catch (Exception e) {
            log.error("Error fetching household surveys by village", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/risk/{riskLevel}")
    public ResponseEntity<List<HouseholdSurvey>> getHouseholdSurveysByRiskLevel(@PathVariable String riskLevel) {
        try {
            List<HouseholdSurvey> surveys = householdSurveyService.getHouseholdSurveysByRiskLevel(riskLevel);
            return ResponseEntity.ok(surveys);
        } catch (Exception e) {
            log.error("Error fetching household surveys by risk level", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private Map<String, Object> createError(String code, String message, Map<String, String> details) {
        Map<String, Object> error = new HashMap<>();
        error.put("code", code);
        error.put("message", message);
        if (details != null) {
            error.put("details", details);
        }
        return error;
    }
}
