package com.arogyajal.service;

import com.arogyajal.model.Alert;
import com.arogyajal.model.SensorReading;
import com.arogyajal.model.SymptomReport;
import com.arogyajal.repository.AlertRepository;
import com.arogyajal.repository.SymptomRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Smart Alert Service - Implements intelligent alert logic
 * - Repeat confirmation (no first-reading alerts)
 * - Rate limiting (max 1 alert per sensor per 30 min)
 * - Deduplication (fingerprint-based)
 */
@Service
public class SmartAlertService {
    
    private static final Logger log = LoggerFactory.getLogger(SmartAlertService.class);
    
    private final AlertRepository alertRepository;
    private final AlertService alertService;
    private final SymptomRepository symptomRepository;
    
    // Configuration
    private static final int RATE_LIMIT_MINUTES = 30;
    private static final int CONFIRMATION_WINDOW_MINUTES = 60;
    private static final int HIGH_SEVERITY_CONFIRMATIONS_REQUIRED = 2;
    
    // Phase 3: Symptom correlation thresholds
    private static final int SYMPTOM_CLUSTER_THRESHOLD = 3; // Min reports to consider cluster
    private static final int SYMPTOM_LOOKBACK_HOURS = 48; // Look back 48 hours for symptoms
    private static final double SYMPTOM_CLUSTER_RADIUS_KM = 10.0; // Same as water sensor radius
    
    public SmartAlertService(AlertRepository alertRepository, AlertService alertService, 
                            SymptomRepository symptomRepository) {
        this.alertRepository = alertRepository;
        this.alertService = alertService;
        this.symptomRepository = symptomRepository;
    }
    
    /**
     * Process sensor reading with smart alert logic
     */
    public SmartAlertResult processSensorReading(SensorReading reading, String severity) {
        log.info("Processing sensor reading with smart alert logic: {} - {}", 
                 reading.getSensorId(), severity);
        
        // STEP 1: Handle based on severity
        switch (severity) {
            case "NORMAL":
                return new SmartAlertResult("NO_ACTION", null, "Normal reading - no alert needed");
                
            case "MODERATE":
                return handleModerateReading(reading);
                
            case "HIGH":
                return handleHighReading(reading);
                
            case "CRITICAL":
                return handleCriticalReading(reading);
                
            default:
                return new SmartAlertResult("NO_ACTION", null, "Unknown severity");
        }
    }

    
    /**
     * Handle MODERATE severity reading
     * Action: UI highlight only, no push alert
     */
    private SmartAlertResult handleModerateReading(SensorReading reading) {
        log.info("Moderate reading - UI highlight only: {}", reading.getSensorId());
        // TODO: Update dashboard highlight
        return new SmartAlertResult("UI_HIGHLIGHT", null, "Moderate - UI highlight only");
    }
    
    /**
     * Handle HIGH severity reading
     * Action: Wait for 2nd reading in 30-60 min window
     */
    private SmartAlertResult handleHighReading(SensorReading reading) {
        try {
            // Check for recent HIGH readings
            List<Alert> recentAlerts = getRecentAlertsForSensor(
                reading.getSensorId(), 
                CONFIRMATION_WINDOW_MINUTES
            );
            
            // Count unconfirmed HIGH alerts
            long unconfirmedCount = recentAlerts.stream()
                .filter(a -> "HIGH".equals(a.getSeverity()))
                .filter(a -> a.getIsConfirmed() == null || !a.getIsConfirmed())
                .count();
            
            if (unconfirmedCount >= HIGH_SEVERITY_CONFIRMATIONS_REQUIRED - 1) {
                // 2nd reading confirmed - create alert
                // RATE LIMITING TEMPORARILY DISABLED FOR N8N TESTING
                // if (shouldCreateAlert(reading, "HIGH")) {
                    Alert alert = createSmartAlert(reading, "HIGH", true);
                    return new SmartAlertResult("ALERT_CREATED", alert.getId(), 
                        "High severity confirmed - alert created");
                // } else {
                //     return new SmartAlertResult("RATE_LIMITED", null, 
                //         "Alert suppressed - rate limited");
                // }
            } else {
                // First HIGH reading - store but don't alert
                storeUnconfirmedAlert(reading, "HIGH");
                return new SmartAlertResult("WAITING_CONFIRMATION", null, 
                    "High reading - waiting for confirmation");
            }
            
        } catch (Exception e) {
            log.error("Error handling HIGH reading", e);
            return new SmartAlertResult("ERROR", null, e.getMessage());
        }
    }
    
    /**
     * Handle CRITICAL severity reading
     * Action: Immediate alert with rate limiting
     */
    private SmartAlertResult handleCriticalReading(SensorReading reading) {
        try {
            // Check rate limit - TEMPORARILY DISABLED FOR N8N TESTING
            // if (isRateLimited(reading.getSensorId(), RATE_LIMIT_MINUTES)) {
            //     log.info("Critical alert rate-limited: {}", reading.getSensorId());
            //     return new SmartAlertResult("RATE_LIMITED", null, 
            //         "Critical alert suppressed - rate limited");
            // }
            
            // Create alert immediately
            if (shouldCreateAlert(reading, "CRITICAL")) {
                Alert alert = createSmartAlert(reading, "CRITICAL", true);
                return new SmartAlertResult("ALERT_CREATED", alert.getId(), 
                    "Critical alert created");
            } else {
                return new SmartAlertResult("DUPLICATE", null, 
                    "Alert suppressed - duplicate");
            }
            
        } catch (Exception e) {
            log.error("Error handling CRITICAL reading", e);
            return new SmartAlertResult("ERROR", null, e.getMessage());
        }
    }

    
    /**
     * Check if sensor is rate limited
     */
    private boolean isRateLimited(String sensorId, int minutes) {
        try {
            Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() - (minutes * 60), 0
            );
            
            List<Alert> recentAlerts = alertRepository.findAll().stream()
                .filter(a -> sensorId.equals(a.getSensorId()))
                .filter(a -> a.getTriggeredAt() != null && 
                            a.getTriggeredAt().compareTo(cutoff) > 0)
                .filter(a -> a.getIsConfirmed() != null && a.getIsConfirmed())
                .toList();
            
            return !recentAlerts.isEmpty();
            
        } catch (Exception e) {
            log.error("Error checking rate limit", e);
            return false;
        }
    }
    
    /**
     * Check if alert should be created (deduplication)
     */
    private boolean shouldCreateAlert(SensorReading reading, String severity) {
        String fingerprint = generateAlertFingerprint(
            reading.getSensorId(),
            getParameterFromReading(reading),
            severity,
            30 // time window in minutes
        );
        
        return !alertFingerprintExists(fingerprint);
    }
    
    /**
     * Generate alert fingerprint for deduplication
     */
    private String generateAlertFingerprint(String sensorId, String parameter, 
                                           String severity, int timeWindowMinutes) {
        long timeWindow = System.currentTimeMillis() / (timeWindowMinutes * 60 * 1000);
        return String.format("%s_%s_%s_%d", sensorId, parameter, severity, timeWindow);
    }
    
    /**
     * Check if alert fingerprint exists
     */
    private boolean alertFingerprintExists(String fingerprint) {
        try {
            List<Alert> alerts = alertRepository.findAll();
            return alerts.stream()
                .anyMatch(a -> fingerprint.equals(a.getFingerprint()));
        } catch (Exception e) {
            log.error("Error checking fingerprint", e);
            return false;
        }
    }
    
    /**
     * Get recent alerts for sensor
     */
    private List<Alert> getRecentAlertsForSensor(String sensorId, int minutes) 
            throws ExecutionException, InterruptedException {
        Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(
            Timestamp.now().getSeconds() - (minutes * 60), 0
        );
        
        return alertRepository.findAll().stream()
            .filter(a -> sensorId.equals(a.getSensorId()))
            .filter(a -> a.getTriggeredAt() != null && 
                        a.getTriggeredAt().compareTo(cutoff) > 0)
            .toList();
    }

    
    /**
     * Store unconfirmed alert (waiting for repeat confirmation)
     */
    private void storeUnconfirmedAlert(SensorReading reading, String severity) {
        try {
            String parameter = getParameterFromReading(reading);
            Double value = getValueFromReading(reading, parameter);
            
            Alert alert = Alert.builder()
                .alertType("WATER_QUALITY")
                .severity(severity)
                .title(parameter + " Level " + severity)
                .description(String.format("%s reading: %.2f (waiting confirmation)", 
                                          parameter, value))
                .location(reading.getLocation())
                .sensorId(reading.getSensorId())
                .parameter(parameter)
                .actualValue(value)
                .status("PENDING")
                .isConfirmed(false)
                .repeatCount(1)
                .firstDetectedAt(Timestamp.now())
                .build();
            
            String alertId = java.util.UUID.randomUUID().toString();
            alertRepository.save(alert, alertId);
            
            log.info("Stored unconfirmed alert: {} - {}", reading.getSensorId(), severity);
            
        } catch (Exception e) {
            log.error("Error storing unconfirmed alert", e);
        }
    }
    
    /**
     * Create smart alert with confirmation and spatial aggregation
     */
    private Alert createSmartAlert(SensorReading reading, String severity, boolean confirmed) {
        String parameter = getParameterFromReading(reading);
        
        // Check for nearby sensors with similar issues (Phase 2: Spatial Aggregation)
        List<SensorReading> nearbySensors = findNearbySensorsWithIssues(
            reading, parameter, severity, 10.0 // 10km radius
        );
        
        if (nearbySensors.size() >= 2) {
            // Multiple sensors in region - create aggregated alert
            return createAggregatedAlert(nearbySensors, parameter, severity, confirmed);
        } else {
            // Single sensor - create normal alert
            return createSingleSensorAlert(reading, parameter, severity, confirmed);
        }
    }
    
    /**
     * Create single sensor alert
     */
    private Alert createSingleSensorAlert(SensorReading reading, String parameter, 
                                          String severity, boolean confirmed) {
        Double value = getValueFromReading(reading, parameter);
        String fingerprint = generateAlertFingerprint(
            reading.getSensorId(), parameter, severity, 30
        );
        
        // Get possible diseases for this parameter
        String possibleDiseases = getPossibleDiseasesForParameter(parameter);
        
        Alert alert = Alert.builder()
            .alertType("WATER_QUALITY")
            .severity(severity)
            .title(parameter + " Level " + severity)
            .description(String.format("%s reading: %.2f (confirmed). Possible diseases: %s", 
                                      parameter, value, possibleDiseases))
            .location(reading.getLocation())
            .sensorId(reading.getSensorId())
            .parameter(parameter)
            .actualValue(value)
            .status("ACTIVE")
            .fingerprint(fingerprint)
            .isConfirmed(confirmed)
            .repeatCount(confirmed ? 2 : 1)
            .firstDetectedAt(Timestamp.now())
            .lastConfirmedAt(Timestamp.now())
            .build();
        
        return alertService.createAlert(alert);
    }
    
    /**
     * Create aggregated alert for multiple sensors in same region
     * Phase 3: Check for symptom correlation before creating alert
     */
    private Alert createAggregatedAlert(List<SensorReading> sensors, String parameter, 
                                       String severity, boolean confirmed) {
        // Extract region from first sensor location
        String region = extractRegion(sensors.get(0).getLocation());
        
        // Calculate average value
        double avgValue = sensors.stream()
            .mapToDouble(s -> getValueFromReading(s, parameter))
            .average()
            .orElse(0.0);
        
        // Create aggregated fingerprint
        String fingerprint = generateAlertFingerprint(
            "CLUSTER_" + region, parameter, severity, 30
        );
        
        // Build sensor IDs list
        String sensorIds = sensors.stream()
            .map(SensorReading::getSensorId)
            .collect(java.util.stream.Collectors.joining(", "));
        
        // Phase 3: Check for symptom correlation (Water + Health data)
        boolean hasSymptomCluster = checkForSymptomCorrelation(
            sensors.get(0).getLocation(), region
        );
        
        // Escalate to outbreak alert if symptoms confirmed
        if (hasSymptomCluster && "CRITICAL".equals(severity)) {
            return createOutbreakAlert(sensors, parameter, avgValue, sensorIds, region);
        }
        
        // Normal cluster alert
        Alert alert = Alert.builder()
            .alertType("WATER_QUALITY_CLUSTER")
            .severity(severity)
            .title(String.format("Multiple Water Sources - %s Alert", severity))
            .description(String.format(
                "⚠️ CLUSTER ALERT: %d sensors in %s showing %s contamination. " +
                "Average %s: %.2f. Affected sensors: %s. " +
                "Regional investigation required.",
                sensors.size(), region, parameter, parameter, avgValue, sensorIds
            ))
            .location(sensors.get(0).getLocation())
            .sensorId(sensors.get(0).getSensorId()) // Primary sensor
            .parameter(parameter)
            .actualValue(avgValue)
            .status("ACTIVE")
            .fingerprint(fingerprint)
            .isConfirmed(confirmed)
            .repeatCount(sensors.size())
            .firstDetectedAt(Timestamp.now())
            .lastConfirmedAt(Timestamp.now())
            .notes(String.format("Aggregated from %d sensors: %s", sensors.size(), sensorIds))
            .build();
        
        log.info("🌍 Created aggregated alert for {} sensors in {}", sensors.size(), region);
        return alertService.createAlert(alert);
    }
    
    /**
     * Phase 3: Create outbreak alert (Water + Symptom correlation)
     */
    private Alert createOutbreakAlert(List<SensorReading> sensors, String parameter, 
                                     double avgValue, String sensorIds, String region) {
        String fingerprint = generateAlertFingerprint(
            "OUTBREAK_" + region, parameter, "CRITICAL", 60
        );
        
        Alert alert = Alert.builder()
            .alertType("OUTBREAK_ALERT")
            .severity("CRITICAL")
            .title(String.format("🔴 OUTBREAK ALERT - %s", region))
            .description(String.format(
                "🔴 WATERBORNE DISEASE OUTBREAK SUSPECTED\n\n" +
                "Location: %s\n" +
                "Type: Water contamination + Health reports correlation\n" +
                "Affected Area: 10km radius\n\n" +
                "WATER QUALITY:\n" +
                "- %d sensors showing critical %s levels\n" +
                "- Average %s: %.2f\n" +
                "- Sensors: %s\n\n" +
                "HEALTH DATA:\n" +
                "- Symptom cluster detected in same region\n" +
                "- Multiple cases of waterborne illness reported\n\n" +
                "IMMEDIATE ACTIONS REQUIRED:\n" +
                "✓ Deploy emergency medical teams\n" +
                "✓ Shut down affected water sources\n" +
                "✓ Issue public health advisory\n" +
                "✓ Activate outbreak response protocol\n" +
                "✓ Conduct epidemiological investigation\n\n" +
                "Acknowledgement Required: District Officer (within 15 min)",
                region, sensors.size(), parameter, parameter, avgValue, sensorIds
            ))
            .location(sensors.get(0).getLocation())
            .sensorId(sensors.get(0).getSensorId())
            .parameter(parameter)
            .actualValue(avgValue)
            .status("ACTIVE")
            .fingerprint(fingerprint)
            .isConfirmed(true)
            .repeatCount(sensors.size())
            .firstDetectedAt(Timestamp.now())
            .lastConfirmedAt(Timestamp.now())
            .notes(String.format("OUTBREAK: %d sensors + symptom cluster in %s", 
                                sensors.size(), region))
            .build();
        
        log.error("🔴 OUTBREAK ALERT CREATED for {} - {} sensors affected", region, sensors.size());
        return alertService.createAlert(alert);
    }
    
    /**
     * Phase 3: Check for symptom correlation in region
     * Detects if there are multiple symptom reports in the same area as water quality issues
     */
    private boolean checkForSymptomCorrelation(String location, String region) {
        try {
            // Parse coordinates
            String[] coords = location.split(",");
            double lat = Double.parseDouble(coords[0]);
            double lon = Double.parseDouble(coords[1]);
            
            // Look back 48 hours for symptom reports
            Timestamp lookbackTime = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() - (SYMPTOM_LOOKBACK_HOURS * 3600), 0
            );
            
            // Get all recent symptom reports
            List<SymptomReport> allReports = symptomRepository.findAll();
            
            // Filter reports within time window and geographic radius
            List<SymptomReport> nearbyReports = allReports.stream()
                .filter(report -> {
                    // Check time window
                    if (report.getReportedAt() == null || 
                        report.getReportedAt().compareTo(lookbackTime) < 0) {
                        return false;
                    }
                    
                    // Check geographic proximity using GeoPoint
                    if (report.getGeoLocation() != null) {
                        double reportLat = report.getGeoLocation().getLatitude();
                        double reportLon = report.getGeoLocation().getLongitude();
                        double distance = calculateDistance(lat, lon, reportLat, reportLon);
                        return distance <= SYMPTOM_CLUSTER_RADIUS_KM;
                    }
                    
                    // Fallback: Check if location string matches region
                    if (report.getLocation() != null && report.getLocation().contains(region)) {
                        return true;
                    }
                    
                    return false;
                })
                .toList();
            
            // Check if we have enough reports to consider it a cluster
            if (nearbyReports.size() >= SYMPTOM_CLUSTER_THRESHOLD) {
                // Check for waterborne disease symptoms
                long waterborneSymptomCount = nearbyReports.stream()
                    .filter(report -> hasWaterborneSymptoms(report))
                    .count();
                
                if (waterborneSymptomCount >= SYMPTOM_CLUSTER_THRESHOLD) {
                    log.warn("🔴 SYMPTOM CLUSTER DETECTED: {} reports with waterborne symptoms in {} " +
                            "(within {}km, last {} hours)", 
                            waterborneSymptomCount, region, SYMPTOM_CLUSTER_RADIUS_KM, 
                            SYMPTOM_LOOKBACK_HOURS);
                    
                    // Log details for investigation
                    log.info("Symptom cluster details: {} total reports, {} with waterborne symptoms",
                            nearbyReports.size(), waterborneSymptomCount);
                    
                    return true;
                }
            }
            
            log.debug("No symptom cluster detected in {} ({} reports found)", 
                     region, nearbyReports.size());
            return false;
            
        } catch (Exception e) {
            log.error("Error checking symptom correlation: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Check if symptom report contains waterborne disease symptoms
     */
    private boolean hasWaterborneSymptoms(SymptomReport report) {
        if (report.getSymptoms() == null || report.getSymptoms().isEmpty()) {
            return false;
        }
        
        // Common waterborne disease symptoms
        List<String> waterborneSymptoms = List.of(
            "DIARRHEA", "VOMITING", "NAUSEA", "STOMACH_ACHE", 
            "ABDOMINAL_PAIN", "FEVER", "DEHYDRATION", "CHOLERA",
            "TYPHOID", "DYSENTERY", "GASTROENTERITIS"
        );
        
        // Check if report has any waterborne symptoms
        return report.getSymptoms().stream()
            .anyMatch(symptom -> waterborneSymptoms.stream()
                .anyMatch(wb -> symptom.toUpperCase().contains(wb)));
    }
    
    /**
     * Get parameter name from reading
     */
    private String getParameterFromReading(SensorReading reading) {
        if (reading.getPh() != null && (reading.getPh() < 6.5 || reading.getPh() > 8.5)) {
            return "pH";
        }
        if (reading.getTurbidity() != null && reading.getTurbidity() > 5.0) {
            return "Turbidity";
        }
        if (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 500) {
            return "TDS";
        }
        if (reading.getTemperature() != null && reading.getTemperature() > 30) {
            return "Temperature";
        }
        return "Unknown";
    }
    
    /**
     * Get value from reading for specific parameter
     */
    private Double getValueFromReading(SensorReading reading, String parameter) {
        switch (parameter) {
            case "pH": return reading.getPh();
            case "Turbidity": return reading.getTurbidity();
            case "TDS": return reading.getTotalDissolvedSolids();
            case "Temperature": return reading.getTemperature();
            default: return 0.0;
        }
    }
    
    /**
     * Find nearby sensors with similar issues (Phase 2: Spatial Aggregation)
     */
    private List<SensorReading> findNearbySensorsWithIssues(SensorReading reading, 
                                                            String parameter, 
                                                            String severity, 
                                                            double radiusKm) {
        try {
            // Parse location
            String[] coords = reading.getLocation().split(",");
            double lat = Double.parseDouble(coords[0]);
            double lon = Double.parseDouble(coords[1]);
            
            // Get recent alerts in last 60 minutes
            Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() - (60 * 60), 0
            );
            
            // Find alerts with same parameter and severity in nearby area
            List<Alert> recentAlerts = alertRepository.findAll().stream()
                .filter(a -> a.getTriggeredAt() != null && 
                            a.getTriggeredAt().compareTo(cutoff) > 0)
                .filter(a -> parameter.equals(a.getParameter()))
                .filter(a -> severity.equals(a.getSeverity()))
                .filter(a -> a.getLocation() != null)
                .filter(a -> {
                    try {
                        String[] alertCoords = a.getLocation().split(",");
                        double alertLat = Double.parseDouble(alertCoords[0]);
                        double alertLon = Double.parseDouble(alertCoords[1]);
                        double distance = calculateDistance(lat, lon, alertLat, alertLon);
                        return distance <= radiusKm;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .toList();
            
            // Create dummy sensor readings from alerts (for aggregation)
            List<SensorReading> nearbySensors = new java.util.ArrayList<>();
            nearbySensors.add(reading); // Add current reading
            
            // Add sensors from recent alerts
            for (Alert alert : recentAlerts) {
                if (!alert.getSensorId().equals(reading.getSensorId())) {
                    SensorReading dummy = new SensorReading();
                    dummy.setSensorId(alert.getSensorId());
                    dummy.setLocation(alert.getLocation());
                    setValueInReading(dummy, parameter, alert.getActualValue());
                    nearbySensors.add(dummy);
                }
            }
            
            return nearbySensors;
            
        } catch (Exception e) {
            log.error("Error finding nearby sensors", e);
            return java.util.Collections.singletonList(reading);
        }
    }
    
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Extract region name from location coordinates
     */
    private String extractRegion(String location) {
        try {
            String[] coords = location.split(",");
            double lat = Double.parseDouble(coords[0]);
            double lon = Double.parseDouble(coords[1]);
            
            // Simple region detection based on coordinates
            // Guwahati area: ~26.1°N, 91.7°E
            if (lat >= 26.0 && lat <= 26.3 && lon >= 91.6 && lon <= 91.9) {
                return "Guwahati District";
            }
            // Add more regions as needed
            
            return String.format("Region (%.2f°N, %.2f°E)", lat, lon);
        } catch (Exception e) {
            return "Unknown Region";
        }
    }
    
    /**
     * Set value in reading for specific parameter
     */
    private void setValueInReading(SensorReading reading, String parameter, Double value) {
        switch (parameter) {
            case "pH": reading.setPh(value); break;
            case "Turbidity": reading.setTurbidity(value); break;
            case "TDS": reading.setTotalDissolvedSolids(value); break;
            case "Temperature": reading.setTemperature(value); break;
        }
    }
    
    /**
     * Result class for smart alert processing
     */
    public static class SmartAlertResult {
        private final String action;
        private final String alertId;
        private final String reason;
        
        public SmartAlertResult(String action, String alertId, String reason) {
            this.action = action;
            this.alertId = alertId;
            this.reason = reason;
        }
        
        public String getAction() { return action; }
        public String getAlertId() { return alertId; }
        public String getReason() { return reason; }
    }
    
    /**
     * Get possible diseases based on water quality parameter
     */
    private String getPossibleDiseasesForParameter(String parameter) {
        switch (parameter) {
            case "pH":
                return "Diarrhea, Skin irritation, Gastrointestinal issues";
            case "Turbidity":
                return "Cholera, Typhoid, Dysentery, Giardiasis";
            case "TDS":
                return "Kidney stones, Cardiovascular issues, Gastrointestinal problems";
            case "Conductivity":
                return "Diarrhea, Dehydration, Electrolyte imbalance";
            case "Temperature":
                return "Bacterial growth, Cholera, E.coli infection";
            case "Dissolved Oxygen":
                return "Bacterial contamination, Waterborne diseases";
            default:
                return "Waterborne diseases";
        }
    }
}
