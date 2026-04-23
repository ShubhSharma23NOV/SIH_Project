package com.arogyajal.controller;

import com.arogyajal.dto.UserRegistrationRequest;
import com.arogyajal.model.User;
import com.arogyajal.model.UserRole;
import com.arogyajal.service.UserService;
import com.google.cloud.Timestamp;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for user registration (role-based hierarchy)
 * NEW - Does not affect existing APIs
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class UserRegistrationController {
    
    private static final Logger log = LoggerFactory.getLogger(UserRegistrationController.class);
    
    @Autowired
    private UserService userService;
    
    /**
     * Register a new user (role-based with hierarchy)
     * Optional authentication - if no token, anyone can register
     * Different from /api/users/register (old endpoint for backward compatibility)
     */
    @PostMapping("/register-official")
    public ResponseEntity<?> registerUser(
            @Valid @RequestBody UserRegistrationRequest request,
            @RequestHeader(value = "Authorization", required = false) String token) {
        
        try {
            User registrar = null;
            
            // If token provided, validate registrar permissions
            if (token != null && !token.isEmpty()) {
                registrar = userService.getUserFromToken(token);
                
                if (registrar != null) {
                    // Check if registrar can register users
                    if (!registrar.getCanRegisterUsers()) {
                        return ResponseEntity.status(403).body(createError("You don't have permission to register users"));
                    }
                    
                    // Validate role hierarchy
                    try {
                        UserRole registrarRole = UserRole.valueOf(registrar.getRole());
                        UserRole targetRole = UserRole.valueOf(request.getRole());
                        
                        if (!registrarRole.canRegister(targetRole)) {
                            return ResponseEntity.status(403)
                                .body(createError("You can only register " + getRegisterableRoles(registrarRole)));
                        }
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(400).body(createError("Invalid role specified"));
                    }
                    
                    // Check jurisdiction
                    if (!isWithinJurisdiction(registrar, request)) {
                        return ResponseEntity.status(403)
                            .body(createError("You can only register users within your jurisdiction"));
                    }
                }
            }
            
            // Check if user already exists
            if (userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.status(400).body(createError("Email already registered"));
            }
            
            if (userService.existsByPhone(request.getPhoneNumber())) {
                return ResponseEntity.status(400).body(createError("Phone number already registered"));
            }
            
            // Create new user with generated ID
            String userId = java.util.UUID.randomUUID().toString();
            
            User newUser = User.builder()
                    .id(userId)  // Generate unique ID
                    .role(request.getRole())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .email(request.getEmail())
                    .passwordHash(userService.hashPassword(request.getPassword()))
                    .state(request.getState())
                    .district(request.getDistrict())
                    .block(request.getBlock())
                    .village(request.getVillage())
                    .pincode(request.getPincode())
                    .designation(request.getDesignation())
                    .employeeId(request.getEmployeeId())
                    .phcName(request.getPhcName())
                    .clinicName(request.getClinicName())
                    .labId(request.getLabId())
                    .ashaId(request.getAshaId())
                    .registeredBy(registrar != null ? registrar.getId() : "SELF")
                    .registeredAt(Timestamp.now())
                    .isActive(true)
                    .isVerified(false)
                    .build();
            
            // Set permissions based on role
            try {
                UserRole targetRole = UserRole.valueOf(request.getRole());
                UserRole.RolePermissions permissions = targetRole.getPermissions();
                newUser.setCanRegisterUsers(permissions.canRegisterUsers());
                newUser.setCanUpdateSensors(permissions.canUpdateSensors());
                newUser.setCanInvestigateReports(permissions.canInvestigateReports());
                newUser.setCanResolveReports(permissions.canResolveReports());
            } catch (IllegalArgumentException e) {
                // Default permissions if role not in enum
                newUser.setCanRegisterUsers(false);
                newUser.setCanUpdateSensors(false);
                newUser.setCanInvestigateReports(false);
                newUser.setCanResolveReports(false);
            }
            
            // Save user
            User savedUser = userService.save(newUser);
            
            log.info("User registered successfully: {} ({})", savedUser.getFullName(), savedUser.getRole());
            
            // Return success (without password hash)
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User registered successfully");
            response.put("userId", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("role", savedUser.getRole());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error registering user: {}", e.getMessage());
            return ResponseEntity.status(500).body(createError("Registration failed: " + e.getMessage()));
        }
    }
    
    /**
     * Get list of users registered by current user
     * Optional authentication
     */
    @GetMapping("/my-registrations")
    public ResponseEntity<?> getMyRegistrations(
            @RequestHeader(value = "Authorization", required = false) String token) {
        
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body(createError("Authentication required"));
        }
        
        User registrar = userService.getUserFromToken(token);
        
        if (registrar == null) {
            return ResponseEntity.status(401).body(createError("Invalid token"));
        }
        
        List<User> users = userService.getUsersRegisteredBy(registrar.getId());
        return ResponseEntity.ok(users);
    }
    
    /**
     * Get all users (admin only)
     * Optional authentication
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String token) {
        
        try {
            // If no token, return empty list (backward compatible)
            if (token == null || token.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            
            User user = userService.getUserFromToken(token);
            
            if (user == null) {
                return ResponseEntity.ok(List.of());
            }
            
            // Only STATE_ADMIN can see all users
            if (!"STATE_ADMIN".equals(user.getRole())) {
                return ResponseEntity.status(403).body(createError("Admin access required"));
            }
            
            return ResponseEntity.ok(userService.getAllUsers());
            
        } catch (Exception e) {
            log.error("Error getting all users: {}", e.getMessage());
            return ResponseEntity.status(500).body(createError("Failed to retrieve users"));
        }
    }
    
    // Helper methods
    
    private boolean isWithinJurisdiction(User registrar, UserRegistrationRequest request) {
        // State must match
        if (registrar.getState() != null && !registrar.getState().equals(request.getState())) {
            return false;
        }
        
        // If registrar has district, new user must be in same district
        if (registrar.getDistrict() != null && !registrar.getDistrict().equals(request.getDistrict())) {
            return false;
        }
        
        // If registrar has village, new user must be in same village
        if (registrar.getVillage() != null && !registrar.getVillage().equals(request.getVillage())) {
            return false;
        }
        
        return true;
    }
    
    private String getRegisterableRoles(UserRole role) {
        switch (role) {
            case STATE_ADMIN:
                return "District Health Officers and Lab Officials";
            case DISTRICT_HEALTH_OFFICER:
                return "Medical Officers and Village Health Officers";
            case VILLAGE_HEALTH_OFFICER:
                return "ASHA Workers and Clinics";
            default:
                return "none";
        }
    }
    
    private Map<String, Object> createError(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
}
