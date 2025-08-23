# Android SDK Setup Guide

## Issue
The Android SDK path could not be resolved. This prevents opening the Expo app on Android devices or emulators.

## Immediate Solution: Use Web Browser
For immediate testing, you can run your app in a web browser:
1. In the Expo terminal, press `w` to open in web browser
2. This will launch your app at `http://localhost:19006`

## Permanent Solution: Install Android Studio & SDK

### Step 1: Download Android Studio
1. Go to https://developer.android.com/studio
2. Download Android Studio for Windows
3. Run the installer and follow the setup wizard

### Step 2: Install Android SDK
1. Open Android Studio
2. Go to File > Settings (or Android Studio > Preferences on Mac)
3. Navigate to Appearance & Behavior > System Settings > Android SDK
4. Install the latest Android SDK Platform
5. In the SDK Tools tab, ensure these are installed:
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android SDK Tools

### Step 3: Set Environment Variables
1. Find your Android SDK path (usually `C:\Users\[USERNAME]\AppData\Local\Android\Sdk`)
2. Add environment variables:
   - `ANDROID_HOME`: Path to your Android SDK
   - `ANDROID_SDK_ROOT`: Same path as ANDROID_HOME
3. Add to PATH:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

### Step 4: Verify Installation
Open a new terminal and run:
```bash
adb version
```
You should see the Android Debug Bridge version.

### Step 5: Restart Expo
1. Stop the current Expo server (Ctrl+C)
2. Restart with `npx expo start`
3. Press `a` to open on Android

## Alternative: Use Expo Go App
1. Install Expo Go from Google Play Store on your Android device
2. Scan the QR code displayed in the Expo terminal
3. Your app will open directly in Expo Go

## Troubleshooting
- If environment variables don't work, restart your computer
- Ensure Windows Defender/Antivirus isn't blocking Android Studio
- Try running terminal as Administrator if permission issues occur