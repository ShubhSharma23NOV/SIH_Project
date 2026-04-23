package com.arogyajal.repository;

import com.arogyajal.model.ManualWaterTest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Repository for ManualWaterTest model.
 * Handles Firestore operations for manual water quality tests.
 */
@Repository
public class ManualWaterTestRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "manual_water_tests";

    public ManualWaterTestRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new water test
     */
    public String save(ManualWaterTest test) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(test.getId())
                .set(test);
        future.get();
        return test.getId();
    }

    /**
     * Find test by ID
     */
    public ManualWaterTest findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get();
        
        if (document.exists()) {
            return document.toObject(ManualWaterTest.class);
        }
        return null;
    }

    /**
     * Find all tests
     */
    public List<ManualWaterTest> findAll() throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests by tester ID
     */
    public List<ManualWaterTest> findByTesterId(String testerId) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("testerId", testerId)
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests by location
     */
    public List<ManualWaterTest> findByLocation(String location) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests by water source
     */
    public List<ManualWaterTest> findByWaterSource(String waterSourceId) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("waterSourceId", waterSourceId)
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests by quality status
     */
    public List<ManualWaterTest> findByQualityStatus(String qualityStatus) throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("qualityStatus", qualityStatus)
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find unsafe water tests
     */
    public List<ManualWaterTest> findUnsafeTests() throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereIn("qualityStatus", List.of("UNSAFE", "CONTAMINATED"))
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests pending sync
     */
    public List<ManualWaterTest> findPendingSync() throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("syncStatus", "PENDING")
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Find tests that generated alerts
     */
    public List<ManualWaterTest> findTestsWithAlerts() throws ExecutionException, InterruptedException {
        List<ManualWaterTest> tests = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("alertGenerated", true)
                .orderBy("testDate", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            tests.add(document.toObject(ManualWaterTest.class));
        }
        return tests;
    }

    /**
     * Update sync status
     */
    public void updateSyncStatus(String id, String syncStatus) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update(
                    "syncStatus", syncStatus,
                    "syncedAt", Timestamp.now(),
                    "updatedAt", Timestamp.now()
                )
                .get();
    }

    /**
     * Update test
     */
    public void update(ManualWaterTest test) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(test.getId())
                .set(test)
                .get();
    }

    /**
     * Delete test
     */
    public void delete(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete()
                .get();
    }

    /**
     * Count tests by tester
     */
    public long countByTesterId(String testerId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("testerId", testerId)
                .get();
        return future.get().size();
    }

    /**
     * Count unsafe tests by location
     */
    public long countUnsafeTestsByLocation(String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .whereIn("qualityStatus", List.of("UNSAFE", "CONTAMINATED"))
                .get();
        return future.get().size();
    }
}
