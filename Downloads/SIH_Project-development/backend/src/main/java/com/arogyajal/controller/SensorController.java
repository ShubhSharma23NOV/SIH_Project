package com.arogyajal.controller;

import com.arogyajal.dto.SensorData;
import com.arogyajal.dto.WaterQualityResponse;
import com.arogyajal.model.SensorReading;
import com.arogyajal.service.SensorService;
import com.arogyajal.service.WaterQualityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.google.cloud.Timestamp;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;



@RestController
@RequestMapping("/api")
@Tag(name = "Sensor Data API", description = "APIs for IoT sensor data from North East India water sources")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
public class SensorController {

    private static final Logger log = LoggerFactory.getLogger(SensorController.class);
    private final SensorService sensorService;
    private final WaterQualityService waterQualityService;
    
    // Cache for sensor readings (30 second TTL to reduce Firestore reads)
    private List<SensorReading> cachedReadings = null;
    private long readingsCacheTimestamp = 0;
    private static final long READINGS_CACHE_TTL_MS = 30000; // 30 seconds

    public SensorController(SensorService sensorService, WaterQualityService waterQualityService) {
        this.sensorService = sensorService;
        this.waterQualityService = waterQualityService;
    }
    
    /**
     * Alias endpoint for frontend compatibility
     * Maps /api/sensors/readings to /api/sensors/sensor-data/readings
     * CACHED for 30 seconds to reduce Firestore reads (saves quota!)
     */
    @GetMapping("/sensors/readings")
    @Operation(summary = "Get all sensor readings (alias)", 
              description = "Alias endpoint for frontend - retrieves all sensor readings")
    public ResponseEntity<List<SensorReading>> getSensorReadingsAlias() {
        log.info("Fetching all sensor readings via alias endpoint");
        
        // Check cache first
        long now = System.currentTimeMillis();
        if (cachedReadings != null && (now - readingsCacheTimestamp) < READINGS_CACHE_TTL_MS) {
            log.info("✅ Returning cached sensor readings ({} readings, age: {}ms)", 
                    cachedReadings.size(), now - readingsCacheTimestamp);
            return ResponseEntity.ok(cachedReadings);
        }
        
        try {
            List<SensorReading> readings = sensorService.getAllSensorReadings();
            
            // Update cache
            cachedReadings = readings;
            readingsCacheTimestamp = now;
            
            log.info("Fetched {} sensor readings from Firestore (cached for 30s)", readings.size());
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error fetching sensor readings", e);
            return ResponseEntity.ok(new ArrayList<>()); // Return empty list instead of error
        }
    }
    
    /**
     * Alias endpoint for test compatibility
     * Maps /api/sensors/sensor-data/readings to /api/sensor-data/readings
     */
    @GetMapping("/sensors/sensor-data/readings")
    @Operation(summary = "Get recent sensor readings (alias)", 
              description = "Alias endpoint for tests - retrieves recent sensor readings")
    public ResponseEntity<List<SensorData>> getSensorDataReadingsAlias(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Fetching recent sensor readings via alias endpoint with limit: {}", limit);
        try {
            List<SensorData> readings = sensorService.getRecentReadings(limit);
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error fetching recent readings", e);
            return ResponseEntity.ok(new ArrayList<>()); // Return empty list instead of error
        }
    }

    @GetMapping("/sensor-data")
    @Operation(summary = "Get all sensor data", 
              description = "Retrieve all sensor readings (for WhatsApp/browser compatibility)")
    public ResponseEntity<List<SensorReading>> getAllSensorData() {
        log.info("GET request for all sensor data");
        try {
            List<SensorReading> readings = sensorService.getAllSensorReadings();
            log.info("Returning {} sensor readings", readings.size());
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error fetching all sensor data", e);
            return ResponseEntity.ok(new ArrayList<>()); // Return empty list instead of error
        }
    }
    
    @PostMapping("/sensor-data")
    @Operation(summary = "Submit sensor data", 
              description = "Receive sensor data from IoT devices in JSON format")
    public ResponseEntity<Map<String, Object>> receiveSensorData(
            @Valid @RequestBody SensorData sensorData) {
        
        log.info("Received sensor data from device: {}", sensorData.getDeviceId());
        
        try {
            // Process and save the sensor data
            SensorData savedData = sensorService.processAndSaveSensorData(sensorData);
            
            // Log the received data
            if (sensorData.getLocation() != null) {
                log.info("Location: {}°N, {}°E", 
                        sensorData.getLocation().getLat(), 
                        sensorData.getLocation().getLon());
            }
            
            if (sensorData.getSensors() != null) {
                log.info("Sensors - pH: {}, Temp: {}°C, TDS: {}ppm, DO: {}mg/L, Turbidity: {}NTU",
                        sensorData.getSensors().getPH() != null ? sensorData.getSensors().getPH() : "N/A",
                        sensorData.getSensors().getTemperature_C() != null ? sensorData.getSensors().getTemperature_C() : "N/A",
                        sensorData.getSensors().getTDS_ppm() != null ? sensorData.getSensors().getTDS_ppm() : "N/A",
                        sensorData.getSensors().getTurbidity_NTU() != null ? sensorData.getSensors().getTurbidity_NTU() : "N/A");
            }
            
            // Create a success response
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Data received and processed successfully");
            response.put("deviceId", savedData.getDeviceId());
            response.put("timestamp", savedData.getTimestamp().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error processing sensor data: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to process sensor data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/sensor-data/readings")
    @Operation(summary = "Get recent sensor readings",
              description = "Retrieve a list of recent sensor readings with pagination")
    public ResponseEntity<List<SensorData>> getRecentReadings(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<SensorData> readings = sensorService.getRecentReadings(limit);
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error fetching recent readings: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/sensor-data/latest")
    @Operation(summary = "Get latest sensor data", 
              description = "Retrieve the most recent sensor data")
    public ResponseEntity<?> getLatestSensorData() {
        try {
            SensorData latestData = sensorService.getLatestSensorData();
            if (latestData != null) {
                return ResponseEntity.ok(latestData);
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "No sensor data available");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error retrieving latest sensor data: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve latest sensor data: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/sensor-data/device/{deviceId}")
    @Operation(summary = "Get latest sensor data by device ID", 
              description = "Retrieve the most recent sensor data for a specific device")
    public ResponseEntity<?> getLatestSensorDataByDeviceId(
            @Parameter(description = "Device ID") @PathVariable String deviceId) {
        try {
            SensorData sensorData = sensorService.getSensorDataByDeviceId(deviceId);
            if (sensorData != null) {
                return ResponseEntity.ok(sensorData);
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "No data available for device: " + deviceId);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error retrieving sensor data for device {}: {}", deviceId, e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve sensor data: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/sensor-data/debug/{deviceId}")
    @Operation(summary = "Debug endpoint to log all data for a device",
              description = "Debug endpoint that logs all sensor data for a specific device")
    public ResponseEntity<?> debugDeviceData(@PathVariable String deviceId) {
        try {
            sensorService.debugDeviceData(deviceId);
            return ResponseEntity.ok().body("Debug information logged for device: " + deviceId);
        } catch (Exception e) {
            log.error("Error in debugDeviceData: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                             .body("Error debugging device data: " + e.getMessage());
        }
    }
    
    @GetMapping("/sensor-data/device-ids")
    @Operation(summary = "List all device IDs",
              description = "Get a list of all available device IDs in the system")
    public ResponseEntity<Map<String, Object>> listDeviceIds() {
        log.info("Fetching all device IDs");
        try {
            List<String> deviceIds = sensorService.getDistinctDeviceIds();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("count", deviceIds.size());
            response.put("deviceIds", deviceIds);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching device IDs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Failed to fetch device IDs: " + e.getMessage()));
        }
    }
    
    @GetMapping("/sensor-data/statistics")
    @Operation(summary = "Get sensor data statistics",
              description = "Get statistics about the sensor data")
    public ResponseEntity<SensorStatisticsResponse> getStatistics() {
        log.info("Fetching sensor data statistics");
        try {
            SensorStatisticsResponse response = new SensorStatisticsResponse();
            response.setTotalReadings(sensorService.getTotalReadings());
            response.setDeviceIds(sensorService.getDistinctDeviceIds());
            response.setLocations(sensorService.getDistinctLocations());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching sensor data statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/water-quality/{deviceId}")
    @Operation(summary = "Get water quality assessment for device",
              description = "Returns comprehensive water quality evaluation with government-standard scoring")
    public ResponseEntity<WaterQualityResponse> getWaterQuality(
            @Parameter(description = "Device ID") @PathVariable String deviceId) {
        log.info("Fetching water quality assessment for device: {}", deviceId);
        try {
            // Get latest reading for device
            Optional<SensorReading> latestReading = sensorService.getLatestReadingBySensorId(deviceId);
            
            if (latestReading.isEmpty()) {
                log.warn("No readings found for device: {}", deviceId);
                return ResponseEntity.notFound().build();
            }
            
            // Calculate water quality using government-standard rules
            WaterQualityResponse response = waterQualityService.calculateWaterQuality(latestReading.get());
            
            log.info("Water quality for {}: {} - {}", deviceId, response.getFinalStatus(), response.getStatusReason());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error calculating water quality for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/all-readings")
    @Operation(summary = "Get all sensor readings", description = "Retrieve all sensor readings")
    public ResponseEntity<List<SensorReading>> getAllSensorReadings() {
        log.info("Retrieving all sensor readings");
        try {
            List<SensorReading> readings = sensorService.getAllSensorReadings();
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving all sensor readings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/sensor-data/readings/time-range")
    @Operation(summary = "Get readings by time range", 
              description = "Retrieve sensor readings within a specific time range")
    public ResponseEntity<List<SensorReading>> getReadingsByTimeRange(
            @Parameter(description = "Start time in seconds since epoch") @RequestParam long startSeconds,
            @Parameter(description = "End time in seconds since epoch") @RequestParam long endSeconds) {
        Timestamp start = Timestamp.ofTimeSecondsAndNanos(startSeconds, 0);
        Timestamp end = Timestamp.ofTimeSecondsAndNanos(endSeconds, 0);
        log.info("Retrieving readings between {} and {}", start, end);
        try {
            List<SensorReading> readings = sensorService.getReadingsByTimeRange(start, end);
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving readings by time range: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/{id}")
    @Operation(summary = "Get sensor reading by ID", description = "Retrieve a specific sensor reading by its ID")
    public ResponseEntity<SensorReading> getSensorReadingById(
            @Parameter(description = "Sensor reading ID") @PathVariable String id) {
        log.info("Retrieving sensor reading by ID: {}", id);
        try {
            return sensorService.getSensorReadingById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving sensor reading with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/sensor/{sensorId}")
    @Operation(summary = "Get readings by sensor ID", description = "Retrieve all readings for a specific sensor")
    public ResponseEntity<List<SensorReading>> getReadingsBySensorId(
            @Parameter(description = "Sensor ID") @PathVariable String sensorId) {
        log.info("Retrieving readings for sensor: {}", sensorId);
        try {
            List<SensorReading> readings = sensorService.getReadingsBySensorId(sensorId);
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving readings for sensor {}: {}", sensorId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/sensor/{sensorId}/latest")
    @Operation(summary = "Get latest reading by sensor ID", 
              description = "Retrieve the most recent reading for a specific sensor")
    public ResponseEntity<SensorReading> getLatestReadingBySensorId(
            @Parameter(description = "Sensor ID") @PathVariable String sensorId) {
        log.info("Retrieving latest reading for sensor: {}", sensorId);
        try {
            return sensorService.getLatestReadingBySensorId(sensorId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving latest reading for sensor {}: {}", sensorId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/quality/{qualityStatus}")
    @Operation(summary = "Get readings by quality status", 
              description = "Retrieve readings filtered by quality status (GOOD, WARNING, CRITICAL)")
    public ResponseEntity<List<SensorReading>> getReadingsByQualityStatus(
            @Parameter(description = "Quality status (GOOD, WARNING, CRITICAL)") @PathVariable String qualityStatus) {
        log.info("Retrieving readings with quality status: {}", qualityStatus);
        try {
            List<SensorReading> readings = sensorService.getReadingsByQualityStatus(qualityStatus.toUpperCase());
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving readings with quality status {}: {}", qualityStatus, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/critical")
    @Operation(summary = "Get critical readings", 
              description = "Retrieve all readings with critical water quality parameters")
    public ResponseEntity<List<SensorReading>> getCriticalReadings() {
        log.info("Retrieving critical sensor readings");
        try {
            List<SensorReading> readings = sensorService.getCriticalReadings();
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving critical readings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/sensor-data/readings/state/{state}")
    @Operation(summary = "Get readings by NER state", 
              description = "Filter sensor readings by North East India state (Assam, Meghalaya, etc.)")
    public ResponseEntity<List<SensorReading>> getReadingsByState(
            @Parameter(description = "State name") @PathVariable String state) {
        log.info("Retrieving readings for state: {}", state);
        try {
            List<SensorReading> readings = sensorService.getReadingsByState(state);
            return ResponseEntity.ok(readings);
        } catch (Exception e) {
            log.error("Error retrieving readings for state {}: {}", state, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/sensor-data/bulk")
    @Operation(summary = "Bulk sensor data ingestion", 
              description = "Submit multiple sensor readings at once")
    public ResponseEntity<Map<String, Object>> receiveBulkSensorData(
            @Valid @RequestBody List<SensorData> sensorDataList) {
        log.info("Received bulk sensor data: {} readings", sensorDataList.size());
        try {
            int successCount = sensorService.processBulkSensorData(sensorDataList);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Bulk data processed");
            response.put("totalReceived", sensorDataList.size());
            response.put("successfullyProcessed", successCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing bulk sensor data: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to process bulk data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    
    // Inner class for sensor statistics response
    public static class SensorStatisticsResponse {
        private long totalReadings;
        private List<String> deviceIds;
        private List<String> locations;
        
        public SensorStatisticsResponse() {
            this.deviceIds = new ArrayList<>();
            this.locations = new ArrayList<>();
        }
        
        public long getTotalReadings() {
            return totalReadings;
        }
        
        public void setTotalReadings(long totalReadings) {
            this.totalReadings = totalReadings;
        }
        
        public List<String> getDeviceIds() {
            return deviceIds;
        }
        
        public void setDeviceIds(List<String> deviceIds) {
            this.deviceIds = deviceIds;
        }
        
        public List<String> getLocations() {
            return locations;
        }
        
        public void setLocations(List<String> locations) {
            this.locations = locations;
        }
    }
}
