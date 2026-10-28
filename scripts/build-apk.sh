#!/bin/bash
# ==============================================================================
# Briefly - Android APK Compilation & Sync Script
# ==============================================================================
# This script prepares the production web bundle, syncs assets into the native
# Android Capacitor container, and builds a debug APK (or outputs Gradle build instructions).

set -e

echo "🚀 [1/3] Building production web assets..."
npm run build

echo "🔄 [2/3] Syncing assets with Capacitor Android..."
npx cap sync android

echo "📦 [3/3] Checking Android build environment..."

if command -v javac >/dev/null 2>&1 && [ -f "./android/gradlew" ]; then
  echo "⚡ Java JDK detected! Compiling Android APK with Gradle..."
  cd android
  chmod +x ./gradlew
  ./gradlew assembleDebug
  cd ..
  
  APK_PATH="./android/app/build/outputs/apk/debug/app-debug.apk"
  if [ -f "$APK_PATH" ]; then
    echo "🎉 Success! APK built at: $APK_PATH"
    echo "You can transfer this APK directly to any Android device with 'Install Unknown Apps' enabled."
  fi
else
  echo "ℹ️  Capacitor Android project is completely synchronized at /android"
  echo "To generate the APK locally or on CI:"
  echo "  1. Install Android Studio (or run 'npx cap open android')"
  echo "  2. Run 'cd android && ./gradlew assembleDebug'"
  echo "  3. The resulting APK will be in android/app/build/outputs/apk/debug/app-debug.apk"
fi

echo "✅ Android Native project is ready for installation and store publishing!"
