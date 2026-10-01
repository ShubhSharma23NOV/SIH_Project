package com.arogyajal.controller;

import com.arogyajal.dto.SymptomRequest;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.service.AlertService;
import com.arogyajal.service.SymptomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
//import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.cloud.Timestamp;
import java.util.List;
import java.util.Optional;

@RestController
@Tag(name = "Symptom Controller", description = "APIs for managing symptom reports")
public class SymptomController {
    
    private static final Logger log = LoggerFactory.getLogger(SymptomController.class);
    
    private final SymptomService symptomService;
    private final AlertService alertService;

    public SymptomController(SymptomService symptomService, AlertService alertService) {
        this.symptomService = symptomService;
        this.alertService = alertService;
    }
    
    @GetMapping("/api/symptoms")
    @Operation(summary = "Get symptom reporting API info", description = "Returns API information and usage instructions")
    public ResponseEntity<?> getSymptomApiInfo() {
        log.info("GET request received for /api/symptoms - returning API info");
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("service", "ArogyaJal Symptom Reporting API");
        response.put("version", "1.0");
        response.put("status", "operational");
        response.put("description", "Submit symptom reports for waterborne disease tracking");
        
        java.util.Map<String, String> endpoints = new java.util.HashMap<>();
        endpoints.put("POST /api/symptoms", "Submit new symptom report (mobile app)");
        endpoints.put("POST /api/symptoms/reports", "Submit new symptom report (web)");
        endpoints.put("GET /api/symptoms/reports", "Get all symptom reports");
        endpoints.put("GET /api/symptoms/statistics", "Get symptom statistics");
        response.put("endpoints", endpoints);
        
        java.util.Map<String, String> exampleRequest = new java.util.HashMap<>();
        exampleRequest.put("userId", "user_001");
        exampleRequest.put("location", "Guwahati - Kamakhya");
        exampleRequest.put("waterSource", "RIVER");
        exampleRequest.put("symptoms", "[\"DIARRHEA\", \"FEVER\"]");
        exampleRequest.put("severity", "MODERATE");
        exampleRequest.put("duration", "DAYS");
        response.put("exampleRequest", exampleRequest);
        
        response.put("documentation", "https://48d5f777fe07.ngrok-free.app/swagger-ui.html");
        response.put("note", "Use POST method to submit symptom reports");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/symptoms")
    @Operation(summary = "Create a new symptom report (mobile app endpoint)", description = "Submit a new symptom report - mobile app compatible")
    public ResponseEntity<SymptomReport> createSymptomReportMobile(@Valid @RequestBody SymptomRequest request) {
        log.info("Creating symptom report for user: {} (mobile endpoint)", request.getUserId());
        
        try {
            SymptomReport report = symptomService.saveSymptomReport(request);
            
            // TODO: Check for symptom cluster alerts after saving the report
            // alertService.checkForSymptomClusterAlerts(request.getLocation());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            log.error("Error creating symptom report", e);
            throw e;
        }
    }
    
    @PostMapping("/api/symptoms/report")
    @Operation(summary = "Create symptom report (mobile app v2)", description = "Submit symptom report - mobile app endpoint")
    public ResponseEntity<SymptomReport> createSymptomReportMobileV2(@Valid @RequestBody SymptomRequest request) {
        log.info("Creating symptom report for user: {} (mobile v2 endpoint)", request.getUserId());
        
        try {
            SymptomReport report = symptomService.saveSymptomReport(request);
            
            // TODO: Check for symptom cluster alerts after saving the report
            // alertService.checkForSymptomClusterAlerts(request.getLocation());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            log.error("Error creating symptom report", e);
            throw e;
        }
    }
    
    @PostMapping("/api/symptoms/reports")
    @Operation(summary = "Create a new symptom report", description = "Submit a new symptom report")
    public ResponseEntity<SymptomReport> createSymptomReport(@Valid @RequestBody SymptomRequest request) {
        log.info("Creating symptom report for user: {}", request.getUserId());
        
        try {
            SymptomReport report = symptomService.saveSymptomReport(request);
            
            // TODO: Check for symptom cluster alerts after saving the report
            // alertService.checkForSymptomClusterAlerts(request.getLocation());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (Exception e) {
            log.error("Error creating symptom report", e);
            throw e;
        }
    }
    
    @GetMapping("/api/symptoms/reports")
    @Operation(summary = "Get all symptom reports", description = "Retrieve all symptom reports")
    public ResponseEntity<List<SymptomReport>> getAllSymptomReports() {
        log.info("Retrieving all symptom reports");
        List<SymptomReport> reports = symptomService.getAllSymptomReports();
        return ResponseEntity.ok(reports);
    }
    
    // Alias endpoint for frontend compatibility (without 's' in symptoms)
    @GetMapping("/api/symptom-reports")
    @Operation(summary = "Get all symptom reports (alias)", description = "Retrieve all symptom reports - alias endpoint for frontend")
    public ResponseEntity<List<SymptomReport>> getAllSymptomReportsAlias() {
        log.info("Retrieving all symptom reports (via alias endpoint /api/symptom-reports)");
        return getAllSymptomReports();
    }
    
    @GetMapping("/api/symptoms/reports/{id}")
    @Operation(summary = "Get symptom report by ID", description = "Retrieve a specific symptom report by its ID")
    public ResponseEntity<SymptomReport> getSymptomReportById(
            @Parameter(description = "Symptom report ID") @PathVariable String id) {
        log.info("Retrieving symptom report by ID: {}", id);
        
        Optional<SymptomReport> report = symptomService.getSymptomReportById(id);
        return report.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/api/symptoms/reports/user/{userId}")
    @Operation(summary = "Get reports by user ID", description = "Retrieve all reports for a specific user")
    public ResponseEntity<List<SymptomReport>> getReportsByUserId(
            @Parameter(description = "User ID") @PathVariable String userId) {
        log.info("Retrieving reports for user: {}", userId);
        
        List<SymptomReport> reports = symptomService.getReportsByUserId(userId);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/location/{location}")
    @Operation(summary = "Get reports by location", description = "Retrieve all reports for a specific location")
    public ResponseEntity<List<SymptomReport>> getReportsByLocation(
            @Parameter(description = "Location name") @PathVariable String location) {
        log.info("Retrieving reports for location: {}", location);
        
        List<SymptomReport> reports = symptomService.getReportsByLocation(location);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/status/{status}")
    @Operation(summary = "Get reports by status", description = "Retrieve reports filtered by status")
    public ResponseEntity<List<SymptomReport>> getReportsByStatus(
            @Parameter(description = "Report status (PENDING, INVESTIGATED, RESOLVED)") @PathVariable String status) {
        log.info("Retrieving reports with status: {}", status);
        
        List<SymptomReport> reports = symptomService.getReportsByStatus(status);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/severity/{severity}")
    @Operation(summary = "Get reports by severity", description = "Retrieve reports filtered by severity")
    public ResponseEntity<List<SymptomReport>> getReportsBySeverity(
            @Parameter(description = "Severity level (MILD, MODERATE, SEVERE)") @PathVariable String severity) {
        log.info("Retrieving reports with severity: {}", severity);
        
        List<SymptomReport> reports = symptomService.getReportsBySeverity(severity);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/time-range")
    @Operation(summary = "Get reports by time range", description = "Retrieve reports within a specific time range")
    public ResponseEntity<List<SymptomReport>> getReportsByTimeRange(
            @Parameter(description = "Start time (seconds since epoch)") @RequestParam long startSeconds,
            @Parameter(description = "End time (seconds since epoch)") @RequestParam long endSeconds) {
        Timestamp start = Timestamp.ofTimeSecondsAndNanos(startSeconds, 0);
        Timestamp end = Timestamp.ofTimeSecondsAndNanos(endSeconds, 0);
        log.info("Retrieving reports between {} and {}", start, end);
        
        List<SymptomReport> reports = symptomService.getReportsByTimeRange(start, end);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/location/{location}/time-range")
    @Operation(summary = "Get reports by location and time range", description = "Retrieve reports for a location within a specific time range")
    public ResponseEntity<List<SymptomReport>> getReportsByLocationAndTimeRange(
            @Parameter(description = "Location name") @PathVariable String location,
            @Parameter(description = "Start time (seconds since epoch)") @RequestParam long startSeconds,
            @Parameter(description = "End time (seconds since epoch)") @RequestParam long endSeconds) {
        Timestamp start = Timestamp.ofTimeSecondsAndNanos(startSeconds, 0);
        Timestamp end = Timestamp.ofTimeSecondsAndNanos(endSeconds, 0);
        log.info("Retrieving reports for location {} between {} and {}", location, start, end);
        
        List<SymptomReport> reports = symptomService.getReportsByLocationAndTimeRange(location, start, end);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/symptoms")
    @Operation(summary = "Get reports by symptoms", description = "Retrieve reports containing specific symptoms")
    public ResponseEntity<List<SymptomReport>> getReportsBySymptoms(
            @Parameter(description = "List of symptoms") @RequestParam List<String> symptoms) {
        log.info("Retrieving reports with symptoms: {}", symptoms);
        
        List<SymptomReport> reports = symptomService.getReportsBySymptoms(symptoms);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/location/{location}/symptoms")
    @Operation(summary = "Get reports by location and symptoms", description = "Retrieve reports for a location containing specific symptoms")
    public ResponseEntity<List<SymptomReport>> getReportsByLocationAndSymptoms(
            @Parameter(description = "Location name") @PathVariable String location,
            @Parameter(description = "List of symptoms") @RequestParam List<String> symptoms) {
        log.info("Retrieving reports for location {} with symptoms: {}", location, symptoms);
        
        List<SymptomReport> reports = symptomService.getReportsByLocationAndSymptoms(location, symptoms);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/api/symptoms/reports/high-severity/recent")
    @Operation(summary = "Get high severity recent reports", description = "Retrieve high severity reports from the last 24 hours")
    public ResponseEntity<List<SymptomReport>> getHighSeverityRecentReports(
            @Parameter(description = "Hours to look back") @RequestParam(defaultValue = "24") int hours) {
        log.info("Retrieving high severity reports from last {} hours", hours);
        
        Timestamp since = Timestamp.ofTimeSecondsAndNanos(
            Timestamp.now().getSeconds() - (hours * 3600), 0);
        List<SymptomReport> reports = symptomService.getHighSeverityRecentReports(since);
        return ResponseEntity.ok(reports);
    }
    
    @PutMapping("/api/symptoms/reports/{id}/status")
    @Operation(summary = "Update report status", description = "Update the status of a symptom report")
    public ResponseEntity<SymptomReport> updateReportStatus(
            @Parameter(description = "Report ID") @PathVariable String id,
            @Parameter(description = "New status") @RequestParam String status,
            @Parameter(description = "Investigation notes") @RequestParam(required = false) String investigationNotes) {
        log.info("Updating report {} status to: {}", id, status);
        
        try {
            SymptomReport report = symptomService.updateReportStatus(id, status, investigationNotes);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/api/symptoms/statistics")
    @Operation(summary = "Get symptom report statistics", description = "Retrieve statistics about symptom reports")
    public ResponseEntity<SymptomStatisticsResponse> getSymptomStatistics() {
        log.info("Retrieving symptom report statistics");
        
        SymptomStatisticsResponse response = new SymptomStatisticsResponse();
        response.totalReports = symptomService.getReportCount();
        response.pendingReports = symptomService.getReportCountByStatus("PENDING");
        response.resolvedReports = symptomService.getReportCountByStatus("RESOLVED");
        response.severeReports = symptomService.getReportCountBySeverity("SEVERE");
        response.distinctLocations = symptomService.getDistinctLocations();
        response.distinctSymptoms = symptomService.getDistinctSymptoms();
        
        return ResponseEntity.ok(response);
    }
    
    // Response class
    public static class SymptomStatisticsResponse {
        public long totalReports;
        public long pendingReports;
        public long resolvedReports;
        public long severeReports;
        public List<String> distinctLocations;
        public List<String> distinctSymptoms;
    }
}
