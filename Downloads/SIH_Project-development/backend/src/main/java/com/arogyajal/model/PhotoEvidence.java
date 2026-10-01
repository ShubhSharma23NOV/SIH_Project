package com.arogyajal.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.GeoPoint;
import java.util.List;
import java.util.Map;

/**
 * Photo Evidence Model
 * Stores photo evidence with routing workflow
 */
public class PhotoEvidence {
    private String id;
    private String evidenceId;
    private String userId;
    private String userPhone;
    private List<String> imageUrls;
    private String description;
    private GeoPoint location;
    private String aiCategory;
    private String status; // pending, acknowledged, resolved
    private Map<String, Object> routingTimeline;
    private Timestamp timestamp;
    private Timestamp createdAt;
    
    // Assigned officials
    private String ashaId;
    private String supervisorId;
    private String cityOfficerId;
    
    public PhotoEvidence() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEvidenceId() {
        return evidenceId;
    }

    public void setEvidenceId(String evidenceId) {
        this.evidenceId = evidenceId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public GeoPoint getLocation() {
        return location;
    }

    public void setLocation(GeoPoint location) {
        this.location = location;
    }

    public String getAiCategory() {
        return aiCategory;
    }

    public void setAiCategory(String aiCategory) {
        this.aiCategory = aiCategory;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Map<String, Object> getRoutingTimeline() {
        return routingTimeline;
    }

    public void setRoutingTimeline(Map<String, Object> routingTimeline) {
        this.routingTimeline = routingTimeline;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public String getAshaId() {
        return ashaId;
    }

    public void setAshaId(String ashaId) {
        this.ashaId = ashaId;
    }

    public String getSupervisorId() {
        return supervisorId;
    }

    public void setSupervisorId(String supervisorId) {
        this.supervisorId = supervisorId;
    }

    public String getCityOfficerId() {
        return cityOfficerId;
    }

    public void setCityOfficerId(String cityOfficerId) {
        this.cityOfficerId = cityOfficerId;
    }
}
