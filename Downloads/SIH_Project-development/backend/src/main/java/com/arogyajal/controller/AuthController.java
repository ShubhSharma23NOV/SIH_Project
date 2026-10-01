package com.arogyajal.controller;

import com.arogyajal.dto.LoginResponse;
import com.arogyajal.model.User;
import com.arogyajal.security.JwtService;
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

    @Autowired
    private JwtService jwtService;
    
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
            
            // Generate JWT token
            String token = jwtService.generateToken(user);
            
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
    public ResponseEntity<?> logout() {
        // JWT is stateless - frontend should clear the token
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully - please clear your token");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get current user info from authenticated security context
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        // Get the authenticated user from Spring Security
        org.springframework.security.core.Authentication authentication =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(createError("Authentication required"));
        }

        // Extract user ID from the principal
        String userId = authentication.getName();

        try {
            // Get user from Firestore
            User user = userService.getUserById(userId);

            // Get the JWT from the Authorization header
            jakarta.servlet.http.HttpServletRequest request =
                (jakarta.servlet.http.HttpServletRequest) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes().getRequest();
            String token = request.getHeader("Authorization");

            // Return user info with jurisdiction and permissions
            LoginResponse response = new LoginResponse(token, user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(createError("Invalid token"));
        }
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
