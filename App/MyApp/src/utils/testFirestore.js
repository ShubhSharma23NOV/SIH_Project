import { firebase } from '@react-native-firebase/app';
import firebaseConfig from '../config/firebase';

// Test Firebase App initialization
export const testFirebaseApp = async () => {
  try {
    console.log('Testing Firebase App initialization...');
    
    // Initialize Firebase config
    const initialized = await firebaseConfig.initialize();
    if (!initialized) {
      return {
        success: false,
        message: `Firebase initialization failed: ${firebaseConfig.initializationError?.message}`,
        code: firebaseConfig.initializationError?.code
      };
    }
    
    const app = firebaseConfig.getApp();
    console.log('Firebase App test successful:', app.name);
    
    return { success: true, message: `Firebase App initialized: ${app.name}` };
  } catch (error) {
    console.error('Firebase App test failed:', error);
    return { 
      success: false, 
      message: `Firebase App failed: ${error.message}`,
      code: error.code 
    };
  }
};

// Test Firestore connection
export const testFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...');
    
    const firestore = firebase.firestore();
    console.log('Firestore instance created successfully');
    
    // Test Firestore settings access
    const settings = firestore._settings;
    console.log('Firestore settings accessible');
    
    // Test a simple read operation (this will fail if Firestore is not properly configured)
    const testRef = firestore.collection('_test_connection');
    await testRef.limit(1).get();
    console.log('Firestore read test successful');
    
    return { success: true, message: 'Firestore connection successful' };
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    
    let message = `Firestore connection failed: ${error.message}`;
    if (error.code === 'firestore/permission-denied') {
      message += ' (Check Firestore rules or create database)';
    } else if (error.code === 'firestore/unavailable') {
      message += ' (Check internet connection)';
    }
    
    return { 
      success: false, 
      message,
      code: error.code 
    };
  }
};

// Test Firebase Auth
export const testFirebaseAuth = async () => {
  try {
    console.log('Testing Firebase Auth...');
    
    const auth = firebase.auth();
    console.log('Auth instance created successfully');
    
    // Get current auth state
    const user = auth.currentUser;
    console.log('Auth state:', user ? `Signed in as ${user.uid}` : 'Not signed in');
    
    // Test auth configuration
    const settings = auth.settings;
    console.log('Auth settings accessible');
    
    return { 
      success: true, 
      message: `Firebase Auth accessible. User: ${user ? user.uid : 'None'}` 
    };
  } catch (error) {
    console.error('Firebase Auth test failed:', error);
    return { 
      success: false, 
      message: `Firebase Auth failed: ${error.message}`,
      code: error.code 
    };
  }
};

// Test ASHA workers collection access
export const testAshaWorkersCollection = async () => {
  try {
    console.log('Testing ASHA workers collection...');
    
    const firestore = firebase.firestore();
    const snapshot = await firestore.collection('asha_workers').limit(1).get();
    
    console.log('ASHA workers collection accessible. Document count:', snapshot.size);
    
    return { 
      success: true, 
      message: `ASHA workers collection accessible. Found ${snapshot.size} documents.` 
    };
  } catch (error) {
    console.error('ASHA workers collection test failed:', error);
    
    let message = `ASHA workers collection failed: ${error.message}`;
    if (error.code === 'firestore/permission-denied') {
      message += ' (Check Firestore security rules)';
    } else if (error.code === 'firestore/not-found') {
      message += ' (Collection may not exist yet)';
    }
    
    return { 
      success: false, 
      message,
      code: error.code 
    };
  }
};

// Test Firebase project configuration
export const testFirebaseProjectConfig = async () => {
  try {
    console.log('Testing Firebase project configuration...');
    
    const app = firebase.app();
    const options = app.options;
    
    console.log('Project ID:', options.projectId);
    console.log('App ID:', options.appId);
    console.log('API Key:', options.apiKey ? 'Present' : 'Missing');
    console.log('Auth Domain:', options.authDomain);
    
    if (!options.projectId) {
      throw new Error('Project ID missing from configuration');
    }
    
    if (!options.apiKey) {
      throw new Error('API Key missing from configuration');
    }
    
    return { 
      success: true, 
      message: `Project configured: ${options.projectId}` 
    };
  } catch (error) {
    console.error('Firebase project config test failed:', error);
    return { 
      success: false, 
      message: `Project config failed: ${error.message}`,
      code: error.code 
    };
  }
};

// Test Google Services configuration
export const testGoogleServicesConfig = async () => {
  try {
    console.log('Testing Google Services configuration...');
    
    const app = firebase.app();
    
    // Check if app was initialized (indicates google-services.json is working)
    if (app.name === '[DEFAULT]') {
      console.log('Default Firebase app initialized successfully');
      return { 
        success: true, 
        message: 'Google Services configuration working (google-services.json loaded)' 
      };
    } else {
      throw new Error('Default Firebase app not properly initialized');
    }
  } catch (error) {
    console.error('Google Services config test failed:', error);
    return { 
      success: false, 
      message: `Google Services config failed: ${error.message} (Check google-services.json)`,
      code: error.code 
    };
  }
};

// Run all tests
export const runFirebaseTests = async () => {
  console.log('🔥 Running comprehensive Firebase tests...');
  
  const results = {
    app: await testFirebaseApp(),
    projectConfig: await testFirebaseProjectConfig(),
    googleServices: await testGoogleServicesConfig(),
    firestore: await testFirestoreConnection(),
    auth: await testFirebaseAuth(),
    ashaWorkers: await testAshaWorkersCollection()
  };
  
  console.log('🔥 Firebase test results:', results);
  
  // Count successful tests
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`🔥 Test Summary: ${successCount}/${totalCount} tests passed`);
  
  return {
    ...results,
    summary: {
      passed: successCount,
      total: totalCount,
      allPassed: successCount === totalCount
    }
  };
};