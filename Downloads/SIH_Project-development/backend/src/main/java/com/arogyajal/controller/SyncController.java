package com.arogyajal.controller;

import com.arogyajal.model.HouseholdSurvey;
import com.arogyajal.model.WaterTest;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.model.IssueReport;
import com.arogyajal.service.HouseholdSurveyService;
import com.arogyajal.service.WaterTestService;
import com.arogyajal.service.SymptomService;
import com.arogyajal.service.IssueReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/mobile/sync")
@CrossOrigin(origins = "*")
public class SyncController {
    
    private static final Logger log = LoggerFactory.getLogger(SyncController.class);
    private final WaterTestService waterTestService;
    private final HouseholdSurveyService householdSurveyService;
    private final SymptomService symptomService;
    private final IssueReportService issueReportService;
    
    public SyncController(WaterTestService waterTestService, HouseholdSurveyService householdSurveyService,
                         SymptomService symptomService, IssueReportService issueReportService) {
        this.waterTestService = waterTestService;
        this.householdSurveyService = householdSurveyService;
        this.symptomService = symptomService;
        this.issueReportService = issueReportService;
    }
    
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> batchSync(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) payload.get("userId");
            String deviceId = (String) payload.get("deviceId");
            String syncTimestamp = (String) payload.get("syncTimestamp");
            
            log.info("Batch sync started - userId: {}, deviceId: {}, timestamp: {}", userId, deviceId, syncTimestamp);
            
            // Process water tests
            Map<String, Object> waterTestsResult = processWaterTests(payload.get("waterTests"));
            
            // Process household surveys
            Map<String, Object> surveysResult = processHouseholdSurveys(payload.get("householdSurveys"));
            
            // Process health reports (symptom reports)
            Map<String, Object> healthReportsResult = processHealthReports(payload.get("healthReports"));
            
            // Process issue reports
            Map<String, Object> issueReportsResult = processIssueReports(payload.get("issueReports"));
            
            // Build results
            Map<String, Object> results = new HashMap<>();
            results.put("waterTests", waterTestsResult);
            results.put("householdSurveys", surveysResult);
            results.put("healthReports", healthReportsResult);
            results.put("issueReports", issueReportsResult);
            
            response.put("success", true);
            response.put("message", "Batch sync completed");
            response.put("results", results);
            response.put("syncedAt", java.time.Instant.now().toString());
            
            log.info("Batch sync completed successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in batch sync", e);
            response.put("success", false);
            response.put("error", createError("SERVER_ERROR", "Batch sync failed: " + e.getMessage(), null));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    private Map<String, Object> processWaterTests(Object waterTestsObj) {
        Map<String, Object> result = new HashMap<>();
        List<String> uploadedIds = new ArrayList<>();
        int uploaded = 0;
        int failed = 0;
        
        if (waterTestsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> waterTestsList = (List<Map<String, Object>>) waterTestsObj;
            
            for (Map<String, Object> testData : waterTestsList) {
                try {
                    WaterTest waterTest = mapToWaterTest(testData);
                    
                    // Check for duplicate
                    WaterTest existing = waterTestService.getWaterTestById(waterTest.getId());
                    if (existing == null) {
                        waterTestService.saveWaterTest(waterTest);
                        uploadedIds.add(waterTest.getId());
                        uploaded++;
                    } else {
                        log.info("Skipping duplicate water test: {}", waterTest.getId());
                        uploadedIds.add(waterTest.getId());
                        uploaded++;
                    }
                } catch (Exception e) {
                    log.error("Error processing water test", e);
                    failed++;
                }
            }
        }
        
        result.put("uploaded", uploaded);
        result.put("failed", failed);
        result.put("ids", uploadedIds);
        
        return result;
    }
    
    private Map<String, Object> processHouseholdSurveys(Object surveysObj) {
        Map<String, Object> result = new HashMap<>();
        List<String> uploadedIds = new ArrayList<>();
        int uploaded = 0;
        int failed = 0;
        
        if (surveysObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> surveysList = (List<Map<String, Object>>) surveysObj;
            
            for (Map<String, Object> surveyData : surveysList) {
                try {
                    HouseholdSurvey survey = mapToHouseholdSurvey(surveyData);
                    
                    // Check for duplicate
                    HouseholdSurvey existing = householdSurveyService.getHouseholdSurveyById(survey.getId());
                    if (existing == null) {
                        householdSurveyService.saveHouseholdSurvey(survey);
                        uploadedIds.add(survey.getId());
                        uploaded++;
                    } else {
                        log.info("Skipping duplicate household survey: {}", survey.getId());
                        uploadedIds.add(survey.getId());
                        uploaded++;
                    }
                } catch (Exception e) {
                    log.error("Error processing household survey", e);
                    failed++;
                }
            }
        }
        
        result.put("uploaded", uploaded);
        result.put("failed", failed);
        result.put("ids", uploadedIds);
        
        return result;
    }
    
    private WaterTest mapToWaterTest(Map<String, Object> data) {
        WaterTest waterTest = new WaterTest();
        waterTest.setId((String) data.get("id"));
        waterTest.setSourceType((String) data.get("sourceType"));
        waterTest.setSourceName((String) data.get("sourceName"));
        waterTest.setAppearance((String) data.get("appearance"));
        waterTest.setOdour((String) data.get("odour"));
        waterTest.setSuspendedMatter((String) data.get("suspendedMatter"));
        waterTest.setPH((String) data.get("pH"));
        waterTest.setFrc((String) data.get("frc"));
        waterTest.setTurbidity((String) data.get("turbidity"));
        waterTest.setTds(data.get("tds") != null ? ((Number) data.get("tds")).intValue() : null);
        waterTest.setHardness((String) data.get("hardness"));
        waterTest.setGeogenicParameter((String) data.get("geogenicParameter"));
        waterTest.setRainfall24h((String) data.get("rainfall24h"));
        
        @SuppressWarnings("unchecked")
        List<String> riskActivities = (List<String>) data.get("nearbyRiskActivity");
        waterTest.setNearbyRiskActivity(riskActivities);
        
        waterTest.setChlorination((String) data.get("chlorination"));
        waterTest.setStorageMethod((String) data.get("storageMethod"));
        waterTest.setPhotoPath((String) data.get("photoPath"));
        waterTest.setRiskLevel((String) data.get("riskLevel"));
        waterTest.setLatitude(data.get("latitude") != null ? ((Number) data.get("latitude")).doubleValue() : null);
        waterTest.setLongitude(data.get("longitude") != null ? ((Number) data.get("longitude")).doubleValue() : null);
        waterTest.setReporterId((String) data.get("reporterId"));
        waterTest.setReporterType((String) data.get("reporterType"));
        waterTest.setStatus((String) data.get("status"));
        waterTest.setSynced(data.get("synced") != null ? ((Number) data.get("synced")).intValue() : 0);
        
        return waterTest;
    }
    
    private HouseholdSurvey mapToHouseholdSurvey(Map<String, Object> data) {
        HouseholdSurvey survey = new HouseholdSurvey();
        survey.setId((String) data.get("id"));
        survey.setState((String) data.get("state"));
        survey.setDistrict((String) data.get("district"));
        survey.setBlock((String) data.get("block"));
        survey.setVillage((String) data.get("village"));
        survey.setHouseholdId((String) data.get("householdId"));
        survey.setDateOfVisit((String) data.get("dateOfVisit"));
        survey.setFiledBy((String) data.get("filedBy"));
        survey.setContactNumber((String) data.get("contactNumber"));
        
        @SuppressWarnings("unchecked")
        Map<String, Double> gpsLocation = (Map<String, Double>) data.get("gpsLocation");
        survey.setGpsLocation(gpsLocation);
        
        survey.setHeadOfHousehold((String) data.get("headOfHousehold"));
        survey.setTotalMembers((String) data.get("totalMembers"));
        survey.setAge0to5((String) data.get("age0to5"));
        survey.setAge6to18((String) data.get("age6to18"));
        survey.setAge19to50((String) data.get("age19to50"));
        survey.setAge50plus((String) data.get("age50plus"));
        survey.setSocialCategory((String) data.get("socialCategory"));
        survey.setEducationLevel((String) data.get("educationLevel"));
        survey.setWaterSource((String) data.get("waterSource"));
        
        @SuppressWarnings("unchecked")
        List<String> waterTreatment = (List<String>) data.get("waterTreatment");
        survey.setWaterTreatment(waterTreatment);
        
        survey.setStorageType((String) data.get("storageType"));
        survey.setDistanceFromSource((String) data.get("distanceFromSource"));
        survey.setSharedSource((String) data.get("sharedSource"));
        survey.setToiletFacility((String) data.get("toiletFacility"));
        survey.setHandwashing((String) data.get("handwashing"));
        survey.setWastewaterDisposal((String) data.get("wastewaterDisposal"));
        survey.setSolidWasteDisposal((String) data.get("solidWasteDisposal"));
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> members = (List<Map<String, Object>>) data.get("members");
        survey.setMembers(members);
        
        survey.setRiskLevel((String) data.get("riskLevel"));
        survey.setWaterContaminationLikelihood((String) data.get("waterContaminationLikelihood"));
        survey.setRecommendedAction((String) data.get("recommendedAction"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> consentData = (Map<String, Object>) data.get("consentData");
        survey.setConsentData(consentData);
        
        survey.setSynced(data.get("synced") != null ? ((Number) data.get("synced")).intValue() : 0);
        survey.setStatus((String) data.get("status"));
        
        return survey;
    }
    
    private Map<String, Object> processHealthReports(Object healthReportsObj) {
        Map<String, Object> result = new HashMap<>();
        List<String> uploadedIds = new ArrayList<>();
        int uploaded = 0;
        int failed = 0;
        
        if (healthReportsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> healthReportsList = (List<Map<String, Object>>) healthReportsObj;
            
            for (Map<String, Object> reportData : healthReportsList) {
                try {
                    SymptomReport report = mapToSymptomReport(reportData);
                    
                    // Check for duplicate
                    java.util.Optional<SymptomReport> existing = symptomService.getSymptomReportById(report.getId());
                    if (!existing.isPresent()) {
                        symptomService.saveSymptomReportDirect(report);
                        uploadedIds.add(report.getId());
                        uploaded++;
                    } else {
                        log.info("Skipping duplicate health report: {}", report.getId());
                        uploadedIds.add(report.getId());
                        uploaded++;
                    }
                } catch (Exception e) {
                    log.error("Error processing health report", e);
                    failed++;
                }
            }
        }
        
        result.put("uploaded", uploaded);
        result.put("failed", failed);
        result.put("ids", uploadedIds);
        
        return result;
    }
    
    private Map<String, Object> processIssueReports(Object issueReportsObj) {
        Map<String, Object> result = new HashMap<>();
        List<String> uploadedIds = new ArrayList<>();
        int uploaded = 0;
        int failed = 0;
        
        if (issueReportsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> issueReportsList = (List<Map<String, Object>>) issueReportsObj;
            
            for (Map<String, Object> reportData : issueReportsList) {
                try {
                    IssueReport report = mapToIssueReport(reportData);
                    
                    // Check for duplicate
                    IssueReport existing = issueReportService.getIssueReportById(report.getId());
                    if (existing == null) {
                        issueReportService.saveIssueReport(report);
                        uploadedIds.add(report.getId());
                        uploaded++;
                    } else {
                        log.info("Skipping duplicate issue report: {}", report.getId());
                        uploadedIds.add(report.getId());
                        uploaded++;
                    }
                } catch (Exception e) {
                    log.error("Error processing issue report", e);
                    failed++;
                }
            }
        }
        
        result.put("uploaded", uploaded);
        result.put("failed", failed);
        result.put("ids", uploadedIds);
        
        return result;
    }
    
    private SymptomReport mapToSymptomReport(Map<String, Object> data) {
        SymptomReport report = new SymptomReport();
        report.setId((String) data.get("id"));
        report.setUserId((String) data.get("userId"));
        report.setLocation((String) data.get("location"));
        report.setWaterSource((String) data.get("waterSource"));
        report.setReporterType((String) data.get("reporterType"));
        report.setReporterId((String) data.get("reporterId"));
        report.setPatientName((String) data.get("patientName"));
        report.setPatientAge(data.get("patientAge") != null ? ((Number) data.get("patientAge")).intValue() : null);
        report.setPatientGender((String) data.get("patientGender"));
        report.setPatientPhone((String) data.get("patientPhone"));
        
        @SuppressWarnings("unchecked")
        List<String> symptoms = (List<String>) data.get("symptoms");
        report.setSymptoms(symptoms);
        
        report.setSeverity((String) data.get("severity"));
        report.setDuration((String) data.get("duration"));
        report.setWaterConsumption(data.get("waterConsumption") != null ? ((Number) data.get("waterConsumption")).intValue() : null);
        report.setAdditionalNotes((String) data.get("additionalNotes"));
        report.setContactInfo((String) data.get("contactInfo"));
        report.setStatus((String) data.get("status"));
        report.setSyncStatus((String) data.get("syncStatus"));
        
        return report;
    }
    
    private IssueReport mapToIssueReport(Map<String, Object> data) {
        IssueReport report = new IssueReport();
        report.setId((String) data.get("id"));
        report.setIssueType((String) data.get("issueType"));
        report.setDescription((String) data.get("description"));
        report.setLocation((String) data.get("location"));
        report.setVillage((String) data.get("village"));
        report.setDistrict((String) data.get("district"));
        report.setState((String) data.get("state"));
        
        @SuppressWarnings("unchecked")
        Map<String, Double> gpsLocation = (Map<String, Double>) data.get("gpsLocation");
        report.setGpsLocation(gpsLocation);
        
        report.setSeverity((String) data.get("severity"));
        report.setStatus((String) data.get("status"));
        report.setPhotoPath((String) data.get("photoPath"));
        report.setReporterId((String) data.get("reporterId"));
        report.setReporterType((String) data.get("reporterType"));
        report.setReporterName((String) data.get("reporterName"));
        report.setContactNumber((String) data.get("contactNumber"));
        report.setSynced(data.get("synced") != null ? ((Number) data.get("synced")).intValue() : 0);
        report.setResolution((String) data.get("resolution"));
        
        return report;
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
