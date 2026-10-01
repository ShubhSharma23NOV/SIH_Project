package com.arogyajal.repository;

import com.arogyajal.model.IssueReport;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class IssueReportRepository {
    
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "issue_reports";
    
    public IssueReportRepository(Firestore firestore) {
        this.firestore = firestore;
    }
    
    public String save(IssueReport issueReport) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(issueReport.getId())
                .set(issueReport);
        future.get();
        return issueReport.getId();
    }
    
    public IssueReport findById(String id) throws ExecutionException, InterruptedException {
        return firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get()
                .toObject(IssueReport.class);
    }
    
    public List<IssueReport> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        return future.get().toObjects(IssueReport.class);
    }
    
    public List<IssueReport> findByReporterId(String reporterId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("reporterId", reporterId)
                .get();
        return future.get().toObjects(IssueReport.class);
    }
    
    public List<IssueReport> findBySeverity(String severity) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("severity", severity)
                .get();
        return future.get().toObjects(IssueReport.class);
    }
    
    public List<IssueReport> findByStatus(String status) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("status", status)
                .get();
        return future.get().toObjects(IssueReport.class);
    }
}
