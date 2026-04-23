import { initializeApp } from 'firebase/app';

// Firebase configuration loaded from environment variables
// Create a .env file in the project root with your Firebase config
// Make sure to add .env to .gitignore to keep your credentials secure

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

// Check for missing environment variables in development
if (process.env.NODE_ENV === 'development') {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables for Firebase:', missingVars.join(', '));
    console.warn('Please create a .env file with the required Firebase configuration.');
  }
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ''
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

export { firebaseConfig };

// Collection names
export const COLLECTIONS = {
  SENSOR_READINGS: 'sensor_readings',
  DEVICES: 'devices',
  ALERTS: 'alerts'
};
