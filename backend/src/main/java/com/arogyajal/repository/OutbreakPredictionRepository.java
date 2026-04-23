package com.arogyajal.repository;

import com.arogyajal.model.OutbreakPrediction;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Repository for OutbreakPrediction model.
 * Handles Firestore operations for outbreak predictions.
 */
@Repository
public class OutbreakPredictionRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "outbreak_predictions";

    public OutbreakPredictionRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new outbreak prediction
     */
    public String save(OutbreakPrediction prediction) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(prediction.getId())
                .set(prediction);
        future.get();
        return prediction.getId();
    }

    /**
     * Find prediction by ID
     */
    public OutbreakPrediction findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get();
        
        if (document.exists()) {
            return document.toObject(OutbreakPrediction.class);
        }
        return null;
    }

    /**
     * Find all predictions
     */
    public List<OutbreakPrediction> findAll() throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            predictions.add(document.toObject(OutbreakPrediction.class));
        }
        return predictions;
    }

    /**
     * Find predictions by location
     */
    public List<OutbreakPrediction> findByLocation(String location) throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            predictions.add(document.toObject(OutbreakPrediction.class));
        }
        return predictions;
    }

    /**
     * Find predictions by risk level
     */
    public List<OutbreakPrediction> findByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("riskLevel", riskLevel)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            predictions.add(document.toObject(OutbreakPrediction.class));
        }
        return predictions;
    }

    /**
     * Find active predictions
     */
    public List<OutbreakPrediction> findActiveByLocation(String location) throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            predictions.add(document.toObject(OutbreakPrediction.class));
        }
        return predictions;
    }

    /**
     * Find high-risk predictions
     */
    public List<OutbreakPrediction> findHighRiskPredictions() throws ExecutionException, InterruptedException {
        List<OutbreakPrediction> predictions = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereIn("riskLevel", List.of("HIGH", "CRITICAL"))
                .whereEqualTo("status", "ACTIVE")
                .orderBy("riskScore", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            predictions.add(document.toObject(OutbreakPrediction.class));
        }
        return predictions;
    }

    /**
     * Update prediction status
     */
    public void updateStatus(String id, String status) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update("status", status, "updatedAt", Timestamp.now())
                .get();
    }

    /**
     * Update prediction
     */
    public void update(OutbreakPrediction prediction) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(prediction.getId())
                .set(prediction)
                .get();
    }

    /**
     * Delete prediction
     */
    public void delete(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete()
                .get();
    }

    /**
     * Count predictions by risk level
     */
    public long countByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("riskLevel", riskLevel)
                .whereEqualTo("status", "ACTIVE")
                .get();
        return future.get().size();
    }
}
