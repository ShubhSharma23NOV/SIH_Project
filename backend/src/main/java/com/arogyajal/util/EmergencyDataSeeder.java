package com.arogyajal.util;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.GeoPoint;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Seeds emergency data to Firestore on application startup
 * DISABLED: Causing quota exhaustion - enable only when needed
 */
// @Component  // DISABLED to prevent quota exhaustion
public class EmergencyDataSeeder implements CommandLineRunner {
    
    private static final Logger log = LoggerFactory.getLogger(EmergencyDataSeeder.class);
    
    @Override
    public void run(String... args) throws Exception {
        log.info("🌱 Checking if emergency data needs seeding...");
        
        Firestore firestore = FirestoreClient.getFirestore();
        
        // Check if data already exists
        long phcCount = firestore.collection("phc_facilities").get().get().size();
        
        if (phcCount > 0) {
            log.info("✓ Emergency data already exists. Skipping seed.");
            return;
        }
        
        log.info("📍 Seeding PHC Facilities...");
        seedPHCFacilities(firestore);
        
        log.info("📢 Seeding District Advisories...");
        seedDistrictAdvisories(firestore);
        
        log.info("💧 Seeding Water Updates...");
        seedWaterUpdates(firestore);
        
        log.info("✅ Emergency data seeding completed!");
    }
    
    private void seedPHCFacilities(Firestore firestore) throws Exception {
        Map<String, Object> phc1 = new HashMap<>();
        phc1.put("name", "Guwahati Primary Health Center");
        phc1.put("location", new GeoPoint(26.1445, 91.7362));
        phc1.put("bedsAvailable", 12L);
        phc1.put("doctorsOnDuty", 3L);
        phc1.put("phone", "+91-361-2345678");
        phc1.put("active", true);
        firestore.collection("phc_facilities").document("phc_guwahati_001").set(phc1).get();
        
        Map<String, Object> phc2 = new HashMap<>();
        phc2.put("name", "Kamakhya PHC");
        phc2.put("location", new GeoPoint(26.1650, 91.7050));
        phc2.put("bedsAvailable", 8L);
        phc2.put("doctorsOnDuty", 2L);
        phc2.put("phone", "+91-361-2345679");
        phc2.put("active", true);
        firestore.collection("phc_facilities").document("phc_kamakhya_002").set(phc2).get();
        
        Map<String, Object> phc3 = new HashMap<>();
        phc3.put("name", "Dispur Community Health Center");
        phc3.put("location", new GeoPoint(26.1433, 91.7898));
        phc3.put("bedsAvailable", 15L);
        phc3.put("doctorsOnDuty", 4L);
        phc3.put("phone", "+91-361-2345680");
        phc3.put("active", true);
        firestore.collection("phc_facilities").document("phc_dispur_003").set(phc3).get();
        
        Map<String, Object> phc4 = new HashMap<>();
        phc4.put("name", "Barpeta District Hospital");
        phc4.put("location", new GeoPoint(26.3222, 90.9667));
        phc4.put("bedsAvailable", 20L);
        phc4.put("doctorsOnDuty", 5L);
        phc4.put("phone", "+91-3665-234567");
        phc4.put("active", true);
        firestore.collection("phc_facilities").document("phc_barpeta_004").set(phc4).get();
        
        log.info("  ✓ Added 4 PHC facilities");
    }
    
    private void seedDistrictAdvisories(Firestore firestore) throws Exception {
        Map<String, Object> adv1 = new HashMap<>();
        adv1.put("district", "Kamrup");
        adv1.put("title", "Water Quality Alert");
        adv1.put("message", "Boil water before drinking. Contamination detected in Guwahati area.");
        adv1.put("severity", "HIGH");
        adv1.put("author", "District Health Officer");
        adv1.put("active", true);
        adv1.put("createdAt", Timestamp.now());
        firestore.collection("district_advisories").document("adv_001").set(adv1).get();
        
        Map<String, Object> adv2 = new HashMap<>();
        adv2.put("district", "Kamrup");
        adv2.put("title", "Monsoon Health Advisory");
        adv2.put("message", "Increase in waterborne diseases. Maintain hygiene and use clean water.");
        adv2.put("severity", "MEDIUM");
        adv2.put("author", "State Health Department");
        adv2.put("active", true);
        adv2.put("createdAt", Timestamp.now());
        firestore.collection("district_advisories").document("adv_002").set(adv2).get();
        
        Map<String, Object> adv3 = new HashMap<>();
        adv3.put("district", "Barpeta");
        adv3.put("title", "Outbreak Prevention");
        adv3.put("message", "Preventive measures for diarrhea outbreak. Free ORS available at PHCs.");
        adv3.put("severity", "HIGH");
        adv3.put("author", "District Medical Officer");
        adv3.put("active", true);
        adv3.put("createdAt", Timestamp.now());
        firestore.collection("district_advisories").document("adv_003").set(adv3).get();
        
        log.info("  ✓ Added 3 district advisories");
    }
    
    private void seedWaterUpdates(Firestore firestore) throws Exception {
        Map<String, Object> water1 = new HashMap<>();
        water1.put("area", "2614_9173");
        water1.put("type", "maintenance");
        water1.put("message", "Water supply maintenance scheduled for tomorrow 10 AM - 2 PM");
        water1.put("status", "scheduled");
        water1.put("timestamp", Timestamp.now());
        firestore.collection("water_updates").document("water_001").set(water1).get();
        
        Map<String, Object> water2 = new HashMap<>();
        water2.put("area", "2614_9173");
        water2.put("type", "quality_check");
        water2.put("message", "Water quality testing completed. Results: Safe for consumption");
        water2.put("status", "completed");
        water2.put("timestamp", Timestamp.now());
        firestore.collection("water_updates").document("water_002").set(water2).get();
        
        Map<String, Object> water3 = new HashMap<>();
        water3.put("area", "2632_9096");
        water3.put("type", "alert");
        water3.put("message", "Temporary water contamination detected. Use boiled water only");
        water3.put("status", "active");
        water3.put("timestamp", Timestamp.now());
        firestore.collection("water_updates").document("water_003").set(water3).get();
        
        log.info("  ✓ Added 3 water updates");
    }
}
