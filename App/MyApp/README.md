# MyApp - React Native Android Project

A minimal React Native project configured only for Android development.

## Project Structure

```
MyApp/
├── android/                    # Android project files
│   ├── app/
│   │   ├── build.gradle       # App-level Gradle configuration
│   │   ├── proguard-rules.pro # ProGuard rules
│   │   ├── debug.keystore     # Debug signing key
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/myapp/
│   │       │   ├── MainActivity.java
│   │       │   ├── MainApplication.java
│   │       │   └── ReactNativeFlipper.java
│   │       └── res/           # Android resources
│   ├── build.gradle           # Project-level Gradle configuration
│   ├── gradle.properties      # Gradle properties
│   └── settings.gradle        # Gradle settings
├── App.js                     # Main React component
├── index.js                   # Entry point
├── package.json               # Node.js dependencies
├── app.json                   # App configuration
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro bundler configuration
└── .gitignore                 # Git ignore rules
```

## Prerequisites

- Node.js (>= 18)
- Java Development Kit (JDK) 17 or higher
- Android Studio
- Android SDK (API level 21 or higher)
- Android emulator or physical Android device

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd MyApp
   npm install
   ```

2. **Set up Android environment:**
   - Open Android Studio
   - Install Android SDK (API level 21+)
   - Set up Android emulator or connect physical device

3. **Run the app:**
   ```bash
   # Start Metro bundler
   npm start
   
   # In another terminal, run on Android
   npm run android
   ```

## Features

- ✅ Minimal React Native setup (Android only)
- ✅ Latest React Native version (0.73.2)
- ✅ Proper Gradle configuration
- ✅ AndroidManifest.xml setup
- ✅ Debug keystore for development
- ✅ Simple "Hello Android" UI
- ✅ Ready to run in Android Studio or device

## App Description

The app displays a simple "Hello Android" message centered on the screen with a clean, modern UI design. It's configured to run only on Android devices and emulators.

## Troubleshooting

- Make sure Android SDK is properly installed
- Ensure Android emulator is running or device is connected
- Check that all dependencies are installed with `npm install`
- Verify Java version compatibility (JDK 17+)










