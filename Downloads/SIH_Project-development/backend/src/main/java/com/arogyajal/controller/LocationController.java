package com.arogyajal.controller;

import com.arogyajal.model.DeviceRegistry;
import com.arogyajal.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Location Hierarchy API
 * Provides cascading filters: State → District → City/Town → Village → Device
 */
@RestController
@RequestMapping("/api/locations")
@Tag(name = "Location API", description = "Hierarchical location filtering for North East India regions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"}, 
           allowedHeaders = "*", 
           allowCredentials = "true")
public class LocationController {
    
    private static final Logger log = LoggerFactory.getLogger(LocationController.class);
    private final LocationService locationService;
    
    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }
    
    @GetMapping("/states")
    @Operation(summary = "Get all states",
              description = "Returns list of all states with registered devices")
    public ResponseEntity<List<String>> getStates() {
        log.info("Fetching all states");
        try {
            List<String> states = locationService.getAllStates();
            log.info("Found {} states", states.size());
            return ResponseEntity.ok(states);
        } catch (Exception e) {
            log.error("Error fetching states: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/districts")
    @Operation(summary = "Get districts for a state",
              description = "Returns list of districts in the specified state")
    public ResponseEntity<List<String>> getDistricts(
            @Parameter(description = "State name") @RequestParam String state) {
        log.info("Fetching districts for state: {}", state);
        try {
            List<String> districts = locationService.getDistrictsByState(state);
            log.info("Found {} districts in {}", districts.size(), state);
            return ResponseEntity.ok(districts);
        } catch (Exception e) {
            log.error("Error fetching districts for state {}: {}", state, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/cities")
    @Operation(summary = "Get cities/towns for a district",
              description = "Returns list of cities/towns in the specified state and district")
    public ResponseEntity<List<String>> getCities(
            @Parameter(description = "State name") @RequestParam String state,
            @Parameter(description = "District name") @RequestParam String district) {
        log.info("Fetching cities for state: {}, district: {}", state, district);
        try {
            List<String> cities = locationService.getCitiesByStateAndDistrict(state, district);
            log.info("Found {} cities in {}, {}", cities.size(), district, state);
            return ResponseEntity.ok(cities);
        } catch (Exception e) {
            log.error("Error fetching cities: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/villages")
    @Operation(summary = "Get villages for a city/town",
              description = "Returns list of villages in the specified location hierarchy. City is optional.")
    public ResponseEntity<List<String>> getVillages(
            @Parameter(description = "State name") @RequestParam String state,
            @Parameter(description = "District name") @RequestParam String district,
            @Parameter(description = "City/Town name (optional)") @RequestParam(required = false) String city) {
        log.info("Fetching villages for state: {}, district: {}, city: {}", state, district, city);
        try {
            List<String> villages = locationService.getVillagesByStateDistrictAndCity(state, district, city);
            log.info("Found {} villages in {}, {}, {}", villages.size(), city != null ? city : "all cities", district, state);
            return ResponseEntity.ok(villages);
        } catch (Exception e) {
            log.error("Error fetching villages: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/devices")
    @Operation(summary = "Get devices by location hierarchy",
              description = "Returns devices filtered by location hierarchy. All parameters are optional.")
    public ResponseEntity<List<DeviceRegistry>> getDevices(
            @Parameter(description = "State name (optional)") @RequestParam(required = false) String state,
            @Parameter(description = "District name (optional)") @RequestParam(required = false) String district,
            @Parameter(description = "City/Town name (optional)") @RequestParam(required = false) String city,
            @Parameter(description = "Village name (optional)") @RequestParam(required = false) String village) {
        
        log.info("Fetching devices - State: {}, District: {}, City: {}, Village: {}", 
                 state, district, city, village);
        
        try {
            List<DeviceRegistry> devices = locationService.getDevicesByLocationHierarchy(
                state, district, city, village);
            log.info("Found {} devices matching criteria", devices.size());
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            log.error("Error fetching devices: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
