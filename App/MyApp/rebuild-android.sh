#!/bin/bash

echo "🔨 Rebuilding Android app with icons..."

# Clean Android build
echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

# Clear Metro cache
echo "🗑️  Clearing Metro cache..."
npm start -- --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null

# Rebuild and run
echo "🚀 Building and running app..."
npm run android

echo "✅ Done! Icons should now be visible."
