# EAS Credentials Setup Guide

This guide will help you set up production credentials for your Sha_Pay mobile app deployment.

## 🔐 Android Keystore Setup

### 1. Generate Production Keystore

```bash
# Navigate to android/app directory
cd android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias sha-pay-key -keyalg RSA -keysize 2048 -validity 10000
```

**Important Information to Provide:**
- **Keystore Password**: Choose a strong password (save this securely)
- **Key Password**: Choose a strong password (save this securely)
- **First and Last Name**: Your organization name
- **Organizational Unit**: Your department/team
- **Organization**: Your company name
- **City/Locality**: Your city
- **State/Province**: Your state
- **Country Code**: Your 2-letter country code (e.g., US, NG, UK)

### 2. Update Environment Variables

Create a `.env.local` file in your project root:

```env
# Android Keystore Credentials
KEYSTORE_PASSWORD=your_keystore_password_here
KEY_PASSWORD=your_key_password_here

# iOS Certificates (if building for iOS)
CERT_PASSWORD=your_certificate_password_here
```

### 3. Update EAS Configuration

Replace the placeholder values in `eas.json`:

```json
{
  "credentials": {
    "android": {
      "keystore": {
        "keystorePath": "./android/app/release.keystore",
        "keystorePassword": "$KEYSTORE_PASSWORD",
        "keyAlias": "sha-pay-key",
        "keyPassword": "$KEY_PASSWORD"
      }
    }
  }
}
```

## 🍎 iOS Credentials Setup (Optional)

### 1. Apple Developer Account Requirements

- Active Apple Developer Program membership ($99/year)
- App ID registered in Apple Developer Portal
- Distribution Certificate
- App Store Provisioning Profile

### 2. Generate iOS Certificates

```bash
# Create iOS certificates directory
mkdir -p ios/certs ios/profiles

# Download certificates from Apple Developer Portal
# Place distribution.p12 in ios/certs/
# Place AppStore.mobileprovision in ios/profiles/
```

## 🚀 Build Commands

### Development Build
```bash
eas build --profile development --platform android
```

### Preview Build (APK)
```bash
eas build --profile preview --platform android
```

### Production Build (AAB for Play Store)
```bash
eas build --profile production --platform android
```

### iOS Production Build
```bash
eas build --profile production --platform ios
```

## 🔒 Security Best Practices

1. **Never commit credentials to version control**
   - Add `.env.local` to `.gitignore`
   - Add `*.keystore` to `.gitignore`
   - Add `ios/certs/` and `ios/profiles/` to `.gitignore`

2. **Store credentials securely**
   - Use environment variables for CI/CD
   - Consider using EAS Secrets for cloud builds
   - Keep backup copies in secure password manager

3. **Keystore backup**
   - Store keystore file in multiple secure locations
   - Document all passwords and alias information
   - **Warning**: Losing your keystore means you cannot update your app!

## 📱 Alternative: EAS Managed Credentials

For easier setup, you can use EAS managed credentials:

```bash
# Let EAS manage credentials automatically
eas credentials

# Follow the interactive prompts
# EAS will generate and store credentials securely
```

Update `eas.json` to use managed credentials:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Keystore not found**
   - Verify the `keystorePath` in `eas.json`
   - Ensure keystore file exists in specified location

2. **Invalid credentials**
   - Double-check passwords in environment variables
   - Verify key alias matches keystore

3. **Build failures**
   - Check EAS build logs for detailed error messages
   - Ensure all required certificates are present

### Verification Commands

```bash
# Verify keystore information
keytool -list -v -keystore android/app/release.keystore

# Check EAS configuration
eas config

# Validate build profile
eas build --profile production --platform android --dry-run
```

## 📋 Checklist

- [ ] Generated production keystore
- [ ] Updated environment variables
- [ ] Configured `eas.json` credentials
- [ ] Added sensitive files to `.gitignore`
- [ ] Backed up keystore and passwords
- [ ] Tested build with `--dry-run`
- [ ] Successfully built production APK/AAB

---

**Next Steps**: Once credentials are configured, you can build and deploy your app to Google Play Store or distribute APK files directly.