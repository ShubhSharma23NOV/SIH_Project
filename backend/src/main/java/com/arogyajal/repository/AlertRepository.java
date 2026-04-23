package com.arogyajal.repository;

import com.arogyajal.model.Alert;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
//import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class AlertRepository extends BaseFirestoreRepository<Alert> {
    
    private static final String COLLECTION_NAME = "alerts";
    
    public AlertRepository() {
        super(COLLECTION_NAME, Alert.class);
    }
    
    public List<Alert> findByStatus(String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<Alert> findBySeverity(String severity) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("severity", severity)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public long count() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        return future.get().size();
    }
    
    public long countByStatus(String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .get();
        return future.get().size();
    }
    
    public long countBySeverity(String severity) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("severity", severity)
                .get();
        return future.get().size();
    }
    
    public List<Alert> findByLocation(String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<Alert> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("triggeredAt", startDate)
                .whereLessThanOrEqualTo("triggeredAt", endDate)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<Alert> findByStatusAndLocation(String status, String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .whereEqualTo("location", location)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
    
    public List<Alert> findByAlertType(String alertType) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereEqualTo("alertType", alertType)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }


    /**
     * Find alerts triggered between two timestamps
     */
    public List<Alert> findByTriggeredAtBetween(com.google.cloud.Timestamp startTime, com.google.cloud.Timestamp endTime) 
            throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("triggeredAt", startTime)
                .whereLessThanOrEqualTo("triggeredAt", endTime)
                .orderBy("triggeredAt", Query.Direction.DESCENDING)
                .get();
        return getEntities(future);
    }
}