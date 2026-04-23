package com.arogyajal.dto;

import com.arogyajal.model.User;

/**
 * DTO for login response with user info, jurisdiction, and permissions
 */
public class LoginResponse {
    
    private String token;
    private UserInfo user;
    private Jurisdiction jurisdiction;
    private Permissions permissions;
    
    public LoginResponse() {
    }
    
    public LoginResponse(String token, User user) {
        this.token = token;
        this.user = new UserInfo(user);
        this.jurisdiction = new Jurisdiction(user);
        this.permissions = new Permissions(user);
    }
    
    // Getters and Setters
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
    
    public Jurisdiction getJurisdiction() {
        return jurisdiction;
    }
    
    public void setJurisdiction(Jurisdiction jurisdiction) {
        this.jurisdiction = jurisdiction;
    }
    
    public Permissions getPermissions() {
        return permissions;
    }
    
    public void setPermissions(Permissions permissions) {
        this.permissions = permissions;
    }
    
    /**
     * User information (without sensitive data)
     */
    public static class UserInfo {
        private String id;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String role;
        private String designation;
        private String employeeId;
        
        public UserInfo() {
        }
        
        public UserInfo(User user) {
            this.id = user.getId();
            this.fullName = user.getFullName();
            this.email = user.getEmail();
            this.phoneNumber = user.getPhoneNumber();
            this.role = user.getRole();
            this.designation = user.getDesignation();
            this.employeeId = user.getEmployeeId();
        }
        
        // Getters and Setters
        public String getId() {
            return id;
        }
        
        public void setId(String id) {
            this.id = id;
        }
        
        public String getFullName() {
            return fullName;
        }
        
        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getPhoneNumber() {
            return phoneNumber;
        }
        
        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
        
        public String getDesignation() {
            return designation;
        }
        
        public void setDesignation(String designation) {
            this.designation = designation;
        }
        
        public String getEmployeeId() {
            return employeeId;
        }
        
        public void setEmployeeId(String employeeId) {
            this.employeeId = employeeId;
        }
    }
    
    /**
     * User's jurisdiction (auto-filter data)
     */
    public static class Jurisdiction {
        private String state;
        private String district;
        private String block;
        private String village;
        
        public Jurisdiction() {
        }
        
        public Jurisdiction(User user) {
            this.state = user.getState();
            this.district = user.getDistrict();
            this.block = user.getBlock();
            this.village = user.getVillage();
        }
        
        public Jurisdiction(String state, String district, String block, String village) {
            this.state = state;
            this.district = district;
            this.block = block;
            this.village = village;
        }
        
        // Getters and Setters
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
        
        public String getBlock() {
            return block;
        }
        
        public void setBlock(String block) {
            this.block = block;
        }
        
        public String getVillage() {
            return village;
        }
        
        public void setVillage(String village) {
            this.village = village;
        }
    }
    
    /**
     * User's permissions
     */
    public static class Permissions {
        private boolean canRegisterUsers;
        private boolean canUpdateSensors;
        private boolean canInvestigateReports;
        private boolean canResolveReports;
        
        public Permissions() {
        }
        
        public Permissions(User user) {
            this.canRegisterUsers = user.getCanRegisterUsers() != null && user.getCanRegisterUsers();
            this.canUpdateSensors = user.getCanUpdateSensors() != null && user.getCanUpdateSensors();
            this.canInvestigateReports = user.getCanInvestigateReports() != null && user.getCanInvestigateReports();
            this.canResolveReports = user.getCanResolveReports() != null && user.getCanResolveReports();
        }
        
        public Permissions(boolean canRegisterUsers, boolean canUpdateSensors,
                         boolean canInvestigateReports, boolean canResolveReports) {
            this.canRegisterUsers = canRegisterUsers;
            this.canUpdateSensors = canUpdateSensors;
            this.canInvestigateReports = canInvestigateReports;
            this.canResolveReports = canResolveReports;
        }
        
        // Getters and Setters
        public boolean isCanRegisterUsers() {
            return canRegisterUsers;
        }
        
        public void setCanRegisterUsers(boolean canRegisterUsers) {
            this.canRegisterUsers = canRegisterUsers;
        }
        
        public boolean isCanUpdateSensors() {
            return canUpdateSensors;
        }
        
        public void setCanUpdateSensors(boolean canUpdateSensors) {
            this.canUpdateSensors = canUpdateSensors;
        }
        
        public boolean isCanInvestigateReports() {
            return canInvestigateReports;
        }
        
        public void setCanInvestigateReports(boolean canInvestigateReports) {
            this.canInvestigateReports = canInvestigateReports;
        }
        
        public boolean isCanResolveReports() {
            return canResolveReports;
        }
        
        public void setCanResolveReports(boolean canResolveReports) {
            this.canResolveReports = canResolveReports;
        }
    }
}
