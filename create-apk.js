const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple APK creation script for Sha_Pay app
console.log('🚀 Creating APK for Sha_Pay app...');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Export bundle not found. Please run: npx expo export --platform android');
  process.exit(1);
}

// Create APK directory structure
const apkDir = path.join(__dirname, 'apk-build');
if (fs.existsSync(apkDir)) {
  fs.rmSync(apkDir, { recursive: true });
}
fs.mkdirSync(apkDir, { recursive: true });

// Copy exported bundle
const bundleSource = path.join(distPath, '_expo');
const bundleDest = path.join(apkDir, 'assets');
fs.mkdirSync(bundleDest, { recursive: true });

// Copy bundle files
if (fs.existsSync(bundleSource)) {
  execSync(`xcopy "${bundleSource}" "${bundleDest}" /E /I /Y`, { stdio: 'inherit' });
}

// Copy assets
const assetsSource = path.join(distPath, 'assets');
const assetsDest = path.join(apkDir, 'assets', 'assets');
if (fs.existsSync(assetsSource)) {
  fs.mkdirSync(assetsDest, { recursive: true });
  execSync(`xcopy "${assetsSource}" "${assetsDest}" /E /I /Y`, { stdio: 'inherit' });
}

// Create manifest
const manifest = {
  name: 'Sha_Pay!',
  package: 'com.shapay.app',
  version: '1.0.0',
  bundle: 'assets/_expo/static/js/android/index-*.hbc'
};

fs.writeFileSync(
  path.join(apkDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('✅ APK structure created successfully!');
console.log('📁 APK files location:', apkDir);
console.log('📱 To install: Use the generated files with a proper APK builder or upload to app stores');
console.log('🌐 For immediate testing, use the web version at http://localhost:8083');