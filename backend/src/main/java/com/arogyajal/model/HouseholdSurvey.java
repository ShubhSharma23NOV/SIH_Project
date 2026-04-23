package com.arogyajal.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import java.util.List;
import java.util.Map;

public class HouseholdSurvey {
    
    @DocumentId
    private String id;
    private String state;
    private String district;
    private String block;
    private String village;
    private String householdId;
    private String dateOfVisit;
    private String filedBy;
    private String contactNumber;
    private Map<String, Double> gpsLocation;
    private String headOfHousehold;
    private String totalMembers;
    private String age0to5;
    private String age6to18;
    private String age19to50;
    private String age50plus;
    private String socialCategory;
    private String educationLevel;
    private String waterSource;
    private List<String> waterTreatment;
    private String storageType;
    private String distanceFromSource;
    private String sharedSource;
    private String toiletFacility;
    private String handwashing;
    private String wastewaterDisposal;
    private String solidWasteDisposal;
    private List<Map<String, Object>> members;
    private String riskLevel;
    private String waterContaminationLikelihood;
    private String recommendedAction;
    private Map<String, Object> consentData;
    private Integer synced;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private String status;
    
    public HouseholdSurvey() {}
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    
    public String getBlock() { return block; }
    public void setBlock(String block) { this.block = block; }
    
    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }
    
    public String getHouseholdId() { return householdId; }
    public void setHouseholdId(String householdId) { this.householdId = householdId; }
    
    public String getDateOfVisit() { return dateOfVisit; }
    public void setDateOfVisit(String dateOfVisit) { this.dateOfVisit = dateOfVisit; }
    
    public String getFiledBy() { return filedBy; }
    public void setFiledBy(String filedBy) { this.filedBy = filedBy; }
    
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    
    public Map<String, Double> getGpsLocation() { return gpsLocation; }
    public void setGpsLocation(Map<String, Double> gpsLocation) { this.gpsLocation = gpsLocation; }
    
    public String getHeadOfHousehold() { return headOfHousehold; }
    public void setHeadOfHousehold(String headOfHousehold) { this.headOfHousehold = headOfHousehold; }
    
    public String getTotalMembers() { return totalMembers; }
    public void setTotalMembers(String totalMembers) { this.totalMembers = totalMembers; }
    
    public String getAge0to5() { return age0to5; }
    public void setAge0to5(String age0to5) { this.age0to5 = age0to5; }
    
    public String getAge6to18() { return age6to18; }
    public void setAge6to18(String age6to18) { this.age6to18 = age6to18; }
    
    public String getAge19to50() { return age19to50; }
    public void setAge19to50(String age19to50) { this.age19to50 = age19to50; }
    
    public String getAge50plus() { return age50plus; }
    public void setAge50plus(String age50plus) { this.age50plus = age50plus; }
    
    public String getSocialCategory() { return socialCategory; }
    public void setSocialCategory(String socialCategory) { this.socialCategory = socialCategory; }
    
    public String getEducationLevel() { return educationLevel; }
    public void setEducationLevel(String educationLevel) { this.educationLevel = educationLevel; }
    
    public String getWaterSource() { return waterSource; }
    public void setWaterSource(String waterSource) { this.waterSource = waterSource; }
    
    public List<String> getWaterTreatment() { return waterTreatment; }
    public void setWaterTreatment(List<String> waterTreatment) { this.waterTreatment = waterTreatment; }
    
    public String getStorageType() { return storageType; }
    public void setStorageType(String storageType) { this.storageType = storageType; }
    
    public String getDistanceFromSource() { return distanceFromSource; }
    public void setDistanceFromSource(String distanceFromSource) { this.distanceFromSource = distanceFromSource; }
    
    public String getSharedSource() { return sharedSource; }
    public void setSharedSource(String sharedSource) { this.sharedSource = sharedSource; }
    
    public String getToiletFacility() { return toiletFacility; }
    public void setToiletFacility(String toiletFacility) { this.toiletFacility = toiletFacility; }
    
    public String getHandwashing() { return handwashing; }
    public void setHandwashing(String handwashing) { this.handwashing = handwashing; }
    
    public String getWastewaterDisposal() { return wastewaterDisposal; }
    public void setWastewaterDisposal(String wastewaterDisposal) { this.wastewaterDisposal = wastewaterDisposal; }
    
    public String getSolidWasteDisposal() { return solidWasteDisposal; }
    public void setSolidWasteDisposal(String solidWasteDisposal) { this.solidWasteDisposal = solidWasteDisposal; }
    
    public List<Map<String, Object>> getMembers() { return members; }
    public void setMembers(List<Map<String, Object>> members) { this.members = members; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public String getWaterContaminationLikelihood() { return waterContaminationLikelihood; }
    public void setWaterContaminationLikelihood(String waterContaminationLikelihood) { 
        this.waterContaminationLikelihood = waterContaminationLikelihood; 
    }
    
    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    
    public Map<String, Object> getConsentData() { return consentData; }
    public void setConsentData(Map<String, Object> consentData) { this.consentData = consentData; }
    
    public Integer getSynced() { return synced; }
    public void setSynced(Integer synced) { this.synced = synced; }
    
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
    
    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
