package com.arogyajal.service;

import com.arogyajal.model.DeviceRegistry;
import com.arogyajal.repository.DeviceRegistryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Location Hierarchy Service
 * Provides cascading location filtering for North East India regions
 */
@Service
public class LocationService {
    
    private static final Logger log = LoggerFactory.getLogger(LocationService.class);
    private final DeviceRegistryRepository deviceRegistryRepository;
    
    public LocationService(DeviceRegistryRepository deviceRegistryRepository) {
        this.deviceRegistryRepository = deviceRegistryRepository;
    }
    
    /**
     * Get all distinct states
     */
    public List<String> getAllStates() {
        try {
            List<DeviceRegistry> allDevices = deviceRegistryRepository.findAll();
            return allDevices.stream()
                .map(DeviceRegistry::getState)
                .filter(state -> state != null && !state.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching states: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch states", e);
        }
    }
    
    /**
     * Get districts for a given state
     */
    public List<String> getDistrictsByState(String state) {
        try {
            List<DeviceRegistry> devices = deviceRegistryRepository.findAll();
            return devices.stream()
                .filter(d -> state.equalsIgnoreCase(d.getState()))
                .map(DeviceRegistry::getDistrict)
                .filter(district -> district != null && !district.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching districts for state {}: {}", state, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch districts", e);
        }
    }
    
    /**
     * Get cities/towns for a given state and district
     */
    public List<String> getCitiesByStateAndDistrict(String state, String district) {
        try {
            List<DeviceRegistry> devices = deviceRegistryRepository.findAll();
            return devices.stream()
                .filter(d -> state.equalsIgnoreCase(d.getState()) && 
                           district.equalsIgnoreCase(d.getDistrict()))
                .map(DeviceRegistry::getCityOrTown)
                .filter(city -> city != null && !city.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching cities: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch cities", e);
        }
    }
    
    /**
     * Get villages for a given state, district, and city (city is optional)
     */
    public List<String> getVillagesByStateDistrictAndCity(String state, String district, String city) {
        try {
            List<DeviceRegistry> devices = deviceRegistryRepository.findAll();
            return devices.stream()
                .filter(d -> state.equalsIgnoreCase(d.getState()) && 
                           district.equalsIgnoreCase(d.getDistrict()))
                .filter(d -> city == null || city.trim().isEmpty() || 
                           (d.getCityOrTown() != null && city.equalsIgnoreCase(d.getCityOrTown())))
                .map(DeviceRegistry::getVillage)
                .filter(village -> village != null && !village.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching villages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch villages", e);
        }
    }
    
    /**
     * Get devices by location hierarchy
     * All parameters are optional - null means "all"
     */
    public List<DeviceRegistry> getDevicesByLocationHierarchy(
            String state, String district, String city, String village) {
        try {
            List<DeviceRegistry> devices = deviceRegistryRepository.findAll();
            
            return devices.stream()
                .filter(d -> state == null || state.equalsIgnoreCase(d.getState()))
                .filter(d -> district == null || district.equalsIgnoreCase(d.getDistrict()))
                .filter(d -> city == null || city.equalsIgnoreCase(d.getCityOrTown()))
                .filter(d -> village == null || village.equalsIgnoreCase(d.getVillage()))
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error fetching devices by hierarchy: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch devices", e);
        }
    }
    
    /**
     * Get all device IDs across all regions
     */
    public List<String> getAllDeviceIds() {
        try {
            List<DeviceRegistry> allDevices = deviceRegistryRepository.findAll();
            return allDevices.stream()
                .map(DeviceRegistry::getDeviceId)
                .filter(deviceId -> deviceId != null && !deviceId.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all device IDs: {}", e.getMessage(), e);
            return List.of(); // Return empty list on error
        }
    }
}
