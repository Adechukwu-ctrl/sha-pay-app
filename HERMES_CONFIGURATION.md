# Hermes JavaScript Engine Configuration Guide

## Overview
Hermes is a JavaScript engine optimized for React Native that provides faster app startup, reduced memory usage, and smaller app size. This guide explains how Hermes has been configured for both Android and iOS platforms in your Sha_Pay! app.

## Configuration Files

### 1. app.json
The main configuration file that enables Hermes for both platforms:

```json
{
  "expo": {
    "ios": {
      "jsEngine": "hermes"
    },
    "android": {
      "jsEngine": "hermes"
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableHermes": true
          },
          "ios": {
            "enableHermes": true
          }
        }
      ]
    ]
  }
}
```

### 2. babel.config.js
Updated to use `babel-preset-expo` for optimal Hermes compatibility:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add any additional plugins here if needed
    ],
  };
};
```

## Dependencies Added
- `expo-build-properties`: Required plugin for configuring build properties including Hermes
- `babel-preset-expo`: Optimized Babel preset for Expo projects with Hermes support

## Benefits of Hermes

### Performance Improvements
- **Faster App Startup**: Hermes pre-compiles JavaScript to bytecode
- **Reduced Memory Usage**: More efficient memory management
- **Smaller App Size**: Better compression and optimization
- **Improved Performance**: Optimized for mobile devices

### Platform Support
- ✅ **Android**: Fully supported and enabled
- ✅ **iOS**: Fully supported and enabled
- ⚠️ **Web**: Uses default JavaScript engine (V8/SpiderMonkey)

## Verification Steps

### 1. Check Build Logs
When building your app, look for Hermes-related messages:
```
✓ Hermes enabled for Android
✓ Hermes enabled for iOS
```

### 2. Runtime Verification
Add this code to check if Hermes is running:

```javascript
// Add to your App.js or any component
console.log('JavaScript engine:', global.HermesInternal ? 'Hermes' : 'JSC/V8');

// Or use this more detailed check
if (global.HermesInternal) {
  console.log('✅ Hermes is enabled');
  console.log('Hermes version:', global.HermesInternal.getRuntimeProperties?.()?.['OSS Release Version'] || 'Unknown');
} else {
  console.log('❌ Hermes is not enabled');
}
```

### 3. Performance Testing
Compare app startup times and memory usage before and after Hermes:
- Use React Native performance monitoring tools
- Check app bundle size
- Monitor memory usage in development tools

## Building with Hermes

### Development
```bash
# Start development server
npm start

# Run on Android with Hermes
npm run android

# Run on iOS with Hermes
npm run ios
```

### Production Builds
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure `expo-build-properties` is properly installed
   - Check that `babel-preset-expo` is in dependencies
   - Clear cache: `npx expo start --clear`

2. **JavaScript Errors**
   - Some JavaScript features may behave differently in Hermes
   - Check for unsupported JavaScript features
   - Use Hermes-compatible polyfills if needed

3. **Performance Issues**
   - Profile your app to identify bottlenecks
   - Optimize heavy JavaScript operations
   - Use React Native performance best practices

### Debug Commands
```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro bundler cache
npx react-native start --reset-cache

# Check Expo configuration
npx expo config
```

## Additional Resources

- [Hermes Documentation](https://hermesengine.dev/)
- [Expo Hermes Guide](https://docs.expo.dev/guides/using-hermes/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Build Properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)

## Notes

- Hermes is now the default JavaScript engine for new React Native projects
- Web builds will continue to use the browser's JavaScript engine
- Some third-party libraries may need updates for Hermes compatibility
- Always test thoroughly on both platforms after enabling Hermes

---

**Configuration completed successfully!** 🚀
Your Sha_Pay! app is now configured to use Hermes on both Android and iOS platforms.