package com.arogyajal.repository;

import com.arogyajal.model.SensorHealth;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class SensorHealthRepository {
    
    private static final Logger log = LoggerFactory.getLogger(SensorHealthRepository.class);
    private static final String COLLECTION_NAME = "sensor_health";
    
    private final Firestore firestore;
    
    public SensorHealthRepository(Firestore firestore) {
        this.firestore = firestore;
    }
    
    /**
     * Save or update sensor health
     */
    public void save(SensorHealth sensorHealth) {
        try {
            String docId = sensorHealth.getDeviceId();
            firestore.collection(COLLECTION_NAME)
                .document(docId)
                .set(sensorHealth)
                .get();
            log.info("Saved sensor health for: {}", sensorHealth.getDeviceId());
        } catch (Exception e) {
            log.error("Error saving sensor health: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Find sensor health by device ID
     */
    public Optional<SensorHealth> findByDeviceId(String deviceId) {
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                .document(deviceId)
                .get()
                .get();
            
            if (document.exists()) {
                SensorHealth health = document.toObject(SensorHealth.class);
                if (health != null) {
                    health.setId(document.getId());
                }
                return Optional.ofNullable(health);
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error finding sensor health: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Find all sensor health records
     */
    public List<SensorHealth> findAll() {
        try {
            QuerySnapshot querySnapshot = firestore.collection(COLLECTION_NAME)
                .get()
                .get();
            
            List<SensorHealth> healthList = new ArrayList<>();
            for (DocumentSnapshot document : querySnapshot.getDocuments()) {
                SensorHealth health = document.toObject(SensorHealth.class);
                if (health != null) {
                    health.setId(document.getId());
                    healthList.add(health);
                }
            }
            return healthList;
        } catch (Exception e) {
            log.error("Error finding all sensor health: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Find sensors by status
     */
    public List<SensorHealth> findByStatus(String status) {
        try {
            QuerySnapshot querySnapshot = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .get()
                .get();
            
            List<SensorHealth> healthList = new ArrayList<>();
            for (DocumentSnapshot document : querySnapshot.getDocuments()) {
                SensorHealth health = document.toObject(SensorHealth.class);
                if (health != null) {
                    health.setId(document.getId());
                    healthList.add(health);
                }
            }
            return healthList;
        } catch (Exception e) {
            log.error("Error finding sensors by status: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Delete sensor health record
     */
    public void delete(String deviceId) {
        try {
            firestore.collection(COLLECTION_NAME)
                .document(deviceId)
                .delete()
                .get();
            log.info("Deleted sensor health for: {}", deviceId);
        } catch (Exception e) {
            log.error("Error deleting sensor health: {}", e.getMessage(), e);
        }
    }
}
