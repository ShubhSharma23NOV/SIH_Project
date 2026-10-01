package com.arogyajal.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import java.util.List;

public class WaterTest {
    
    @DocumentId
    private String id;
    private String sourceType;
    private String sourceName;
    private String appearance;
    private String odour;
    private String suspendedMatter;
    private String pH;
    private String frc;
    private String turbidity;
    private Integer tds;
    private String hardness;
    private String geogenicParameter;
    private String rainfall24h;
    private List<String> nearbyRiskActivity;
    private String chlorination;
    private String storageMethod;
    private String photoPath;
    private String riskLevel;
    private Double latitude;
    private Double longitude;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String reporterId;
    private String reporterType;
    private String status;
    private Integer synced;
    
    public WaterTest() {}
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    
    public String getAppearance() { return appearance; }
    public void setAppearance(String appearance) { this.appearance = appearance; }
    
    public String getOdour() { return odour; }
    public void setOdour(String odour) { this.odour = odour; }
    
    public String getSuspendedMatter() { return suspendedMatter; }
    public void setSuspendedMatter(String suspendedMatter) { this.suspendedMatter = suspendedMatter; }
    
    public String getPH() { return pH; }
    public void setPH(String pH) { this.pH = pH; }
    
    public String getFrc() { return frc; }
    public void setFrc(String frc) { this.frc = frc; }
    
    public String getTurbidity() { return turbidity; }
    public void setTurbidity(String turbidity) { this.turbidity = turbidity; }
    
    public Integer getTds() { return tds; }
    public void setTds(Integer tds) { this.tds = tds; }
    
    public String getHardness() { return hardness; }
    public void setHardness(String hardness) { this.hardness = hardness; }
    
    public String getGeogenicParameter() { return geogenicParameter; }
    public void setGeogenicParameter(String geogenicParameter) { this.geogenicParameter = geogenicParameter; }
    
    public String getRainfall24h() { return rainfall24h; }
    public void setRainfall24h(String rainfall24h) { this.rainfall24h = rainfall24h; }
    
    public List<String> getNearbyRiskActivity() { return nearbyRiskActivity; }
    public void setNearbyRiskActivity(List<String> nearbyRiskActivity) { this.nearbyRiskActivity = nearbyRiskActivity; }
    
    public String getChlorination() { return chlorination; }
    public void setChlorination(String chlorination) { this.chlorination = chlorination; }
    
    public String getStorageMethod() { return storageMethod; }
    public void setStorageMethod(String storageMethod) { this.storageMethod = storageMethod; }
    
    public String getPhotoPath() { return photoPath; }
    public void setPhotoPath(String photoPath) { this.photoPath = photoPath; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    
    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
    
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    
    public String getReporterType() { return reporterType; }
    public void setReporterType(String reporterType) { this.reporterType = reporterType; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Integer getSynced() { return synced; }
    public void setSynced(Integer synced) { this.synced = synced; }
}
