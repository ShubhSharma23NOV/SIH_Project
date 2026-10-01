package com.arogyajal.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.GeoPoint;

/**
 * Represents a manual water quality test conducted by field workers (ASHA workers).
 * Supports offline data entry and later synchronization.
 */
public class ManualWaterTest {
    
    @DocumentId
    private String id;
    
    private String testerId; // ASHA worker ID or field worker ID
    private String testerName; // Name of the tester
    private String location; // Location name (village/area)
    private GeoPoint geoLocation; // GPS coordinates
    
    @ServerTimestamp
    private Timestamp testDate;
    
    // Water quality parameters (same as IoT sensors)
    private Double ph;
    private Double turbidity; // NTU
    private Integer tds; // ppm (Total Dissolved Solids)
    private Double dissolvedOxygen; // mg/L
    private Double temperature; // Celsius
    
    // Test metadata
    private String testKitType; // Type of test kit used
    private String photoUrl; // Photo of test strip/results (optional)
    private String notes; // Additional observations
    
    // Water source information
    private String waterSourceType; // WELL, TAP, RIVER, POND, BOREWELL
    private String waterSourceId; // Unique identifier for the water source
    
    // Offline sync support
    private String syncStatus; // SYNCED, PENDING, FAILED
    private Timestamp offlineCreatedAt; // Original creation time on mobile device
    private Integer syncAttempts; // Number of sync attempts
    
    // Quality assessment (calculated by backend)
    private String qualityStatus; // SAFE, UNSAFE, CRITICAL
    private Boolean alertGenerated; // Whether an alert was created
    
    @ServerTimestamp
    private Timestamp createdAt;
    
    @ServerTimestamp
    private Timestamp updatedAt;
    
    // Constructors
    public ManualWaterTest() {
    }
    
    public ManualWaterTest(String id, String testerId, String testerName, String location, 
                          GeoPoint geoLocation, Timestamp testDate, Double ph, Double turbidity,
                          Integer tds, Double dissolvedOxygen, Double temperature, String testKitType,
                          String photoUrl, String notes, String waterSourceType, String waterSourceId,
                          String syncStatus, Timestamp offlineCreatedAt, Integer syncAttempts,
                          String qualityStatus, Boolean alertGenerated, Timestamp createdAt, 
                          Timestamp updatedAt) {
        this.id = id;
        this.testerId = testerId;
        this.testerName = testerName;
        this.location = location;
        this.geoLocation = geoLocation;
        this.testDate = testDate;
        this.ph = ph;
        this.turbidity = turbidity;
        this.tds = tds;
        this.dissolvedOxygen = dissolvedOxygen;
        this.temperature = temperature;
        this.testKitType = testKitType;
        this.photoUrl = photoUrl;
        this.notes = notes;
        this.waterSourceType = waterSourceType;
        this.waterSourceId = waterSourceId;
        this.syncStatus = syncStatus;
        this.offlineCreatedAt = offlineCreatedAt;
        this.syncAttempts = syncAttempts;
        this.qualityStatus = qualityStatus;
        this.alertGenerated = alertGenerated;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTesterId() {
        return testerId;
    }
    
    public void setTesterId(String testerId) {
        this.testerId = testerId;
    }
    
    public String getTesterName() {
        return testerName;
    }
    
    public void setTesterName(String testerName) {
        this.testerName = testerName;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public GeoPoint getGeoLocation() {
        return geoLocation;
    }
    
    public void setGeoLocation(GeoPoint geoLocation) {
        this.geoLocation = geoLocation;
    }
    
    public Timestamp getTestDate() {
        return testDate;
    }
    
    public void setTestDate(Timestamp testDate) {
        this.testDate = testDate;
    }
    
    public Double getPh() {
        return ph;
    }
    
    public void setPh(Double ph) {
        this.ph = ph;
    }
    
    public Double getTurbidity() {
        return turbidity;
    }
    
    public void setTurbidity(Double turbidity) {
        this.turbidity = turbidity;
    }
    
    public Integer getTds() {
        return tds;
    }
    
    public void setTds(Integer tds) {
        this.tds = tds;
    }
    
    public Double getDissolvedOxygen() {
        return dissolvedOxygen;
    }
    
    public void setDissolvedOxygen(Double dissolvedOxygen) {
        this.dissolvedOxygen = dissolvedOxygen;
    }
    
    public Double getTemperature() {
        return temperature;
    }
    
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }
    
    public String getTestKitType() {
        return testKitType;
    }
    
    public void setTestKitType(String testKitType) {
        this.testKitType = testKitType;
    }
    
    public String getPhotoUrl() {
        return photoUrl;
    }
    
    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getWaterSourceType() {
        return waterSourceType;
    }
    
    public void setWaterSourceType(String waterSourceType) {
        this.waterSourceType = waterSourceType;
    }
    
    public String getWaterSourceId() {
        return waterSourceId;
    }
    
    public void setWaterSourceId(String waterSourceId) {
        this.waterSourceId = waterSourceId;
    }
    
    public String getSyncStatus() {
        return syncStatus;
    }
    
    public void setSyncStatus(String syncStatus) {
        this.syncStatus = syncStatus;
    }
    
    public Timestamp getOfflineCreatedAt() {
        return offlineCreatedAt;
    }
    
    public void setOfflineCreatedAt(Timestamp offlineCreatedAt) {
        this.offlineCreatedAt = offlineCreatedAt;
    }
    
    public Integer getSyncAttempts() {
        return syncAttempts;
    }
    
    public void setSyncAttempts(Integer syncAttempts) {
        this.syncAttempts = syncAttempts;
    }
    
    public String getQualityStatus() {
        return qualityStatus;
    }
    
    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }
    
    public Boolean getAlertGenerated() {
        return alertGenerated;
    }
    
    public void setAlertGenerated(Boolean alertGenerated) {
        this.alertGenerated = alertGenerated;
    }
    
    public Timestamp getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
    
    public Timestamp getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "ManualWaterTest{" +
                "id='" + id + '\'' +
                ", testerId='" + testerId + '\'' +
                ", location='" + location + '\'' +
                ", testDate=" + testDate +
                ", ph=" + ph +
                ", turbidity=" + turbidity +
                ", tds=" + tds +
                ", dissolvedOxygen=" + dissolvedOxygen +
                ", temperature=" + temperature +
                ", waterSourceType='" + waterSourceType + '\'' +
                ", qualityStatus='" + qualityStatus + '\'' +
                ", syncStatus='" + syncStatus + '\'' +
                '}';
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String id;
        private String testerId;
        private String testerName;
        private String location;
        private GeoPoint geoLocation;
        private Timestamp testDate = Timestamp.now();
        private Double ph;
        private Double turbidity;
        private Integer tds;
        private Double dissolvedOxygen;
        private Double temperature;
        private String testKitType;
        private String photoUrl;
        private String notes;
        private String waterSourceType;
        private String waterSourceId;
        private String syncStatus = "SYNCED";
        private Timestamp offlineCreatedAt;
        private Integer syncAttempts = 0;
        private String qualityStatus;
        private Boolean alertGenerated = false;
        private Timestamp createdAt = Timestamp.now();
        private Timestamp updatedAt = Timestamp.now();
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder testerId(String testerId) {
            this.testerId = testerId;
            return this;
        }
        
        public Builder testerName(String testerName) {
            this.testerName = testerName;
            return this;
        }
        
        public Builder location(String location) {
            this.location = location;
            return this;
        }
        
        public Builder geoLocation(GeoPoint geoLocation) {
            this.geoLocation = geoLocation;
            return this;
        }
        
        public Builder testDate(Timestamp testDate) {
            this.testDate = testDate;
            return this;
        }
        
        public Builder ph(Double ph) {
            this.ph = ph;
            return this;
        }
        
        public Builder turbidity(Double turbidity) {
            this.turbidity = turbidity;
            return this;
        }
        
        public Builder tds(Integer tds) {
            this.tds = tds;
            return this;
        }
        
        public Builder dissolvedOxygen(Double dissolvedOxygen) {
            this.dissolvedOxygen = dissolvedOxygen;
            return this;
        }
        
        public Builder temperature(Double temperature) {
            this.temperature = temperature;
            return this;
        }
        
        public Builder testKitType(String testKitType) {
            this.testKitType = testKitType;
            return this;
        }
        
        public Builder photoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
            return this;
        }
        
        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }
        
        public Builder waterSourceType(String waterSourceType) {
            this.waterSourceType = waterSourceType;
            return this;
        }
        
        public Builder waterSourceId(String waterSourceId) {
            this.waterSourceId = waterSourceId;
            return this;
        }
        
        public Builder syncStatus(String syncStatus) {
            this.syncStatus = syncStatus;
            return this;
        }
        
        public Builder offlineCreatedAt(Timestamp offlineCreatedAt) {
            this.offlineCreatedAt = offlineCreatedAt;
            return this;
        }
        
        public Builder syncAttempts(Integer syncAttempts) {
            this.syncAttempts = syncAttempts;
            return this;
        }
        
        public Builder qualityStatus(String qualityStatus) {
            this.qualityStatus = qualityStatus;
            return this;
        }
        
        public Builder alertGenerated(Boolean alertGenerated) {
            this.alertGenerated = alertGenerated;
            return this;
        }
        
        public Builder createdAt(Timestamp createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        public Builder updatedAt(Timestamp updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }
        
        public ManualWaterTest build() {
            ManualWaterTest test = new ManualWaterTest();
            test.setId(id);
            test.setTesterId(testerId);
            test.setTesterName(testerName);
            test.setLocation(location);
            test.setGeoLocation(geoLocation);
            test.setTestDate(testDate);
            test.setPh(ph);
            test.setTurbidity(turbidity);
            test.setTds(tds);
            test.setDissolvedOxygen(dissolvedOxygen);
            test.setTemperature(temperature);
            test.setTestKitType(testKitType);
            test.setPhotoUrl(photoUrl);
            test.setNotes(notes);
            test.setWaterSourceType(waterSourceType);
            test.setWaterSourceId(waterSourceId);
            test.setSyncStatus(syncStatus);
            test.setOfflineCreatedAt(offlineCreatedAt);
            test.setSyncAttempts(syncAttempts);
            test.setQualityStatus(qualityStatus);
            test.setAlertGenerated(alertGenerated);
            test.setCreatedAt(createdAt);
            test.setUpdatedAt(updatedAt);
            return test;
        }
    }
}
