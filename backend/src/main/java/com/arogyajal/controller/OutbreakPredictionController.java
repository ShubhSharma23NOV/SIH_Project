package com.arogyajal.controller;

import com.arogyajal.model.OutbreakPrediction;
import com.arogyajal.service.OutbreakPredictionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
//import java.util.concurrent.ExecutionException;

/**
 * REST API Controller for Outbreak Predictions.
 * Provides endpoints for ML-based outbreak prediction management.
 */
@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
public class OutbreakPredictionController {

    private final OutbreakPredictionService predictionService;

    public OutbreakPredictionController(OutbreakPredictionService predictionService) {
        this.predictionService = predictionService;
    }

    /**
     * Create a new outbreak prediction
     * POST /api/predictions
     */
    @PostMapping
    public ResponseEntity<?> createPrediction(@RequestBody OutbreakPrediction prediction) {
        try {
            OutbreakPrediction created = predictionService.createPrediction(prediction);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create prediction: " + e.getMessage()));
        }
    }

    /**
     * Get prediction by ID
     * GET /api/predictions/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPredictionById(@PathVariable String id) {
        try {
            OutbreakPrediction prediction = predictionService.getPredictionById(id);
            return ResponseEntity.ok(prediction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve prediction: " + e.getMessage()));
        }
    }

    /**
     * Get all predictions
     * GET /api/predictions
     */
    @GetMapping
    public ResponseEntity<?> getAllPredictions() {
        try {
            List<OutbreakPrediction> predictions = predictionService.getAllPredictions();
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve predictions: " + e.getMessage()));
        }
    }

    /**
     * Get predictions by location
     * GET /api/predictions/location/{location}
     */
    @GetMapping("/location/{location}")
    public ResponseEntity<?> getPredictionsByLocation(@PathVariable String location) {
        try {
            List<OutbreakPrediction> predictions = predictionService.getPredictionsByLocation(location);
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve predictions: " + e.getMessage()));
        }
    }

    /**
     * Get active predictions by location
     * GET /api/predictions/location/{location}/active
     */
    @GetMapping("/location/{location}/active")
    public ResponseEntity<?> getActivePredictionsByLocation(@PathVariable String location) {
        try {
            List<OutbreakPrediction> predictions = predictionService.getActivePredictionsByLocation(location);
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve active predictions: " + e.getMessage()));
        }
    }

    /**
     * Get high-risk predictions
     * GET /api/predictions/high-risk
     */
    @GetMapping("/high-risk")
    public ResponseEntity<?> getHighRiskPredictions() {
        try {
            List<OutbreakPrediction> predictions = predictionService.getHighRiskPredictions();
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve high-risk predictions: " + e.getMessage()));
        }
    }

    /**
     * Get predictions by risk level
     * GET /api/predictions/risk-level/{riskLevel}
     */
    @GetMapping("/risk-level/{riskLevel}")
    public ResponseEntity<?> getPredictionsByRiskLevel(@PathVariable String riskLevel) {
        try {
            List<OutbreakPrediction> predictions = predictionService.getPredictionsByRiskLevel(riskLevel);
            return ResponseEntity.ok(predictions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve predictions: " + e.getMessage()));
        }
    }

    /**
     * Update prediction
     * PUT /api/predictions/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePrediction(@PathVariable String id, 
                                             @RequestBody OutbreakPrediction prediction) {
        try {
            prediction = OutbreakPrediction.builder()
                    .id(id)
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
                    .build();
            
            OutbreakPrediction updated = predictionService.updatePrediction(prediction);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update prediction: " + e.getMessage()));
        }
    }

    /**
     * Update prediction status
     * PATCH /api/predictions/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updatePredictionStatus(@PathVariable String id, 
                                                    @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            predictionService.updatePredictionStatus(id, status);
            return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update status: " + e.getMessage()));
        }
    }

    /**
     * Delete prediction
     * DELETE /api/predictions/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePrediction(@PathVariable String id) {
        try {
            predictionService.deletePrediction(id);
            return ResponseEntity.ok(Map.of("message", "Prediction deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete prediction: " + e.getMessage()));
        }
    }

    /**
     * Get prediction statistics by location
     * GET /api/predictions/stats/location/{location}
     */
    @GetMapping("/stats/location/{location}")
    public ResponseEntity<?> getPredictionStatsByLocation(@PathVariable String location) {
        try {
            Map<String, Object> stats = predictionService.getPredictionStatsByLocation(location);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Get overall prediction statistics
     * GET /api/predictions/stats/overall
     */
    @GetMapping("/stats/overall")
    public ResponseEntity<?> getOverallStats() {
        try {
            Map<String, Object> stats = predictionService.getOverallStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Archive old predictions
     * POST /api/predictions/archive
     */
    @PostMapping("/archive")
    public ResponseEntity<?> archiveOldPredictions(@RequestParam(defaultValue = "30") int daysOld) {
        try {
            int archivedCount = predictionService.archiveOldPredictions(daysOld);
            return ResponseEntity.ok(Map.of(
                    "message", "Predictions archived successfully",
                    "archivedCount", archivedCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to archive predictions: " + e.getMessage()));
        }
    }
    
    /**
     * Manually trigger outbreak alert check (for testing)
     * POST /api/predictions/check-outbreak-alerts
     */
    @PostMapping("/check-outbreak-alerts")
    public ResponseEntity<?> triggerOutbreakAlertCheck() {
        try {
            predictionService.checkForOutbreakAlerts();
            return ResponseEntity.ok(Map.of(
                    "message", "Outbreak alert check triggered successfully",
                    "status", "completed"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check outbreak alerts: " + e.getMessage()));
        }
    }
}
