package com.arogyajal.repository;

import com.arogyajal.model.SensorReading;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.stereotype.Repository;

import com.google.cloud.Timestamp;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Repository
public class SensorRepository extends BaseFirestoreRepository<SensorReading> {
    
    private static final String COLLECTION_NAME = "sensor_readings";
    
    public SensorRepository() {
        super(COLLECTION_NAME, SensorReading.class);
    }
    
    @Override
    protected List<SensorReading> getEntities(ApiFuture<QuerySnapshot> future) throws ExecutionException, InterruptedException {
        List<SensorReading> list = new ArrayList<>();
        QuerySnapshot querySnapshot = future.get();
        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
            SensorReading reading = fixSensorReading(doc);
            if (reading != null) {
                list.add(reading);
            }
        }
        return list;
    }
    
    @Override
    public Optional<SensorReading> findById(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            return Optional.of(fixSensorReading(document));
        }
        return Optional.empty();
    }
    
    private SensorReading fixSensorReading(DocumentSnapshot doc) {
        SensorReading reading = doc.toObject(SensorReading.class);
        if (reading != null) {
            // Manual fix for temperature and turbidity if null
            if (reading.getTemperature() == null && doc.contains("temperature")) {
                reading.setTemperature(doc.getDouble("temperature"));
            }
            if (reading.getTurbidity() == null && doc.contains("turbidity")) {
                reading.setTurbidity(doc.getDouble("turbidity"));
            }
        }
        return reading;
    }
    
    public List<SensorReading> findBySensorId(String sensorId) throws ExecutionException, InterruptedException {
        return findBySensorIdOrderByTimestampDesc(sensorId);
    }
    
    public List<SensorReading> findTop1ByOrderByTimestampDesc() throws ExecutionException, InterruptedException {
        // Get the most recent document
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(1)
                .get();
                
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        return documents.stream()
                .map(doc -> {
                    SensorReading reading = doc.toObject(SensorReading.class);
                    reading.setId(doc.getId());
                    // Manual fix for temperature and turbidity if null
                    if (reading.getTemperature() == null && doc.contains("temperature")) {
                        reading.setTemperature(doc.getDouble("temperature"));
                    }
                    if (reading.getTurbidity() == null && doc.contains("turbidity")) {
                        reading.setTurbidity(doc.getDouble("turbidity"));
                    }
                    return reading;
                })
                .collect(Collectors.toList());
    }
    
    public List<SensorReading> findBySensorIdOrderByTimestampDesc(String sensorId) throws ExecutionException, InterruptedException {
        // First get all documents with matching sensorId
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("sensorId", sensorId)
                .get();
                
        List<SensorReading> readings = getEntities(future);
        
        // Then sort in memory
        if (readings != null) {
            readings.sort((r1, r2) -> {
                Timestamp t1 = r1.getTimestamp();
                Timestamp t2 = r2.getTimestamp();
                if (t1 == null && t2 == null) return 0;
                if (t1 == null) return 1;  // Nulls last
                if (t2 == null) return -1;  // Nulls last
                return t2.compareTo(t1);    // Descending order
            });
        }
        
        return readings != null ? readings : new ArrayList<>();
    }
    
    public List<SensorReading> findByLocation(String location) throws ExecutionException, InterruptedException {
        return findByLocationOrderByTimestampDesc(location);
    }
    
    public List<SensorReading> findByLocationOrderByTimestampDesc(String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public Optional<SensorReading> findFirstBySensorIdOrderByTimestampDesc(String sensorId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("deviceId", sensorId)  // Changed from "sensorId" to "deviceId"
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(1)
                .get();
        List<SensorReading> results = getEntities(future);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    
    public List<SensorReading> findByTimestampBefore(Timestamp timestamp) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereLessThan("timestamp", timestamp)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findByTimestampAfter(Timestamp timestamp) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereGreaterThan("timestamp", timestamp)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findByTimestampBetween(Timestamp start, Timestamp end) throws ExecutionException, InterruptedException {
        return findByTimestampBetweenOrderByTimestampDesc(start, end);
    }
    
    public List<SensorReading> findByTimestampBetweenOrderByTimestampDesc(Timestamp start, Timestamp end) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("timestamp", start)
                .whereLessThanOrEqualTo("timestamp", end)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findBySensorIdAndTimestampBetween(String sensorId, Timestamp start, Timestamp end) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("sensorId", sensorId)
                .whereGreaterThanOrEqualTo("timestamp", start)
                .whereLessThanOrEqualTo("timestamp", end)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findByQualityStatusOrderByTimestampDesc(String qualityStatus) 
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("qualityStatus", qualityStatus)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findByLocationAndQualityStatusOrderByTimestampDesc(String location, String qualityStatus) 
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .whereEqualTo("qualityStatus", qualityStatus)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<SensorReading> findCriticalReadings() throws ExecutionException, InterruptedException {
        // Firebase doesn't support OR queries directly, so we need to perform multiple queries
        List<SensorReading> criticalReadings = new ArrayList<>();
        
        // Query for critical pH (low)
        criticalReadings.addAll(getEntities(db.collection(COLLECTION_NAME)
                .whereLessThan("ph", 6.5)
                .whereGreaterThan("ph", 0)
                .get()));
                
        // Query for critical pH (high)
        criticalReadings.addAll(getEntities(db.collection(COLLECTION_NAME)
                .whereGreaterThan("ph", 8.5)
                .get()));
                
        // Query for critical temperature
        criticalReadings.addAll(getEntities(db.collection(COLLECTION_NAME)
                .whereGreaterThan("temperature", 30)
                .get()));
                
        // Query for critical turbidity
        criticalReadings.addAll(getEntities(db.collection(COLLECTION_NAME)
                .whereGreaterThan("turbidity", 5)
                .get()));
                
        // Query for critical dissolved oxygen
        criticalReadings.addAll(getEntities(db.collection(COLLECTION_NAME)
                .whereLessThan("dissolvedOxygen", 5)
                .get()));
                
        // Remove duplicates by ID
        return criticalReadings.stream()
                .collect(Collectors.toMap(
                        SensorReading::getId,
                        reading -> reading,
                        (existing, replacement) -> existing))
                .values()
                .stream()
                .sorted((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()))
                .collect(Collectors.toList());
    }
    
    public List<SensorReading> findBySensorIdAndParameterRange(String sensorId, String parameter, Double min, Double max) 
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("sensorId", sensorId)
                .whereGreaterThanOrEqualTo(parameter, min)
                .whereLessThanOrEqualTo(parameter, max)
                .orderBy(parameter)
                .get();
        return getEntities(future);
    }
    
    public long countBySensorId(String sensorId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("sensorId", sensorId)
                .get();
        return future.get().size();
    }
    
    public long countByLocation(String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .get();
        return future.get().size();
    }
    
    public long count() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        return future.get().size();
    }
    
    // Find distinct device IDs
    public List<String> findDistinctDeviceIds() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        return future.get().getDocuments().stream()
                .map(doc -> {
                    String deviceId = doc.getString("deviceId");
                    return deviceId != null ? deviceId : doc.getString("sensorId");
                })
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }

    // Find distinct sensor IDs (legacy method)
    public List<String> findDistinctSensorIds() throws ExecutionException, InterruptedException {
        return findDistinctDeviceIds();
    }
    
    // Find distinct locations
    public List<String> findDistinctLocations() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        return future.get().getDocuments().stream()
                .map(doc -> doc.getString("location"))
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
}
