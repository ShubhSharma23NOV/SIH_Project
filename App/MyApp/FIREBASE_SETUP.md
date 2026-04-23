# Firebase Setup Guide for MyApp

This document provides instructions for setting up Firebase in your React Native project.

## 🔥 Firebase Configuration

### Current Setup

Your project is configured with the following Firebase services:

- **Authentication** (Phone Number Auth)
- **Firestore Database**
- **App Check** (for security)

### Project Details

- **Project ID**: `arogyajal-979e2`
- **Project Number**: `245986373726`
- **Storage Bucket**: `arogyajal-979e2.firebasestorage.app`
- **Package Name**: `com.Arogya_jal.app`

## 📱 Installation Steps

### 1. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

### 2. Android Configuration

The following files are already configured:

- `android/app/google-services.json` - Firebase configuration
- `android/build.gradle` - Google Services plugin
- `android/app/build.gradle` - Firebase dependencies

### 3. Rebuild the App

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Install node modules
npm install

# For React Native 0.60+, no need to link manually
# Run the app
npx react-native run-android
```

## 🏗️ Database Structure

### Collections

#### `asha_workers`

```javascript
{
  name: "Worker Name",
  phone: "+911234567890",
  email: "worker@example.com",
  district: "District Name",
  block: "Block Name",
  village: "Village Name",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true
}
```

#### `reports`

```javascript
{
  ashaWorkerId: "worker_document_id",
  ashaWorkerPhone: "+911234567890",
  caseType: "Disease Type",
  patientName: "Patient Name",
  patientAge: 25,
  symptoms: ["symptom1", "symptom2"],
  location: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Full Address"
  },
  status: "pending|reviewed|resolved",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### `alerts`

```javascript
{
  title: "Alert Title",
  message: "Alert Message",
  type: "info|warning|error|success",
  targetAudience: "all|specific_workers",
  isRead: false,
  createdAt: Timestamp
}
```

## 🔐 Security Rules

Firestore security rules are configured in `firestore.rules`:

- ASHA workers can only access their own data
- Users can only create/read reports associated with their phone number
- Admins have broader access to all collections
- Authentication is required for all operations

## 🚀 Features Implemented

### Authentication

- **Phone Number Authentication** with OTP
- Automatic verification of ASHA worker registration
- Fallback direct login for testing

### Database Operations

- Worker registration verification
- Report creation and management
- Alert system
- Firestore utilities for common operations

### Security

- App Check integration for enhanced security
- Role-based access control
- Phone number verification

## 📱 Usage in Code

### Authentication

```javascript
import auth from '@react-native-firebase/auth';

// Send OTP
const confirmation = await auth().signInWithPhoneNumber('+911234567890');

// Verify OTP
await confirmation.confirm('123456');
```

### Firestore Operations

```javascript
import { ashaWorkerHelpers } from './src/utils/firestore';

// Check if worker exists
const exists = await ashaWorkerHelpers.checkByPhone('+911234567890');

// Get worker data
const worker = await ashaWorkerHelpers.getByPhone('+911234567890');
```

### Native Module

```javascript
import { NativeModules } from 'react-native';
const { AshaLogin } = NativeModules;

// Check registration (uses Firestore)
const isRegistered = await AshaLogin.checkRegistered('+911234567890');
```

## 🛠️ Development Notes

### Testing

- Use the "DIRECT LOGIN (TEST)" button for development
- OTP authentication requires a physical device for SMS
- Use Firebase Console to manually add test ASHA workers

### Firebase Console

Access your project at: https://console.firebase.google.com/project/arogyajal-979e2

### Common Issues

1. **Build errors**: Clean and rebuild after adding Firebase
2. **OTP not received**: Check phone number format (+91XXXXXXXXXX)
3. **Permission denied**: Verify Firestore security rules
4. **App Check**: May need configuration for production

## 📝 Next Steps

1. Set up Firebase functions for backend processing
2. Implement push notifications
3. Add offline data synchronization
4. Set up Analytics and Crashlytics
5. Configure App Check for production use

---

**Note**: This configuration uses Firebase SDK v20.4.0 which is compatible with React Native 0.73.x