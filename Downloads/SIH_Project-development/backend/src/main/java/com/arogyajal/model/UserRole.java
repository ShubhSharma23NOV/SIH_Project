package com.arogyajal.model;

/**
 * Enum representing different user roles in the ArogyaJal system.
 * Follows the government health system hierarchy.
 */
public enum UserRole {
    STATE_ADMIN("State Admin", 1),
    DISTRICT_HEALTH_OFFICER("District Health Officer", 2),
    LAB_OFFICIAL("Lab Official", 2),
    MEDICAL_OFFICER("Medical Officer", 3),
    VILLAGE_HEALTH_OFFICER("Village Health Officer", 4),
    ASHA_WORKER("ASHA Worker", 5),
    CLINIC("Clinic", 5);
    
    private final String displayName;
    private final int level; // Hierarchy level
    
    UserRole(String displayName, int level) {
        this.displayName = displayName;
        this.level = level;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getLevel() {
        return level;
    }
    
    /**
     * Check if this role can register another role
     */
    public boolean canRegister(UserRole targetRole) {
        // Can only register roles one level below
        return this.level == targetRole.level - 1;
    }
    
    /**
     * Get permissions for this role
     */
    public RolePermissions getPermissions() {
        switch (this) {
            case STATE_ADMIN:
                return new RolePermissions(true, false, true, false);
            case DISTRICT_HEALTH_OFFICER:
                return new RolePermissions(true, false, true, false);
            case LAB_OFFICIAL:
                return new RolePermissions(false, true, false, false);
            case MEDICAL_OFFICER:
                return new RolePermissions(false, false, true, false);
            case VILLAGE_HEALTH_OFFICER:
                return new RolePermissions(true, false, true, true);
            case ASHA_WORKER:
                return new RolePermissions(false, false, false, false);
            case CLINIC:
                return new RolePermissions(false, false, false, false);
            default:
                return new RolePermissions(false, false, false, false);
        }
    }
    
    public static class RolePermissions {
        private final boolean canRegisterUsers;
        private final boolean canUpdateSensors;
        private final boolean canInvestigateReports;
        private final boolean canResolveReports;
        
        public RolePermissions(boolean canRegisterUsers, boolean canUpdateSensors,
                             boolean canInvestigateReports, boolean canResolveReports) {
            this.canRegisterUsers = canRegisterUsers;
            this.canUpdateSensors = canUpdateSensors;
            this.canInvestigateReports = canInvestigateReports;
            this.canResolveReports = canResolveReports;
        }
        
        public boolean canRegisterUsers() {
            return canRegisterUsers;
        }
        
        public boolean canUpdateSensors() {
            return canUpdateSensors;
        }
        
        public boolean canInvestigateReports() {
            return canInvestigateReports;
        }
        
        public boolean canResolveReports() {
            return canResolveReports;
        }
    }
}
