package com.arogyajal.repository;

import com.arogyajal.model.DeviceRegistry;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * Repository for Device Registry operations
 */
@Repository
public class DeviceRegistryRepository extends BaseFirestoreRepository<DeviceRegistry> {
    
    private static final Logger log = LoggerFactory.getLogger(DeviceRegistryRepository.class);
    private static final String COLLECTION_NAME = "device_registry";
    
    public DeviceRegistryRepository() {
        super(COLLECTION_NAME, DeviceRegistry.class);
    }
    
    /**
     * Check if device is already registered
     */
    public boolean isDeviceRegistered(String deviceId) {
        try {
            ApiFuture<DocumentSnapshot> future = db
                .collection(COLLECTION_NAME)
                .document(deviceId)
                .get();
            
            DocumentSnapshot document = future.get();
            return document.exists();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error checking device registration: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get device registry by deviceId
     */
    public Optional<DeviceRegistry> findByDeviceId(String deviceId) {
        try {
            return findById(deviceId);
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching device registry: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    /**
     * Save or update device registry
     */
    public DeviceRegistry saveDevice(DeviceRegistry device) {
        try {
            return save(device, device.getDeviceId());
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving device registry: {}", e.getMessage());
            throw new RuntimeException("Failed to save device registry", e);
        }
    }
}
