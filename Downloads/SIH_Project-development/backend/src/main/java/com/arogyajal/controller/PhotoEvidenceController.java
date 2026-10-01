package com.arogyajal.controller;

import com.arogyajal.service.PhotoEvidenceService;
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

@RestController
@RequestMapping("/api/evidence")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Tag(name = "Photo Evidence API", description = "Photo evidence upload and routing workflow")
public class PhotoEvidenceController {
    
    private static final Logger log = LoggerFactory.getLogger(PhotoEvidenceController.class);
    private final PhotoEvidenceService evidenceService;
    
    public PhotoEvidenceController(PhotoEvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }
    
    /**
     * Upload photo evidence
     * POST /api/evidence/upload
     */
    @PostMapping("/upload")
    @Operation(summary = "Upload photo evidence", 
              description = "Upload photos with auto-routing to ASHA → Supervisor → City Officer")
    public ResponseEntity<Map<String, Object>> uploadEvidence(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam("description") String description,
            @RequestParam("lat") double latitude,
            @RequestParam("lng") double longitude,
            @RequestParam("userId") String userId,
            @RequestParam(value = "timestamp", required = false) Long timestamp) {
        
        log.info("Photo evidence upload from user: {} ({} images)", userId, images.size());
        
        try {
            Map<String, Object> result = evidenceService.uploadEvidence(
                    userId, description, latitude, longitude, images);
            
            log.info("Evidence uploaded successfully: {}", result.get("evidenceId"));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error uploading evidence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    
    /**
     * Get routing timeline
     * GET /api/evidence/routing/{evidenceId}
     */
    @GetMapping("/routing/{evidenceId}")
    @Operation(summary = "Get routing timeline", 
              description = "Get routing timeline showing ASHA → Supervisor → City Officer workflow")
    public ResponseEntity<Map<String, Object>> getRoutingTimeline(
            @PathVariable String evidenceId) {
        
        log.info("Getting routing timeline for evidence: {}", evidenceId);
        
        try {
            Map<String, Object> timeline = evidenceService.getRoutingTimeline(evidenceId);
            return ResponseEntity.ok(timeline);
            
        } catch (Exception e) {
            log.error("Error getting routing timeline", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Evidence not found"));
        }
    }
    
    /**
     * Get evidence history
     * GET /api/evidence/history?userId={userId}
     */
    @GetMapping("/history")
    @Operation(summary = "Get evidence history", 
              description = "Get all photo evidence submitted by user")
    public ResponseEntity<Map<String, Object>> getEvidenceHistory(
            @RequestParam String userId) {
        
        log.info("Getting evidence history for user: {}", userId);
        
        try {
            List<Map<String, Object>> history = evidenceService.getEvidenceHistory(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("evidence", history);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting evidence history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Acknowledge evidence
     * POST /api/evidence/{evidenceId}/acknowledge
     */
    @PostMapping("/{evidenceId}/acknowledge")
    @Operation(summary = "Acknowledge evidence", 
              description = "Mark evidence as acknowledged by ASHA/Supervisor/City Officer")
    public ResponseEntity<Map<String, Object>> acknowledgeEvidence(
            @PathVariable String evidenceId,
            @RequestBody Map<String, String> request) {
        
        String userId = request.get("userId");
        String level = request.get("level"); // ASHA, Supervisor, City Officer
        
        log.info("Evidence {} acknowledged by {} ({})", evidenceId, userId, level);
        
        try {
            evidenceService.acknowledgeEvidence(evidenceId, userId, level);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Evidence acknowledged"
            ));
            
        } catch (Exception e) {
            log.error("Error acknowledging evidence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    
    /**
     * Get all photo evidence for map display
     * GET /api/evidence/map
     */
    @GetMapping("/map")
    @Operation(summary = "Get evidence for map", 
              description = "Get all photo evidence grouped by location for map display")
    public ResponseEntity<List<Map<String, Object>>> getEvidenceForMap() {
        
        log.info("Getting photo evidence for map display");
        
        try {
            List<Map<String, Object>> evidenceMarkers = evidenceService.getEvidenceForMap();
            
            return ResponseEntity.ok(evidenceMarkers);
            
        } catch (Exception e) {
            log.error("Error getting evidence for map", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }

    /**
     * Fix placeholder URLs in existing data
     * POST /api/evidence/fix-placeholders
     */
    @PostMapping("/fix-placeholders")
    @Operation(summary = "Fix placeholder URLs", 
              description = "Replace via.placeholder.com URLs with data URIs (admin utility)")
    public ResponseEntity<Map<String, Object>> fixPlaceholderUrls() {
        
        log.info("🔧 Admin request: Fixing placeholder URLs in existing data");
        
        try {
            Map<String, Object> result = evidenceService.fixPlaceholderUrls();
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error fixing placeholder URLs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}