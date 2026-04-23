package com.arogyajal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Base DTO for user registration requests
 */
public class UserRegistrationRequest {
    
    @NotBlank(message = "Role is required")
    private String role;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Invalid phone number")
    private String phoneNumber;
    
    @Email(message = "Invalid email address")
    private String email;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    // Location fields
    @NotBlank(message = "State is required")
    private String state;
    
    private String district;
    private String block;
    private String village;
    private String pincode;
    
    // Role-specific fields
    private String designation;
    private String employeeId;
    private String phcName;
    private String clinicName;
    private String labId;
    private String ashaId;
    
    // Constructors
    public UserRegistrationRequest() {
    }
    
    // Getters and Setters
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getPhoneNumber() {
        return phoneNumber;
    }
    
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
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
    
    public String getPincode() {
        return pincode;
    }
    
    public void setPincode(String pincode) {
        this.pincode = pincode;
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
    
    public String getPhcName() {
        return phcName;
    }
    
    public void setPhcName(String phcName) {
        this.phcName = phcName;
    }
    
    public String getClinicName() {
        return clinicName;
    }
    
    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }
    
    public String getLabId() {
        return labId;
    }
    
    public void setLabId(String labId) {
        this.labId = labId;
    }
    
    public String getAshaId() {
        return ashaId;
    }
    
    public void setAshaId(String ashaId) {
        this.ashaId = ashaId;
    }
}
