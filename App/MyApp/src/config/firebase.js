// Import Firebase modules
import { firebase } from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

// Firebase initialization and configuration
class FirebaseConfig {
  constructor() {
    this.isInitialized = false;
    this.initializationError = null;
  }

  async initialize() {
    try {
      // Check if Firebase is already initialized
      if (firebase.apps.length > 0) {
        console.log('Firebase already initialized');
        this.isInitialized = true;
        return true;
      }

      // Firebase should be automatically initialized by google-services.json
      // We just need to verify it's working
      await this.verifyInitialization();
      this.isInitialized = true;
      console.log('Firebase initialization verified successfully');
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.initializationError = error;
      return false;
    }
  }

  async verifyInitialization() {
    try {
      // Test Firebase App
      const app = firebase.app();
      console.log('Firebase App initialized:', app.name);

      // Test Firestore
      const firestore = firebase.firestore();
      console.log('Firestore instance created');

      // Test Auth
      const auth = firebase.auth();
      console.log('Auth instance created');

      return true;
    } catch (error) {
      throw new Error(`Firebase verification failed: ${error.message}`);
    }
  }

  getFirestore() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return firebase.firestore();
  }

  getAuth() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return firebase.auth();
  }

  getApp() {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return firebase.app();
  }
}

// Create singleton instance
const firebaseConfig = new FirebaseConfig();

// Export individual services
export const auth = () => firebase.auth();
export const firestore = () => firebase.firestore();
export const app = () => firebase.app();

// Export the config instance for initialization
export default firebaseConfig;