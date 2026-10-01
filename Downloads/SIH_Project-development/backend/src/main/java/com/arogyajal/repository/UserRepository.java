package com.arogyajal.repository;

import com.arogyajal.model.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.cloud.Timestamp;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Repository for User model.
 * Handles Firestore operations for user authentication and management.
 * 
 * IMPORTANT: Uses separate Firebase project (arogyajal-users) for user data
 * to avoid quota conflicts with sensor/symptom data.
 */
@Repository
public class UserRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "users";

    /**
     * Constructor with @Qualifier to inject the users-specific Firestore instance
     * 
     * @param firestore Firestore instance from FirebaseUsersConfig
     */
    public UserRepository(@Qualifier("usersFirestore") Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Save a new user
     */
    public String save(User user) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(user.getId())
                .set(user);
        future.get();
        return user.getId();
    }

    /**
     * Find user by ID
     */
    public User findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                .document(id)
                .get()
                .get();
        
        if (document.exists()) {
            return document.toObject(User.class);
        }
        return null;
    }

    /**
     * Find user by username (for login)
     */
    public User findByUsername(String username) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("username", username)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        }
        return null;
    }

    /**
     * Find user by email
     */
    public User findByEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("email", email)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        }
        return null;
    }

    /**
     * Find user by phone number
     */
    public User findByPhoneNumber(String phoneNumber) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("phoneNumber", phoneNumber)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        }
        return null;
    }

    /**
     * Find all users
     */
    public List<User> findAll() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find users by role
     */
    public List<User> findByRole(String role) throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("role", role)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find ASHA workers by district
     */
    public List<User> findAshaWorkersByDistrict(String district) throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("role", "ASHA")
                .whereEqualTo("district", district)
                .whereEqualTo("isActive", true)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find users by village
     */
    public List<User> findByVillage(String village) throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("village", village)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find active users
     */
    public List<User> findActiveUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("isActive", true)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find unverified users
     */
    public List<User> findUnverifiedUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("isVerified", false)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (QueryDocumentSnapshot document : documents) {
            users.add(document.toObject(User.class));
        }
        return users;
    }

    /**
     * Find user by reset token
     */
    public User findByResetToken(String resetToken) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("resetToken", resetToken)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        }
        return null;
    }

    /**
     * Find user by verification token
     */
    public User findByVerificationToken(String verificationToken) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("verificationToken", verificationToken)
                .limit(1)
                .get();
        
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(User.class);
        }
        return null;
    }

    /**
     * Update user
     */
    public void update(User user) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(user.getId())
                .set(user)
                .get();
    }

    /**
     * Update last login
     */
    public void updateLastLogin(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update("lastLogin", Timestamp.now())
                .get();
    }

    /**
     * Update password
     */
    public void updatePassword(String id, String passwordHash) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update(
                    "passwordHash", passwordHash,
                    "updatedAt", Timestamp.now()
                )
                .get();
    }

    /**
     * Increment failed login attempts
     */
    public void incrementFailedLoginAttempts(String id) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        firestore.runTransaction(transaction -> {
            DocumentSnapshot snapshot = transaction.get(docRef).get();
            Integer currentAttempts = snapshot.getLong("failedLoginAttempts").intValue();
            transaction.update(docRef, "failedLoginAttempts", currentAttempts + 1);
            return null;
        }).get();
    }

    /**
     * Reset failed login attempts
     */
    public void resetFailedLoginAttempts(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update("failedLoginAttempts", 0)
                .get();
    }

    /**
     * Lock account
     */
    public void lockAccount(String id, Timestamp lockUntil) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update(
                    "isActive", false,
                    "accountLockedUntil", lockUntil,
                    "updatedAt", Timestamp.now()
                )
                .get();
    }

    /**
     * Unlock account
     */
    public void unlockAccount(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update(
                    "isActive", true,
                    "accountLockedUntil", null,
                    "failedLoginAttempts", 0,
                    "updatedAt", Timestamp.now()
                )
                .get();
    }

    /**
     * Verify user
     */
    public void verifyUser(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .update(
                    "isVerified", true,
                    "verificationToken", null,
                    "updatedAt", Timestamp.now()
                )
                .get();
    }

    /**
     * Delete user
     */
    public void delete(String id) throws ExecutionException, InterruptedException {
        firestore.collection(COLLECTION_NAME)
                .document(id)
                .delete()
                .get();
    }

    /**
     * Check if username exists
     */
    public boolean existsByUsername(String username) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("username", username)
                .limit(1)
                .get();
        return !future.get().isEmpty();
    }

    /**
     * Check if email exists
     */
    public boolean existsByEmail(String email) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("email", email)
                .limit(1)
                .get();
        return !future.get().isEmpty();
    }

    /**
     * Check if phone number exists
     */
    public boolean existsByPhoneNumber(String phoneNumber) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("phoneNumber", phoneNumber)
                .limit(1)
                .get();
        return !future.get().isEmpty();
    }

    /**
     * Count users by role
     */
    public long countByRole(String role) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("role", role)
                .get();
        return future.get().size();
    }
    
    // ========== NEW METHODS FOR ROLE-BASED SYSTEM ==========
    // These methods are added for the new role-based authentication
    // They don't affect existing functionality
    
    /**
     * Find users registered by a specific user
     */
    public List<User> findByRegisteredBy(String registrarId) {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("registeredBy", registrarId)
                    .get();
            
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<User> users = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : documents) {
                users.add(document.toObject(User.class));
            }
            
            return users;
            
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
