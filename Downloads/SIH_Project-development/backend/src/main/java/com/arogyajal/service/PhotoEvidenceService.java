package com.arogyajal.service;

import com.arogyajal.model.PhotoEvidence;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class PhotoEvidenceService {
    
    private static final Logger log = LoggerFactory.getLogger(PhotoEvidenceService.class);
    private final Firestore firestore;
    
    public PhotoEvidenceService() {
        this.firestore = FirestoreClient.getFirestore();
    }
    
    /**
     * Upload photo evidence with routing workflow
     */
    public Map<String, Object> uploadEvidence(String userId, String description, 
                                             double latitude, double longitude,
                                             List<MultipartFile> images) 
            throws ExecutionException, InterruptedException {
        
        String evidenceId = "EV" + System.currentTimeMillis();
        
        // Upload images to Firebase Storage
        List<String> imageUrls = new ArrayList<>();
        
        try {
            Bucket bucket = StorageClient.getInstance().bucket();
            
            for (int i = 0; i < images.size(); i++) {
                MultipartFile image = images.get(i);
                String fileName = "evidence/" + evidenceId + "_" + i + "_" + image.getOriginalFilename();
                
                try {
                    // Upload to Firebase Storage
                    Blob blob = bucket.create(
                        fileName,
                        image.getInputStream(),
                        image.getContentType()
                    );
                    
                    // Generate signed URL (valid for 7 days)
                    String signedUrl = blob.signUrl(7, TimeUnit.DAYS).toString();
                    imageUrls.add(signedUrl);
                    
                    log.info("✅ Uploaded image: {} (size: {} bytes)", fileName, image.getSize());
                    
                } catch (IOException e) {
                    log.error("Failed to upload image: {}", fileName, e);
                    // Fallback to data URI if upload fails (no network request needed)
                    String fallbackUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23ff6b6b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EPhoto " + (i+1) + " Upload Failed%3C/text%3E%3C/svg%3E";
                    imageUrls.add(fallbackUrl);
                }
            }
        } catch (Exception storageError) {
            log.error("⚠️ Firebase Storage not available: {}. Using data URI placeholders.", storageError.getMessage());
            // If Storage bucket doesn't exist, use data URI placeholders (no network request)
            for (int i = 0; i < images.size(); i++) {
                String fallbackUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%234CAF50'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EPhoto Evidence " + (i+1) + "%3C/text%3E%3C/svg%3E";
                imageUrls.add(fallbackUrl);
            }
        }
        
        // Auto-assign officials based on location
        Map<String, String> assignedOfficials = assignOfficials(latitude, longitude);
        
        // AI classification (mock for now)
        String aiCategory = classifyImage(description);
        
        // Create routing timeline
        List<Map<String, Object>> timeline = new ArrayList<>();
        timeline.add(Map.of(
            "level", "ASHA",
            "userId", assignedOfficials.get("ashaId"),
            "assignedAt", Timestamp.now().getSeconds(),
            "status", "notified"
        ));
        
        // Store evidence
        Map<String, Object> evidenceData = new HashMap<>();
        evidenceData.put("evidenceId", evidenceId);
        evidenceData.put("userId", userId);
        evidenceData.put("imageUrls", imageUrls);
        evidenceData.put("description", description);
        evidenceData.put("location", new GeoPoint(latitude, longitude));
        evidenceData.put("aiCategory", aiCategory);
        evidenceData.put("status", "pending");
        evidenceData.put("ashaId", assignedOfficials.get("ashaId"));
        evidenceData.put("supervisorId", assignedOfficials.get("supervisorId"));
        evidenceData.put("cityOfficerId", assignedOfficials.get("cityOfficerId"));
        evidenceData.put("routingTimeline", timeline);
        evidenceData.put("timestamp", Timestamp.now());
        evidenceData.put("createdAt", Timestamp.now());
        
        firestore.collection("photo_evidence").document(evidenceId).set(evidenceData).get();
        
        log.info("Photo evidence uploaded: {} (category: {})", evidenceId, aiCategory);
        
        // Build response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("evidenceId", evidenceId);
        response.put("imageURL", imageUrls.get(0));
        response.put("assignedTo", Map.of(
            "ashaId", assignedOfficials.get("ashaId"),
            "supervisorId", assignedOfficials.get("supervisorId"),
            "cityOfficerId", assignedOfficials.get("cityOfficerId")
        ));
        response.put("aiCategory", aiCategory);
        response.put("routingTimeline", timeline);
        
        return response;
    }
    
    /**
     * Get routing timeline for evidence
     */
    public Map<String, Object> getRoutingTimeline(String evidenceId) 
            throws ExecutionException, InterruptedException {
        
        DocumentSnapshot doc = firestore.collection("photo_evidence")
                .document(evidenceId).get().get();
        
        if (!doc.exists()) {
            throw new RuntimeException("Evidence not found: " + evidenceId);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("evidenceId", evidenceId);
        response.put("timeline", doc.get("routingTimeline"));
        
        return response;
    }
    
    /**
     * Get evidence history for user
     */
    public List<Map<String, Object>> getEvidenceHistory(String userId) 
            throws ExecutionException, InterruptedException {
        
        List<QueryDocumentSnapshot> docs = firestore.collection("photo_evidence")
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().get().getDocuments();
        
        List<Map<String, Object>> history = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> evidence = new HashMap<>();
            evidence.put("evidenceId", doc.getString("evidenceId"));
            evidence.put("imageURL", ((List<String>) doc.get("imageUrls")).get(0));
            evidence.put("description", doc.getString("description"));
            evidence.put("timestamp", doc.getTimestamp("timestamp").getSeconds());
            evidence.put("status", doc.getString("status"));
            history.add(evidence);
        }
        
        return history;
    }
    
    /**
     * Acknowledge evidence (ASHA/Supervisor/City Officer)
     */
    public void acknowledgeEvidence(String evidenceId, String userId, String level) 
            throws ExecutionException, InterruptedException {
        
        DocumentReference docRef = firestore.collection("photo_evidence").document(evidenceId);
        DocumentSnapshot doc = docRef.get().get();
        
        if (!doc.exists()) {
            throw new RuntimeException("Evidence not found: " + evidenceId);
        }
        
        List<Map<String, Object>> timeline = (List<Map<String, Object>>) doc.get("routingTimeline");
        
        // Update timeline
        for (Map<String, Object> entry : timeline) {
            if (entry.get("level").equals(level)) {
                entry.put("acknowledgedAt", Timestamp.now().getSeconds());
                entry.put("status", "acknowledged");
            }
        }
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("routingTimeline", timeline);
        updates.put("status", "acknowledged");
        
        docRef.update(updates).get();
        
        log.info("Evidence {} acknowledged by {} ({})", evidenceId, userId, level);
    }
    
    // Helper methods
    
    private Map<String, String> assignOfficials(double latitude, double longitude) {
        // TODO: Query officials database based on location
        // For now, return mock assignments
        Map<String, String> officials = new HashMap<>();
        officials.put("ashaId", "A001");
        officials.put("supervisorId", "S023");
        officials.put("cityOfficerId", "C009");
        return officials;
    }
    
    private String classifyImage(String description) {
        // Simple keyword-based classification
        String desc = description.toLowerCase();
        if (desc.contains("dirty") || desc.contains("contaminated")) {
            return "Dirty Water";
        } else if (desc.contains("pipe") || desc.contains("leak")) {
            return "Broken Pipe";
        } else if (desc.contains("stagnant") || desc.contains("standing")) {
            return "Stagnant Water";
        } else if (desc.contains("sewage") || desc.contains("drain")) {
            return "Sewage Leak";
        }
        return "Water Quality Issue";
    }
    
    /**
     * Get all photo evidence for map display
     */
    public List<Map<String, Object>> getEvidenceForMap() 
            throws ExecutionException, InterruptedException {
        
        List<QueryDocumentSnapshot> docs = firestore.collection("photo_evidence")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(100)
                .get().get().getDocuments();
        
        List<Map<String, Object>> markers = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : docs) {
            GeoPoint location = doc.getGeoPoint("location");
            if (location == null) continue;
            
            Map<String, Object> marker = new HashMap<>();
            marker.put("id", doc.getString("evidenceId"));
            marker.put("lat", location.getLatitude());
            marker.put("lng", location.getLongitude());
            marker.put("description", doc.getString("description"));
            marker.put("category", doc.getString("aiCategory"));
            marker.put("status", doc.getString("status"));
            marker.put("imageUrls", doc.get("imageUrls"));
            marker.put("timestamp", doc.getTimestamp("timestamp").getSeconds());
            marker.put("userId", doc.getString("userId"));
            
            markers.add(marker);
        }
        
        log.info("Retrieved {} photo evidence markers for map", markers.size());
        
        return markers;
    }


    /**
     * Fix placeholder URLs in existing data
     * Replaces via.placeholder.com URLs with data URIs
     */
    public Map<String, Object> fixPlaceholderUrls() 
            throws ExecutionException, InterruptedException {
        
        log.info("🔧 Starting to fix placeholder URLs in existing photo evidence...");
        
        List<QueryDocumentSnapshot> docs = firestore.collection("photo_evidence")
                .get().get().getDocuments();
        
        int fixedCount = 0;
        int totalCount = docs.size();
        
        for (QueryDocumentSnapshot doc : docs) {
            List<String> imageUrls = (List<String>) doc.get("imageUrls");
            
            if (imageUrls != null && !imageUrls.isEmpty()) {
                boolean needsUpdate = false;
                List<String> updatedUrls = new ArrayList<>();
                
                for (int i = 0; i < imageUrls.size(); i++) {
                    String url = imageUrls.get(i);
                    
                    if (url.contains("via.placeholder.com")) {
                        // Replace with data URI
                        String dataUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%234CAF50'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3EPhoto Evidence " + (i+1) + "%3C/text%3E%3C/svg%3E";
                        updatedUrls.add(dataUri);
                        needsUpdate = true;
                    } else {
                        updatedUrls.add(url);
                    }
                }
                
                if (needsUpdate) {
                    doc.getReference().update("imageUrls", updatedUrls).get();
                    fixedCount++;
                    log.info("✅ Fixed URLs for evidence: {}", doc.getString("evidenceId"));
                }
            }
        }
        
        log.info("🎉 Fixed {} out of {} photo evidence records", fixedCount, totalCount);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("totalRecords", totalCount);
        result.put("fixedRecords", fixedCount);
        result.put("message", "Replaced via.placeholder.com URLs with data URIs");
        
        return result;
    }
}
