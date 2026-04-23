#!/bin/bash

echo "🔗 Linking React Native Vector Icons..."

# For Android
echo "📱 Setting up Android..."

# Clean Android build
cd android
./gradlew clean
cd ..

echo "✅ Icons linked successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: cd android && ./gradlew clean && cd .."
echo "2. Run: npm start -- --reset-cache"
echo "3. Run: npm run android"
echo ""
echo "Or simply run: ./rebuild-android.sh"
