# Android Studio Installation Script
# This script helps download and install Android Studio with proper SDK setup

Write-Host "=== Android Studio Installation Helper ===" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "Warning: Running without administrator privileges. Some operations may fail." -ForegroundColor Yellow
    Write-Host ""
}

# Create download directory
$downloadPath = "$env:USERPROFILE\Downloads\AndroidStudio"
if (-not (Test-Path $downloadPath)) {
    New-Item -ItemType Directory -Path $downloadPath -Force | Out-Null
    Write-Host "Created download directory: $downloadPath" -ForegroundColor Green
}

# Android Studio download URL (latest stable)
$androidStudioUrl = "https://redirector.gvt1.com/edgedl/android/studio/install/2023.1.1.28/android-studio-2023.1.1.28-windows.exe"
$installerPath = "$downloadPath\android-studio-installer.exe"

Write-Host "Step 1: Downloading Android Studio..." -ForegroundColor Cyan
Write-Host "Download URL: $androidStudioUrl"
Write-Host "Saving to: $installerPath"
Write-Host ""

try {
    # Download Android Studio
    Write-Host "Starting download... This may take several minutes." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $androidStudioUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "✓ Android Studio downloaded successfully!" -ForegroundColor Green
    
    # Verify download
    if (Test-Path $installerPath) {
        $fileSize = (Get-Item $installerPath).Length / 1MB
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Step 2: Starting Android Studio installation..." -ForegroundColor Cyan
    Write-Host "The installer will open. Please follow these steps:"
    Write-Host "1. Click 'Next' through the welcome screens"
    Write-Host "2. Choose 'Standard' installation type"
    Write-Host "3. Accept the license agreements"
    Write-Host "4. Wait for the download and installation to complete"
    Write-Host "5. When prompted, choose to install Android SDK"
    Write-Host ""
    
    # Start the installer
    Write-Host "Launching installer..." -ForegroundColor Yellow
    Start-Process -FilePath $installerPath
    
    Write-Host "✓ Installer launched successfully!" -ForegroundColor Green
    Write-Host "Please complete the installation in the opened window."
    Write-Host ""
    Write-Host "After installation completes:"
    Write-Host "1. Open Android Studio"
    Write-Host "2. Complete the setup wizard"
    Write-Host "3. Install the Android SDK when prompted"
    Write-Host "4. Restart your terminal"
    Write-Host "5. Run 'adb version' to verify installation"
    
} catch {
    Write-Host "❌ Error during download: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please try downloading manually from: https://developer.android.com/studio"
    Write-Host "Save the installer to: $installerPath"
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Complete the Android Studio installation"
Write-Host "2. Set up Android SDK through Android Studio"
Write-Host "3. Restart your terminal/PowerShell"
Write-Host "4. Navigate to your Expo project"
Write-Host "5. Run 'npx expo start' and press 'a' for Android"
Write-Host ""
Write-Host "For detailed setup instructions, see ANDROID_SETUP_GUIDE.md"
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")