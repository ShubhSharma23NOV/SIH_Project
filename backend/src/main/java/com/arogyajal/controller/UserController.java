package com.arogyajal.controller;

import com.arogyajal.model.User;
import com.arogyajal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API Controller for User Management.
 * Provides endpoints for authentication and user operations.
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Register a new user
     * POST /api/users/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> body) {
        try {
            // Extract user data
            User user = User.builder()
                    .username((String) body.get("username"))
                    .role((String) body.get("role"))
                    .fullName((String) body.get("fullName"))
                    .phoneNumber((String) body.get("phoneNumber"))
                    .email((String) body.get("email"))
                    .village((String) body.get("village"))
                    .district((String) body.get("district"))
                    .state((String) body.get("state"))
                    .language((String) body.get("language"))
                    .ashaId((String) body.get("ashaId"))
                    .assignedArea((String) body.get("assignedArea"))
                    .build();
            
            String password = (String) body.get("password");
            if (password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }
            
            User registered = userService.registerUser(user, password);
            
            // Remove sensitive data before returning
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "User registered successfully",
                    "userId", registered.getId(),
                    "username", registered.getUsername(),
                    "role", registered.getRole()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to register user: " + e.getMessage()));
        }
    }

    /**
     * Login user
     * POST /api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");
            
            if (username == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username and password are required"));
            }
            
            User user = userService.authenticateUser(username, password);
            
            // Return user data without password
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Login successful");
            response.put("user", sanitizeUser(user));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            User user = userService.getUserById(id);
            // Remove sensitive data
            return ResponseEntity.ok(sanitizeUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve user: " + e.getMessage()));
        }
    }

    /**
     * Get user by username
     * GET /api/users/username/{username}
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            User user = userService.getUserByUsername(username);
            return ResponseEntity.ok(sanitizeUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve user: " + e.getMessage()));
        }
    }

    /**
     * Get all users
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            List<Map<String, Object>> sanitizedUsers = users.stream()
                    .map(this::sanitizeUser)
                    .toList();
            return ResponseEntity.ok(sanitizedUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve users: " + e.getMessage()));
        }
    }

    /**
     * Get users by role
     * GET /api/users/role/{role}
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            List<User> users = userService.getUsersByRole(role);
            List<Map<String, Object>> sanitizedUsers = users.stream()
                    .map(this::sanitizeUser)
                    .toList();
            return ResponseEntity.ok(sanitizedUsers);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve users: " + e.getMessage()));
        }
    }

    /**
     * Get ASHA workers by district
     * GET /api/users/asha/district/{district}
     */
    @GetMapping("/asha/district/{district}")
    public ResponseEntity<?> getAshaWorkersByDistrict(@PathVariable String district) {
        try {
            List<User> users = userService.getAshaWorkersByDistrict(district);
            List<Map<String, Object>> sanitizedUsers = users.stream()
                    .map(this::sanitizeUser)
                    .toList();
            return ResponseEntity.ok(sanitizedUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve ASHA workers: " + e.getMessage()));
        }
    }

    /**
     * Get users by village
     * GET /api/users/village/{village}
     */
    @GetMapping("/village/{village}")
    public ResponseEntity<?> getUsersByVillage(@PathVariable String village) {
        try {
            List<User> users = userService.getUsersByVillage(village);
            List<Map<String, Object>> sanitizedUsers = users.stream()
                    .map(this::sanitizeUser)
                    .toList();
            return ResponseEntity.ok(sanitizedUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve users: " + e.getMessage()));
        }
    }

    /**
     * Get active users
     * GET /api/users/active
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveUsers() {
        try {
            List<User> users = userService.getActiveUsers();
            List<Map<String, Object>> sanitizedUsers = users.stream()
                    .map(this::sanitizeUser)
                    .toList();
            return ResponseEntity.ok(sanitizedUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve active users: " + e.getMessage()));
        }
    }

    /**
     * Update user profile
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User user) {
        try {
            user = User.builder()
                    .id(id)
                    .role(user.getRole())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .email(user.getEmail())
                    .village(user.getVillage())
                    .district(user.getDistrict())
                    .state(user.getState())
                    .language(user.getLanguage())
                    .ashaId(user.getAshaId())
                    .assignedArea(user.getAssignedArea())
                    .notificationsEnabled(user.getNotificationsEnabled())
                    .smsEnabled(user.getSmsEnabled())
                    .emailEnabled(user.getEmailEnabled())
                    .isActive(user.getIsActive())
                    .build();
            
            User updated = userService.updateUser(user);
            return ResponseEntity.ok(sanitizeUser(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    /**
     * Change password
     * POST /api/users/{id}/change-password
     */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable String id, 
                                           @RequestBody Map<String, String> passwords) {
        try {
            String oldPassword = passwords.get("oldPassword");
            String newPassword = passwords.get("newPassword");
            
            if (oldPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Old and new passwords are required"));
            }
            
            userService.changePassword(id, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to change password: " + e.getMessage()));
        }
    }

    /**
     * Request password reset
     * POST /api/users/reset-password/request
     */
    @PostMapping("/reset-password/request")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            
            String resetToken = userService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of(
                    "message", "Password reset token generated",
                    "resetToken", resetToken
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to request password reset: " + e.getMessage()));
        }
    }

    /**
     * Reset password with token
     * POST /api/users/reset-password/confirm
     */
    @PostMapping("/reset-password/confirm")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String resetToken = body.get("resetToken");
            String newPassword = body.get("newPassword");
            
            if (resetToken == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Reset token and new password are required"));
            }
            
            userService.resetPassword(resetToken, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reset password: " + e.getMessage()));
        }
    }

    /**
     * Verify user account
     * POST /api/users/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody Map<String, String> body) {
        try {
            String verificationToken = body.get("verificationToken");
            if (verificationToken == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Verification token is required"));
            }
            
            userService.verifyUser(verificationToken);
            return ResponseEntity.ok(Map.of("message", "User verified successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to verify user: " + e.getMessage()));
        }
    }

    /**
     * Deactivate user
     * POST /api/users/{id}/deactivate
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable String id) {
        try {
            userService.deactivateUser(id);
            return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to deactivate user: " + e.getMessage()));
        }
    }

    /**
     * Delete user
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    /**
     * Get user statistics
     * GET /api/users/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getUserStatistics() {
        try {
            Map<String, Object> stats = userService.getUserStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics: " + e.getMessage()));
        }
    }

    /**
     * Helper method to remove sensitive data from user object
     */
    private Map<String, Object> sanitizeUser(User user) {
        Map<String, Object> sanitized = new java.util.HashMap<>();
        sanitized.put("id", user.getId());
        sanitized.put("username", user.getUsername());
        sanitized.put("role", user.getRole());
        sanitized.put("fullName", user.getFullName());
        sanitized.put("phoneNumber", user.getPhoneNumber());
        sanitized.put("email", user.getEmail() != null ? user.getEmail() : "");
        sanitized.put("village", user.getVillage() != null ? user.getVillage() : "");
        sanitized.put("district", user.getDistrict() != null ? user.getDistrict() : "");
        sanitized.put("state", user.getState() != null ? user.getState() : "");
        sanitized.put("language", user.getLanguage());
        sanitized.put("ashaId", user.getAshaId() != null ? user.getAshaId() : "");
        sanitized.put("assignedArea", user.getAssignedArea() != null ? user.getAssignedArea() : "");
        sanitized.put("isActive", user.getIsActive());
        sanitized.put("isVerified", user.getIsVerified());
        sanitized.put("reportsSubmitted", user.getReportsSubmitted());
        return sanitized;
    }
}
