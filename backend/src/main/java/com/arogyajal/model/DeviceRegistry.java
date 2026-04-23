package com.arogyajal.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;

/**
 * Device Registry Model
 * Stores device metadata including reverse-geocoded location information
 */
public class DeviceRegistry {
    
    @DocumentId
    private String deviceId;
    
    private Double lat;
    private Double lon;
    
    // Reverse-geocoded location fields
    private String state;
    private String district;
    private String cityOrTown;
    private String village;
    
    // Optional metadata
    private String waterSourceType;
    private Boolean verified;
    private Boolean needsVerification;
    
    // Tracking
    private String geoSource; // NOMINATIM_OSM, MANUAL, etc.
    private Timestamp createdAt;
    private Timestamp updatedAt;
    
    // Raw address data (for debugging)
    private String rawAddress;
    
    // Constructors
    public DeviceRegistry() {
    }
    
    public DeviceRegistry(String deviceId, Double lat, Double lon, String state, String district, 
                         String cityOrTown, String village, String waterSourceType, Boolean verified, 
                         Boolean needsVerification, String geoSource, Timestamp createdAt, 
                         Timestamp updatedAt, String rawAddress) {
        this.deviceId = deviceId;
        this.lat = lat;
        this.lon = lon;
        this.state = state;
        this.district = district;
        this.cityOrTown = cityOrTown;
        this.village = village;
        this.waterSourceType = waterSourceType;
        this.verified = verified;
        this.needsVerification = needsVerification;
        this.geoSource = geoSource;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.rawAddress = rawAddress;
    }
    
    // Getters and Setters
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public Double getLat() {
        return lat;
    }
    
    public void setLat(Double lat) {
        this.lat = lat;
    }
    
    public Double getLon() {
        return lon;
    }
    
    public void setLon(Double lon) {
        this.lon = lon;
    }
    
    public String getState() {
        return state;
    }
    
    public void setState(String state) {
        this.state = state;
    }
    
    public String getDistrict() {
        return district;
    }
    
    public void setDistrict(String district) {
        this.district = district;
    }
    
    public String getCityOrTown() {
        return cityOrTown;
    }
    
    public void setCityOrTown(String cityOrTown) {
        this.cityOrTown = cityOrTown;
    }
    
    public String getVillage() {
        return village;
    }
    
    public void setVillage(String village) {
        this.village = village;
    }
    
    public String getWaterSourceType() {
        return waterSourceType;
    }
    
    public void setWaterSourceType(String waterSourceType) {
        this.waterSourceType = waterSourceType;
    }
    
    public Boolean getVerified() {
        return verified;
    }
    
    public void setVerified(Boolean verified) {
        this.verified = verified;
    }
    
    public Boolean getNeedsVerification() {
        return needsVerification;
    }
    
    public void setNeedsVerification(Boolean needsVerification) {
        this.needsVerification = needsVerification;
    }
    
    public String getGeoSource() {
        return geoSource;
    }
    
    public void setGeoSource(String geoSource) {
        this.geoSource = geoSource;
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
    
    public String getRawAddress() {
        return rawAddress;
    }
    
    public void setRawAddress(String rawAddress) {
        this.rawAddress = rawAddress;
    }
}
