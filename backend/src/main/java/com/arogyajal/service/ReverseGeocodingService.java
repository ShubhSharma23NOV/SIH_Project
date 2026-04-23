package com.arogyajal.service;

import com.arogyajal.model.DeviceRegistry;
import com.arogyajal.repository.DeviceRegistryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Service for reverse geocoding using OpenStreetMap Nominatim API
 */
@Service
public class ReverseGeocodingService {
    
    private static final Logger log = LoggerFactory.getLogger(ReverseGeocodingService.class);
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
    
    private final DeviceRegistryRepository deviceRegistryRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    // Rate limiting: track last API call time
    private long lastApiCallTime = 0;
    private static final long MIN_API_INTERVAL_MS = 1000; // 1 second between calls
    
    // Lock to prevent concurrent API calls
    private final Lock apiLock = new ReentrantLock();
    
    // Track devices being processed to avoid duplicates
    private final ConcurrentHashMap<String, Boolean> processingDevices = new ConcurrentHashMap<>();
    
    public ReverseGeocodingService(DeviceRegistryRepository deviceRegistryRepository, RestTemplate restTemplate) {
        this.deviceRegistryRepository = deviceRegistryRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Enrich device with location metadata
     * Returns cached data if device already registered
     */
    public DeviceRegistry enrichDeviceLocation(String deviceId, Double lat, Double lon) {
        // Check if already registered
        if (deviceRegistryRepository.isDeviceRegistered(deviceId)) {
            log.info("deviceAlreadyRegistered: {}", deviceId);
            return deviceRegistryRepository.findByDeviceId(deviceId).orElse(null);
        }
        
        // Check if currently being processed
        if (processingDevices.putIfAbsent(deviceId, true) != null) {
            log.info("Device {} is already being processed, skipping", deviceId);
            return null;
        }
        
        try {
            // Validate coordinates
            if (lat == null || lon == null || !isValidCoordinates(lat, lon)) {
                log.warn("Invalid coordinates for device {}: lat={}, lon={}", deviceId, lat, lon);
                DeviceRegistry fallbackRegistry = createFallbackRegistry(deviceId, lat, lon);
                // Save fallback registry to database
                deviceRegistryRepository.saveDevice(fallbackRegistry);
                log.info("Saved fallback registry for device with invalid coordinates: {}", deviceId);
                return fallbackRegistry;
            }
            
            // Call Nominatim API with rate limiting
            DeviceRegistry registry = reverseGeocode(deviceId, lat, lon);
            
            // Save to database
            deviceRegistryRepository.saveDevice(registry);
            log.info("reverseGeocodeLookupSuccess: {} - {}, {}", deviceId, registry.getState(), registry.getDistrict());
            
            return registry;
            
        } catch (Exception e) {
            log.error("reverseGeocodeFailure: {} - {}", deviceId, e.getMessage());
            return createFallbackRegistry(deviceId, lat, lon);
        } finally {
            processingDevices.remove(deviceId);
        }
    }
    
    /**
     * Call Nominatim API with rate limiting
     */
    private DeviceRegistry reverseGeocode(String deviceId, Double lat, Double lon) {
        apiLock.lock();
        try {
            // Rate limiting: ensure 1 second between API calls
            long now = System.currentTimeMillis();
            long timeSinceLastCall = now - lastApiCallTime;
            if (timeSinceLastCall < MIN_API_INTERVAL_MS) {
                Thread.sleep(MIN_API_INTERVAL_MS - timeSinceLastCall);
            }
            
            // Build URL
            String url = String.format("%s?lat=%f&lon=%f&format=json&zoom=18&addressdetails=1",
                NOMINATIM_URL, lat, lon);
            
            log.info("Calling Nominatim API for device {}: {}", deviceId, url);
            
            // Call API
            String response = restTemplate.getForObject(url, String.class);
            lastApiCallTime = System.currentTimeMillis();
            
            // Parse response
            return parseNominatimResponse(deviceId, lat, lon, response);
            
        } catch (Exception e) {
            log.error("Error calling Nominatim API: {}", e.getMessage());
            throw new RuntimeException("Nominatim API call failed", e);
        } finally {
            apiLock.unlock();
        }
    }
    
    /**
     * Parse Nominatim JSON response
     */
    private DeviceRegistry parseNominatimResponse(String deviceId, Double lat, Double lon, String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode address = root.get("address");
            
            if (address == null) {
                log.warn("No address data in Nominatim response for device {}", deviceId);
                return createFallbackRegistry(deviceId, lat, lon);
            }
            
            // Extract fields with fallback logic
            String state = extractField(address, "state");
            String district = extractField(address, "district", "county");
            String cityOrTown = extractField(address, "town", "city", "locality");
            String village = extractField(address, "village", "hamlet", "suburb");
            
            // Check if any fields are missing
            boolean needsVerification = (state == null || district == null || 
                                        (cityOrTown == null && village == null));
            
            // Build registry
            DeviceRegistry registry = new DeviceRegistry();
            registry.setDeviceId(deviceId);
            registry.setLat(lat);
            registry.setLon(lon);
            registry.setState(state);
            registry.setDistrict(district);
            registry.setCityOrTown(cityOrTown);
            registry.setVillage(village);
            registry.setWaterSourceType(inferWaterSourceType(cityOrTown, village, root));
            registry.setVerified(false);
            registry.setNeedsVerification(needsVerification);
            registry.setGeoSource("NOMINATIM_OSM");
            registry.setCreatedAt(Timestamp.now());
            registry.setUpdatedAt(Timestamp.now());
            registry.setRawAddress(root.get("display_name") != null ? root.get("display_name").asText() : null);
            
            log.info("Parsed location for {}: state={}, district={}, city={}, village={}", 
                deviceId, state, district, cityOrTown, village);
            
            return registry;
            
        } catch (Exception e) {
            log.error("Error parsing Nominatim response: {}", e.getMessage());
            return createFallbackRegistry(deviceId, lat, lon);
        }
    }
    
    /**
     * Extract field from address with fallback options
     */
    private String extractField(JsonNode address, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode field = address.get(fieldName);
            if (field != null && !field.isNull()) {
                return field.asText();
            }
        }
        return null;
    }
    
    /**
     * Create fallback registry when geocoding fails
     */
    private DeviceRegistry createFallbackRegistry(String deviceId, Double lat, Double lon) {
        DeviceRegistry registry = new DeviceRegistry();
        registry.setDeviceId(deviceId);
        registry.setLat(lat);
        registry.setLon(lon);
        registry.setState(null);
        registry.setDistrict(null);
        registry.setCityOrTown(null);
        registry.setVillage(null);
        registry.setWaterSourceType(null);
        registry.setVerified(false);
        registry.setNeedsVerification(true);
        registry.setGeoSource("FAILED");
        registry.setCreatedAt(Timestamp.now());
        registry.setUpdatedAt(Timestamp.now());
        return registry;
    }
    
    /**
     * Infer water source type based on location characteristics
     * Uses location name patterns and geographic features
     */
    private String inferWaterSourceType(String cityOrTown, String village, JsonNode root) {
        try {
            // Get display name and address for pattern matching
            String displayName = root.get("display_name") != null ? 
                root.get("display_name").asText().toLowerCase() : "";
            JsonNode address = root.get("address");
            
            // Check for water body names in location
            if (displayName.contains("river") || displayName.contains("nadi") || 
                displayName.contains("ganga") || displayName.contains("brahmaputra")) {
                return "RIVER";
            }
            
            if (displayName.contains("pond") || displayName.contains("pokhar") || 
                displayName.contains("talab")) {
                return "POND";
            }
            
            if (displayName.contains("spring") || displayName.contains("jharna")) {
                return "SPRING";
            }
            
            // Check address components for water features
            if (address != null) {
                JsonNode waterway = address.get("waterway");
                if (waterway != null) {
                    String waterwayType = waterway.asText().toLowerCase();
                    if (waterwayType.contains("river") || waterwayType.contains("stream")) {
                        return "RIVER";
                    }
                }
            }
            
            // Infer based on location type
            if (village != null && !village.isEmpty()) {
                // Rural areas more likely to have wells or handpumps
                return "HANDPUMP";
            }
            
            if (cityOrTown != null && !cityOrTown.isEmpty()) {
                // Urban areas more likely to have tap water
                return "TAP";
            }
            
            // Default fallback
            return "WELL";
            
        } catch (Exception e) {
            log.debug("Error inferring water source type: {}", e.getMessage());
            return "WELL"; // Safe default
        }
    }
    
    /**
     * Validate coordinates
     */
    private boolean isValidCoordinates(Double lat, Double lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }
    
    /**
     * Get cached device registry
     */
    public DeviceRegistry getDeviceRegistry(String deviceId) {
        return deviceRegistryRepository.findByDeviceId(deviceId).orElse(null);
    }
}
