# Training Module Setup Instructions

## Step 1: Install Required Packages

Run these commands in your MyApp directory:

```bash
cd MyApp

# Install video player
npm install react-native-video

# Install file system access
npm install react-native-fs

# Install PDF viewer
npm install react-native-pdf

# Install progress bar
npm install react-native-progress

# Link native dependencies (for React Native < 0.60)
npx react-native link react-native-video
npx react-native link react-native-fs
npx react-native link react-native-pdf
```

## Step 2: Android Permissions

The permissions are already added in your AndroidManifest.xml, but verify these exist:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Step 3: iOS Setup (if building for iOS)

```bash
cd ios
pod install
cd ..
```

## Step 4: Cloudinary Setup

1. Go to https://cloudinary.com/users/register/free
2. Sign up and verify email
3. Get your credentials from Dashboard:
   - Cloud name
   - API Key
   - API Secret
4. Create folders: training/videos, training/documents, training/images
5. Upload 1-2 sample videos

## Step 5: Firestore Setup

1. Go to Firebase Console → Firestore Database
2. Create collection: `training_modules`
3. Add sample document (see FIRESTORE_SCHEMA.md)

## Step 6: Test the Feature

1. Rebuild the app:
   ```bash
   npx react-native run-android
   ```

2. Login as ASHA worker
3. Navigate to Training section
4. Download a module
5. Go offline (airplane mode)
6. Open the downloaded module - it should play!

## Files Created:

- src/screens/OpsTrainingScreen.js - Training management for Ops
- src/screens/TrainingModulesScreen.js - Training list for ASHA
- src/screens/VideoPlayerScreen.js - Video player
- src/screens/PDFViewerScreen.js - PDF viewer
- src/services/TrainingService.js - Training module service
- src/services/DownloadService.js - Download management

## Navigation Updated:

- Added Training routes to AppNavigator.js
- Added Training button to AshaDashboard
- Added Training management to OpsDashboard
