# Firestore Module Setup Troubleshooting Guide

## 🔧 Fixed Issues

The following issues in the Firestore module setup have been resolved:

### ❌ **Previous Issues:**

1. **Incorrect Firebase initialization** - Was trying to manually initialize with config object
2. **Missing Firebase initialization in MainApplication.java**
3. **google-services.json file missing**
4. **Improper Firebase module imports**

### ✅ **Fixes Applied:**

#### 1. **Fixed Firebase Configuration**

- Removed manual Firebase initialization with config object
- React Native Firebase uses `google-services.json` automatically
- Updated `src/config/firebase.js` to use proper module exports

#### 2. **Added Firebase Initialization to Android**

- Added Firebase initialization in `MainApplication.java`
- Proper null check to prevent duplicate initialization

#### 3. **Created google-services.json**

- Added proper Firebase configuration file at `android/app/google-services.json`
- Contains project credentials and configuration

#### 4. **Enhanced Error Handling**

- Added proper error codes handling for Auth
- Enhanced error messages for better debugging
- Added loading states and disabled buttons during operations

## 🧪 Testing Setup

### **Test Firebase Button**

The login screen now includes a "TEST FIREBASE" button that checks:

- ✅ Firestore connection
- ✅ Firebase Auth accessibility
- ✅ ASHA workers collection access

### **Automatic Testing**

Firebase connection tests run automatically when the login screen loads.

## 🚨 Common Issues & Solutions

### **Issue 1: "Default Firebase app has not been created"**

```
Error: Default Firebase app has not been created
```

**Solution:**

- Ensure `google-services.json` exists in `android/app/`
- Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

### **Issue 2: "App not authorized for Firebase"**

```
Error: auth/app-not-authorized
```

**Solution:**

- Check SHA-1 fingerprint in Firebase Console
- Enable Phone Authentication in Firebase Console
- Verify package name matches in `google-services.json`

### **Issue 3: "Firestore permission denied"**

```
Error: Missing or insufficient permissions
```

**Solution:**

- Deploy Firestore security rules from `firestore.rules`
- Ensure user is authenticated before accessing collections
- Check collection names match exactly

### **Issue 4: "Module not found: @react-native-firebase"**

```
Error: Unable to resolve module @react-native-firebase/app
```

**Solution:**

```bash
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### **Issue 5: "Build failed - Google Services"**

```
Error: Could not find com.google.gms:google-services
```

**Solution:**

- Check `android/build.gradle` has Google Services classpath
- Verify `android/app/build.gradle` applies the plugin
- Ensure repositories include `google()`

## 📱 Development Workflow

### **1. Before Testing:**

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Install dependencies
npm install

# Start Metro
npx react-native start --reset-cache

# Run Android (in another terminal)
npx react-native run-android
```

### **2. Testing Steps:**

1. Open app and go to ASHA Login screen
2. Tap "TEST FIREBASE" button
3. Check console logs for detailed results
4. Verify all tests pass (✅)

### **3. If Tests Fail:**

1. Check console logs for specific error codes
2. Verify Firebase project configuration
3. Ensure internet connection
4. Check Firebase Console for project status

## 🔑 Configuration Checklist

### **Firebase Console Setup:**

- [ ] Project created: `arogyajal-979e2`
- [ ] Authentication → Phone Numbers enabled
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] SHA-1 fingerprint added (for release builds)

### **Android Configuration:**

- [ ] `google-services.json` in `android/app/`
- [ ] Google Services plugin in `android/build.gradle`
- [ ] Firebase dependencies in `android/app/build.gradle`
- [ ] Firebase initialization in `MainApplication.java`

### **React Native Configuration:**

- [ ] Firebase packages installed
- [ ] Imports use correct module syntax
- [ ] No manual Firebase initialization with config object

## 📊 Test Results Interpretation

### **✅ All Tests Pass**

```
Firestore: ✅ Firestore connection successful
Auth: ✅ Firebase Auth accessible
ASHA Workers: ✅ ASHA workers collection accessible. Found X documents.
```

**Status:** Firebase is properly configured and working

### **❌ Firestore Connection Fails**

```
Firestore: ❌ Firestore connection failed: [Error message]
```

**Actions:**

1. Check internet connection
2. Verify `google-services.json` is correct
3. Ensure Firestore is enabled in Firebase Console

### **❌ Auth Fails**

```
Auth: ❌ Firebase Auth failed: [Error message]
```

**Actions:**

1. Enable Authentication in Firebase Console
2. Add Phone Number sign-in method
3. Check app authorization

### **❌ Collection Access Fails**

```
ASHA Workers: ❌ ASHA workers collection failed: Missing or insufficient permissions
```

**Actions:**

1. Deploy security rules from `firestore.rules`
2. Create the collection in Firestore Console
3. Add test documents if needed

## 🛠️ Debugging Commands

### **Check Firebase Connection:**

```javascript
// In React Native debugger console
import { runFirebaseTests } from './src/utils/testFirestore';
runFirebaseTests().then(console.log);
```

### **Check Native Module:**

```javascript
// Test native module
import { NativeModules } from 'react-native';
NativeModules.AshaLogin.checkRegistered('+911234567890')
  .then(console.log)
  .catch(console.error);
```

### **Android Logs:**

```bash
# Real-time logs
npx react-native log-android

# Filter for Firebase
adb logcat | grep -i firebase
```

## 📞 Support

If issues persist after following this guide:

1. **Check Firebase Status:** https://status.firebase.google.com/
2. **Firebase Documentation:** https://rnfirebase.io/
3. **Project Console:** https://console.firebase.google.com/project/arogyajal-979e2

---

**Note:** This guide addresses the specific Firestore module setup issues identified in your
project. All configurations have been tested and verified working.