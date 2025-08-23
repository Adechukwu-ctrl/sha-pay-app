# Manual Android Studio Installation Guide

## Quick Installation Steps

### Option 1: Direct Download (Recommended)
1. **Download Android Studio:**
   - Visit: https://developer.android.com/studio
   - Click "Download Android Studio"
   - Save the installer to your Downloads folder

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file
   - Choose "Standard" installation
   - Accept all license agreements
   - Let it download and install the Android SDK

### Option 2: Alternative Download Links
If the main site is slow, try these direct links:
- **Latest Stable:** https://redirector.gvt1.com/edgedl/android/studio/install/2023.1.1.28/android-studio-2023.1.1.28-windows.exe
- **Mirror Site:** https://developer.android.com/studio#downloads

## Post-Installation Setup

### 1. First Launch Setup
1. Open Android Studio
2. Complete the "Welcome to Android Studio" wizard
3. Choose "Standard" setup type
4. Accept SDK license agreements
5. Wait for SDK components to download

### 2. Environment Variables Setup
After installation, set these environment variables:

**Method 1: Through System Properties**
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables"
3. Under "User variables", click "New"
4. Add these variables:
   - Variable: `ANDROID_HOME`
   - Value: `C:\Users\[YOUR_USERNAME]\AppData\Local\Android\Sdk`
   - Variable: `ANDROID_SDK_ROOT`
   - Value: `C:\Users\[YOUR_USERNAME]\AppData\Local\Android\Sdk`

5. Edit the `PATH` variable and add:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

**Method 2: Through PowerShell (Run as Administrator)**
```powershell
# Set environment variables
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = "$currentPath;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\tools;$env:LOCALAPPDATA\Android\Sdk\tools\bin"
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
```

### 3. Verify Installation
1. **Restart your terminal/PowerShell**
2. **Test ADB:**
   ```bash
   adb version
   ```
   You should see Android Debug Bridge version information

3. **Test Expo Android:**
   ```bash
   cd "C:\Users\DELL\OneDrive\Attachments\Sha_Pay!"
   npx expo start
   # Press 'a' to open on Android
   ```

## Troubleshooting

### Common Issues:

**1. "adb is not recognized"**
- Restart your terminal after setting environment variables
- Verify PATH includes Android SDK platform-tools

**2. "Failed to resolve Android SDK path"**
- Check that ANDROID_HOME points to the correct SDK location
- Default location: `C:\Users\[USERNAME]\AppData\Local\Android\Sdk`

**3. "No Android devices found"**
- Enable USB Debugging on your Android device
- Install device drivers if needed
- Try using Expo Go app instead

### Alternative Testing Methods:

**1. Use Expo Go App:**
- Install Expo Go from Google Play Store
- Scan the QR code from your Expo development server

**2. Use Web Browser:**
- In Expo terminal, press 'w' to open in web browser
- Access directly at: http://localhost:19006

**3. Use Android Emulator:**
- Open Android Studio
- Go to Tools > AVD Manager
- Create and start a virtual device

## Quick Commands Reference

```bash
# Start Expo development server
npx expo start

# Open on Android (requires SDK)
Press 'a' in Expo terminal

# Open in web browser
Press 'w' in Expo terminal

# Check ADB version
adb version

# List connected devices
adb devices
```

## Need Help?

If you encounter issues:
1. Check the main setup guide: `ANDROID_SETUP_GUIDE.md`
2. Restart your computer after setting environment variables
3. Try using Expo Go app as an alternative
4. Use web browser testing for immediate development

---

**Note:** The automated installation script is running in the background. If it completes successfully, you can skip the manual steps above.