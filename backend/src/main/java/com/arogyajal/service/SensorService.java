package com.arogyajal.service;

import com.arogyajal.dto.SensorData;
import com.arogyajal.model.SensorReading;
import com.arogyajal.repository.SensorRepository;
import com.arogyajal.util.WQICalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import com.google.cloud.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class for handling sensor data operations
 */
@Service
public class SensorService {
    
    private static final Logger log = LoggerFactory.getLogger(SensorService.class);
    private final SensorRepository sensorRepository;
    private final MLPredictionService mlPredictionService;
    private final AlertService alertService;
    private final SmartAlertService smartAlertService;
    private final SensorHealthMonitorService sensorHealthMonitorService;
    private final ReverseGeocodingService reverseGeocodingService;
    
    public SensorService(SensorRepository sensorRepository, MLPredictionService mlPredictionService, 
                        AlertService alertService, SmartAlertService smartAlertService,
                        SensorHealthMonitorService sensorHealthMonitorService,
                        ReverseGeocodingService reverseGeocodingService) {
        this.sensorRepository = sensorRepository;
        this.mlPredictionService = mlPredictionService;
        this.alertService = alertService;
        this.smartAlertService = smartAlertService;
        this.sensorHealthMonitorService = sensorHealthMonitorService;
        this.reverseGeocodingService = reverseGeocodingService;
    }
    
    /**
     * Process and save sensor data
     * @param sensorData The sensor data to process and save
     * @return The saved sensor data with any additional processing
     */
    /**
     * Get sensor readings by location
     * @param location The location to get readings for
     * @return List of sensor readings for the specified location, ordered by timestamp descending
     */
    @Cacheable(value = "sensorReadings", key = "'location:' + #location")
    public List<SensorReading> getReadingsByLocation(String location) {
        try {
            return sensorRepository.findByLocationOrderByTimestampDesc(location);
        } catch (Exception e) {
            log.error("Error fetching sensor readings for location: " + location, e);
            return new ArrayList<>();
        }
    }
    
    @CacheEvict(value = {"sensorReadings", "sensors", "dashboard"}, allEntries = true)
    public SensorData processAndSaveSensorData(SensorData sensorData) {
        try {
            // Set current timestamp if not provided
            if (sensorData.getTimestamp() == null) {
                sensorData.setTimestamp(Timestamp.now());
            }
            
            // Generate a unique ID if not provided
            String deviceId = sensorData.getDeviceId();
            if (deviceId == null || deviceId.trim().isEmpty()) {
                deviceId = "DEV-" + UUID.randomUUID().toString().substring(0, 8);
                sensorData.setDeviceId(deviceId);
            }
            
            // Convert SensorData to SensorReading entity
            SensorReading reading = new SensorReading();
            reading.setSensorId(deviceId);
            reading.setTimestamp(sensorData.getTimestamp());
            
            // Set location if available
            if (sensorData.getLocation() != null) {
                reading.setLocation(sensorData.getLocation().getLat() + "," + sensorData.getLocation().getLon());
                
                // Enrich device with reverse geocoding (only for new devices)
                try {
                    reverseGeocodingService.enrichDeviceLocation(
                        deviceId, 
                        sensorData.getLocation().getLat(), 
                        sensorData.getLocation().getLon()
                    );
                } catch (Exception e) {
                    log.warn("Reverse geocoding failed for device {}: {}", deviceId, e.getMessage());
                }
            }
            
            // Set sensor readings if available
            if (sensorData.getSensors() != null) {
                // Set available sensor readings - use null/0 for missing sensors
                // Don't use fake default values - let the system know data is missing
                reading.setPh(sensorData.getSensors().getPH() != null ? 
                    sensorData.getSensors().getPH() : 0.0);
                
                reading.setTemperature(sensorData.getSensors().getTemperature_C() != null ? 
                    sensorData.getSensors().getTemperature_C() : 0.0);
                
                if (sensorData.getSensors().getTurbidity_NTU() != null) {
                    reading.setTurbidity(sensorData.getSensors().getTurbidity_NTU().doubleValue());
                } else {
                    reading.setTurbidity(0.0);
                }
                
                // DO sensor not available - set to 0
                reading.setDissolvedOxygen(0.0);
                
                if (sensorData.getSensors().getTDS_ppm() != null) {
                    reading.setTotalDissolvedSolids(sensorData.getSensors().getTDS_ppm().doubleValue());
                } else {
                    reading.setTotalDissolvedSolids(0.0);
                }
                
                // Set default values for missing sensor readings
                reading.setConductivity(0.0);  // Default value for conductivity
                reading.setChlorine(0.0);      // Default value for chlorine
                reading.setHardness(0.0);       // Default value for hardness
                reading.setWaterLevel(0.0);     // Default value for water level
                reading.setFlowRate(0.0);       // Default value for flow rate
                
                // Check if we have enough sensor data for ML prediction
                int availableSensors = 0;
                // Count only available sensors (4 sensors: pH, Temp, TDS, Turbidity)
                if (reading.getPh() != null && reading.getPh() > 0) availableSensors++;
                if (reading.getTemperature() != null && reading.getTemperature() > 0) availableSensors++;
                if (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 0) availableSensors++;
                if (reading.getTurbidity() != null && reading.getTurbidity() > 0) availableSensors++;
                // DO sensor not available - not counted
                
                boolean hasSufficientData = availableSensors >= 3;
                
                // Check sensor health
                sensorHealthMonitorService.checkSensorHealth(deviceId, hasSufficientData, reading);
                
                // Calculate WQI using formula-based calculator
                if (hasSufficientData) {
                    try {
                        double wqi = WQICalculator.calculateWQI(
                            reading.getPh(),
                            reading.getTurbidity(),
                            reading.getTotalDissolvedSolids(),
                            reading.getTemperature()
                        );
                        
                        reading.setWqi(wqi);
                        reading.setQualityStatus(WQICalculator.getSeverityLevel(wqi));
                        log.info("✅ WQI Calculated - WQI: {}, Status: {}", wqi, reading.getQualityStatus());
                        
                    } catch (Exception e) {
                        log.error("❌ Error calculating WQI: {}, using fallback", e.getMessage());
                        reading.setWqi(50.0);
                        reading.setQualityStatus(calculateQualityStatus(reading));
                    }
                } else {
                    // Not enough sensors for WQI calculation
                    log.warn("Insufficient sensor data ({} sensors) for WQI calculation. Setting defaults", availableSensors);
                    reading.setWqi(50.0);
                    reading.setQualityStatus("UNKNOWN");
                }
            } else {
                // If no sensor data is available, set all values to defaults
                reading.setPh(0.0);
                reading.setTemperature(0.0);
                reading.setTurbidity(0.0);
                reading.setDissolvedOxygen(0.0);
                reading.setTotalDissolvedSolids(0.0);
                reading.setConductivity(0.0);
                reading.setChlorine(0.0);
                reading.setHardness(0.0);
                reading.setWaterLevel(0.0);
                reading.setFlowRate(0.0);
                reading.setQualityStatus("UNKNOWN");
            }
            
            // Set battery info if available
            if (sensorData.getBattery() != null) {
                if (sensorData.getBattery().getVoltage() != null) {
                    reading.setBatteryVoltage(sensorData.getBattery().getVoltage());
                }
                if (sensorData.getBattery().getLevel() != null) {
                    reading.setBatteryLevel(sensorData.getBattery().getLevel());
                }
                log.info("Battery data saved - Voltage: {}V, Level: {}%", 
                    reading.getBatteryVoltage(), reading.getBatteryLevel());
            }
            
            // Calculate overall severity based on all parameters
            String overallSeverity = calculateOverallSeverity(reading);
            reading.setSeverity(overallSeverity);
            log.info("Calculated overall severity: {}", overallSeverity);
            
            // Save to database with a generated document ID
            String documentId = UUID.randomUUID().toString();
            reading.setId(documentId);
            
            // Debug log before save
            log.info("About to save - pH: {}, temp: {}, turbidity: {}, TDS: {}, severity: {}", 
                reading.getPh(), reading.getTemperature(), reading.getTurbidity(), 
                reading.getTotalDissolvedSolids(), reading.getSeverity());
            
            sensorRepository.save(reading, documentId);
            log.info("Saved sensor data for device: {} with ID: {}", deviceId, documentId);
            
            // Smart Alert System - Process with intelligent alert logic
            try {
                String severity = calculateSeverityForAlert(reading);
                SmartAlertService.SmartAlertResult result = 
                    smartAlertService.processSensorReading(reading, severity);
                
                log.info("🚨 Smart Alert Result: {} - {} (Device: {})", 
                    result.getAction(), result.getReason(), deviceId);
                
                // Log different actions
                switch (result.getAction()) {
                    case "ALERT_CREATED":
                        log.info("✅ Alert created: {}", result.getAlertId());
                        break;
                    case "WAITING_CONFIRMATION":
                        log.info("⏳ Waiting for repeat confirmation");
                        break;
                    case "RATE_LIMITED":
                        log.info("🚫 Alert suppressed - rate limited");
                        break;
                    case "UI_HIGHLIGHT":
                        log.info("💡 UI highlight only - no push alert");
                        break;
                    case "NO_ACTION":
                        log.info("✓ Normal reading - no alert needed");
                        break;
                }
            } catch (Exception e) {
                log.error("Error in smart alert processing: {}", e.getMessage(), e);
                // Don't fail the entire operation if alert check fails
            }
            
            return sensorData;
            
        } catch (Exception e) {
            log.error("Error saving sensor data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save sensor data", e);
        }
    }
    
    /**
     * Get the latest sensor data
     * @return The most recent sensor data, or null if no data is available
     */
    @Cacheable(value = "sensors", key = "'latest'")
    public SensorData getLatestSensorData() {
        try {
            // First try to get all device IDs
            List<String> deviceIds = getDistinctDeviceIds();
            if (deviceIds.isEmpty()) {
                log.warn("No device IDs found");
                return null;
            }
            
            log.info("Found {} device(s): {}", deviceIds.size(), deviceIds);
            
            // Get the most recent reading from each device
            List<SensorReading> latestReadings = new ArrayList<>();
            for (String deviceId : deviceIds) {
                try {
                    // Get the most recent reading for this device
                    List<SensorReading> deviceReadings = sensorRepository.findBySensorId(deviceId);
                    if (deviceReadings != null && !deviceReadings.isEmpty()) {
                        // The first one should be the most recent as per repository implementation
                        latestReadings.add(deviceReadings.get(0));
                        log.debug("Added reading for device: {} - Timestamp: {}", 
                                deviceId, 
                                deviceReadings.get(0).getTimestamp());
                    }
                } catch (Exception e) {
                    log.warn("Error getting readings for device {}: {}", deviceId, e.getMessage());
                }
            }
            
            if (latestReadings.isEmpty()) {
                log.warn("No readings found for any device");
                return null;
            }
            
            // Sort by timestamp descending to get the most recent one
            latestReadings.sort((r1, r2) -> {
                if (r1.getTimestamp() == null && r2.getTimestamp() == null) return 0;
                if (r1.getTimestamp() == null) return 1;
                if (r2.getTimestamp() == null) return -1;
                return r2.getTimestamp().compareTo(r1.getTimestamp());
            });
            
            SensorReading latestReading = latestReadings.get(0);
            log.info("Latest reading found - Device: {}, Timestamp: {}", 
                    latestReading.getSensorId(), 
                    latestReading.getTimestamp());
                    
            return convertToSensorData(latestReading);
            
        } catch (Exception e) {
            log.error("Error retrieving latest sensor data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve latest sensor data", e);
        }
    }
    
    /**
     * Get sensor data by device ID
     * @param deviceId The device ID to retrieve data for
     * @return The sensor data for the specified device, or null if not found
     */
    @Cacheable(value = "sensors", key = "'device:' + #deviceId")
    public SensorData getSensorDataByDeviceId(String deviceId) {
        try {
            log.info("Fetching sensor data for device: {}", deviceId);
            List<SensorReading> readings = sensorRepository.findBySensorId(deviceId);
            
            if (readings == null || readings.isEmpty()) {
                log.warn("No sensor data found for device: {}", deviceId);
                return null;
            }
            
            // Log the raw readings
            log.info("Raw readings for device {}: {}", deviceId, readings);
            
            // Filter out readings with null timestamps and sort the rest
            List<SensorReading> validReadings = readings.stream()
                .peek(reading -> log.debug("Reading - ID: {}, pH: {}, temp: {}, turbidity: {}, TDS: {}", 
                    reading.getId(), reading.getPh(), reading.getTemperature(), 
                    reading.getTurbidity(), reading.getTotalDissolvedSolids()))
                .filter(r -> r.getTimestamp() != null)
                .sorted((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()))
                .collect(Collectors.toList());
                
            if (validReadings.isEmpty()) {
                log.warn("No valid sensor readings with timestamps found for device: {}", deviceId);
                return null;
            }
            
            SensorReading latestReading = validReadings.get(0);
            log.info("Latest reading for device {}: pH={}, temp={}, turbidity={}, TDS={}", 
                deviceId, latestReading.getPh(), latestReading.getTemperature(), 
                latestReading.getTurbidity(), latestReading.getTotalDissolvedSolids());
                
            SensorData result = convertToSensorData(latestReading);
            log.info("Converted SensorData: {}", result);
            return result;
            
        } catch (Exception e) {
            String errorMsg = String.format("Error retrieving sensor data for device %s: %s", deviceId, e.getMessage());
            log.error(errorMsg, e);
            throw new RuntimeException(errorMsg, e);
        }
    }
    
    /**
     * Get all sensor data (for debugging and testing)
     * @return A list of all stored sensor data
     */
    public List<SensorData> getAllSensorData() {
        try {
            return sensorRepository.findAll().stream()
                .map(this::convertToSensorData)
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving all sensor data: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve all sensor data", e);
        }
    }
    
    /**
     * Get all sensor readings
     * @return List of all sensor readings
     */
    public List<SensorReading> getAllSensorReadings() {
        try {
            return sensorRepository.findAll();
        } catch (Exception e) {
            log.error("Error retrieving all sensor readings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve sensor readings", e);
        }
    }
    
    /**
     * Get readings by time range
     * @param start Start time
     * @param end End time
     * @return List of sensor readings within the time range
     */
    public List<SensorReading> getReadingsByTimeRange(Timestamp start, Timestamp end) {
        try {
            return sensorRepository.findByTimestampBetween(start, end);
        } catch (Exception e) {
            log.error("Error retrieving readings by time range: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve readings by time range", e);
        }
    }
    
    /**
     * Get sensor reading by ID
     * @param id The ID of the sensor reading to retrieve
     * @return Optional containing the sensor reading if found, empty otherwise
     */
    public Optional<SensorReading> getSensorReadingById(String id) {
        try {
            return sensorRepository.findById(id);
        } catch (Exception e) {
            log.error("Error retrieving sensor reading with ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve sensor reading with ID: " + id, e);
        }
    }
    
    /**
     * Get readings by sensor ID
     * @param sensorId The sensor ID to filter by
     * @return List of sensor readings for the specified sensor
     */
    public List<SensorReading> getReadingsBySensorId(String sensorId) {
        try {
            return sensorRepository.findBySensorId(sensorId);
        } catch (Exception e) {
            log.error("Error retrieving readings for sensor {}: {}", sensorId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve readings for sensor: " + sensorId, e);
        }
    }
    

    /**
     * Get recent sensor readings
     * @param limit Maximum number of readings to return
     * @return List of recent sensor data
     */
    public List<SensorData> getRecentReadings(int limit) {
        try {
            List<SensorReading> allReadings = sensorRepository.findAll();
            
            // Sort by timestamp in descending order (newest first)
            allReadings.sort((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()));
            
            // Limit the number of results
            List<SensorReading> recentReadings = allReadings.stream()
                .limit(limit)
                .collect(Collectors.toList());
                
            // Convert to SensorData DTOs
            return recentReadings.stream()
                .map(this::convertToSensorData)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error fetching recent readings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch recent readings", e);
        }
    }
    
    /**
     * Get latest reading by sensor ID
     * @param sensorId The sensor ID to get the latest reading for
     * @return Optional containing the latest sensor reading if found, empty otherwise
     */
    public Optional<SensorReading> getLatestReadingBySensorId(String sensorId) {
        try {
            List<SensorReading> readings = sensorRepository.findBySensorId(sensorId);
            if (readings.isEmpty()) {
                return Optional.empty();
            }
            readings.sort((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()));
            return Optional.of(readings.get(0));
        } catch (Exception e) {
            log.error("Error retrieving latest reading for sensor {}: {}", sensorId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve latest reading for sensor: " + sensorId, e);
        }
    }
    
    /**
     * Get sensor readings by quality status
     * @param qualityStatus The quality status to filter by (e.g., GOOD, WARNING, CRITICAL)
     * @return List of sensor readings with the specified quality status
     */
    public List<SensorReading> getReadingsByQualityStatus(String qualityStatus) {
        try {
            log.info("Retrieving readings with quality status: {}", qualityStatus);
            return sensorRepository.findAll().stream()
                .filter(reading -> qualityStatus.equalsIgnoreCase(reading.getQualityStatus()))
                .sorted((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving readings with quality status {}: {}", qualityStatus, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve readings by quality status", e);
        }
    }
    
    /**
     * Get critical sensor readings
     * @return List of critical sensor readings
     */
    public List<SensorReading> getCriticalReadings() {
        return getReadingsByQualityStatus("CRITICAL");
    }
    
    /**
     * Get sensor readings by NER state
     * @param state The state name (Assam, Meghalaya, etc.)
     * @return List of sensor readings from the specified state
     */
    public List<SensorReading> getReadingsByState(String state) {
        try {
            log.info("Retrieving readings for state: {}", state);
            return sensorRepository.findAll().stream()
                .filter(reading -> reading.getLocation() != null && 
                        reading.getLocation().toLowerCase().contains(state.toLowerCase()))
                .sorted((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()))
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error retrieving readings for state {}: {}", state, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve readings by state", e);
        }
    }
    
    /**
     * Process bulk sensor data
     * @param sensorDataList List of sensor data to process
     * @return Number of successfully processed readings
     */
    @CacheEvict(value = {"sensorReadings", "sensors", "dashboard"}, allEntries = true)
    public int processBulkSensorData(List<SensorData> sensorDataList) {
        int successCount = 0;
        for (SensorData sensorData : sensorDataList) {
            try {
                processAndSaveSensorData(sensorData);
                successCount++;
            } catch (Exception e) {
                log.error("Error processing sensor data for device {}: {}", 
                    sensorData.getDeviceId(), e.getMessage());
            }
        }
        log.info("Bulk processing complete: {}/{} successful", successCount, sensorDataList.size());
        return successCount;
    }
    
    /**
     * Get all distinct sensor IDs
     * @return List of unique sensor IDs
     */
    public List<String> getDistinctSensorIds() {
        try {
            return sensorRepository.findDistinctSensorIds();
        } catch (Exception e) {
            log.error("Error retrieving distinct sensor IDs: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve distinct sensor IDs", e);
        }
    }
    
    /**
     * Get all distinct locations
     * @return List of unique locations
     */
    public List<String> getDistinctLocations() {
        try {
            return sensorRepository.findDistinctLocations();
        } catch (Exception e) {
            log.error("Error retrieving distinct locations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve distinct locations", e);
        }
    }
    
    /**
     * Get sensor count by location
     * @param location The location to count sensors for
     * @return Count of sensors at the specified location
     */
    public long getSensorCountByLocation(String location) {
        try {
            return sensorRepository.countByLocation(location);
        } catch (Exception e) {
            log.error("Error counting sensors for location {}: {}", location, e.getMessage(), e);
            throw new RuntimeException("Failed to count sensors by location", e);
        }
    }
    
    public List<String> getDistinctDeviceIds() {
        try {
            return sensorRepository.findDistinctDeviceIds();
        } catch (Exception e) {
            log.error("Error getting distinct device IDs: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get distinct device IDs", e);
        }
    }
    

    public long getTotalReadings() {
        try {
            return sensorRepository.count();
        } catch (Exception e) {
            log.error("Error getting total readings: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get total readings", e);
        }
    }
    
    
    /**
     * Debug method to log all sensor data for a specific device
     * @param deviceId The device ID to get data for
     */
    public void debugDeviceData(String deviceId) {
        try {
            log.info("===== DEBUGGING DEVICE DATA FOR: {} =====", deviceId);
            List<SensorReading> readings = sensorRepository.findBySensorId(deviceId);
            
            if (readings == null || readings.isEmpty()) {
                log.info("No data found for device: {}", deviceId);
                return;
            }
            
            log.info("Found {} readings for device: {}", readings.size(), deviceId);
            
            for (int i = 0; i < readings.size(); i++) {
                SensorReading reading = readings.get(i);
                log.info("\n--- Reading {} ---\n" +
                        "ID: {}\n" +
                        "Timestamp: {}\n" +
                        "pH: {}\n" +
                        "Temperature: {}\n" +
                        "Turbidity: {}\n" +
                        "Dissolved Oxygen: {}\n" +
                        "Conductivity: {}\n" +
                        "Total Dissolved Solids: {}\n" +
                        "Chlorine: {}\n" +
                        "Hardness: {}\n" +
                        "Water Level: {}\n" +
                        "Flow Rate: {}\n" +
                        "Quality Status: {}",
                        i + 1,
                        reading.getId(),
                        reading.getTimestamp(),
                        reading.getPh(),
                        reading.getTemperature(),
                        reading.getTurbidity(),
                        reading.getDissolvedOxygen(),
                        reading.getConductivity(),
                        reading.getTotalDissolvedSolids(),
                        reading.getChlorine(),
                        reading.getHardness(),
                        reading.getWaterLevel(),
                        reading.getFlowRate(),
                        reading.getQualityStatus()
                );
            }
            
        } catch (Exception e) {
            log.error("Error debugging device data: {}", e.getMessage(), e);
        }
    }
    
    public SensorData convertToSensorData(SensorReading reading) {
        if (reading == null) {
            return null;
        }
        
        log.info("Converting SensorReading to SensorData: {}", reading);
        
        SensorData sensorData = new SensorData();
        sensorData.setDeviceId(reading.getSensorId());
        sensorData.setTimestamp(reading.getTimestamp());
        
        // Set location (default to null if not available)
        if (reading.getLocation() != null) {
            try {
                // Assuming location is stored as "lat,lon" in the database
                String[] latLon = reading.getLocation().split(",");
                if (latLon.length == 2) {
                    SensorData.Location location = new SensorData.Location();
                    location.setLat(Double.parseDouble(latLon[0].trim()));
                    location.setLon(Double.parseDouble(latLon[1].trim()));
                    sensorData.setLocation(location);
                }
            } catch (Exception e) {
                log.warn("Failed to parse location: " + reading.getLocation(), e);
            }
        }
        
        // Set sensor readings
        SensorData.Sensors sensors = new SensorData.Sensors();
        
        // Set each sensor value with debug logging
        if (reading.getPh() != null) {
            log.debug("Setting pH: {}", reading.getPh());
            sensors.setPH(reading.getPh());
        }
        if (reading.getTemperature() != null) {
            log.debug("Setting temperature: {}", reading.getTemperature());
            sensors.setTemperature_C(reading.getTemperature());
        }
        if (reading.getTurbidity() != null) {
            log.debug("Setting turbidity: {}", reading.getTurbidity());
            sensors.setTurbidity_NTU(reading.getTurbidity());
        }
        // DO sensor not available - not included in response
        if (reading.getTotalDissolvedSolids() != null) {
            int tdsValue = reading.getTotalDissolvedSolids().intValue();
            log.debug("Setting TDS: {}", tdsValue);
            sensors.setTDS_ppm(tdsValue);
        }
        
        // Log the sensors object before setting it
        log.debug("Created sensors object: {}", sensors);
        
        // Always set the sensors object, even if all values are null
        sensorData.setSensors(sensors);
        
        // Set battery data from SensorReading fields (preferred) or extract from notes (fallback)
        SensorData.Battery battery = new SensorData.Battery();
        
        // First try to get from dedicated fields
        if (reading.getBatteryVoltage() != null) {
            battery.setVoltage(reading.getBatteryVoltage());
            log.debug("Battery voltage from field: {}V", reading.getBatteryVoltage());
        }
        if (reading.getBatteryLevel() != null) {
            battery.setLevel(reading.getBatteryLevel());
            log.debug("Battery level from field: {}%", reading.getBatteryLevel());
        }
        
        // Fallback: Extract battery voltage from notes if fields are empty
        if (battery.getVoltage() == null && reading.getNotes() != null && reading.getNotes().contains("Battery Voltage:")) {
            try {
                String notes = reading.getNotes();
                int startIndex = notes.indexOf("Battery Voltage: ") + "Battery Voltage: ".length();
                int endIndex = notes.indexOf("V", startIndex);
                if (endIndex > startIndex) {
                    String voltageStr = notes.substring(startIndex, endIndex).trim();
                    Double voltage = Double.parseDouble(voltageStr);
                    battery.setVoltage(voltage);
                    log.debug("Extracted battery voltage from notes: {}V", voltage);
                }
            } catch (Exception e) {
                log.warn("Failed to parse battery voltage from notes: {}", reading.getNotes());
            }
        }
        
        sensorData.setBattery(battery);
        
        // Set quality status from reading
        sensorData.setQualityStatus(reading.getQualityStatus());
        
        // Log the final sensor data
        log.info("Converted SensorData: {}", sensorData);
        
        return sensorData;
    }
    
    /**
     * Fallback method to calculate quality status based on water parameters
     * Used when ML service is unavailable
     */
    private String calculateQualityStatus(SensorReading reading) {
        int criticalCount = 0;
        int warningCount = 0;
        int availableSensors = 0;
        
        // Check pH (ideal: 6.5-8.5)
        if (reading.getPh() != null && reading.getPh() > 0) {
            availableSensors++;
            if (reading.getPh() < 6.0 || reading.getPh() > 9.0) {
                criticalCount++;
            } else if (reading.getPh() < 6.5 || reading.getPh() > 8.5) {
                warningCount++;
            }
        }
        
        // Check temperature (ideal: 15-30°C)
        if (reading.getTemperature() != null && reading.getTemperature() > 0) {
            availableSensors++;
            if (reading.getTemperature() > 35 || reading.getTemperature() < 10) {
                criticalCount++;
            } else if (reading.getTemperature() > 30 || reading.getTemperature() < 15) {
                warningCount++;
            }
        }
        
        // Check TDS (ideal: < 500 ppm)
        if (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 0) {
            availableSensors++;
            if (reading.getTotalDissolvedSolids() > 1000) {
                criticalCount++;
            } else if (reading.getTotalDissolvedSolids() > 500) {
                warningCount++;
            }
        }
        
        // DO sensor not available - not checked
        
        // Check turbidity (ideal: < 5 NTU)
        if (reading.getTurbidity() != null && reading.getTurbidity() > 0) {
            availableSensors++;
            if (reading.getTurbidity() > 10) {
                criticalCount++;
            } else if (reading.getTurbidity() > 5) {
                warningCount++;
            }
        }
        
        // If less than 3 sensors available, return UNKNOWN
        if (availableSensors < 3) {
            log.warn("Insufficient sensor data for quality assessment. Available sensors: {}", availableSensors);
            return "UNKNOWN";
        }
        
        // Determine overall status
        if (criticalCount > 0) {
            return "CRITICAL";
        } else if (warningCount > 1) {
            return "WARNING";
        } else if (warningCount == 1) {
            return "GOOD";
        } else {
            return "EXCELLENT";
        }
    }
    
    /**
     * Calculate severity for smart alert system
     * Returns: NORMAL, MODERATE, HIGH, or CRITICAL
     */
    private String calculateSeverityForAlert(SensorReading reading) {
        int criticalCount = 0;
        int highCount = 0;
        int moderateCount = 0;
        
        // pH check (ideal: 6.5-8.5)
        if (reading.getPh() != null && reading.getPh() > 0) {
            if (reading.getPh() < 4.0 || reading.getPh() > 10.0) {
                criticalCount++;
            } else if (reading.getPh() < 5.0 || reading.getPh() > 9.0) {
                highCount++;
            } else if (reading.getPh() < 6.5 || reading.getPh() > 8.5) {
                moderateCount++;
            }
        }
        
        // TDS check (ideal: <500 ppm)
        if (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 0) {
            if (reading.getTotalDissolvedSolids() > 1000) {
                criticalCount++;
            } else if (reading.getTotalDissolvedSolids() > 750) {
                highCount++;
            } else if (reading.getTotalDissolvedSolids() > 500) {
                moderateCount++;
            }
        }
        
        // Turbidity check (ideal: <5 NTU)
        if (reading.getTurbidity() != null && reading.getTurbidity() > 0) {
            if (reading.getTurbidity() > 10) {
                criticalCount++;
            } else if (reading.getTurbidity() > 7) {
                highCount++;
            } else if (reading.getTurbidity() > 5) {
                moderateCount++;
            }
        }
        
        // Temperature check (ideal: 15-30°C)
        if (reading.getTemperature() != null && reading.getTemperature() > 0) {
            if (reading.getTemperature() > 35 || reading.getTemperature() < 10) {
                criticalCount++;
            } else if (reading.getTemperature() > 32 || reading.getTemperature() < 15) {
                highCount++;
            } else if (reading.getTemperature() > 30) {
                moderateCount++;
            }
        }
        
        // Determine overall severity
        if (criticalCount > 0) return "CRITICAL";
        if (highCount > 1) return "HIGH";
        if (highCount == 1 || moderateCount > 1) return "MODERATE";
        return "NORMAL";
    }
    
    /**
     * Calculate overall severity based on all available sensor parameters
     * Uses AlertService.getSeverityForParameter for each parameter
     * Returns the highest severity: CRITICAL > HIGH > MEDIUM > LOW
     */
    private String calculateOverallSeverity(SensorReading reading) {
        String highestSeverity = "LOW";
        int highestLevel = 0;
        
        // Severity hierarchy: LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4
        java.util.Map<String, Integer> severityLevels = java.util.Map.of(
            "LOW", 1,
            "MEDIUM", 2,
            "HIGH", 3,
            "CRITICAL", 4
        );
        
        try {
            // Check pH
            if (reading.getPh() != null && reading.getPh() > 0) {
                String severity = alertService.getSeverityForParameter("pH", reading.getPh());
                int level = severityLevels.getOrDefault(severity, 0);
                if (level > highestLevel) {
                    highestLevel = level;
                    highestSeverity = severity;
                }
            }
            
            // Check Temperature
            if (reading.getTemperature() != null && reading.getTemperature() > 0) {
                String severity = alertService.getSeverityForParameter("Temperature", reading.getTemperature());
                int level = severityLevels.getOrDefault(severity, 0);
                if (level > highestLevel) {
                    highestLevel = level;
                    highestSeverity = severity;
                }
            }
            
            // Check Turbidity
            if (reading.getTurbidity() != null && reading.getTurbidity() > 0) {
                String severity = alertService.getSeverityForParameter("Turbidity", reading.getTurbidity());
                int level = severityLevels.getOrDefault(severity, 0);
                if (level > highestLevel) {
                    highestLevel = level;
                    highestSeverity = severity;
                }
            }
            
            // DO sensor not available - not checked
            // Disabled - DO sensor not available
            
            // Check Conductivity
            if (reading.getConductivity() != null && reading.getConductivity() > 0) {
                String severity = alertService.getSeverityForParameter("Conductivity", reading.getConductivity());
                int level = severityLevels.getOrDefault(severity, 0);
                if (level > highestLevel) {
                    highestLevel = level;
                    highestSeverity = severity;
                }
            }
            
            // Check TDS
            if (reading.getTotalDissolvedSolids() != null && reading.getTotalDissolvedSolids() > 0) {
                String severity = alertService.getSeverityForParameter("TDS", reading.getTotalDissolvedSolids());
                int level = severityLevels.getOrDefault(severity, 0);
                if (level > highestLevel) {
                    highestLevel = level;
                    highestSeverity = severity;
                }
            }
            
        } catch (Exception e) {
            log.error("Error calculating overall severity: {}", e.getMessage(), e);
            return "MEDIUM"; // Default to MEDIUM on error
        }
        
        return highestSeverity;
    }
}
