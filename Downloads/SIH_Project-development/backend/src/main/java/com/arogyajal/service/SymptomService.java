package com.arogyajal.service;

import com.arogyajal.dto.SymptomRequest;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.repository.SymptomRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SymptomService {
    
    private static final Logger log = LoggerFactory.getLogger(SymptomService.class);
    
    private final SymptomRepository symptomRepository;
    private final AlertService alertService;

    public SymptomService(SymptomRepository symptomRepository, AlertService alertService) {
        this.symptomRepository = symptomRepository;
        this.alertService = alertService;
    }
    
    public SymptomReport saveSymptomReportDirect(SymptomReport report) {
        log.info("Saving symptom report directly: {}", report.getId());
        
        try {
            // Set timestamps if not provided
            if (report.getReportedAt() == null) {
                report.setReportedAt(Timestamp.now());
            }
            if (report.getOfflineCreatedAt() == null) {
                report.setOfflineCreatedAt(Timestamp.now());
            }
            
            // Set default status if not provided
            if (report.getStatus() == null) {
                report.setStatus("PENDING");
            }
            if (report.getSyncStatus() == null) {
                report.setSyncStatus("SYNCED");
            }
            
            SymptomReport savedReport = symptomRepository.save(report);
            
            // Check for symptom clusters after saving
            try {
                if (report.getLocation() != null) {
                    alertService.checkForSymptomClusterAlerts(report.getLocation());
                    alertService.checkForSymptomSpikeAlerts(report.getLocation());
                }
            } catch (Exception e) {
                log.error("Error checking for symptom alerts: {}", e.getMessage());
            }
            
            return savedReport;
        } catch (Exception e) {
            log.error("Error saving symptom report directly: {}", report.getId(), e);
            throw new RuntimeException("Failed to save symptom report", e);
        }
    }
    
    public SymptomReport saveSymptomReport(SymptomRequest request) {
        log.info("Saving symptom report for user ID: {}", request.getUserId());
        
        try {
            // Generate a new ID for the report
            String reportId = UUID.randomUUID().toString();
            
            // Convert geoLocation map to GeoPoint if provided
            com.google.cloud.firestore.GeoPoint geoPoint = null;
            if (request.getGeoLocation() != null && 
                request.getGeoLocation().containsKey("latitude") && 
                request.getGeoLocation().containsKey("longitude")) {
                double lat = request.getGeoLocation().get("latitude");
                double lon = request.getGeoLocation().get("longitude");
                geoPoint = new com.google.cloud.firestore.GeoPoint(lat, lon);
            }
            
            // Set defaults for optional fields
            String duration = request.getDuration() != null ? request.getDuration() : "DAYS";
            Integer waterConsumption = request.getWaterConsumption() != null ? request.getWaterConsumption() : 0;
            
            SymptomReport report = SymptomReport.builder()
                    .id(reportId)
                    .userId(request.getUserId())
                    .location(request.getLocation())
                    .geoLocation(geoPoint)
                    .waterSource(request.getWaterSource())
                    .reporterType(request.getReporterType())
                    .reporterId(request.getReporterId())
                    .patientAge(request.getPatientAge())
                    .patientGender(request.getPatientGender())
                    .symptoms(request.getSymptoms())
                    .severity(request.getSeverity())
                    .duration(duration)
                    .waterConsumption(waterConsumption)
                    .lastWaterConsumption(com.google.cloud.Timestamp.now())
                    .additionalNotes(request.getAdditionalNotes())
                    .contactInfo(request.getContactInfo())
                    .reportedAt(com.google.cloud.Timestamp.now())
                    .status("PENDING")
                    .syncStatus("SYNCED")
                    .build();
            
            // Set patient name and phone separately (not in builder)
            report.setPatientName(request.getPatientName());
            report.setPatientPhone(request.getPatientPhone());
            
            SymptomReport savedReport = symptomRepository.save(report);
            
            // Check for symptom clusters after saving
            try {
                alertService.checkForSymptomClusterAlerts(request.getLocation());
                log.info("Checked for symptom clusters in location: {}", request.getLocation());
            } catch (Exception e) {
                log.error("Error checking for symptom clusters: {}", e.getMessage(), e);
                // Don't fail the entire operation if cluster check fails
            }
            
            // Check for symptom spikes after saving
            try {
                alertService.checkForSymptomSpikeAlerts(request.getLocation());
                log.info("Checked for symptom spikes in location: {}", request.getLocation());
            } catch (Exception e) {
                log.error("Error checking for symptom spikes: {}", e.getMessage(), e);
                // Don't fail the entire operation if spike check fails
            }
            
            return savedReport;
        } catch (Exception e) {
            log.error("Error saving symptom report for user ID: {}", request.getUserId(), e);
            throw new RuntimeException("Failed to save symptom report", e);
        }
    }
    
    public List<SymptomReport> getAllSymptomReports() {
        log.info("Retrieving all symptom reports");
        return symptomRepository.findAll();
    }
    
    public Optional<SymptomReport> getSymptomReportById(String id) {
        log.info("Retrieving symptom report by ID: {}", id);
        return symptomRepository.findById(id);
    }
    
    public List<SymptomReport> getReportsByUserId(String userId) {
        log.info("Retrieving reports for user ID: {}", userId);
        return symptomRepository.findByUserIdOrderByReportedAtDesc(userId);
    }
    
    public List<SymptomReport> getReportsByLocation(String location) {
        log.info("Retrieving reports for location: {}", location);
        return symptomRepository.findByLocationOrderByReportedAtDesc(location);
    }
    
    public List<SymptomReport> getReportsByStatus(String status) {
        log.info("Retrieving reports with status: {}", status);
        return symptomRepository.findByStatusOrderByReportedAtDesc(status);
    }
    
    public List<SymptomReport> getReportsBySeverity(String severity) {
        log.info("Retrieving reports with severity: {}", severity);
        return symptomRepository.findBySeverityOrderByReportedAtDesc(severity);
    }
    
    public List<SymptomReport> getReportsByTimeRange(Timestamp start, Timestamp end) {
        log.info("Retrieving reports between {} and {}", start, end);
        return symptomRepository.findByReportedAtBetweenOrderByReportedAtDesc(start, end);
    }
    
    public List<SymptomReport> getReportsByLocationAndTimeRange(String location, Timestamp start, Timestamp end) {
        log.info("Retrieving reports for location {} between {} and {}", location, start, end);
        return symptomRepository.findByLocationAndReportedAtBetweenOrderByReportedAtDesc(location, start, end);
    }
    
    public List<SymptomReport> getReportsBySymptoms(List<String> symptoms) {
        try {
            List<SymptomReport> reports = new ArrayList<>();
            for (String symptom : symptoms) {
                reports.addAll(symptomRepository.findBySymptomsContaining(symptom));
            }
            return reports;
        } catch (Exception e) {
            log.error("Error fetching reports by symptoms", e);
            return Collections.emptyList();
        }
    }
    
    public List<SymptomReport> getReportsByLocationAndSymptoms(String location, List<String> symptoms) {
        try {
            List<SymptomReport> reports = new ArrayList<>();
            for (String symptom : symptoms) {
                List<SymptomReport> locationReports = symptomRepository.findByLocation(location);
                for (SymptomReport report : locationReports) {
                    if (report.getSymptoms() != null && report.getSymptoms().contains(symptom)) {
                        reports.add(report);
                    }
                }
            }
            return reports;
        } catch (Exception e) {
            log.error("Error fetching reports by location and symptoms", e);
            return Collections.emptyList();
        }
    }
    
    public List<SymptomReport> getHighSeverityRecentReports(Timestamp since) {
        log.info("Retrieving high severity reports since: {}", since);
        return symptomRepository.findHighSeverityRecentReports(since);
    }
    
    public SymptomReport updateReportStatus(String id, String status, String investigationNotes) {
        log.info("Updating report {} status to: {}", id, status);
        
        Optional<SymptomReport> reportOpt = symptomRepository.findById(id);
        if (reportOpt.isPresent()) {
            SymptomReport report = reportOpt.get();
            report.setStatus(status);
            report.setInvestigationNotes(investigationNotes);
            report.setInvestigatedAt(com.google.cloud.Timestamp.now());
            return symptomRepository.save(report);
        }
        throw new RuntimeException("Symptom report not found with ID: " + id);
    }
    
    public long getReportCount() {
        return symptomRepository.count();
    }
    
    public long getReportCountByStatus(String status) {
        return symptomRepository.countByStatus(status);
    }
    
    public long getReportCountByLocation(String location) {
        return symptomRepository.countByLocation(location);
    }
    
    public long getReportCountBySeverity(String severity) {
        return symptomRepository.countBySeverity(severity);
    }
    
    public List<String> getDistinctLocations() {
        try {
            return symptomRepository.findDistinctLocations();
        } catch (Exception e) {
            log.error("Error fetching distinct locations", e);
            return Collections.emptyList();
        }
    }
    
    public List<String> getDistinctSymptoms() {
        try {
            return symptomRepository.findDistinctSymptoms();
        } catch (Exception e) {
            log.error("Error fetching distinct symptoms", e);
            return Collections.emptyList();
        }
    }
    
    public Optional<SymptomReport> getLatestReportByUserId(String userId) {
        return symptomRepository.findFirstByUserIdOrderByReportedAtDesc(userId);
    }
}
