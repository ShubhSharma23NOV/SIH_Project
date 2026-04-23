package com.arogyajal.controller;

import com.arogyajal.model.WaterTest;
import com.arogyajal.service.WaterTestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mobile/water-tests")
@CrossOrigin(origins = "*")
public class WaterTestController {
    
    private static final Logger log = LoggerFactory.getLogger(WaterTestController.class);
    private final WaterTestService waterTestService;
    
    public WaterTestController(WaterTestService waterTestService) {
        this.waterTestService = waterTestService;
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadWaterTest(@RequestBody WaterTest waterTest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate required fields
            if (waterTest.getId() == null || waterTest.getId().isEmpty()) {
                response.put("success", false);
                response.put("error", createError("VALIDATION_ERROR", "ID is required", null));
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check for duplicate
            WaterTest existing = waterTestService.getWaterTestById(waterTest.getId());
            if (existing != null) {
                response.put("success", false);
                response.put("error", createError("DUPLICATE_ERROR", "Water test with this ID already exists", null));
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Save water test
            String id = waterTestService.saveWaterTest(waterTest);
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("uploadedAt", java.time.Instant.now().toString());
            
            response.put("success", true);
            response.put("message", "Water test uploaded successfully");
            response.put("data", data);
            
            log.info("Water test uploaded successfully: {}", id);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error uploading water test", e);
            response.put("success", false);
            response.put("error", createError("SERVER_ERROR", "Internal server error: " + e.getMessage(), null));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping
    public ResponseEntity<List<WaterTest>> getAllWaterTests() {
        try {
            List<WaterTest> waterTests = waterTestService.getAllWaterTests();
            return ResponseEntity.ok(waterTests);
        } catch (Exception e) {
            log.error("Error fetching water tests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<WaterTest> getWaterTestById(@PathVariable String id) {
        try {
            WaterTest waterTest = waterTestService.getWaterTestById(id);
            if (waterTest == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(waterTest);
        } catch (Exception e) {
            log.error("Error fetching water test", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<WaterTest>> getWaterTestsByReporter(@PathVariable String reporterId) {
        try {
            List<WaterTest> waterTests = waterTestService.getWaterTestsByReporter(reporterId);
            return ResponseEntity.ok(waterTests);
        } catch (Exception e) {
            log.error("Error fetching water tests by reporter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/risk/{riskLevel}")
    public ResponseEntity<List<WaterTest>> getWaterTestsByRiskLevel(@PathVariable String riskLevel) {
        try {
            List<WaterTest> waterTests = waterTestService.getWaterTestsByRiskLevel(riskLevel);
            return ResponseEntity.ok(waterTests);
        } catch (Exception e) {
            log.error("Error fetching water tests by risk level", e);
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
