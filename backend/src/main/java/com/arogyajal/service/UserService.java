package com.arogyajal.service;

import com.arogyajal.model.User;
import com.arogyajal.repository.UserRepository;
import com.google.cloud.Timestamp;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.regex.Pattern;

/**
 * Service for User business logic.
 * Handles user authentication, registration, and management.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    // Password validation pattern (min 8 chars, 1 uppercase, 1 lowercase, 1 digit)
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");
    
    // Phone number pattern (Indian format)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "^\\+91[6-9]\\d{9}$");
    
    // Email pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_HOURS = 24;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Register a new user
     */
    public User registerUser(User user, String plainPassword) throws ExecutionException, InterruptedException {
        // Validate user data
        validateUserRegistration(user, plainPassword);
        
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        
        // Check if email already exists (if provided)
        if (user.getEmail() != null && userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Check if phone number already exists
        if (userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already exists");
        }
        
        // Hash password (in production, use BCrypt or similar)
        String passwordHash = hashPassword(plainPassword);
        
        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        
        // Set timestamps and defaults
        Timestamp now = Timestamp.now();
        user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(user.getUsername())
                .passwordHash(passwordHash)
                .role(user.getRole())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .village(user.getVillage())
                .district(user.getDistrict())
                .state(user.getState())
                .language(user.getLanguage() != null ? user.getLanguage() : "hi")
                .ashaId(user.getAshaId())
                .assignedArea(user.getAssignedArea())
                .notificationsEnabled(user.getNotificationsEnabled() != null ? user.getNotificationsEnabled() : true)
                .smsEnabled(user.getSmsEnabled() != null ? user.getSmsEnabled() : true)
                .emailEnabled(user.getEmailEnabled() != null ? user.getEmailEnabled() : false)
                .isActive(true)
                .isVerified(false)
                .verificationToken(verificationToken)
                .failedLoginAttempts(0)
                .reportsSubmitted(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
        
        // Save to repository
        String id = userRepository.save(user);
        
        // TODO: Send verification SMS/email
        
        return userRepository.findById(id);
    }

    /**
     * Authenticate user (login)
     */
    public User authenticateUser(String username, String plainPassword) throws ExecutionException, InterruptedException {
        // Find user by username
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        
        // Check if account is locked
        if (user.getAccountLockedUntil() != null && 
            user.getAccountLockedUntil().compareTo(Timestamp.now()) > 0) {
            throw new IllegalStateException("Account is locked. Please try again later.");
        }
        
        // Check if account is active
        if (!user.getIsActive()) {
            throw new IllegalStateException("Account is inactive");
        }
        
        // Verify password
        if (!verifyPassword(plainPassword, user.getPasswordHash())) {
            // Increment failed attempts
            userRepository.incrementFailedLoginAttempts(user.getId());
            
            int attempts = user.getFailedLoginAttempts() + 1;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                // Lock account
                Timestamp lockUntil = Timestamp.ofTimeSecondsAndNanos(
                        Timestamp.now().getSeconds() + (LOCK_DURATION_HOURS * 3600), 0);
                userRepository.lockAccount(user.getId(), lockUntil);
                throw new IllegalStateException("Account locked due to too many failed login attempts");
            }
            
            throw new IllegalArgumentException("Invalid username or password");
        }
        
        // Reset failed attempts on successful login
        userRepository.resetFailedLoginAttempts(user.getId());
        
        // Update last login
        userRepository.updateLastLogin(user.getId());
        
        return userRepository.findById(user.getId());
    }

    /**
     * Get user by ID
     */
    public User getUserById(String id) throws ExecutionException, InterruptedException {
        User user = userRepository.findById(id);
        if (user == null) {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
        return user;
    }

    /**
     * Get user by username
     */
    public User getUserByUsername(String username) throws ExecutionException, InterruptedException {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("User not found with username: " + username);
        }
        return user;
    }

    /**
     * Get all users
     */
    public List<User> getAllUsers() throws ExecutionException, InterruptedException {
        return userRepository.findAll();
    }

    /**
     * Get users by role
     */
    public List<User> getUsersByRole(String role) throws ExecutionException, InterruptedException {
        validateRole(role);
        return userRepository.findByRole(role);
    }

    /**
     * Get ASHA workers by district
     */
    public List<User> getAshaWorkersByDistrict(String district) throws ExecutionException, InterruptedException {
        return userRepository.findAshaWorkersByDistrict(district);
    }

    /**
     * Get users by village
     */
    public List<User> getUsersByVillage(String village) throws ExecutionException, InterruptedException {
        return userRepository.findByVillage(village);
    }

    /**
     * Get active users
     */
    public List<User> getActiveUsers() throws ExecutionException, InterruptedException {
        return userRepository.findActiveUsers();
    }

    /**
     * Get unverified users
     */
    public List<User> getUnverifiedUsers() throws ExecutionException, InterruptedException {
        return userRepository.findUnverifiedUsers();
    }

    /**
     * Update user profile
     */
    public User updateUser(User user) throws ExecutionException, InterruptedException {
        // Verify user exists
        User existing = getUserById(user.getId());
        
        // Validate updated user
        validateUserUpdate(user);
        
        // Update timestamp, keep password and creation date
        user = User.builder()
                .id(user.getId())
                .username(existing.getUsername()) // Username cannot be changed
                .passwordHash(existing.getPasswordHash()) // Password updated separately
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
                .isVerified(existing.getIsVerified())
                .verificationToken(existing.getVerificationToken())
                .resetToken(existing.getResetToken())
                .resetTokenExpiry(existing.getResetTokenExpiry())
                .failedLoginAttempts(existing.getFailedLoginAttempts())
                .accountLockedUntil(existing.getAccountLockedUntil())
                .lastLogin(existing.getLastLogin())
                .reportsSubmitted(existing.getReportsSubmitted())
                .createdAt(existing.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        userRepository.update(user);
        return userRepository.findById(user.getId());
    }

    /**
     * Change password
     */
    public void changePassword(String userId, String oldPassword, String newPassword) 
            throws ExecutionException, InterruptedException {
        User user = getUserById(userId);
        
        // Verify old password
        if (!verifyPassword(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Validate new password
        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit");
        }
        
        // Hash and update password
        String newPasswordHash = hashPassword(newPassword);
        userRepository.updatePassword(userId, newPasswordHash);
    }

    /**
     * Request password reset
     */
    public String requestPasswordReset(String email) throws ExecutionException, InterruptedException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }
        
        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        Timestamp expiry = Timestamp.ofTimeSecondsAndNanos(
                Timestamp.now().getSeconds() + (24 * 3600), 0); // 24 hours
        
        // Update user with reset token
        user = User.builder()
                .id(user.getId())
                .username(user.getUsername())
                .passwordHash(user.getPasswordHash())
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
                .isVerified(user.getIsVerified())
                .verificationToken(user.getVerificationToken())
                .resetToken(resetToken)
                .resetTokenExpiry(expiry)
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .accountLockedUntil(user.getAccountLockedUntil())
                .lastLogin(user.getLastLogin())
                .reportsSubmitted(user.getReportsSubmitted())
                .createdAt(user.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        userRepository.update(user);
        
        // TODO: Send reset email/SMS
        
        return resetToken;
    }

    /**
     * Reset password with token
     */
    public void resetPassword(String resetToken, String newPassword) throws ExecutionException, InterruptedException {
        User user = userRepository.findByResetToken(resetToken);
        if (user == null) {
            throw new IllegalArgumentException("Invalid reset token");
        }
        
        // Check if token is expired
        if (user.getResetTokenExpiry().compareTo(Timestamp.now()) < 0) {
            throw new IllegalArgumentException("Reset token has expired");
        }
        
        // Validate new password
        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit");
        }
        
        // Hash and update password
        String newPasswordHash = hashPassword(newPassword);
        userRepository.updatePassword(user.getId(), newPasswordHash);
        
        // Clear reset token
        user = User.builder()
                .id(user.getId())
                .username(user.getUsername())
                .passwordHash(newPasswordHash)
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
                .isVerified(user.getIsVerified())
                .verificationToken(user.getVerificationToken())
                .resetToken(null)
                .resetTokenExpiry(null)
                .failedLoginAttempts(0)
                .accountLockedUntil(user.getAccountLockedUntil())
                .lastLogin(user.getLastLogin())
                .reportsSubmitted(user.getReportsSubmitted())
                .createdAt(user.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        userRepository.update(user);
    }

    /**
     * Verify user account
     */
    public void verifyUser(String verificationToken) throws ExecutionException, InterruptedException {
        User user = userRepository.findByVerificationToken(verificationToken);
        if (user == null) {
            throw new IllegalArgumentException("Invalid verification token");
        }
        
        userRepository.verifyUser(user.getId());
    }

    /**
     * Deactivate user
     */
    public void deactivateUser(String userId) throws ExecutionException, InterruptedException {
        User user = getUserById(userId);
        
        user = User.builder()
                .id(user.getId())
                .username(user.getUsername())
                .passwordHash(user.getPasswordHash())
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
                .isActive(false)
                .isVerified(user.getIsVerified())
                .verificationToken(user.getVerificationToken())
                .resetToken(user.getResetToken())
                .resetTokenExpiry(user.getResetTokenExpiry())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .accountLockedUntil(user.getAccountLockedUntil())
                .lastLogin(user.getLastLogin())
                .reportsSubmitted(user.getReportsSubmitted())
                .createdAt(user.getCreatedAt())
                .updatedAt(Timestamp.now())
                .build();
        
        userRepository.update(user);
    }

    /**
     * Delete user
     */
    public void deleteUser(String userId) throws ExecutionException, InterruptedException {
        getUserById(userId);
        userRepository.delete(userId);
    }

    /**
     * Get user statistics
     */
    public Map<String, Object> getUserStatistics() throws ExecutionException, InterruptedException {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalUsers", userRepository.findAll().size());
        stats.put("ashaWorkers", userRepository.countByRole("ASHA"));
        stats.put("villagers", userRepository.countByRole("VILLAGER"));
        stats.put("officials", userRepository.countByRole("OFFICIAL"));
        stats.put("admins", userRepository.countByRole("ADMIN"));
        stats.put("activeUsers", userRepository.findActiveUsers().size());
        stats.put("unverifiedUsers", userRepository.findUnverifiedUsers().size());
        
        return stats;
    }

    /**
     * Verify password (simplified - use BCrypt in production)
     */
    private boolean verifyPassword(String plainPassword, String passwordHash) {
        // TODO: Implement proper password verification with BCrypt
        String testHash = hashPassword(plainPassword);
        return testHash.equals(passwordHash);
    }

    /**
     * Validate user registration
     */
    private void validateUserRegistration(User user, String plainPassword) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        
        if (user.getUsername().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters");
        }
        
        if (!PASSWORD_PATTERN.matcher(plainPassword).matches()) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit");
        }
        
        if (user.getRole() == null) {
            throw new IllegalArgumentException("Role is required");
        }
        validateRole(user.getRole());
        
        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }
        
        if (user.getPhoneNumber() == null || !PHONE_PATTERN.matcher(user.getPhoneNumber()).matches()) {
            throw new IllegalArgumentException("Valid Indian phone number is required (+91XXXXXXXXXX)");
        }
        
        if (user.getEmail() != null && !EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        // ASHA-specific validation
        if ("ASHA".equals(user.getRole()) && user.getAshaId() == null) {
            throw new IllegalArgumentException("ASHA ID is required for ASHA workers");
        }
    }

    /**
     * Validate user update
     */
    private void validateUserUpdate(User user) {
        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }
        
        if (user.getPhoneNumber() == null || !PHONE_PATTERN.matcher(user.getPhoneNumber()).matches()) {
            throw new IllegalArgumentException("Valid Indian phone number is required (+91XXXXXXXXXX)");
        }
        
        if (user.getEmail() != null && !EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        validateRole(user.getRole());
    }

    /**
     * Validate role
     */
    private void validateRole(String role) {
        List<String> validRoles = Arrays.asList("ASHA", "VILLAGER", "OFFICIAL", "ADMIN",
                "STATE_ADMIN", "DISTRICT_HEALTH_OFFICER", "LAB_OFFICIAL", 
                "MEDICAL_OFFICER", "VILLAGE_HEALTH_OFFICER", "ASHA_WORKER", "CLINIC");
        if (!validRoles.contains(role)) {
            throw new IllegalArgumentException("Invalid role. Must be one of: " + validRoles);
        }
    }
    
    // ========== NEW METHODS FOR ROLE-BASED SYSTEM ==========
    // These methods are added for the new role-based authentication
    // They don't affect existing functionality
    
    /**
     * Get user from token (simple implementation)
     * In production, use JWT with proper validation
     */
    public User getUserFromToken(String token) {
        try {
            // Remove "Bearer " prefix if present
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            // Simple token format: Bearer_userId_timestamp
            if (token.startsWith("Bearer_")) {
                String[] parts = token.split("_");
                if (parts.length >= 2) {
                    String userId = parts[1];
                    return userRepository.findById(userId);
                }
            }
            
            return null;
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Get users registered by a specific user
     */
    public List<User> getUsersRegisteredBy(String registrarId) {
        try {
            return userRepository.findByRegisteredBy(registrarId);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
    /**
     * Authenticate user with email and password
     * Returns null if authentication fails
     */
    public User authenticate(String email, String password) {
        try {
            User user = userRepository.findByEmail(email);
            
            if (user == null) {
                return null;
            }
            
            // Check if account is locked
            if (user.getAccountLockedUntil() != null && 
                user.getAccountLockedUntil().compareTo(Timestamp.now()) > 0) {
                return null;
            }
            
            // Verify password
            if (!verifyPassword(password, user.getPasswordHash())) {
                // Increment failed login attempts
                int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
                user.setFailedLoginAttempts(attempts);
                
                // Lock account after max attempts
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    Timestamp lockUntil = Timestamp.ofTimeSecondsAndNanos(
                            Timestamp.now().getSeconds() + (LOCK_DURATION_HOURS * 3600), 0);
                    user.setAccountLockedUntil(lockUntil);
                }
                
                userRepository.update(user);
                return null;
            }
            
            // Reset failed attempts on successful login
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            userRepository.update(user);
            
            return user;
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Check if email exists
     */
    public boolean existsByEmail(String email) {
        try {
            return userRepository.existsByEmail(email);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Check if phone exists
     */
    public boolean existsByPhone(String phone) {
        try {
            return userRepository.existsByPhoneNumber(phone);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Save user (wrapper for repository save)
     */
    public User save(User user) {
        try {
            String id = userRepository.save(user);
            return userRepository.findById(id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save user: " + e.getMessage());
        }
    }
    
    /**
     * Hash password - public method for controllers
     * TODO: Implement proper password hashing with BCrypt
     */
    public String hashPassword(String plainPassword) {
        return "$2a$12$" + Base64.getEncoder().encodeToString(plainPassword.getBytes());
    }
}
