package com.arogyajal.controller;

import com.arogyajal.model.SensorHealth;
import com.arogyajal.repository.SensorHealthRepository;
import com.arogyajal.service.SensorHealthMonitorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensor-health")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
@Tag(name = "Sensor Health API", description = "APIs for monitoring sensor health and detecting faults")
public class SensorHealthController {
    
    private final SensorHealthMonitorService sensorHealthMonitorService;
    private final SensorHealthRepository sensorHealthRepository;
    
    public SensorHealthController(SensorHealthMonitorService sensorHealthMonitorService,
                                 SensorHealthRepository sensorHealthRepository) {
        this.sensorHealthMonitorService = sensorHealthMonitorService;
        this.sensorHealthRepository = sensorHealthRepository;
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get sensor health statistics", 
              description = "Get overall sensor health statistics including healthy, degraded, and faulty sensors")
    public ResponseEntity<Map<String, Object>> getSensorHealthStats() {
        Map<String, Object> stats = sensorHealthMonitorService.getSensorHealthStats();
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/status/{deviceId}")
    @Operation(summary = "Get sensor status", 
              description = "Get health status of a specific sensor")
    public ResponseEntity<Map<String, Object>> getSensorStatus(@PathVariable String deviceId) {
        String status = sensorHealthMonitorService.getSensorStatus(deviceId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("deviceId", deviceId);
        response.put("status", status);
        response.put("description", getStatusDescription(status));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/all-statuses")
    @Operation(summary = "Get all sensor statuses", 
              description = "Get health status of all sensors")
    public ResponseEntity<Map<String, String>> getAllSensorStatuses() {
        Map<String, String> statuses = sensorHealthMonitorService.getAllSensorStatuses();
        return ResponseEntity.ok(statuses);
    }
    
    @GetMapping("/all-details")
    @Operation(summary = "Get all sensor health details from Firebase", 
              description = "Get detailed health information for all sensors from Firebase")
    public ResponseEntity<List<SensorHealth>> getAllSensorHealthDetails() {
        List<SensorHealth> healthDetails = sensorHealthRepository.findAll();
        return ResponseEntity.ok(healthDetails);
    }
    
    @PostMapping("/reset/{deviceId}")
    @Operation(summary = "Reset sensor health history", 
              description = "Reset health monitoring history for a sensor (for testing or after maintenance)")
    public ResponseEntity<Map<String, Object>> resetSensorHealth(@PathVariable String deviceId) {
        sensorHealthMonitorService.resetSensorHealth(deviceId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Sensor health history reset successfully");
        response.put("deviceId", deviceId);
        
        return ResponseEntity.ok(response);
    }
    
    private String getStatusDescription(String status) {
        switch (status) {
            case "HEALTHY":
                return "Sensor is functioning normally and sending complete data";
            case "DEGRADED":
                return "Sensor is sending incomplete data. Check connections and calibration";
            case "FAULTY":
                return "Sensor has critical issues. Immediate maintenance required";
            default:
                return "Sensor status unknown";
        }
    }
}
