package com.arogyajal.controller;

import com.arogyajal.model.ManualWaterTest;
import com.arogyajal.service.ManualWaterTestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Manual Water Tests.
 * Provides endpoints for field worker water quality testing.
 */
@RestController
@RequestMapping("/api/water-tests")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
public class ManualWaterTestController {

    private final ManualWaterTestService testService;

    public ManualWaterTestController(ManualWaterTestService testService) {
        this.testService = testService;
    }

    /**
     * Create a new water test
     * POST /api/water-tests
     */
    @PostMapping
    public ResponseEntity<?> createTest(@RequestBody Map<String, Object> testData) {
        try {
            // Convert Map to ManualWaterTest
            ManualWaterTest test = new ManualWaterTest();
            test.setTesterId((String) testData.get("testerId"));
            test.setTesterName((String) testData.get("testerName"));
            test.setLocation((String) testData.get("location"));
            
            // Handle GeoPoint conversion
            if (testData.containsKey("geoLocation")) {
                @SuppressWarnings("unchecked")
                Map<String, Double> geoData = (Map<String, Double>) testData.get("geoLocation");
                if (geoData != null && geoData.containsKey("latitude") && geoData.containsKey("longitude")) {
                    test.setGeoLocation(new com.google.cloud.firestore.GeoPoint(
                        geoData.get("latitude"), 
                        geoData.get("longitude")
                    ));
                }
            }
            
            // Set water quality parameters
            if (testData.containsKey("ph")) {
                test.setPh(((Number) testData.get("ph")).doubleValue());
            }
            if (testData.containsKey("turbidity")) {
                test.setTurbidity(((Number) testData.get("turbidity")).doubleValue());
            }
            if (testData.containsKey("tds")) {
                test.setTds(((Number) testData.get("tds")).intValue());
            }
            if (testData.containsKey("dissolvedOxygen")) {
                test.setDissolvedOxygen(((Number) testData.get("dissolvedOxygen")).doubleValue());
            }
            if (testData.containsKey("temperature")) {
                test.setTemperature(((Number) testData.get("temperature")).doubleValue());
            }
            
            // Set metadata
            test.setTestKitType((String) testData.get("testKitType"));
            test.setPhotoUrl((String) testData.get("photoUrl"));
            test.setNotes((String) testData.get("notes"));
            test.setWaterSourceType((String) testData.get("waterSourceType"));
            test.setWaterSourceId((String) testData.get("waterSourceId"));
            
            ManualWaterTest created = testService.createTest(test);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create test: " + e.getMessage()));
        }
    }

    /**
     * Get test by ID
     * GET /api/water-tests/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTestById(@PathVariable String id) {
        try {
            ManualWaterTest test = testService.getTestById(id);
            return ResponseEntity.ok(test);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve test: " + e.getMessage()));
        }
    }

    /**
     * Get all tests
     * GET /api/water-tests
     */
    @GetMapping
    public ResponseEntity<?> getAllTests() {
        try {
            List<ManualWaterTest> tests = testService.getAllTests();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve tests: " + e.getMessage()));
        }
    }

    /**
     * Get tests by tester
     * GET /api/water-tests/tester/{testerId}
     */
    @GetMapping("/tester/{testerId}")
    public ResponseEntity<?> getTestsByTester(@PathVariable String testerId) {
        try {
            List<ManualWaterTest> tests = testService.getTestsByTester(testerId);
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve tests: " + e.getMessage()));
        }
    }

    /**
     * Get tests by location
     * GET /api/water-tests/location/{location}
     */
    @GetMapping("/location/{location}")
    public ResponseEntity<?> getTestsByLocation(@PathVariable String location) {
        try {
            List<ManualWaterTest> tests = testService.getTestsByLocation(location);
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve tests: " + e.getMessage()));
        }
    }

    /**
     * Get tests by water source
     * GET /api/water-tests/water-source/{waterSourceId}
     */
    @GetMapping("/water-source/{waterSourceId}")
    public ResponseEntity<?> getTestsByWaterSource(@PathVariable String waterSourceId) {
        try {
            List<ManualWaterTest> tests = testService.getTestsByWaterSource(waterSourceId);
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve tests: " + e.getMessage()));
        }
    }

    /**
     * Get unsafe tests
     * GET /api/water-tests/unsafe
     */
    @GetMapping("/unsafe")
    public ResponseEntity<?> getUnsafeTests() {
        try {
            List<ManualWaterTest> tests = testService.getUnsafeTests();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve unsafe tests: " + e.getMessage()));
        }
    }

    /**
     * Get tests pending sync
     * GET /api/water-tests/pending-sync
     */
    @GetMapping("/pending-sync")
    public ResponseEntity<?> getPendingSyncTests() {
        try {
            List<ManualWaterTest> tests = testService.getPendingSyncTests();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve pending tests: " + e.getMessage()));
        }
    }

    /**
     * Get tests with alerts
     * GET /api/water-tests/alerts
     */
    @GetMapping("/alerts")
    public ResponseEntity<?> getTestsWithAlerts() {
        try {
            List<ManualWaterTest> tests = testService.getTestsWithAlerts();
            return ResponseEntity.ok(tests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve tests with alerts: " + e.getMessage()));
        }
    }

    /**
     * Update test
     * PUT /api/water-tests/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTest(@PathVariable String id, @RequestBody ManualWaterTest test) {
        try {
            test = ManualWaterTest.builder()
                    .id(id)
                    .testerId(test.getTesterId())
                    .testerName(test.getTesterName())
                    .location(test.getLocation())
                    .geoLocation(test.getGeoLocation())
                    .ph(test.getPh())
                    .turbidity(test.getTurbidity())
                    .tds(test.getTds())
                    .dissolvedOxygen(test.getDissolvedOxygen())
                    .temperature(test.getTemperature())
                    .testKitType(test.getTestKitType())
                    .waterSourceType(test.getWaterSourceType())
                    .waterSourceId(test.getWaterSourceId())
                    .notes(test.getNotes())
                    .photoUrl(test.getPhotoUrl())
                    .testDate(test.getTestDate())
                    .syncStatus(test.getSyncStatus())
                    .build();
            
            ManualWaterTest updated = testService.updateTest(test);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update test: " + e.getMessage()));
        }
    }

    /**
     * Update sync status
     * PATCH /api/water-tests/{id}/sync-status
     */
    @PatchMapping("/{id}/sync-status")
    public ResponseEntity<?> updateSyncStatus(@PathVariable String id, 
                                              @RequestBody Map<String, String> body) {
        try {
            String syncStatus = body.get("syncStatus");
            if (syncStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Sync status is required"));
            }
            testService.updateSyncStatus(id, syncStatus);
            return ResponseEntity.ok(Map.of("message", "Sync status updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update sync status: " + e.getMessage()));
        }
    }

    /**
     * Sync offline tests
     * POST /api/water-tests/sync
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncOfflineTests() {
        try {
            Map<String, Object> result = testService.syncOfflineTests();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to sync tests: " + e.getMessage()));
        }
    }

    /**
     * Delete test
     * DELETE /api/water-tests/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTest(@PathVariable String id) {
        try {
            testService.deleteTest(id);
            return ResponseEntity.ok(Map.of("message", "Test deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete test: " + e.getMessage()));
        }
    }

    /**
     * Get test statistics by tester
     * GET /api/water-tests/stats/tester/{testerId}
     */
    @GetMapping("/stats/tester/{testerId}")
    public ResponseEntity<?> getTestStatsByTester(@PathVariable String testerId) {
        try {
            Map<String, Object> stats = testService.getTestStatsByTester(testerId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Get test statistics by location
     * GET /api/water-tests/stats/location/{location}
     */
    @GetMapping("/stats/location/{location}")
    public ResponseEntity<?> getTestStatsByLocation(@PathVariable String location) {
        try {
            Map<String, Object> stats = testService.getTestStatsByLocation(location);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }
}
