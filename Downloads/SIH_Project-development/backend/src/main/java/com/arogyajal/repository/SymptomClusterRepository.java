package com.arogyajal.repository;

import com.arogyajal.model.SymptomCluster;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Repository for SymptomCluster model.
 * Handles Firestore operations for symptom clustering analysis.
 */
@Repository
public class SymptomClusterRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "symptom_clusters";

    public SymptomClusterRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new symptom cluster
     */
    public String save(SymptomCluster cluster) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(cluster.getId())
                .set(cluster);
        future.get();
        return cluster.getId();
    }

    /**
     * Find cluster by ID
     */
    public SymptomCluster findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get();
        
        if (document.exists()) {
            return document.toObject(SymptomCluster.class);
        }
        return null;
    }

    /**
     * Find all clusters
     */
    public List<SymptomCluster> findAll() throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters by location
     */
    public List<SymptomCluster> findByLocation(String location) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find active clusters
     */
    public List<SymptomCluster> findActiveClusters() throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find active clusters by location
     */
    public List<SymptomCluster> findActiveByLocation(String location) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters by severity
     */
    public List<SymptomCluster> findBySeverity(String severity) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("overallSeverity", severity)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find high-severity clusters
     */
    public List<SymptomCluster> findHighSeverityClusters() throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereIn("overallSeverity", List.of("SEVERE", "CRITICAL"))
                .whereEqualTo("status", "ACTIVE")
                .orderBy("clusterScore", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters by detection method
     */
    public List<SymptomCluster> findByDetectionMethod(String detectionMethod) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("detectionMethod", detectionMethod)
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters with alerts
     */
    public List<SymptomCluster> findClustersWithAlerts() throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("alertGenerated", true)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters by primary water source
     */
    public List<SymptomCluster> findByWaterSource(String waterSource) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("primaryWaterSource", waterSource)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("detectedAt", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters with minimum report count
     */
    public List<SymptomCluster> findByMinReportCount(int minCount) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("reportCount", minCount)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("reportCount", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Find clusters with high cluster score
     */
    public List<SymptomCluster> findHighScoreClusters(double minScore) throws ExecutionException, InterruptedException {
        List<SymptomCluster> clusters = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereGreaterThanOrEqualTo("clusterScore", minScore)
                .whereEqualTo("status", "ACTIVE")
                .orderBy("clusterScore", Query.Direction.DESCENDING)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            clusters.add(document.toObject(SymptomCluster.class));
        }
        return clusters;
    }

    /**
     * Update cluster status
     */
    public void updateStatus(String id, String status) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update("status", status, "updatedAt", Timestamp.now())
                .get();
    }

    /**
     * Add report to cluster
     */
    public void addReport(String clusterId, String reportId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(clusterId);
        firestore.runTransaction(transaction -> {
            DocumentSnapshot snapshot = transaction.get(docRef).get();
            SymptomCluster cluster = snapshot.toObject(SymptomCluster.class);
            
            if (cluster != null) {
                List<String> reportIds = new ArrayList<>(cluster.getReportIds());
                if (!reportIds.contains(reportId)) {
                    reportIds.add(reportId);
                    transaction.update(docRef, 
                        "reportIds", reportIds,
                        "reportCount", reportIds.size(),
                        "updatedAt", Timestamp.now()
                    );
                }
            }
            return null;
        }).get();
    }

    /**
     * Update cluster
     */
    public void update(SymptomCluster cluster) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(cluster.getId())
                .set(cluster)
                .get();
    }

    /**
     * Delete cluster
     */
    public void delete(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete()
                .get();
    }

    /**
     * Count active clusters
     */
    public long countActiveClusters() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", "ACTIVE")
                .get();
        return future.get().size();
    }

    /**
     * Count clusters by location
     */
    public long countByLocation(String location) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("location", location)
                .whereEqualTo("status", "ACTIVE")
                .get();
        return future.get().size();
    }

    /**
     * Count high-severity clusters
     */
    public long countHighSeverityClusters() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereIn("overallSeverity", List.of("SEVERE", "CRITICAL"))
                .whereEqualTo("status", "ACTIVE")
                .get();
        return future.get().size();
    }
}
