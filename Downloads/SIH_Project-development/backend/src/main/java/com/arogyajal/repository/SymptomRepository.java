package com.arogyajal.repository;

import com.arogyajal.model.SymptomReport;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import com.google.cloud.Timestamp;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class SymptomRepository {
    private static final String COLLECTION_NAME = "symptomReports";
    private final Firestore db;

    public SymptomRepository() {
        this.db = FirestoreClient.getFirestore();
    }

    public List<SymptomReport> findByUserIdOrderByReportedAtDesc(String userId) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by user ID", e);
        }
    }

    public List<SymptomReport> findByLocationOrderByReportedAtDesc(String location) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("location", location)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by location", e);
        }
    }

    public long count() {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            return future.get().size();
        } catch (Exception e) {
            throw new RuntimeException("Error counting symptom reports", e);
        }
    }
    
    public SymptomReport save(SymptomReport report) {
        try {
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(report.getId() != null ? report.getId() : UUID.randomUUID().toString());
            docRef.set(report).get();
            return report;
        } catch (Exception e) {
            throw new RuntimeException("Error saving symptom report", e);
        }
    }

    public Optional<SymptomReport> findById(String id) {
        try {
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return Optional.of(document.toObject(SymptomReport.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom report by ID", e);
        }
    }

    public List<SymptomReport> findAll() {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding all symptom reports", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION_NAME).document(id).delete().get();
        } catch (Exception e) {
            throw new RuntimeException("Error deleting symptom report", e);
        }
    }

    private List<SymptomReport> getSymptomReports(ApiFuture<QuerySnapshot> future) throws InterruptedException, ExecutionException {
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<SymptomReport> reports = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            try {
                reports.add(document.toObject(SymptomReport.class));
            } catch (RuntimeException e) {
                // Skip documents with incompatible geoLocation format
                System.err.println("Skipping document " + document.getId() + " due to deserialization error: " + e.getMessage());
            }
        }
        return reports;
    }
    
    // Find reports by status
    public List<SymptomReport> findByStatusOrderByReportedAtDesc(String status) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("status", status)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by status", e);
        }
    }
    
    // Find reports by severity
    public List<SymptomReport> findBySeverityOrderByReportedAtDesc(String severity) {
        try {
            // Try with orderBy first
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("severity", severity)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            // Fallback: Query without orderBy if index is missing
            try {
                ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                        .whereEqualTo("severity", severity)
                        .get();
                List<SymptomReport> reports = getSymptomReports(future);
                // Sort in memory
                reports.sort((r1, r2) -> {
                    if (r1.getReportedAt() == null && r2.getReportedAt() == null) return 0;
                    if (r1.getReportedAt() == null) return 1;
                    if (r2.getReportedAt() == null) return -1;
                    return r2.getReportedAt().compareTo(r1.getReportedAt());
                });
                return reports;
            } catch (Exception fallbackError) {
                throw new RuntimeException("Error finding symptom reports by severity", fallbackError);
            }
        }
    }
    
    // Find reports by water source
    public List<SymptomReport> findByWaterSourceOrderByReportedAtDesc(String waterSource) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("waterSource", waterSource)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by water source", e);
        }
    }
    
    // Find reports within time range
    public List<SymptomReport> findByReportedAtBetweenOrderByReportedAtDesc(Timestamp start, Timestamp end) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereGreaterThanOrEqualTo("reportedAt", start)
                    .whereLessThanOrEqualTo("reportedAt", end)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by date range", e);
        }
    }
    
    // Find reports by location and time range
    public List<SymptomReport> findByLocationAndReportedAtBetweenOrderByReportedAtDesc(
            String location, Timestamp start, Timestamp end) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("location", location)
                    .whereGreaterThanOrEqualTo("reportedAt", start)
                    .whereLessThanOrEqualTo("reportedAt", end)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by location and date range", e);
        }
    }
    
    // Find reports by status and location
    public List<SymptomReport> findByStatusAndLocationOrderByReportedAtDesc(String status, String location) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("status", status)
                    .whereEqualTo("location", location)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by status and location", e);
        }
    }
    
    // Find reports containing specific symptoms
    public List<SymptomReport> findBySymptomsContaining(String symptom) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereArrayContains("symptoms", symptom)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports containing symptom: " + symptom, e);
        }
    }
    
    public List<SymptomReport> findBySymptomsIn(List<String> symptoms) {
        try {
            // Firebase doesn't support direct array contains any query, so we need to query for each symptom and combine results
            List<SymptomReport> results = new ArrayList<>();
            for (String symptom : symptoms) {
                results.addAll(findBySymptomsContaining(symptom));
            }
            // Remove duplicates by ID
            Map<String, SymptomReport> uniqueResults = new HashMap<>();
            for (SymptomReport report : results) {
                uniqueResults.put(report.getId(), report);
            }
            return new ArrayList<>(uniqueResults.values());
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by symptoms", e);
        }
    }
    
    public List<SymptomReport> findByLocation(String location) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("location", location)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by location: " + location, e);
        }
    }
    
    // Find reports by location and symptoms
    public List<SymptomReport> findByLocationAndSymptomsIn(String location, List<String> symptoms) {
        try {
            List<SymptomReport> results = new ArrayList<>();
            for (String symptom : symptoms) {
                ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                        .whereEqualTo("location", location)
                        .whereArrayContains("symptoms", symptom)
                        .get();
                results.addAll(getSymptomReports(future));
            }
            // Remove duplicates by ID
            Map<String, SymptomReport> uniqueResults = new HashMap<>();
            for (SymptomReport report : results) {
                uniqueResults.put(report.getId(), report);
            }
            return new ArrayList<>(uniqueResults.values());
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by location and symptoms", e);
        }
    }
    
    // Find reports with high severity and recent timestamp
    public List<SymptomReport> findHighSeverityRecentReports(Timestamp date) {
        try {
            // Try with both filters
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("severity", "HIGH")
                    .whereGreaterThanOrEqualTo("reportedAt", date)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            // Fallback: Get all HIGH severity and filter by date in memory
            try {
                ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                        .whereEqualTo("severity", "HIGH")
                        .get();
                List<SymptomReport> reports = getSymptomReports(future);
                // Filter by date in memory
                return reports.stream()
                        .filter(r -> r.getReportedAt() != null && r.getReportedAt().compareTo(date) >= 0)
                        .collect(java.util.stream.Collectors.toList());
            } catch (Exception fallbackError) {
                // Final fallback: return empty list
                return new ArrayList<>();
            }
        }
    }
    
    // Find reports by location and severity
    public List<SymptomReport> findByLocationAndSeverityOrderByReportedAtDesc(String location, String severity) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("location", location)
                    .whereEqualTo("severity", severity)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .get();
            return getSymptomReports(future);
        } catch (Exception e) {
            throw new RuntimeException("Error finding symptom reports by location and severity", e);
        }
    }
    
    // Count reports by status
    public long countByStatus(String status) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("status", status)
                    .get();
            return future.get().size();
        } catch (Exception e) {
            throw new RuntimeException("Error counting reports by status", e);
        }
    }
    
    // Count reports by location
    public long countByLocation(String location) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("location", location)
                    .get();
            return future.get().size();
        } catch (Exception e) {
            throw new RuntimeException("Error counting reports by location", e);
        }
    }
    
    // Count reports by severity
    public long countBySeverity(String severity) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("severity", severity)
                    .get();
            return future.get().size();
        } catch (Exception e) {
            throw new RuntimeException("Error counting reports by severity", e);
        }
    }
    
    // Find distinct locations
    public List<String> findDistinctLocations() {
        try {
            Set<String> locations = new HashSet<>();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            for (QueryDocumentSnapshot document : documents) {
                String location = document.getString("location");
                if (location != null) {
                    locations.add(location);
                }
            }
            return new ArrayList<>(locations);
        } catch (Exception e) {
            throw new RuntimeException("Error finding distinct locations", e);
        }
    }
    
    // Find distinct symptoms
    @SuppressWarnings("unchecked")
    public List<String> findDistinctSymptoms() {
        try {
            Set<String> symptoms = new HashSet<>();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            for (QueryDocumentSnapshot document : documents) {
                List<String> reportSymptoms = (List<String>) document.get("symptoms");
                if (reportSymptoms != null) {
                    symptoms.addAll(reportSymptoms);
                }
            }
            return new ArrayList<>(symptoms);
        } catch (Exception e) {
            throw new RuntimeException("Error finding distinct symptoms", e);
        }
    }
    
    // Find latest report by user
    public Optional<SymptomReport> findFirstByUserIdOrderByReportedAtDesc(String userId) {
        try {
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .orderBy("reportedAt", Query.Direction.DESCENDING)
                    .limit(1)
                    .get();
            List<SymptomReport> reports = getSymptomReports(future);
            return reports.isEmpty() ? Optional.empty() : Optional.of(reports.get(0));
        } catch (Exception e) {
            throw new RuntimeException("Error finding latest report by user", e);
        }
    }
}
