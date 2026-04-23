package com.arogyajal.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.arogyajal.config.LocationDeserializer;
import com.arogyajal.config.SeverityDeserializer;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class SymptomRequest {
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    // Location can be either string or geoLocation object
    @JsonDeserialize(using = LocationDeserializer.class)
    private String location;
    
    // GeoLocation (mobile app sends this as "location" object with lat/lng)
    private Map<String, Double> geoLocation; // {lat: 28.6139, lng: 77.2090}
    
    // Latitude and longitude (extracted from location object if sent)
    private Double latitude;
    private Double longitude;
    
    private String waterSource;
    
    // Reporter information (optional)
    private String reporterType; // ASHA, VILLAGER, CLINIC
    private String reporterId;
    
    // Patient information (optional)
    private String patientName; // Patient's name
    private String patientPhone; // Patient's phone number
    private Integer patientAge;
    private String patientGender; // MALE, FEMALE, OTHER
    
    @NotEmpty(message = "At least one symptom must be reported")
    private List<String> symptoms;
    
    // Severity can be either string (MILD/MODERATE/SEVERE) or number (0/1/2)
    @JsonDeserialize(using = SeverityDeserializer.class)
    private String severity;
    
    @Pattern(regexp = "HOURS|DAYS|WEEKS", message = "Duration must be HOURS, DAYS, or WEEKS")
    private String duration; // Optional - defaults to "DAYS" if not provided
    
    @Min(value = 0, message = "Water consumption must be positive")
    @Max(value = 20, message = "Water consumption must be reasonable")
    private Integer waterConsumption; // Optional - defaults to 0 if not provided
    
    private String additionalNotes;
    
    private String contactInfo;

    public SymptomRequest() {
    }

    public SymptomRequest(String userId, String location, String waterSource, List<String> symptoms, 
                         String severity, String duration, Integer waterConsumption, 
                         String additionalNotes, String contactInfo) {
        this.userId = userId;
        this.location = location;
        this.waterSource = waterSource;
        this.symptoms = symptoms;
        this.severity = severity;
        this.duration = duration;
        this.waterConsumption = waterConsumption;
        this.additionalNotes = additionalNotes;
        this.contactInfo = contactInfo;
    }

    // Getters and Setters
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

    public Map<String, Double> getGeoLocation() {
        return geoLocation;
    }

    public void setGeoLocation(Map<String, Double> geoLocation) {
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

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SymptomRequest that = (SymptomRequest) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(location, that.location) &&
               Objects.equals(waterSource, that.waterSource) &&
               Objects.equals(symptoms, that.symptoms) &&
               Objects.equals(severity, that.severity) &&
               Objects.equals(duration, that.duration) &&
               Objects.equals(waterConsumption, that.waterConsumption) &&
               Objects.equals(additionalNotes, that.additionalNotes) &&
               Objects.equals(contactInfo, that.contactInfo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, location, waterSource, symptoms, severity, 
                          duration, waterConsumption, additionalNotes, contactInfo);
    }

    // toString
    @Override
    public String toString() {
        return "SymptomRequest{" +
               "userId='" + userId + '\'' +
               ", location='" + location + '\'' +
               ", waterSource='" + waterSource + '\'' +
               ", symptoms=" + symptoms +
               ", severity='" + severity + '\'' +
               ", duration='" + duration + '\'' +
               ", waterConsumption=" + waterConsumption +
               ", additionalNotes='" + additionalNotes + '\'' +
               ", contactInfo='" + contactInfo + '\'' +
               '}';
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String userId;
        private String location;
        private String waterSource;
        private List<String> symptoms;
        private String severity;
        private String duration;
        private Integer waterConsumption;
        private String additionalNotes;
        private String contactInfo;

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder location(String location) {
            this.location = location;
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

        public Builder additionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
            return this;
        }

        public Builder contactInfo(String contactInfo) {
            this.contactInfo = contactInfo;
            return this;
        }

        public SymptomRequest build() {
            return new SymptomRequest(userId, location, waterSource, symptoms, severity, 
                                    duration, waterConsumption, additionalNotes, contactInfo);
        }
    }
}
