package com.arogyajal.service;

import com.arogyajal.model.ManualWaterTest;
import com.arogyajal.repository.ManualWaterTestRepository;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service for ManualWaterTest business logic.
 * Handles water test creation, quality assessment, and sync management.
 */
@Service
public class ManualWaterTestService {

    private final ManualWaterTestRepository testRepository;

    // WHO water quality standards
    private static final double PH_MIN = 6.5;
    private static final double PH_MAX = 8.5;
    private static final double TURBIDITY_MAX = 5.0; // NTU
    private static final int TDS_MAX = 500; // mg/L
    private static final double DO_MIN = 5.0; // mg/L

    public ManualWaterTestService(ManualWaterTestRepository testRepository) {
        this.testRepository = testRepository;
    }

    /**
     * Create a new water test
     */
    public ManualWaterTest createTest(ManualWaterTest test) throws ExecutionException, InterruptedException {
        // Set timestamps and defaults
        Timestamp now = Timestamp.now();
        if (test.getCreatedAt() == null) {
            test = ManualWaterTest.builder()
                    .id(test.getId() != null ? test.getId() : UUID.randomUUID().toString())
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
                    .testDate(test.getTestDate() != null ? test.getTestDate() : now)
                    .syncStatus(test.getSyncStatus() != null ? test.getSyncStatus() : "SYNCED")
                    .offlineCreatedAt(test.getOfflineCreatedAt())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        }

        // Validate test data
        validateTest(test);

        // Assess water quality
        String qualityStatus = assessWaterQuality(test);
        boolean alertGenerated = "UNSAFE".equals(qualityStatus) || "CONTAMINATED".equals(qualityStatus);

        // Update test with quality assessment
        test = ManualWaterTest.builder()
                .id(test.getId())
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
                .qualityStatus(qualityStatus)
                .alertGenerated(alertGenerated)
                .syncStatus(test.getSyncStatus())
                .syncAttempts(test.getSyncAttempts())
                .offlineCreatedAt(test.getOfflineCreatedAt())
                .createdAt(test.getCreatedAt())
                .updatedAt(test.getUpdatedAt())
                .build();

        // Save to repository
        String id = testRepository.save(test);
        return testRepository.findById(id);
    }

    /**
     * Get test by ID
     */
    public ManualWaterTest getTestById(String id) throws ExecutionException, InterruptedException {
        ManualWaterTest test = testRepository.findById(id);
        if (test == null) {
            throw new IllegalArgumentException("Water test not found with ID: " + id);
        }
        return test;
    }

    /**
     * Get all tests
     */
    public List<ManualWaterTest> getAllTests() throws ExecutionException, InterruptedException {
        return testRepository.findAll();
    }

    /**
     * Get tests by tester
     */
    public List<ManualWaterTest> getTestsByTester(String testerId) throws ExecutionException, InterruptedException {
        return testRepository.findByTesterId(testerId);
    }

    /**
     * Get tests by location
     */
    public List<ManualWaterTest> getTestsByLocation(String location) throws ExecutionException, InterruptedException {
        return testRepository.findByLocation(location);
    }

    /**
     * Get tests by water source
     */
    public List<ManualWaterTest> getTestsByWaterSource(String waterSourceId) throws ExecutionException, InterruptedException {
        return testRepository.findByWaterSource(waterSourceId);
    }

    /**
     * Get unsafe tests
     */
    public List<ManualWaterTest> getUnsafeTests() throws ExecutionException, InterruptedException {
        return testRepository.findUnsafeTests();
    }

    /**
     * Get tests pending sync
     */
    public List<ManualWaterTest> getPendingSyncTests() throws ExecutionException, InterruptedException {
        return testRepository.findPendingSync();
    }

    /**
     * Get tests with alerts
     */
    public List<ManualWaterTest> getTestsWithAlerts() throws ExecutionException, InterruptedException {
        return testRepository.findTestsWithAlerts();
    }

    /**
     * Update test
     */
    public ManualWaterTest updateTest(ManualWaterTest test) throws ExecutionException, InterruptedException {
        // Verify test exists
        ManualWaterTest existing = getTestById(test.getId());
        
        // Validate updated test
        validateTest(test);
        
        // Re-assess water quality
        String qualityStatus = assessWaterQuality(test);
        boolean alertGenerated = "UNSAFE".equals(qualityStatus) || "CONTAMINATED".equals(qualityStatus);
        
        // Update timestamp and quality
        test = ManualWaterTest.builder()
                .id(test.getId())
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
                .qualityStatus(qualityStatus)
                .alertGenerated(alertGenerated)
                .syncStatus(test.getSyncStatus())
                .syncAttempts(test.getSyncAttempts())
                .offlineCreatedAt(test.getOfflineCreatedAt())
                .createdAt(existing.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        testRepository.update(test);
        return testRepository.findById(test.getId());
    }

    /**
     * Update sync status
     */
    public void updateSyncStatus(String id, String syncStatus) throws ExecutionException, InterruptedException {
        validateSyncStatus(syncStatus);
        
        // Verify test exists
        getTestById(id);
        
        testRepository.updateSyncStatus(id, syncStatus);
    }

    /**
     * Sync offline tests
     */
    public Map<String, Object> syncOfflineTests() throws ExecutionException, InterruptedException {
        List<ManualWaterTest> pendingTests = testRepository.findPendingSync();
        
        int successCount = 0;
        int failCount = 0;
        
        for (ManualWaterTest test : pendingTests) {
            try {
                testRepository.updateSyncStatus(test.getId(), "SYNCED");
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalPending", pendingTests.size());
        result.put("synced", successCount);
        result.put("failed", failCount);
        
        return result;
    }

    /**
     * Delete test
     */
    public void deleteTest(String id) throws ExecutionException, InterruptedException {
        // Verify test exists
        getTestById(id);
        
        testRepository.delete(id);
    }

    /**
     * Get test statistics by tester
     */
    public Map<String, Object> getTestStatsByTester(String testerId) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = testRepository.findByTesterId(testerId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", tests.size());
        stats.put("safeTests", tests.stream().filter(t -> "SAFE".equals(t.getQualityStatus())).count());
        stats.put("unsafeTests", tests.stream().filter(t -> "UNSAFE".equals(t.getQualityStatus())).count());
        stats.put("contaminatedTests", tests.stream().filter(t -> "CONTAMINATED".equals(t.getQualityStatus())).count());
        
        // Average parameters
        stats.put("averagePh", tests.stream().filter(t -> t.getPh() != null)
                .mapToDouble(ManualWaterTest::getPh).average().orElse(0.0));
        stats.put("averageTurbidity", tests.stream().filter(t -> t.getTurbidity() != null)
                .mapToDouble(ManualWaterTest::getTurbidity).average().orElse(0.0));
        stats.put("averageTds", tests.stream().filter(t -> t.getTds() != null)
                .mapToInt(ManualWaterTest::getTds).average().orElse(0.0));
        
        return stats;
    }

    /**
     * Get test statistics by location
     */
    public Map<String, Object> getTestStatsByLocation(String location) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = testRepository.findByLocation(location);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", tests.size());
        stats.put("unsafeCount", testRepository.countUnsafeTestsByLocation(location));
        
        // Quality distribution
        Map<String, Long> qualityDistribution = tests.stream()
                .collect(Collectors.groupingBy(ManualWaterTest::getQualityStatus, Collectors.counting()));
        stats.put("qualityDistribution", qualityDistribution);
        
        // Water source distribution
        Map<String, Long> sourceDistribution = tests.stream()
                .filter(t -> t.getWaterSourceType() != null)
                .collect(Collectors.groupingBy(ManualWaterTest::getWaterSourceType, Collectors.counting()));
        stats.put("sourceDistribution", sourceDistribution);
        
        return stats;
    }

    /**
     * Assess water quality based on parameters
     */
    private String assessWaterQuality(ManualWaterTest test) {
        int violations = 0;
        
        // Check pH
        if (test.getPh() != null && (test.getPh() < PH_MIN || test.getPh() > PH_MAX)) {
            violations++;
        }
        
        // Check turbidity
        if (test.getTurbidity() != null && test.getTurbidity() > TURBIDITY_MAX) {
            violations++;
        }
        
        // Check TDS
        if (test.getTds() != null && test.getTds() > TDS_MAX) {
            violations++;
        }
        
        // Check dissolved oxygen
        if (test.getDissolvedOxygen() != null && test.getDissolvedOxygen() < DO_MIN) {
            violations++;
        }
        
        // Determine quality status
        if (violations == 0) {
            return "SAFE";
        } else if (violations <= 2) {
            return "UNSAFE";
        } else {
            return "CONTAMINATED";
        }
    }

    /**
     * Validate test data
     */
    private void validateTest(ManualWaterTest test) {
        if (test.getTesterId() == null || test.getTesterId().trim().isEmpty()) {
            throw new IllegalArgumentException("Tester ID is required");
        }
        
        if (test.getLocation() == null || test.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Location is required");
        }
        
        // Validate pH range
        if (test.getPh() != null && (test.getPh() < 0 || test.getPh() > 14)) {
            throw new IllegalArgumentException("pH must be between 0 and 14");
        }
        
        // Validate turbidity
        if (test.getTurbidity() != null && test.getTurbidity() < 0) {
            throw new IllegalArgumentException("Turbidity cannot be negative");
        }
        
        // Validate TDS
        if (test.getTds() != null && test.getTds() < 0) {
            throw new IllegalArgumentException("TDS cannot be negative");
        }
        
        // Validate dissolved oxygen
        if (test.getDissolvedOxygen() != null && test.getDissolvedOxygen() < 0) {
            throw new IllegalArgumentException("Dissolved oxygen cannot be negative");
        }
        
        // Validate temperature
        if (test.getTemperature() != null && (test.getTemperature() < -10 || test.getTemperature() > 50)) {
            throw new IllegalArgumentException("Temperature must be between -10 and 50 degrees Celsius");
        }
    }

    /**
     * Validate sync status
     */
    private void validateSyncStatus(String syncStatus) {
        List<String> validStatuses = Arrays.asList("PENDING", "SYNCED", "FAILED");
        if (!validStatuses.contains(syncStatus)) {
            throw new IllegalArgumentException("Invalid sync status. Must be one of: " + validStatuses);
        }
    }
}
