package com.arogyajal.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase configuration for User Authentication (Separate Project)
 * 
 * This configuration creates a separate Firebase connection specifically for user data.
 * Benefits:
 * - Isolates user authentication from sensor/symptom data
 * - Prevents quota conflicts
 * - Better security and access control
 * - Independent scaling
 */
@Configuration
public class FirebaseUsersConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseUsersConfig.class);

    @Value("${firebase.users.project-id:arogyajal-users}")
    private String projectId;

    @Value("${firebase.users.database-url:https://arogyajal-users.firebaseio.com}")
    private String databaseUrl;

    @Value("${firebase.users.credentials.location:classpath:firebase-users-service-account.json}")
    private String credentialsLocation;

    /**
     * Creates a separate Firestore instance for user authentication data
     * 
     * FALLBACK: If firebase-users-service-account.json is not found,
     * it will use the default Firestore instance (arogyajal3) temporarily.
     * 
     * @return Firestore instance connected to users Firebase project
     */
    @Bean(name = "usersFirestore")
    public Firestore usersFirestore() {
        log.info("Initializing Firebase Users Firestore...");
        
        // Check if already initialized
        for (FirebaseApp app : FirebaseApp.getApps()) {
            if ("users-app".equals(app.getName())) {
                log.info("Firebase Users app already initialized, reusing existing instance");
                return FirestoreClient.getFirestore(app);
            }
        }

        try {
            // Load service account credentials
            String credPath = credentialsLocation.replace("classpath:", "");
            ClassPathResource resource = new ClassPathResource(credPath);
            
            // Check if file exists
            if (!resource.exists()) {
                log.warn("⚠️  firebase-users-service-account.json NOT FOUND!");
                log.warn("⚠️  Using default Firestore (arogyajal3) for user data temporarily");
                log.warn("⚠️  Download service account from Firebase Console and place in resources/");
                log.warn("⚠️  Project: arogyajal-users → Settings → Service Accounts → Generate Key");
                
                // Return default Firestore as fallback
                return FirestoreClient.getFirestore();
            }
            
            InputStream serviceAccount = resource.getInputStream();

            // Build Firebase options
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setProjectId(projectId)
                    .setDatabaseUrl(databaseUrl)
                    .build();

            // Initialize Firebase app with unique name
            FirebaseApp usersApp = FirebaseApp.initializeApp(options, "users-app");
            
            log.info("✅ Firebase Users Firestore initialized successfully");
            log.info("✅ Project ID: {}", projectId);
            log.info("✅ Database URL: {}", databaseUrl);
            log.info("✅ User data will be stored in separate Firebase project");
            
            return FirestoreClient.getFirestore(usersApp);
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize Firebase Users Firestore: {}", e.getMessage());
            log.warn("⚠️  Falling back to default Firestore (arogyajal3)");
            
            // Return default Firestore as fallback
            return FirestoreClient.getFirestore();
        }
    }
}
