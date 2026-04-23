package com.arogyajal.repository;

import com.arogyajal.model.WaterTest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class WaterTestRepository {
    
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "water_tests";
    
    public WaterTestRepository(Firestore firestore) {
        this.firestore = firestore;
    }
    
    public String save(WaterTest waterTest) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(waterTest.getId())
                .set(waterTest);
        future.get();
        return waterTest.getId();
    }
    
    public WaterTest findById(String id) throws ExecutionException, InterruptedException {
        return firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get()
                .toObject(WaterTest.class);
    }
    
    public List<WaterTest> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        return future.get().toObjects(WaterTest.class);
    }
    
    public List<WaterTest> findByReporterId(String reporterId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("reporterId", reporterId)
                .get();
        return future.get().toObjects(WaterTest.class);
    }
    
    public List<WaterTest> findByRiskLevel(String riskLevel) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("riskLevel", riskLevel)
                .get();
        return future.get().toObjects(WaterTest.class);
    }
}
