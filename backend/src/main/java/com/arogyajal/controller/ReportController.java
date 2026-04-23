package com.arogyajal.controller;

import com.arogyajal.dto.ReportData;
import com.arogyajal.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/report")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@Tag(name = "Report API", description = "Generate region-based water quality reports")
public class ReportController {
    
    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    private final ReportService reportService;
    
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }
    
    /**
     * Generate region-based report for specified time range
     * GET /api/report?state=Assam&district=Barpeta&city=&village=&range=24h
     */
    @GetMapping
    @Operation(summary = "Generate water quality report", 
              description = "Generate comprehensive report with sensors, alerts, and ML predictions")
    public ResponseEntity<ReportData> generateReport(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String village,
            @RequestParam(defaultValue = "24h") String range) {
        
        log.info("📊 Report request - State: {}, District: {}, City: {}, Village: {}, Range: {}",
                state, district, city, village, range);
        
        try {
            // Parse range (default 24 hours)
            int hours = parseRange(range);
            
            // Generate report
            ReportData report = reportService.generateReport(state, district, city, village, hours);
            
            log.info("✅ Report generated successfully");
            return ResponseEntity.ok(report);
            
        } catch (Exception e) {
            log.error("❌ Error generating report", e);
            
            // Return empty report with error message
            ReportData emptyReport = reportService.generateEmptyReport(state, district, city, village);
            return ResponseEntity.ok(emptyReport);
        }
    }
    
    private int parseRange(String range) {
        if (range == null || range.isEmpty()) {
            return 24;
        }
        
        // Parse formats like "24h", "48h", "7d"
        range = range.toLowerCase().trim();
        
        if (range.endsWith("h")) {
            return Integer.parseInt(range.substring(0, range.length() - 1));
        } else if (range.endsWith("d")) {
            int days = Integer.parseInt(range.substring(0, range.length() - 1));
            return days * 24;
        }
        
        return 24; // Default
    }
}
