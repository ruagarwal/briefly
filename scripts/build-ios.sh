#!/bin/bash
# ==============================================================================
# Briefly - iOS Xcode Project Sync & Build Script
# ==============================================================================
# This script compiles the production web app and synchronizes the native iOS
# Xcode project with the latest assets, plugins, and splash screens.

set -e

echo "🚀 [1/2] Compiling production web bundle..."
npm run build

echo "🔄 [2/2] Synchronizing iOS project with Capacitor..."
npx cap sync ios

echo "✅ iOS project synchronized at /ios"
echo "To open in Xcode and run on iPhone / Simulator or generate IPA:"
echo "  npx cap open ios"
echo "  or open ios/App/App.xcworkspace in Xcode"
