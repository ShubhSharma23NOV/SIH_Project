package com.arogyajal.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.ServerTimestamp;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.GeoPoint;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a symptom report submitted by users for tracking waterborne illnesses.
 * Enhanced for SIH PS 25001 compliance with GeoPoint support and proper Timestamp handling.
 */
public class SymptomReport {
    
    @DocumentId
    private String id;
    private String userId;
    private String location; // Location name (village/area)
    private GeoPoint geoLocation; // Geographic coordinates for clustering
    private String waterSource; // TAP, WELL, BOTTLED, etc.
    
    // Reporter information (for mobile app)
    private String reporterType; // ASHA, VILLAGER, CLINIC
    private String reporterId; // ID of the reporter
    
    // Patient information
    private String patientName; // Patient's name (optional for privacy)
    private Integer patientAge;
    private String patientGender; // MALE, FEMALE, OTHER
    private String patientPhone; // Patient's phone number
    
    // Symptoms
    private List<String> symptoms = new ArrayList<>(); // NAUSEA, DIARRHEA, STOMACH_ACHE, HEADACHE, etc.
    private String severity; // MILD, MODERATE, SEVERE
    private String duration; // HOURS, DAYS, WEEKS
    
    // Water consumption details
    private Integer waterConsumption; // in liters per day
    private Timestamp lastWaterConsumption;
    
    // Additional information
    private String additionalNotes;
    private String contactInfo;
    
    // Timestamp - FIXED: Changed from LocalDateTime to Timestamp
    @ServerTimestamp
    private Timestamp reportedAt;
    
    // Status
    private String status = "PENDING"; // PENDING, INVESTIGATED, RESOLVED
    private String investigationNotes;
    @ServerTimestamp
    private Timestamp investigatedAt;
    
    // Offline sync support
    private String syncStatus; // SYNCED, PENDING
    private Timestamp offlineCreatedAt; // Original creation time on mobile device
    
    // Constructors
    public SymptomReport() {
    }
    
    public SymptomReport(String id, String userId, String location, GeoPoint geoLocation, String waterSource, 
                        String reporterType, String reporterId, Integer patientAge, String patientGender,
                        List<String> symptoms, String severity, String duration, 
                        Integer waterConsumption, Timestamp lastWaterConsumption, 
                        String additionalNotes, String contactInfo, Timestamp reportedAt, 
                        String status, String investigationNotes, Timestamp investigatedAt,
                        String syncStatus, Timestamp offlineCreatedAt) {
        this.id = id;
        this.userId = userId;
        this.location = location;
        this.geoLocation = geoLocation;
        this.waterSource = waterSource;
        this.reporterType = reporterType;
        this.reporterId = reporterId;
        this.patientAge = patientAge;
        this.patientGender = patientGender;
        this.symptoms = symptoms;
        this.severity = severity;
        this.duration = duration;
        this.waterConsumption = waterConsumption;
        this.lastWaterConsumption = lastWaterConsumption;
        this.additionalNotes = additionalNotes;
        this.contactInfo = contactInfo;
        this.reportedAt = reportedAt;
        this.status = status;
        this.investigationNotes = investigationNotes;
        this.investigatedAt = investigatedAt;
        this.syncStatus = syncStatus;
        this.offlineCreatedAt = offlineCreatedAt;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public String getReporterType() {
        return reporterType;
    }

    public void setReporterType(String reporterType) {
        this.reporterType = reporterType;
    }

    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public Integer getPatientAge() {
        return patientAge;
    }

    public void setPatientAge(Integer patientAge) {
        this.patientAge = patientAge;
    }

    public String getPatientGender() {
        return patientGender;
    }

    public void setPatientGender(String patientGender) {
        this.patientGender = patientGender;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public String getWaterSource() {
        return waterSource;
    }

    public void setWaterSource(String waterSource) {
        this.waterSource = waterSource;
    }

    public List<String> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(List<String> symptoms) {
        this.symptoms = symptoms;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Integer getWaterConsumption() {
        return waterConsumption;
    }

    public void setWaterConsumption(Integer waterConsumption) {
        this.waterConsumption = waterConsumption;
    }

    public Timestamp getLastWaterConsumption() {
        return lastWaterConsumption;
    }

    public void setLastWaterConsumption(Timestamp lastWaterConsumption) {
        this.lastWaterConsumption = lastWaterConsumption;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public Timestamp getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(Timestamp reportedAt) {
        this.reportedAt = reportedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInvestigationNotes() {
        return investigationNotes;
    }

    public void setInvestigationNotes(String investigationNotes) {
        this.investigationNotes = investigationNotes;
    }

    public Timestamp getInvestigatedAt() {
        return investigatedAt;
    }

    public void setInvestigatedAt(Timestamp investigatedAt) {
        this.investigatedAt = investigatedAt;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SymptomReport that = (SymptomReport) o;
        return (id == null ? that.id == null : id.equals(that.id)) &&
               (userId == null ? that.userId == null : userId.equals(that.userId)) &&
               (location == null ? that.location == null : location.equals(that.location)) &&
               (waterSource == null ? that.waterSource == null : waterSource.equals(that.waterSource)) &&
               (symptoms == null ? that.symptoms == null : symptoms.equals(that.symptoms)) &&
               (severity == null ? that.severity == null : severity.equals(that.severity)) &&
               (duration == null ? that.duration == null : duration.equals(that.duration)) &&
               (waterConsumption == null ? that.waterConsumption == null : waterConsumption.equals(that.waterConsumption)) &&
               (lastWaterConsumption == null ? that.lastWaterConsumption == null : lastWaterConsumption.equals(that.lastWaterConsumption)) &&
               (additionalNotes == null ? that.additionalNotes == null : additionalNotes.equals(that.additionalNotes)) &&
               (contactInfo == null ? that.contactInfo == null : contactInfo.equals(that.contactInfo)) &&
               (reportedAt == null ? that.reportedAt == null : reportedAt.equals(that.reportedAt)) &&
               (status == null ? that.status == null : status.equals(that.status)) &&
               (investigationNotes == null ? that.investigationNotes == null : investigationNotes.equals(that.investigationNotes)) &&
               (investigatedAt == null ? that.investigatedAt == null : investigatedAt.equals(that.investigatedAt));
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + (id == null ? 0 : id.hashCode());
        result = prime * result + (userId == null ? 0 : userId.hashCode());
        result = prime * result + (location == null ? 0 : location.hashCode());
        result = prime * result + (waterSource == null ? 0 : waterSource.hashCode());
        result = prime * result + (symptoms == null ? 0 : symptoms.hashCode());
        result = prime * result + (severity == null ? 0 : severity.hashCode());
        result = prime * result + (duration == null ? 0 : duration.hashCode());
        result = prime * result + (waterConsumption == null ? 0 : waterConsumption.hashCode());
        result = prime * result + (lastWaterConsumption == null ? 0 : lastWaterConsumption.hashCode());
        result = prime * result + (additionalNotes == null ? 0 : additionalNotes.hashCode());
        result = prime * result + (contactInfo == null ? 0 : contactInfo.hashCode());
        result = prime * result + (reportedAt == null ? 0 : reportedAt.hashCode());
        result = prime * result + (status == null ? 0 : status.hashCode());
        result = prime * result + (investigationNotes == null ? 0 : investigationNotes.hashCode());
        result = prime * result + (investigatedAt == null ? 0 : investigatedAt.hashCode());
        return result;
    }

    @Override
    public String toString() {
        return "SymptomReport{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", location='" + location + '\'' +
                ", waterSource='" + waterSource + '\'' +
                ", symptoms=" + symptoms +
                ", severity='" + severity + '\'' +
                ", duration='" + duration + '\'' +
                ", waterConsumption=" + waterConsumption +
                ", lastWaterConsumption=" + lastWaterConsumption +
                ", additionalNotes='" + additionalNotes + '\'' +
                ", contactInfo='" + contactInfo + '\'' +
                ", reportedAt=" + reportedAt +
                ", status='" + status + '\'' +
                ", investigationNotes='" + investigationNotes + '\'' +
                ", investigatedAt=" + investigatedAt +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String userId;
        private String location;
        private GeoPoint geoLocation;
        private String waterSource;
        private String reporterType;
        private String reporterId;
        private Integer patientAge;
        private String patientGender;
        private List<String> symptoms;
        private String severity;
        private String duration;
        private Integer waterConsumption;
        private Timestamp lastWaterConsumption;
        private String additionalNotes;
        private String contactInfo;
        private Timestamp reportedAt = Timestamp.now();
        private String status = "PENDING";
        private String investigationNotes;
        private Timestamp investigatedAt;
        private String syncStatus = "SYNCED";
        private Timestamp offlineCreatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
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

        public Builder reporterType(String reporterType) {
            this.reporterType = reporterType;
            return this;
        }

        public Builder reporterId(String reporterId) {
            this.reporterId = reporterId;
            return this;
        }

        public Builder patientAge(Integer patientAge) {
            this.patientAge = patientAge;
            return this;
        }

        public Builder patientGender(String patientGender) {
            this.patientGender = patientGender;
            return this;
        }

        public Builder waterSource(String waterSource) {
            this.waterSource = waterSource;
            return this;
        }

        public Builder symptoms(List<String> symptoms) {
            this.symptoms = symptoms;
            return this;
        }

        public Builder severity(String severity) {
            this.severity = severity;
            return this;
        }

        public Builder duration(String duration) {
            this.duration = duration;
            return this;
        }

        public Builder waterConsumption(Integer waterConsumption) {
            this.waterConsumption = waterConsumption;
            return this;
        }

        public Builder lastWaterConsumption(Timestamp lastWaterConsumption) {
            this.lastWaterConsumption = lastWaterConsumption;
            return this;
        }

        public Builder additionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
            return this;
        }

        public Builder contactInfo(String contactInfo) {
            this.contactInfo = contactInfo;
            return this;
        }

        public Builder reportedAt(Timestamp reportedAt) {
            this.reportedAt = reportedAt;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder investigationNotes(String investigationNotes) {
            this.investigationNotes = investigationNotes;
            return this;
        }

        public Builder investigatedAt(Timestamp investigatedAt) {
            this.investigatedAt = investigatedAt;
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

        public SymptomReport build() {
            SymptomReport report = new SymptomReport();
            report.setId(id);
            report.setUserId(userId);
            report.setLocation(location);
            report.setGeoLocation(geoLocation);
            report.setWaterSource(waterSource);
            report.setReporterType(reporterType);
            report.setReporterId(reporterId);
            report.setPatientAge(patientAge);
            report.setPatientGender(patientGender);
            report.setSymptoms(symptoms);
            report.setSeverity(severity);
            report.setDuration(duration);
            report.setWaterConsumption(waterConsumption);
            report.setLastWaterConsumption(lastWaterConsumption);
            report.setAdditionalNotes(additionalNotes);
            report.setContactInfo(contactInfo);
            report.setReportedAt(reportedAt);
            report.setStatus(status);
            report.setInvestigationNotes(investigationNotes);
            report.setInvestigatedAt(investigatedAt);
            report.setSyncStatus(syncStatus);
            report.setOfflineCreatedAt(offlineCreatedAt);
            return report;
        }
    }
}
