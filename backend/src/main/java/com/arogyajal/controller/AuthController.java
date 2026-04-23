package com.arogyajal.controller;

import com.arogyajal.dto.LoginResponse;
import com.arogyajal.model.User;
import com.arogyajal.service.UserService;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication controller for login/logout
 * NEW - Does not affect existing APIs
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    /**
     * Login endpoint
     * Returns token, user info, jurisdiction, and permissions
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for: {}", request.getEmail());
            
            // Authenticate user
            User user = userService.authenticate(request.getEmail(), request.getPassword());
            
            if (user == null) {
                log.warn("Login failed for: {}", request.getEmail());
                return ResponseEntity.status(401).body(createError("Invalid email or password"));
            }
            
            // Check if account is active
            if (user.getIsActive() != null && !user.getIsActive()) {
                return ResponseEntity.status(403).body(createError("Account is inactive"));
            }
            
            // Generate simple token (user ID for now - can be JWT later)
            String token = "Bearer_" + user.getId() + "_" + System.currentTimeMillis();
            
            // Update last login
            user.setLastLogin(Timestamp.now());
            userService.save(user);
            
            // Create response with jurisdiction and permissions
            LoginResponse response = new LoginResponse(token, user);
            
            log.info("Login successful for: {} ({})", user.getFullName(), user.getRole());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity.status(500).body(createError("Login failed: " + e.getMessage()));
        }
    }
    
    /**
     * Logout endpoint (optional - frontend can just clear token)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String token) {
        // Just return success - frontend will clear token
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get current user info from token
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body(createError("Authentication required"));
        }
        
        User user = userService.getUserFromToken(token);
        
        if (user == null) {
            return ResponseEntity.status(401).body(createError("Invalid token"));
        }
        
        // Return user info with jurisdiction and permissions
        LoginResponse response = new LoginResponse(token, user);
        return ResponseEntity.ok(response);
    }
    
    private Map<String, Object> createError(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
    
    /**
     * Login request DTO
     */
    public static class LoginRequest {
        private String email;
        private String password;
        
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
    }
}
