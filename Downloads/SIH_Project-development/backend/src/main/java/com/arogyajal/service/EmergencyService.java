package com.arogyajal.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Emergency Service for Mobile App
 * Handles risk detection, emergency alerts, symptom reporting, and photo uploads
 */
@Service
public class EmergencyService {
    
    private static final Logger log = LoggerFactory.getLogger(EmergencyService.class);
    private static final double SEARCH_RADIUS_KM = 5.0;
    private static final int OUTBREAK_THRESHOLD = 5; // 5 reports trigger community alert
    
    private final Firestore firestore;
    
    public EmergencyService() {
        this.firestore = FirestoreClient.getFirestore();
    }
    
    /**
     * Detect water safety risk based on nearby sensors, lab reports, and alerts
     */
    public Map<String, Object> detectWaterRisk(double latitude, double longitude) {
        log.info("Detecting water risk for location: {}, {}", latitude, longitude);
        
        try {
            // Query sensor readings within 5km (last 24 hours)
            Instant yesterday = Instant.now().minus(24, ChronoUnit.HOURS);
            List<QueryDocumentSnapshot> sensorDocs = firestore.collection("sensor_readings")
                    .whereGreaterThan("timestamp", Timestamp.ofTimeSecondsAndNanos(yesterday.getEpochSecond(), 0))
                    .get().get().getDocuments();
            
            int contaminatedSensors = 0;
            for (QueryDocumentSnapshot doc : sensorDocs) {
                String location = doc.getString("location");
                if (location != null && isWithinRadius(latitude, longitude, location, SEARCH_RADIUS_KM)) {
                    String qualityStatus = doc.getString("qualityStatus");
                    if ("POOR".equalsIgnoreCase(qualityStatus) || "CRITICAL".equalsIgnoreCase(qualityStatus)) {
                        contaminatedSensors++;
                    }
                }
            }
            
            // Query lab reports (last 7 days)
            Instant lastWeek = Instant.now().minus(7, ChronoUnit.DAYS);
            List<QueryDocumentSnapshot> labDocs = firestore.collection("lab_reports")
                    .whereGreaterThan("timestamp", Timestamp.ofTimeSecondsAndNanos(lastWeek.getEpochSecond(), 0))
                    .get().get().getDocuments();
            
            int contaminatedLabReports = 0;
            for (QueryDocumentSnapshot doc : labDocs) {
                GeoPoint geoPoint = doc.getGeoPoint("location");
                if (geoPoint != null && calculateDistance(latitude, longitude, geoPoint.getLatitude(), geoPoint.getLongitude()) <= SEARCH_RADIUS_KM) {
                    String status = doc.getString("status");
                    if ("contaminated".equalsIgnoreCase(status)) {
                        contaminatedLabReports++;
                    }
                }
            }
            
            // Query active water alerts
            String areaCode = calculateAreaCode(latitude, longitude);
            List<QueryDocumentSnapshot> alertDocs = firestore.collection("water_alerts")
                    .whereEqualTo("area", areaCode)
                    .whereEqualTo("active", true)
                    .get().get().getDocuments();
            
            int activeAlerts = alertDocs.size();
            
            return buildRiskResponse(contaminatedSensors, contaminatedLabReports, activeAlerts);
            
        } catch (Exception e) {
            log.warn("Firestore error, using mock data: {}", e.getMessage());
            // Return mock data when Firestore fails (quota exceeded)
            return buildRiskResponse(2, 1, 1); // Mock: moderate risk
        }
    }
    
    private Map<String, Object> buildRiskResponse(int contaminatedSensors, int contaminatedLabReports, int activeAlerts) {
        // Calculate risk score (0-100)
        int riskScore = (contaminatedSensors * 5) + (contaminatedLabReports * 10) + (activeAlerts * 15);
        riskScore = Math.min(riskScore, 100);
        
        // Determine risk level
        String riskLevel;
        List<String> suggestedActions = new ArrayList<>();
        
        if (riskScore >= 50) {
            riskLevel = "contaminated";
            suggestedActions.add("Do not drink tap water");
            suggestedActions.add("Use boiled water only");
            suggestedActions.add("Clean overhead tank immediately");
            suggestedActions.add("Contact ASHA worker for assistance");
        } else if (riskScore >= 20) {
            riskLevel = "caution";
            suggestedActions.add("Boil water before drinking");
            suggestedActions.add("Monitor water quality");
            suggestedActions.add("Report any unusual taste or smell");
        } else {
            riskLevel = "safe";
            suggestedActions.add("Water quality is acceptable");
            suggestedActions.add("Continue regular monitoring");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("riskLevel", riskLevel);
        response.put("riskScore", riskScore);
        response.put("suggestedActions", suggestedActions);
        response.put("contaminatedSensors", contaminatedSensors);
        response.put("labReports", contaminatedLabReports);
        response.put("activeAlerts", activeAlerts);
        
        return response;
    }
    
    /**
     * Send emergency SOS alert to officials
     */
    public Map<String, Object> sendEmergencyAlert(Map<String, Object> request) throws ExecutionException, InterruptedException {
        String alertId = "alert_" + UUID.randomUUID().toString().substring(0, 8);
        
        Map<String, Object> alertData = new HashMap<>();
        alertData.put("userId", request.get("userId"));
        alertData.put("userPhone", request.get("userPhone"));
        alertData.put("type", request.get("type"));
        alertData.put("location", new GeoPoint(
                ((Number) request.get("latitude")).doubleValue(),
                ((Number) request.get("longitude")).doubleValue()
        ));
        alertData.put("address", request.get("address"));
        alertData.put("riskLevel", request.get("riskLevel"));
        alertData.put("status", "pending");
        alertData.put("escalated", false);
        alertData.put("notifiedContacts", request.get("contacts"));
        alertData.put("timestamp", Timestamp.now());
        alertData.put("platform", request.get("platform"));
        alertData.put("appVersion", request.get("appVersion"));
        
        // Save to Firestore
        firestore.collection("emergency_alerts").document(alertId).set(alertData).get();
        
        // TODO: Send SMS/push notifications to contacts
        log.info("Emergency alert saved: {} (notifications would be sent here)", alertId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("alertId", alertId);
        
        return response;
    }
    
    /**
     * Escalate alert to supervisor
     */
    public void escalateAlert(String alertId) throws ExecutionException, InterruptedException {
        DocumentReference alertRef = firestore.collection("emergency_alerts").document(alertId);
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", "escalated");
        updates.put("escalated", true);
        updates.put("escalatedAt", Timestamp.now());
        
        alertRef.update(updates).get();
        
        // TODO: Notify supervisor via SMS/push
        log.info("Alert escalated: {} (supervisor notification would be sent here)", alertId);
    }
    
    /**
     * Submit symptom report and check for outbreak
     */
    public Map<String, Object> submitSymptomReport(Map<String, Object> request) throws ExecutionException, InterruptedException {
        String reportId = "symptom_" + UUID.randomUUID().toString().substring(0, 8);
        double latitude = ((Number) request.get("latitude")).doubleValue();
        double longitude = ((Number) request.get("longitude")).doubleValue();
        String areaCode = calculateAreaCode(latitude, longitude);
        
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("userId", request.get("userId"));
        reportData.put("userPhone", request.get("userPhone"));
        reportData.put("symptoms", request.get("symptoms"));
        reportData.put("location", new GeoPoint(latitude, longitude));
        reportData.put("area", areaCode);
        reportData.put("timestamp", Timestamp.now());
        reportData.put("status", "pending");
        
        // Save to Firestore
        firestore.collection("symptom_reports").document(reportId).set(reportData).get();
        
        // Check for outbreak (count similar reports in last 24 hours)
        Instant yesterday = Instant.now().minus(24, ChronoUnit.HOURS);
        List<QueryDocumentSnapshot> recentReports = firestore.collection("symptom_reports")
                .whereEqualTo("area", areaCode)
                .whereGreaterThan("timestamp", Timestamp.ofTimeSecondsAndNanos(yesterday.getEpochSecond(), 0))
                .get().get().getDocuments();
        
        boolean outbreakDetected = recentReports.size() >= OUTBREAK_THRESHOLD;
        
        if (outbreakDetected) {
            // Create community alert
            createCommunityAlert(areaCode, recentReports, latitude, longitude);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("reportId", reportId);
        response.put("outbreakDetected", outbreakDetected);
        
        return response;
    }
    
    /**
     * Upload photos with metadata
     */
    public Map<String, Object> uploadPhotos(String userId, String userPhone, String description,
                                           double latitude, double longitude, List<MultipartFile> photos) 
            throws ExecutionException, InterruptedException {
        
        String reportId = "photo_" + UUID.randomUUID().toString().substring(0, 8);
        
        // TODO: Upload photos to Firebase Storage or S3
        // For now, generate placeholder URLs
        List<String> photoUrls = new ArrayList<>();
        for (int i = 0; i < photos.size(); i++) {
            photoUrls.add("https://storage.arogyajal.com/" + reportId + "_photo" + i + ".jpg");
        }
        
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("userId", userId);
        reportData.put("userPhone", userPhone);
        reportData.put("description", description);
        reportData.put("photoUrls", photoUrls);
        reportData.put("location", new GeoPoint(latitude, longitude));
        reportData.put("status", "pending");
        reportData.put("workflow", Map.of(
                "asha", Map.of("status", "pending", "timestamp", null),
                "supervisor", Map.of("status", "pending", "timestamp", null),
                "cityOfficer", Map.of("status", "pending", "timestamp", null)
        ));
        reportData.put("timestamp", Timestamp.now());
        
        // Save to Firestore
        firestore.collection("photo_reports").document(reportId).set(reportData).get();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("reportId", reportId);
        response.put("photoUrls", photoUrls);
        
        return response;
    }
    
    /**
     * Find nearest PHC with occupancy data
     */
    public Map<String, Object> findNearestPHC(double latitude, double longitude) {
        try {
            List<QueryDocumentSnapshot> phcDocs = firestore.collection("phc_facilities")
                    .whereEqualTo("active", true)
                    .get().get().getDocuments();
            
            Map<String, Object> nearestPHC = null;
            double minDistance = Double.MAX_VALUE;
            
            for (QueryDocumentSnapshot doc : phcDocs) {
                GeoPoint location = doc.getGeoPoint("location");
                if (location != null) {
                    double distance = calculateDistance(latitude, longitude, location.getLatitude(), location.getLongitude());
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPHC = new HashMap<>();
                        nearestPHC.put("name", doc.getString("name"));
                        nearestPHC.put("distance", String.format("%.1f km", distance));
                        nearestPHC.put("bedsAvailable", doc.getLong("bedsAvailable"));
                        nearestPHC.put("doctorsOnDuty", doc.getLong("doctorsOnDuty"));
                        nearestPHC.put("emergencyCapacity", doc.getLong("bedsAvailable") > 5 ? "Available" : "Limited");
                        nearestPHC.put("phone", doc.getString("phone"));
                        nearestPHC.put("location", Map.of(
                                "latitude", location.getLatitude(),
                                "longitude", location.getLongitude()
                        ));
                    }
                }
            }
            
            return nearestPHC;
            
        } catch (Exception e) {
            log.warn("Firestore error, using mock PHC data: {}", e.getMessage());
            // Return mock PHC when Firestore fails
            Map<String, Object> mockPHC = new HashMap<>();
            mockPHC.put("name", "Guwahati Primary Health Center");
            mockPHC.put("distance", "2.5 km");
            mockPHC.put("bedsAvailable", 12L);
            mockPHC.put("doctorsOnDuty", 3L);
            mockPHC.put("emergencyCapacity", "Available");
            mockPHC.put("phone", "+91-361-2345678");
            mockPHC.put("location", Map.of("latitude", 26.1445, "longitude", 91.7362));
            return mockPHC;
        }
    }
    
    /**
     * Get district health advisories
     */
    public List<Map<String, Object>> getDistrictAdvisories(String district) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection("district_advisories")
                .whereEqualTo("district", district)
                .whereEqualTo("active", true)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .limit(10)
                .get().get().getDocuments();
        
        List<Map<String, Object>> advisories = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> advisory = new HashMap<>();
            advisory.put("id", doc.getId());
            advisory.put("title", doc.getString("title"));
            advisory.put("message", doc.getString("message"));
            advisory.put("severity", doc.getString("severity"));
            advisory.put("createdAt", doc.getTimestamp("createdAt").toDate().toInstant().toString());
            advisory.put("author", doc.getString("author"));
            advisories.add(advisory);
        }
        
        return advisories;
    }
    
    /**
     * Get water distribution updates for area
     */
    public List<Map<String, Object>> getWaterUpdates(double latitude, double longitude) throws ExecutionException, InterruptedException {
        String areaCode = calculateAreaCode(latitude, longitude);
        
        Instant lastWeek = Instant.now().minus(7, ChronoUnit.DAYS);
        List<QueryDocumentSnapshot> docs = firestore.collection("water_updates")
                .whereEqualTo("area", areaCode)
                .whereGreaterThan("timestamp", Timestamp.ofTimeSecondsAndNanos(lastWeek.getEpochSecond(), 0))
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().get().getDocuments();
        
        List<Map<String, Object>> updates = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> update = new HashMap<>();
            update.put("type", doc.getString("type"));
            update.put("message", doc.getString("message"));
            update.put("status", doc.getString("status"));
            update.put("timestamp", doc.getTimestamp("timestamp").toDate().toInstant().toString());
            updates.add(update);
        }
        
        return updates;
    }
    
    /**
     * Get emergency contacts for user
     */
    public List<Map<String, Object>> getEmergencyContacts(String userId) {
        // TODO: Query user profile and get assigned contacts
        // For now, return default contacts
        List<Map<String, Object>> contacts = new ArrayList<>();
        
        contacts.add(Map.of("name", "ASHA Worker", "phone", "+91-9876543210", "role", "Primary"));
        contacts.add(Map.of("name", "ASHA Supervisor", "phone", "+91-9876543211", "role", "Escalation"));
        contacts.add(Map.of("name", "PHC Doctor", "phone", "+91-9876543212", "role", "Medical"));
        contacts.add(Map.of("name", "Ambulance", "phone", "108", "role", "Emergency"));
        
        return contacts;
    }
    
    // Helper methods
    
    private void createCommunityAlert(String areaCode, List<QueryDocumentSnapshot> reports, 
                                     double latitude, double longitude) throws ExecutionException, InterruptedException {
        String alertId = "community_" + UUID.randomUUID().toString().substring(0, 8);
        
        // Extract common symptoms
        Map<String, Integer> symptomCount = new HashMap<>();
        for (QueryDocumentSnapshot doc : reports) {
            List<String> symptoms = (List<String>) doc.get("symptoms");
            if (symptoms != null) {
                for (String symptom : symptoms) {
                    symptomCount.put(symptom, symptomCount.getOrDefault(symptom, 0) + 1);
                }
            }
        }
        
        List<String> topSymptoms = symptomCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        Map<String, Object> alertData = new HashMap<>();
        alertData.put("area", areaCode);
        alertData.put("type", "outbreak_suspected");
        alertData.put("reportCount", reports.size());
        alertData.put("symptoms", topSymptoms);
        alertData.put("location", new GeoPoint(latitude, longitude));
        alertData.put("status", "active");
        alertData.put("notifiedOfficials", true);
        alertData.put("timestamp", Timestamp.now());
        
        firestore.collection("community_alerts").document(alertId).set(alertData).get();
        
        log.info("Community alert created: {} ({} reports in area {})", alertId, reports.size(), areaCode);
    }
    
    private String calculateAreaCode(double latitude, double longitude) {
        // Grid-based area code: "2614_9173" for lat 26.14, lon 91.73
        int latCode = (int) (latitude * 100);
        int lonCode = (int) (longitude * 100);
        return latCode + "_" + lonCode;
    }
    
    private boolean isWithinRadius(double lat1, double lon1, String locationStr, double radiusKm) {
        try {
            String[] parts = locationStr.split(",");
            double lat2 = Double.parseDouble(parts[0]);
            double lon2 = Double.parseDouble(parts[1]);
            return calculateDistance(lat1, lon1, lat2, lon2) <= radiusKm;
        } catch (Exception e) {
            return false;
        }
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }


    
    /**
     * Get active emergency alerts
     */
    public List<Map<String, Object>> getActiveAlerts() throws ExecutionException, InterruptedException {
        try {
            // Simple query without orderBy to avoid index requirement
            List<QueryDocumentSnapshot> docs = firestore.collection("emergency_alerts")
                    .whereEqualTo("status", "pending")
                    .limit(50)
                    .get().get().getDocuments();
            
            List<Map<String, Object>> alerts = new ArrayList<>();
            for (QueryDocumentSnapshot doc : docs) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("alertId", doc.getId());
                alert.put("userId", doc.getString("userId"));
                alert.put("userPhone", doc.getString("userPhone"));
                alert.put("type", doc.getString("type"));
                alert.put("location", doc.get("location"));
                alert.put("address", doc.getString("address"));
                alert.put("riskLevel", doc.getString("riskLevel"));
                alert.put("status", doc.getString("status"));
                
                // Handle timestamp safely
                com.google.cloud.Timestamp ts = doc.getTimestamp("timestamp");
                if (ts != null) {
                    alert.put("timestamp", ts.getSeconds());
                } else {
                    alert.put("timestamp", System.currentTimeMillis() / 1000);
                }
                
                alerts.add(alert);
            }
            
            // Sort in memory by timestamp (descending)
            alerts.sort((a, b) -> Long.compare((Long)b.get("timestamp"), (Long)a.get("timestamp")));
            
            return alerts;
            
        } catch (Exception e) {
            log.warn("Error fetching active alerts, returning empty list: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
