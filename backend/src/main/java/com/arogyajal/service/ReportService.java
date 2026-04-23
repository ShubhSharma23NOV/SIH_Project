package com.arogyajal.service;

import com.arogyajal.dto.ReportData;
import com.arogyajal.model.Alert;
import com.arogyajal.model.SensorReading;
import com.arogyajal.repository.SensorRepository;
import com.arogyajal.util.SensorDataValidator;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {
    
    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    
    private final SensorRepository sensorRepository;
    private final AlertService alertService;
    private final OutbreakPredictionService predictionService;
    private final LocationService locationService;
    
    public ReportService(SensorRepository sensorRepository,
                        AlertService alertService,
                        OutbreakPredictionService predictionService,
                        LocationService locationService) {
        this.sensorRepository = sensorRepository;
        this.alertService = alertService;
        this.predictionService = predictionService;
        this.locationService = locationService;
    }
    
    public ReportData generateReport(String state, String district, String city, String village, int hours) {
        // NORMALIZE REGION INPUTS using validator
        String normalizedState = SensorDataValidator.normalizeRegion(state);
        String normalizedDistrict = SensorDataValidator.normalizeRegion(district);
        String normalizedCity = SensorDataValidator.normalizeRegion(city);
        String normalizedVillage = SensorDataValidator.normalizeRegion(village);
        
        log.info("Generating report for region: state={} (normalized: {}), district={} (normalized: {}), city={} (normalized: {}), village={} (normalized: {}), hours={}",
                state, normalizedState, district, normalizedDistrict, city, normalizedCity, village, normalizedVillage, hours);
        
        ReportData report = new ReportData();
        
        // 1. Set metadata
        report.setMetadata(buildMetadata(state, district, city, village, hours));
        
        // 2. Get sensor readings for time range (RECENT DATA)
        Timestamp startTime = Timestamp.ofTimeSecondsAndNanos(
            Instant.now().minusSeconds(hours * 3600L).getEpochSecond(), 0);
        Timestamp endTime = Timestamp.now();
        
        List<SensorReading> rawReadings = getFilteredReadings(normalizedState, normalizedDistrict, normalizedCity, normalizedVillage, startTime, endTime);
        
        boolean isFallbackMode = false;
        
        // FALLBACK MODE: If no recent data, get latest available readings
        if (rawReadings.isEmpty()) {
            log.warn("⚠ No readings in last {} hours. Activating FALLBACK MODE - fetching latest available data", hours);
            rawReadings = getLatestAvailableReadings(normalizedState, normalizedDistrict, normalizedCity, normalizedVillage);
            isFallbackMode = true;
            
            if (!rawReadings.isEmpty()) {
                log.info("✅ Fallback mode: Retrieved {} latest readings", rawReadings.size());
            }
        }
        
        // VALIDATE SENSOR DATA - Filter out invalid readings
        SensorDataValidator.ValidationResult validationResult = SensorDataValidator.validateReadings(rawReadings);
        List<SensorReading> readings = validationResult.getValidReadings();
        
        log.info("Data validation: {} valid, {} discarded, {}% confidence",
                validationResult.getValidCount(), validationResult.getDiscardedCount(),
                String.format("%.1f", validationResult.getConfidencePercentage()));
        
        // Update metadata with reporting devices count and mode
        Set<String> reportingDevices = readings.stream()
            .map(SensorReading::getSensorId)
            .collect(Collectors.toSet());
        report.getMetadata().setReportingDevices24h(reportingDevices.size());
        report.getMetadata().setFallbackMode(isFallbackMode);
        
        // Set dynamic messaging based on mode
        if (isFallbackMode && !readings.isEmpty()) {
            report.getMetadata().setDataModeMessage(
                "⚠ No recent readings in the last " + hours + " hours. " +
                "Using latest available sensor values (fallback mode) to provide current status."
            );
            report.getMetadata().setCoverageMessage(
                "Coverage: " + reportingDevices.size() + " sensors reporting (fallback mode - showing latest available data)."
            );
        } else if (!readings.isEmpty()) {
            report.getMetadata().setDataModeMessage(
                "Out of " + report.getMetadata().getConfiguredDevices() + " sensors, " + 
                reportingDevices.size() + " reported in the last " + hours + " hours."
            );
        } else {
            report.getMetadata().setDataModeMessage(
                "No sensor data available. All " + report.getMetadata().getConfiguredDevices() + 
                " configured sensors are offline or not reporting."
            );
        }
        
        // 3. Build water quality summary with validation metrics
        report.setWaterQualitySummary(buildWaterQualitySummary(readings, validationResult));
        
        // 4. Build sensor history (with fallback mode flag)
        report.setSensorHistory(buildSensorHistory(readings, isFallbackMode));
        
        // 5. Get alerts (use normalized values)
        List<ReportData.AlertSummary> allAlerts = buildAlertsSummary(normalizedState, normalizedDistrict, normalizedCity, normalizedVillage, startTime, endTime);
        
        // ========================================================================
        // PRIORITY RULE: SAFETY OVERRIDE - Prevent False High Risk When No Data
        // ========================================================================
        
        // ========================================================================
        // REPORT MODE CLASSIFICATION ENGINE
        // ========================================================================
        int reportingSensorCount = reportingDevices.size();
        int configuredSensorCount = report.getMetadata().getConfiguredDevices();
        int offlineSensorCount = configuredSensorCount - reportingSensorCount;
        
        String reportMode;
        if (reportingSensorCount == 0) {
            reportMode = "NO_DATA";
        } else if (reportingSensorCount < configuredSensorCount) {
            reportMode = "PARTIAL";
        } else {
            reportMode = "FULL";
        }
        
        report.getMetadata().setReportMode(reportMode);
        report.getMetadata().setOfflineSensors(offlineSensorCount);
        report.getMetadata().setStaleSensors(0);  // Can be enhanced later
        
        log.info("Report Mode Classification: {} (reporting: {}, configured: {}, offline: {})",
                reportMode, reportingSensorCount, configuredSensorCount, offlineSensorCount);
        
        boolean hasValidData = reportingSensorCount > 0 && !readings.isEmpty();
        
        if (!hasValidData) {
            // NO VALID DATA - SUPPRESS PREDICTION
            log.warn("⚠ SAFETY OVERRIDE: No valid sensor data available. Suppressing risk prediction.");
            
            // Move ALL alerts to historical section (not used for prediction)
            report.setAlerts(new ArrayList<>());
            report.setHistoricalAlerts(allAlerts);
            
            // Set suppressed prediction
            report.setMlPrediction(buildSuppressedPrediction(reportingSensorCount, allAlerts.size()));
            
            // Add clarification message
            report.setClarificationMessage(
                "⚠ OUTBREAK RISK NOT COMPUTED — insufficient data.\n\n" +
                "(" + reportingSensorCount + " reporting sensors detected this cycle)\n\n" +
                "System requires at least 1 active sensor stream within the last " + hours + " hours.\n\n" +
                "Possible reasons:\n" +
                "• Sensors offline or in low-connectivity zone\n" +
                "• Maintenance or network downtime\n" +
                "• Device battery drain\n\n" +
                "Recommendation:\n" +
                "Please verify device health on dashboard or re-run report after data update."
            );
            
            log.info("Report generated with SUPPRESSED prediction - no valid data available");
            
            // Add generation summary for NO_DATA mode
            report.setGenerationSummary(buildGenerationSummary(
                    reportMode,
                    reportingSensorCount,
                    offlineSensorCount,
                    validationResult,
                    0,  // No charts generated
                    report.getMlPrediction()
            ));
            
            return report;
        }
        
        // VALID DATA EXISTS - Proceed with normal prediction
        report.setAlerts(allAlerts);
        report.setHistoricalAlerts(new ArrayList<>());
        
        // 6. Get ML prediction with real factors and alert alignment
        report.setMlPrediction(buildMLPredictionSummary(readings, allAlerts, validationResult, reportingSensorCount));
        
        // 7. Add clarification message only if both readings and alerts are empty (shouldn't happen with valid data check)
        if (readings.isEmpty() && allAlerts.isEmpty()) {
            report.setClarificationMessage(
                "No recent activity detected for this region.\n\n" +
                "Possible reasons:\n" +
                "• Sensor offline or in low-connectivity zone\n" +
                "• No water quality issues detected\n" +
                "• Maintenance or network downtime\n" +
                "• Device battery drain\n\n" +
                "Recommendation:\n" +
                "Please verify device health on dashboard or re-run report after data update."
            );
        }
        
        log.info("Report generated successfully with {} sensors, {} alerts",
                reportingDevices.size(), allAlerts.size());
        
        // ========================================================================
        // FINAL OUTPUT METADATA - Generation Summary
        // ========================================================================
        report.setGenerationSummary(buildGenerationSummary(
                reportMode,
                reportingSensorCount,
                offlineSensorCount,
                validationResult,
                report.getSensorHistory().size(),
                report.getMlPrediction()
        ));
        
        return report;
    }
    

    
    /**
     * Get latest available readings per sensor (FALLBACK MODE)
     * Used when no recent data exists in the specified time range
     * 
     * IMPORTANT: In fallback mode, we get ALL sensors regardless of location filter
     * because sensors store coordinates (26.1445,91.7362) not text locations (Sawkuchi, Dispur)
     * Location filtering should be done at device registry level, not sensor reading level
     */
    private List<SensorReading> getLatestAvailableReadings(String state, String district, String city, String village) {
        try {
            // Get all readings (no time filter, no location filter in fallback mode)
            List<SensorReading> allReadings = sensorRepository.findAll();
            
            log.info("Fallback mode: Retrieved {} total readings from database", allReadings.size());
            
            // Group by sensor and get latest reading per sensor
            Map<String, SensorReading> latestPerSensor = allReadings.stream()
                .collect(Collectors.toMap(
                    SensorReading::getSensorId,
                    reading -> reading,
                    (r1, r2) -> {
                        if (r1.getTimestamp() == null) return r2;
                        if (r2.getTimestamp() == null) return r1;
                        return r1.getTimestamp().compareTo(r2.getTimestamp()) > 0 ? r1 : r2;
                    }
                ));
            
            List<SensorReading> latestReadings = new ArrayList<>(latestPerSensor.values());
            
            log.info("Fallback mode: Found {} latest readings from {} unique sensors", 
                    latestReadings.size(), latestPerSensor.size());
            
            return latestReadings;
            
        } catch (Exception e) {
            log.error("Error fetching latest available readings", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Calculate human-readable age of a reading
     */
    private String calculateReadingAge(Timestamp timestamp) {
        if (timestamp == null) return "Unknown age";
        
        long nowSeconds = Instant.now().getEpochSecond();
        long readingSeconds = timestamp.getSeconds();
        long ageSeconds = nowSeconds - readingSeconds;
        
        if (ageSeconds < 0) return "Future reading";
        
        long minutes = ageSeconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;
        
        if (days > 0) {
            return "Last update: " + days + " day" + (days > 1 ? "s" : "") + " ago";
        } else if (hours > 0) {
            return "Last update: " + hours + " hour" + (hours > 1 ? "s" : "") + " ago";
        } else if (minutes > 0) {
            return "Last update: " + minutes + " minute" + (minutes > 1 ? "s" : "") + " ago";
        } else {
            return "Last update: " + ageSeconds + " second" + (ageSeconds > 1 ? "s" : "") + " ago";
        }
    }
    
    private ReportData.ReportMetadata buildMetadata(String state, String district, String city, String village, int hours) {
        ReportData.ReportMetadata metadata = new ReportData.ReportMetadata();
        
        // Build region name
        StringBuilder regionName = new StringBuilder();
        if (village != null && !village.isEmpty()) {
            regionName.append(village).append(", ");
        }
        if (city != null && !city.isEmpty()) {
            regionName.append(city).append(", ");
        }
        if (district != null && !district.isEmpty()) {
            regionName.append(district).append(", ");
        }
        if (state != null && !state.isEmpty()) {
            regionName.append(state);
        }
        
        if (regionName.length() == 0) {
            regionName.append("All Regions (North East India)");
        }
        
        metadata.setRegionName(regionName.toString());
        metadata.setTimeRange("Last " + hours + " hours");
        metadata.setGeneratedAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        metadata.setReportType("Water Quality & Outbreak Risk Report");
        
        // Build scope description
        StringBuilder scope = new StringBuilder();
        if (state != null && !state.isEmpty()) scope.append(state);
        if (district != null && !district.isEmpty()) scope.append(" / ").append(district);
        if (city != null && !city.isEmpty()) scope.append(" / ").append(city);
        if (village != null && !village.isEmpty()) scope.append(" / ").append(village);
        if (scope.length() == 0) scope.append("All Regions");
        metadata.setScope(scope.toString());
        
        // Get total configured devices (from device registry)
        try {
            List<String> allDeviceIds = locationService.getAllDeviceIds();
            metadata.setConfiguredDevices(allDeviceIds.size());
        } catch (Exception e) {
            metadata.setConfiguredDevices(0);
        }
        
        return metadata;
    }
    
    private List<SensorReading> getFilteredReadings(String state, String district, String city, String village,
                                                     Timestamp startTime, Timestamp endTime) {
        try {
            List<SensorReading> allReadings = sensorRepository.findByTimestampBetween(startTime, endTime);
            
            log.info("Found {} readings in time range {} to {}", allReadings.size(), startTime, endTime);
            
            // IMPORTANT: Sensors store coordinates (26.1445,91.7362) not text locations
            // Location filtering by text name will fail. Return all readings for now.
            // TODO: Implement geo-coordinate based filtering or device registry filtering
            if (state == null && district == null && city == null && village == null) {
                return allReadings;
            }
            
            // Try location matching but don't filter out if no matches
            // This prevents empty reports when location format doesn't match
            List<SensorReading> filtered = allReadings.stream()
                .filter(reading -> matchesLocation(reading, state, district, city, village))
                .collect(Collectors.toList());
            
            if (filtered.isEmpty() && !allReadings.isEmpty()) {
                log.warn("Location filter '{}' matched 0 readings. Returning all {} readings to avoid empty report.",
                        String.format("%s/%s/%s/%s", state, district, city, village), allReadings.size());
                return allReadings;
            }
            
            return filtered;
                
        } catch (Exception e) {
            log.error("Error fetching filtered readings", e);
            return new ArrayList<>();
        }
    }
    
    private boolean matchesLocation(SensorReading reading, String normalizedState, String normalizedDistrict, 
                                    String normalizedCity, String normalizedVillage) {
        // Location matching using NORMALIZED values
        String location = reading.getLocation();
        if (location == null) return false;
        
        // Normalize the reading's location using validator
        String normalizedLocation = SensorDataValidator.normalizeRegion(location);
        if (normalizedLocation == null) return false;
        
        // Match against normalized filter values
        if (normalizedVillage != null && !normalizedVillage.isEmpty() && !normalizedLocation.contains(normalizedVillage)) {
            return false;
        }
        if (normalizedCity != null && !normalizedCity.isEmpty() && !normalizedLocation.contains(normalizedCity)) {
            return false;
        }
        if (normalizedDistrict != null && !normalizedDistrict.isEmpty() && !normalizedLocation.contains(normalizedDistrict)) {
            return false;
        }
        if (normalizedState != null && !normalizedState.isEmpty() && !normalizedLocation.contains(normalizedState)) {
            return false;
        }
        
        return true;
    }
    
    private ReportData.WaterQualitySummary buildWaterQualitySummary(List<SensorReading> readings, 
                                                                     SensorDataValidator.ValidationResult validationResult) {
        ReportData.WaterQualitySummary summary = new ReportData.WaterQualitySummary();
        
        // Add validation metrics
        ReportData.ValidationMetrics metrics = new ReportData.ValidationMetrics();
        metrics.setTotalReadings(validationResult.getTotalCount());
        metrics.setValidReadings(validationResult.getValidCount());
        metrics.setDiscardedReadings(validationResult.getDiscardedCount());
        metrics.setMissingReadings(validationResult.getMissingCount());
        metrics.setConfidencePercentage(validationResult.getConfidencePercentage());
        
        // Build sensor status summary
        ReportData.SensorStatusSummary sensorStatus = new ReportData.SensorStatusSummary();
        Set<String> reportingSensors = readings.stream()
            .map(SensorReading::getSensorId)
            .collect(Collectors.toSet());
        
        // Get offline sensors from rejected readings
        Set<String> offlineSensors = validationResult.getRejectedReadings().stream()
            .filter(r -> r.getReason().contains("Missing") || r.getReason().contains("not installed"))
            .map(r -> r.getSensorId())
            .collect(Collectors.toSet());
        
        sensorStatus.setReportingSensors(reportingSensors.size());
        sensorStatus.setNotReportingSensors(offlineSensors.size());
        sensorStatus.setInstalledSensors(reportingSensors.size() + offlineSensors.size());
        sensorStatus.setOfflineSensorIds(new ArrayList<>(offlineSensors));
        
        metrics.setSensorStatus(sensorStatus);
        
        // Build data quality message
        StringBuilder qualityMsg = new StringBuilder();
        
        if (validationResult.getMissingCount() > 0) {
            qualityMsg.append(String.format("⚠ Some sensors did not provide valid readings. " +
                    "These values were excluded from calculations to avoid incorrect risk evaluation. "));
        }
        
        if (validationResult.getDiscardedCount() > 0) {
            qualityMsg.append(String.format("⚠ Some abnormal readings were detected and filtered before generating metrics. "));
        }
        
        if (validationResult.getValidCount() > 0) {
            qualityMsg.append(String.format("Data Confidence: %.0f%% (%d valid, %d missing, %d discarded)",
                    validationResult.getConfidencePercentage(), 
                    validationResult.getValidCount(),
                    validationResult.getMissingCount(),
                    validationResult.getDiscardedCount()));
        } else {
            qualityMsg.append("No valid data available for analysis");
        }
        
        metrics.setDataQualityMessage(qualityMsg.toString());
        summary.setValidationMetrics(metrics);
        
        if (readings.isEmpty()) {
            summary.setTotalSensors(0);
            summary.setActiveSensors(0);
            return summary;
        }
        
        // Get unique sensors
        Set<String> uniqueSensors = readings.stream()
            .map(SensorReading::getSensorId)
            .collect(Collectors.toSet());
        
        summary.setTotalSensors(uniqueSensors.size());
        summary.setActiveSensors(uniqueSensors.size());
        
        // Calculate stats for each parameter (ONLY VALID READINGS - exclude missing/0.00 values)
        List<Double> phValues = readings.stream()
            .map(SensorReading::getPh)
            .filter(v -> !SensorDataValidator.isMissingValue(v))
            .collect(Collectors.toList());
        
        List<Double> tdsValues = readings.stream()
            .map(SensorReading::getTotalDissolvedSolids)
            .filter(v -> !SensorDataValidator.isMissingValue(v))
            .collect(Collectors.toList());
        
        List<Double> turbidityValues = readings.stream()
            .map(SensorReading::getTurbidity)
            .filter(v -> !SensorDataValidator.isMissingValue(v))
            .collect(Collectors.toList());
        
        List<Double> tempValues = readings.stream()
            .map(SensorReading::getTemperature)
            .filter(v -> !SensorDataValidator.isMissingValue(v))
            .collect(Collectors.toList());
        
        summary.setPh(calculateStats(phValues));
        summary.setTds(calculateStats(tdsValues));
        summary.setTurbidity(calculateStats(turbidityValues));
        summary.setTemperature(calculateStats(tempValues));
        
        return summary;
    }
    
    private ReportData.ParameterStats calculateStats(List<Double> values) {
        if (values.isEmpty()) {
            return new ReportData.ParameterStats(0, 0, 0);
        }
        
        double min = values.stream().min(Double::compare).orElse(0.0);
        double max = values.stream().max(Double::compare).orElse(0.0);
        double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        return new ReportData.ParameterStats(min, max, avg);
    }
    
    private List<ReportData.SensorHistory> buildSensorHistory(List<SensorReading> readings, boolean isFallbackMode) {
        Map<String, List<SensorReading>> groupedBySensor = readings.stream()
            .collect(Collectors.groupingBy(SensorReading::getSensorId));
        
        List<ReportData.SensorHistory> history = new ArrayList<>();
        
        for (Map.Entry<String, List<SensorReading>> entry : groupedBySensor.entrySet()) {
            ReportData.SensorHistory sensorHistory = new ReportData.SensorHistory();
            sensorHistory.setDeviceId(entry.getKey());
            
            List<SensorReading> sensorReadings = entry.getValue();
            if (!sensorReadings.isEmpty()) {
                sensorHistory.setLocation(sensorReadings.get(0).getLocation());
            }
            
            List<ReportData.TimeSeriesData> timeSeriesData = sensorReadings.stream()
                .sorted(Comparator.comparing(SensorReading::getTimestamp))
                .map(reading -> convertToTimeSeriesData(reading, isFallbackMode))
                .collect(Collectors.toList());
            
            sensorHistory.setReadings(timeSeriesData);
            
            // Add warning if fallback mode and only 1 reading
            if (isFallbackMode && timeSeriesData.size() == 1) {
                sensorHistory.setChartWarning("⚠ Single data point - chart not available. Table data only.");
            } else if (isFallbackMode && timeSeriesData.size() > 1) {
                sensorHistory.setChartWarning("⚠ This chart contains historical readings (not real-time).");
            }
            
            history.add(sensorHistory);
        }
        
        return history;
    }
    
    private ReportData.TimeSeriesData convertToTimeSeriesData(SensorReading reading, boolean isFallbackMode) {
        ReportData.TimeSeriesData data = new ReportData.TimeSeriesData();
        
        if (reading.getTimestamp() != null) {
            data.setTimestamp(DateTimeFormatter.ISO_INSTANT.format(
                Instant.ofEpochSecond(reading.getTimestamp().getSeconds())));
            
            // Add age tag in fallback mode
            if (isFallbackMode) {
                data.setAgeTag(calculateReadingAge(reading.getTimestamp()));
            }
        }
        
        data.setPh(reading.getPh() != null ? reading.getPh() : 0);
        data.setTds(reading.getTotalDissolvedSolids() != null ? reading.getTotalDissolvedSolids() : 0);
        data.setTurbidity(reading.getTurbidity() != null ? reading.getTurbidity() : 0);
        data.setTemperature(reading.getTemperature() != null ? reading.getTemperature() : 0);
        data.setWqi(reading.getWqi() != null ? reading.getWqi() : 0);
        
        return data;
    }
    
    private List<ReportData.AlertSummary> buildAlertsSummary(String state, String district, String city, String village,
                                                              Timestamp startTime, Timestamp endTime) {
        try {
            List<Alert> alerts = alertService.getAlertsByTimeRange(startTime, endTime);
            
            return alerts.stream()
                .filter(alert -> matchesAlertLocation(alert, state, district, city, village))
                .map(this::convertToAlertSummary)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error fetching alerts", e);
            return new ArrayList<>();
        }
    }
    
    private boolean matchesAlertLocation(Alert alert, String normalizedState, String normalizedDistrict, 
                                        String normalizedCity, String normalizedVillage) {
        String location = alert.getLocation();
        if (location == null) return false;
        
        // Normalize the alert's location using validator
        String normalizedLocation = SensorDataValidator.normalizeRegion(location);
        if (normalizedLocation == null) return false;
        
        // Match against normalized filter values
        if (normalizedVillage != null && !normalizedVillage.isEmpty() && !normalizedLocation.contains(normalizedVillage)) {
            return false;
        }
        if (normalizedCity != null && !normalizedCity.isEmpty() && !normalizedLocation.contains(normalizedCity)) {
            return false;
        }
        if (normalizedDistrict != null && !normalizedDistrict.isEmpty() && !normalizedLocation.contains(normalizedDistrict)) {
            return false;
        }
        if (normalizedState != null && !normalizedState.isEmpty() && !normalizedLocation.contains(normalizedState)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Build suppressed prediction when no valid data is available
     * SAFETY OVERRIDE: Prevents false high risk when sensors are offline
     */
    private ReportData.MLPredictionSummary buildSuppressedPrediction(int reportingSensorCount, int archivedAlertsCount) {
        ReportData.MLPredictionSummary summary = new ReportData.MLPredictionSummary();
        
        summary.setRiskScore(null);
        summary.setRiskLevel("DATA_UNAVAILABLE");
        summary.setConfidence(null);
        summary.setContributingFactors(new HashMap<>());
        summary.setPredictionSuppressed(true);
        summary.setSuppressionReason(
            String.format("Insufficient data: %d reporting sensors detected this cycle", reportingSensorCount)
        );
        
        summary.setExplanation(
            String.format("⚠ Unable to generate outbreak prediction due to missing or outdated sensor data. " +
                         "System requires at least 1 active sensor stream within the last 24 hours. " +
                         "Currently: %d reporting sensors, %d historical alerts (not used for prediction).",
                         reportingSensorCount, archivedAlertsCount)
        );
        
        summary.setRecommendations(Arrays.asList(
            "Verify sensor connectivity and power status",
            "Check network connectivity in the region",
            "Review device maintenance schedule",
            "Re-run report after sensor data becomes available",
            "Contact technical support if sensors remain offline"
        ));
        
        log.info("Suppressed prediction generated - reportingSensors={}, archivedAlerts={}", 
                reportingSensorCount, archivedAlertsCount);
        
        return summary;
    }
    
    private ReportData.AlertSummary convertToAlertSummary(Alert alert) {
        ReportData.AlertSummary summary = new ReportData.AlertSummary();
        
        summary.setAlertId(alert.getId());
        summary.setType(alert.getAlertType());
        summary.setSeverity(alert.getSeverity());
        summary.setStatus(alert.getStatus());
        summary.setDescription(alert.getDescription());
        summary.setDeviceId(alert.getSensorId());
        
        if (alert.getTriggeredAt() != null) {
            summary.setTimestamp(DateTimeFormatter.ISO_INSTANT.format(
                Instant.ofEpochSecond(alert.getTriggeredAt().getSeconds())));
        }
        
        return summary;
    }
    
    private ReportData.MLPredictionSummary buildMLPredictionSummary(List<SensorReading> readings, 
                                                                     List<ReportData.AlertSummary> alerts,
                                                                     SensorDataValidator.ValidationResult validationResult,
                                                                     int reportingSensorCount) {
        ReportData.MLPredictionSummary summary = new ReportData.MLPredictionSummary();
        
        summary.setPredictionSuppressed(false);  // Normal prediction mode
        
        try {
            // This should not happen due to safety override, but keep as fallback
            if (readings.isEmpty() && alerts.isEmpty()) {
                log.warn("buildMLPredictionSummary called with no data - should have been caught by safety override");
                return buildSuppressedPrediction(reportingSensorCount, 0);
            }
            
            // Calculate real contributing factors based on actual data
            Map<String, Double> factors = new HashMap<>();
            
            // 1. Cluster Factor (0-50): Based on symptom cluster alerts
            long clusterAlerts = alerts.stream()
                .filter(a -> "SYMPTOM_CLUSTER".equals(a.getType()))
                .filter(a -> "ACTIVE".equals(a.getStatus()))
                .count();
            
            long highSeverityClusterAlerts = alerts.stream()
                .filter(a -> "SYMPTOM_CLUSTER".equals(a.getType()))
                .filter(a -> "HIGH".equals(a.getSeverity()) || "CRITICAL".equals(a.getSeverity()))
                .count();
            
            double clusterFactor = Math.min(clusterAlerts * 12.0 + highSeverityClusterAlerts * 8.0, 50.0);
            factors.put("cluster_factor", clusterFactor);
            
            // 2. Report Factor (0-20): Based on symptom reports (via alerts)
            long symptomReportAlerts = alerts.stream()
                .filter(a -> a.getType() != null && 
                           (a.getType().contains("SYMPTOM") || a.getType().contains("HEALTH")))
                .count();
            double reportFactor = Math.min(symptomReportAlerts * 3.0, 20.0);
            factors.put("report_factor", reportFactor);
            
            // 3. Quality Factor (0-20): Based on poor WQI sensors
            long poorSensors = readings.stream()
                .filter(r -> r.getWqi() != null && r.getWqi() > 75)
                .map(SensorReading::getSensorId)
                .distinct()
                .count();
            
            long veryPoorSensors = readings.stream()
                .filter(r -> r.getWqi() != null && r.getWqi() > 100)
                .map(SensorReading::getSensorId)
                .distinct()
                .count();
            
            long totalSensors = readings.stream()
                .map(SensorReading::getSensorId)
                .distinct()
                .count();
            
            double qualityFactor = 0.0;
            if (totalSensors > 0) {
                qualityFactor = (poorSensors * 15.0 / totalSensors) + (veryPoorSensors * 5.0 / totalSensors);
                qualityFactor = Math.min(qualityFactor, 20.0);
            }
            factors.put("quality_factor", qualityFactor);
            
            // 4. Source Factor (0-10): Based on water quality alerts
            long waterQualityAlerts = alerts.stream()
                .filter(a -> "WATER_QUALITY".equals(a.getType()))
                .count();
            double sourceFactor = Math.min(waterQualityAlerts * 2.5, 10.0);
            factors.put("source_factor", sourceFactor);
            
            // Calculate total risk score
            double riskScore = clusterFactor + reportFactor + qualityFactor + sourceFactor;
            
            // Check for CRITICAL alerts
            long criticalAlerts = alerts.stream()
                .filter(a -> "CRITICAL".equals(a.getSeverity()))
                .count();
            
            // Check for anomalous readings (discarded data) - EXCLUDE missing sensors
            // Missing sensors should NOT increase risk automatically
            boolean hasAnomalies = validationResult.getDiscardedCount() > 0;
            int missingCount = validationResult.getMissingCount();
            
            // Only consider it anomalous if there are actual bad readings, not just missing sensors
            boolean hasActualAnomalies = (validationResult.getDiscardedCount() - missingCount) > 0;
            
            // Determine risk level with ML SCORE ALIGNMENT
            String riskLevel;
            if (riskScore >= 75) {
                riskLevel = "CRITICAL";
            } else if (riskScore >= 50) {
                riskLevel = "HIGH";
            } else if (riskScore >= 25) {
                riskLevel = "MEDIUM";
            } else {
                riskLevel = "LOW";
            }
            
            // APPLY ML SCORE ALIGNMENT RULES
            // NOTE: Missing sensors do NOT automatically increase risk
            // Only increase risk for: clusters, poor water readings, or repeated stale data
            
            // Rule 1: If CRITICAL alert exists AND actual anomalies detected → minimum MEDIUM
            if (criticalAlerts > 0 && hasActualAnomalies && "LOW".equals(riskLevel)) {
                log.info("ML Score Alignment: Upgrading from LOW to MEDIUM due to CRITICAL alert + anomalies");
                riskLevel = "MEDIUM";
                riskScore = Math.max(riskScore, 25.0);
            }
            
            // Rule 2: If multiple actual anomalies (>3, excluding missing) OR cluster exists → minimum HIGH
            int actualAnomalyCount = validationResult.getDiscardedCount() - missingCount;
            if ((actualAnomalyCount > 3 || clusterAlerts > 0) && 
                ("LOW".equals(riskLevel) || "MEDIUM".equals(riskLevel))) {
                log.info("ML Score Alignment: Upgrading to HIGH due to multiple anomalies ({}) or cluster ({})", 
                        actualAnomalyCount, clusterAlerts);
                riskLevel = "HIGH";
                riskScore = Math.max(riskScore, 50.0);
            }
            
            // Rule 3: Do NOT allow LOW if critical alert present OR actual sensor invalidated
            // (Missing sensors alone don't trigger this)
            if ("LOW".equals(riskLevel) && (criticalAlerts > 0 || hasActualAnomalies)) {
                log.info("ML Score Alignment: Upgrading from LOW to MEDIUM due to critical alert or invalid sensors");
                riskLevel = "MEDIUM";
                riskScore = Math.max(riskScore, 25.0);
            }
            
            // Calculate confidence based on data availability and validation
            double confidence = calculateConfidence(readings, alerts, validationResult);
            
            // Generate human-readable explanation
            String explanation = generateExplanation(riskLevel, riskScore, confidence, 
                                                    clusterAlerts, highSeverityClusterAlerts, 
                                                    poorSensors, totalSensors, waterQualityAlerts,
                                                    criticalAlerts, hasActualAnomalies, missingCount);
            
            // Generate recommendations
            List<String> recommendations = generateRecommendations(riskLevel, clusterAlerts, poorSensors, waterQualityAlerts);
            
            summary.setRiskScore(riskScore);
            summary.setRiskLevel(riskLevel);
            summary.setConfidence(confidence);
            summary.setContributingFactors(factors);
            summary.setRecommendations(recommendations);
            summary.setExplanation(explanation);
            
            log.info("ML prediction calculated - Risk: {} ({}), Confidence: {}%, Factors: cluster={}, report={}, quality={}, source={}, Alignment: criticalAlerts={}, actualAnomalies={}, missingSensors={}",
                    riskScore, riskLevel, confidence, clusterFactor, reportFactor, qualityFactor, sourceFactor, criticalAlerts, hasActualAnomalies, missingCount);
            
            return summary;
            
        } catch (Exception e) {
            log.error("Error building ML prediction summary", e);
            
            // Return safe defaults
            summary.setRiskScore(0.0);
            summary.setRiskLevel("UNKNOWN");
            summary.setConfidence(0.0);
            summary.setContributingFactors(new HashMap<>());
            summary.setRecommendations(Arrays.asList("Prediction not available for this region in the last 24 hours"));
            summary.setExplanation("Error calculating risk assessment. Please try again.");
            
            return summary;
        }
    }
    
    private String generateExplanation(String riskLevel, double riskScore, double confidence,
                                       long clusterAlerts, long highSeverityClusterAlerts,
                                       long poorSensors, long totalSensors, long waterQualityAlerts,
                                       long criticalAlerts, boolean hasActualAnomalies, int missingCount) {
        StringBuilder explanation = new StringBuilder();
        
        explanation.append(String.format("Current risk is %s with a score of %.1f and confidence %.1f%%. ", 
                                        riskLevel, riskScore, confidence));
        
        // Build explanation based on contributing factors
        List<String> factors = new ArrayList<>();
        
        if (clusterAlerts > 0) {
            if (highSeverityClusterAlerts > 0) {
                factors.add(String.format("%d active symptom cluster(s) including %d high-severity case(s)", 
                                        clusterAlerts, highSeverityClusterAlerts));
            } else {
                factors.add(String.format("%d active symptom cluster(s)", clusterAlerts));
            }
        }
        
        if (poorSensors > 0 && totalSensors > 0) {
            double percentage = (poorSensors * 100.0 / totalSensors);
            factors.add(String.format("%.0f%% of sensors (%d/%d) showing poor water quality", 
                                    percentage, poorSensors, totalSensors));
        }
        
        if (waterQualityAlerts > 0) {
            factors.add(String.format("%d water quality alert(s)", waterQualityAlerts));
        }
        
        if (criticalAlerts > 0) {
            factors.add(String.format("%d CRITICAL alert(s) detected", criticalAlerts));
        }
        
        if (hasActualAnomalies) {
            factors.add("anomalous sensor readings detected and filtered");
        }
        
        // Note about missing sensors (informational, not risk-increasing)
        if (missingCount > 0) {
            factors.add(String.format("%d sensor(s) not reporting (excluded from risk calculation)", missingCount));
        }
        
        if (factors.isEmpty()) {
            explanation.append("No significant risk factors detected. ");
            explanation.append("Continue routine monitoring and maintain preventive measures.");
        } else {
            explanation.append("This is primarily driven by: ");
            for (int i = 0; i < factors.size(); i++) {
                explanation.append(factors.get(i));
                if (i < factors.size() - 2) {
                    explanation.append(", ");
                } else if (i == factors.size() - 2) {
                    explanation.append(" and ");
                } else {
                    explanation.append(".");
                }
            }
        }
        
        return explanation.toString();
    }
    
    private double calculateConfidence(List<SensorReading> readings, List<ReportData.AlertSummary> alerts,
                                      SensorDataValidator.ValidationResult validationResult) {
        double confidence = 0.0;
        
        // Sensor data availability (0-40 points)
        long uniqueSensors = readings.stream()
            .map(SensorReading::getSensorId)
            .distinct()
            .count();
        
        if (uniqueSensors >= 5) {
            confidence += 40;
        } else {
            confidence += (uniqueSensors / 5.0) * 40;
        }
        
        // Data recency (0-30 points) - if we have readings in last 24h
        if (!readings.isEmpty()) {
            confidence += 30;
        }
        
        // Alert data (0-30 points)
        if (alerts.size() >= 3) {
            confidence += 30;
        } else {
            confidence += (alerts.size() / 3.0) * 30;
        }
        
        // Reduce confidence based on data quality (validation percentage)
        double validationConfidence = validationResult.getConfidencePercentage();
        confidence = confidence * (validationConfidence / 100.0);
        
        return Math.min(confidence, 100.0);
    }
    
    private List<String> generateRecommendations(String riskLevel, long clusterAlerts, long poorSensors, long waterAlerts) {
        List<String> recommendations = new ArrayList<>();
        
        if ("CRITICAL".equals(riskLevel)) {
            recommendations.add("PRIORITY: Immediate intervention required");
            recommendations.add("PRIORITY: Deploy emergency medical teams");
            recommendations.add("Activate outbreak response protocol");
            recommendations.add("Issue public health advisory");
        } else if ("HIGH".equals(riskLevel)) {
            recommendations.add("PRIORITY: Increase surveillance and monitoring");
            recommendations.add("Prepare emergency response resources");
            recommendations.add("Issue health advisory to community");
            recommendations.add("Conduct water quality testing");
        } else if ("MEDIUM".equals(riskLevel)) {
            recommendations.add("Continue monitoring situation closely");
            recommendations.add("Increase testing frequency");
            recommendations.add("Conduct preventive health education");
            recommendations.add("Monitor water sources");
        } else {
            recommendations.add("Continue routine surveillance");
            recommendations.add("Maintain regular monitoring schedule");
        }
        
        // Add specific recommendations based on factors
        if (clusterAlerts > 0) {
            recommendations.add("PRIORITY: Investigate active symptom clusters");
        }
        if (poorSensors > 0) {
            recommendations.add("Address water quality issues at " + poorSensors + " sensor location(s)");
        }
        if (waterAlerts > 0) {
            recommendations.add("Respond to " + waterAlerts + " water quality alert(s)");
        }
        
        return recommendations;
    }
    
    private double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
    
    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : "";
    }
    
    /**
     * Build generation summary for validation and metadata
     */
    private ReportData.ReportGenerationSummary buildGenerationSummary(
            String reportMode,
            int sensorsReported,
            int sensorsOffline,
            SensorDataValidator.ValidationResult validationResult,
            int chartsGenerated,
            ReportData.MLPredictionSummary mlPrediction) {
        
        ReportData.ReportGenerationSummary summary = new ReportData.ReportGenerationSummary();
        
        summary.setReportMode(reportMode);
        summary.setSensorsReported(sensorsReported);
        summary.setSensorsOffline(sensorsOffline);
        summary.setInvalidValuesFilteredCount(
                validationResult.getDiscardedCount() + validationResult.getMissingCount()
        );
        summary.setChartsGeneratedCount(chartsGenerated);
        
        // Determine prediction status
        String predictionStatus;
        if (mlPrediction.isPredictionSuppressed()) {
            predictionStatus = "SUPPRESSED";
        } else if ("DATA_UNAVAILABLE".equals(mlPrediction.getRiskLevel())) {
            predictionStatus = "SUPPRESSED";
        } else if (mlPrediction.getConfidence() != null && mlPrediction.getConfidence() < 30) {
            predictionStatus = "UNCERTAIN";
        } else {
            predictionStatus = "COMPUTED";
        }
        summary.setPredictionStatus(predictionStatus);
        
        // Validation checks
        boolean validationPassed = true;
        StringBuilder validationMsg = new StringBuilder();
        
        // Check 1: No impossible values
        if (validationResult.getDiscardedCount() > 0) {
            validationMsg.append("✓ Filtered ").append(validationResult.getDiscardedCount())
                    .append(" invalid readings. ");
        }
        
        // Check 2: ML prediction consistency
        if ("NO_DATA".equals(reportMode) && !"SUPPRESSED".equals(predictionStatus)) {
            validationPassed = false;
            validationMsg.append("⚠ Prediction should be suppressed in NO_DATA mode. ");
        }
        
        // Check 3: Sensor count consistency
        if (sensorsReported + sensorsOffline > 0) {
            validationMsg.append("✓ Sensor counts consistent. ");
        }
        
        // Determine overall status
        String status;
        if (!validationPassed) {
            status = "PARTIAL_FIX";
        } else if ("NO_DATA".equals(reportMode)) {
            status = "PASS";
            validationMsg.append("✓ Safe report mode active (no data available).");
        } else if ("PARTIAL".equals(reportMode)) {
            status = "PASS";
            validationMsg.append("✓ Partial data report generated successfully.");
        } else {
            status = "PASS";
            validationMsg.append("✓ Full report generated successfully.");
        }
        
        summary.setStatus(status);
        summary.setValidationPassed(validationPassed);
        summary.setValidationMessage(validationMsg.toString().trim());
        
        log.info("Generation Summary: status={}, mode={}, sensors={}/{}, filtered={}, prediction={}",
                status, reportMode, sensorsReported, (sensorsReported + sensorsOffline),
                summary.getInvalidValuesFilteredCount(), predictionStatus);
        
        return summary;
    }
    
    public ReportData generateEmptyReport(String state, String district, String city, String village) {
        ReportData report = new ReportData();
        
        // Set metadata
        report.setMetadata(buildMetadata(state, district, city, village, 24));
        
        // Empty summary
        ReportData.WaterQualitySummary summary = new ReportData.WaterQualitySummary();
        summary.setTotalSensors(0);
        summary.setActiveSensors(0);
        summary.setPh(new ReportData.ParameterStats(0, 0, 0));
        summary.setTds(new ReportData.ParameterStats(0, 0, 0));
        summary.setTurbidity(new ReportData.ParameterStats(0, 0, 0));
        summary.setTemperature(new ReportData.ParameterStats(0, 0, 0));
        report.setWaterQualitySummary(summary);
        
        // Empty lists
        report.setSensorHistory(new ArrayList<>());
        report.setAlerts(new ArrayList<>());
        
        // Default ML prediction
        ReportData.MLPredictionSummary mlSummary = new ReportData.MLPredictionSummary();
        mlSummary.setRiskScore(0.0);
        mlSummary.setRiskLevel("UNKNOWN");
        mlSummary.setConfidence(0.0);
        mlSummary.setContributingFactors(new HashMap<>());
        mlSummary.setRecommendations(Arrays.asList(
            "Please verify device health on dashboard or re-run report after data update"
        ));
        report.setMlPrediction(mlSummary);
        
        // Add clarification message
        report.setClarificationMessage(
            "No recent activity detected for this region.\n\n" +
            "Possible reasons:\n" +
            "• Sensor offline or in low-connectivity zone\n" +
            "• No water quality issues detected\n" +
            "• Maintenance or network downtime\n" +
            "• Device battery drain\n\n" +
            "Recommendation:\n" +
            "Please verify device health on dashboard or re-run report after data update."
        );
        
        return report;
    }
}
