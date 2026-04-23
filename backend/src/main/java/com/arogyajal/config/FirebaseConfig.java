package com.arogyajal.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {
    
    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);
    
    @Value("${firebase.enabled:true}")
    private boolean firebaseEnabled;
    
    @Value("${firebase.project-id:}")
    private String projectId;
    
    @Value("${firebase.credentials.path:}")
    private String credentialsPath;
    
    @Value("${firebase.database-url:}")
    private String databaseUrl;
    
    @Value("${firebase.storage-bucket:arogyajal-22.appspot.com}")
    private String storageBucket;
    
    @PostConstruct
    public void initializeFirebase() {
        if (!firebaseEnabled) {
            log.info("Firebase initialization is disabled via configuration");
            return;
        }
        
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = buildFirebaseOptions();
                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully");
            } else {
                log.info("Firebase already initialized");
            }
        } catch (Exception e) {
            log.warn("Failed to initialize Firebase: {}", e.getMessage());
            if (!isTestEnvironment()) {
                throw new RuntimeException("Firebase initialization failed. Set firebase.enabled=false in application.properties to disable Firebase.", e);
            }
        }
    }
    
    @Bean(destroyMethod = "")
    public FirebaseAuth firebaseAuth() {
        try {
            return FirebaseAuth.getInstance();
        } catch (Exception e) {
            log.warn("FirebaseAuth not available - this is expected in test environments: {}", e.getMessage());
            return null;
        }
    }
    
    @Bean(destroyMethod = "")
    public Firestore firestore() {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            log.info("Firestore bean created successfully");
            return firestore;
        } catch (Exception e) {
            log.error("Failed to create Firestore bean: {}", e.getMessage());
            if (!isTestEnvironment()) {
                throw new RuntimeException("Firestore initialization failed. Ensure Firebase is properly initialized.", e);
            }
            return null;
        }
    }
    
    private boolean isTestEnvironment() {
        // Check if we're in a test environment
        return System.getProperty("spring.profiles.active", "").contains("test") ||
               System.getProperty("java.class.path").contains("test-classes") ||
               System.getProperty("sun.java.command", "").contains("test");
    }
    
    private FirebaseOptions buildFirebaseOptions() throws IOException {
        FirebaseOptions.Builder builder = FirebaseOptions.builder();
        
        // Set project ID
        if (projectId != null && !projectId.isEmpty()) {
            builder.setProjectId(projectId);
        }
        
        // Set database URL
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            builder.setDatabaseUrl(databaseUrl);
        }
        
        // Set storage bucket
        if (storageBucket != null && !storageBucket.isEmpty()) {
            builder.setStorageBucket(storageBucket);
            log.info("Firebase Storage bucket configured: {}", storageBucket);
        }
        
        // Set credentials
        GoogleCredentials credentials = getCredentials();
        builder.setCredentials(credentials);
        
        return builder.build();
    }
    
    private GoogleCredentials getCredentials() throws IOException {
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            // Try to load from file path first
            try (InputStream serviceAccount = new FileInputStream(credentialsPath)) {
                log.info("Loading Firebase credentials from file: {}", credentialsPath);
                return GoogleCredentials.fromStream(serviceAccount);
            } catch (IOException e) {
                log.warn("Failed to load credentials from file path: {}", credentialsPath);
            }
        }
        
        // Try to load from classpath
        try {
            ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
            if (resource.exists()) {
                log.info("Loading Firebase credentials from classpath: firebase-service-account.json");
                try (InputStream serviceAccount = resource.getInputStream()) {
                    return GoogleCredentials.fromStream(serviceAccount);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to load credentials from classpath");
        }
        
        // Try to load from environment variable
        try {
            log.info("Loading Firebase credentials from environment variable GOOGLE_APPLICATION_CREDENTIALS");
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException e) {
            log.warn("Failed to load credentials from environment variable");
        }
        
        // If all else fails, create default credentials (for development)
        log.warn("Using default credentials - this should only be used in development");
        return GoogleCredentials.getApplicationDefault();
    }
}
