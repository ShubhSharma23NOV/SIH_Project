#!/bin/bash

# Kill any existing Metro processes
pkill -f "react-native start" || true

# Start Metro bundler
echo "Starting Metro bundler..."
npx react-native start --reset-cache &

# Wait for Metro to start
sleep 10

# Set up port forwarding
echo "Setting up port forwarding..."
export PATH=$PATH:~/Library/Android/sdk/platform-tools
adb reverse tcp:8081 tcp:8081

# Launch the app
echo "Launching app..."
adb shell am start -n com.myapp/com.myapp.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER

echo "App launched! Check your device/emulator."
echo "If you still see the error, try shaking the device and selecting 'Reload'"










