package com.arogyajal.controller;

import com.arogyajal.model.IssueReport;
import com.arogyajal.service.IssueReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mobile/issue-reports")
@CrossOrigin(origins = "*")
public class IssueReportController {
    
    private static final Logger log = LoggerFactory.getLogger(IssueReportController.class);
    private final IssueReportService issueReportService;
    
    public IssueReportController(IssueReportService issueReportService) {
        this.issueReportService = issueReportService;
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadIssueReport(@RequestBody IssueReport issueReport) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Validate required fields
            if (issueReport.getId() == null || issueReport.getId().isEmpty()) {
                response.put("success", false);
                response.put("error", createError("VALIDATION_ERROR", "ID is required", null));
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check for duplicate
            IssueReport existing = issueReportService.getIssueReportById(issueReport.getId());
            if (existing != null) {
                response.put("success", false);
                response.put("error", createError("DUPLICATE_ERROR", "Issue report with this ID already exists", null));
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Save issue report
            String id = issueReportService.saveIssueReport(issueReport);
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("uploadedAt", java.time.Instant.now().toString());
            
            response.put("success", true);
            response.put("message", "Issue report uploaded successfully");
            response.put("data", data);
            
            log.info("Issue report uploaded successfully: {}", id);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error uploading issue report", e);
            response.put("success", false);
            response.put("error", createError("SERVER_ERROR", "Internal server error: " + e.getMessage(), null));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping
    public ResponseEntity<List<IssueReport>> getAllIssueReports() {
        try {
            List<IssueReport> issueReports = issueReportService.getAllIssueReports();
            return ResponseEntity.ok(issueReports);
        } catch (Exception e) {
            log.error("Error fetching issue reports", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<IssueReport> getIssueReportById(@PathVariable String id) {
        try {
            IssueReport issueReport = issueReportService.getIssueReportById(id);
            if (issueReport == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(issueReport);
        } catch (Exception e) {
            log.error("Error fetching issue report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/reporter/{reporterId}")
    public ResponseEntity<List<IssueReport>> getIssueReportsByReporter(@PathVariable String reporterId) {
        try {
            List<IssueReport> issueReports = issueReportService.getIssueReportsByReporter(reporterId);
            return ResponseEntity.ok(issueReports);
        } catch (Exception e) {
            log.error("Error fetching issue reports by reporter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/severity/{severity}")
    public ResponseEntity<List<IssueReport>> getIssueReportsBySeverity(@PathVariable String severity) {
        try {
            List<IssueReport> issueReports = issueReportService.getIssueReportsBySeverity(severity);
            return ResponseEntity.ok(issueReports);
        } catch (Exception e) {
            log.error("Error fetching issue reports by severity", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<IssueReport>> getIssueReportsByStatus(@PathVariable String status) {
        try {
            List<IssueReport> issueReports = issueReportService.getIssueReportsByStatus(status);
            return ResponseEntity.ok(issueReports);
        } catch (Exception e) {
            log.error("Error fetching issue reports by status", e);
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
