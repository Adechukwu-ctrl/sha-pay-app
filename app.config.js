import 'dotenv/config';

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PREVIEW = process.env.NODE_ENV === 'preview';

const getEnvVars = () => {
  if (IS_DEV) {
    return {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
      wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL || 'ws://localhost:3000',
      environment: 'development',
      enableAnalytics: false,
      enableCrashReporting: false,
      debugMode: true,
    };
  } else if (IS_PREVIEW) {
    return {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging-api.shapay.ng/api',
      wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL || 'wss://staging-api.shapay.ng',
      environment: 'staging',
      enableAnalytics: true,
      enableCrashReporting: true,
      debugMode: false,
    };
  } else {
    return {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.shapay.ng/api',
      wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL || 'wss://api.shapay.ng',
      environment: 'production',
      enableAnalytics: true,
      enableCrashReporting: true,
      debugMode: false,
    };
  }
};

export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'Sha Pay',
    slug: 'sha-pay',
    version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/icon.svg',
    userInterfaceStyle: 'light',
    description: process.env.EXPO_PUBLIC_APP_DESCRIPTION || 'Secure mobile payment app supporting Visa, Mastercard, and Verve transactions',
    keywords: ['payment', 'finance', 'mobile', 'secure', 'transactions'],
    privacy: 'public',
    splash: {
      image: './src/assets/splash.svg',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['src/assets/**/*'],
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 30000,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.shapay.app',
      jsEngine: 'hermes',
      buildNumber: '1',
      requireFullScreen: false,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/adaptive-icon.svg',
        backgroundColor: '#FFFFFF',
      },
      package: 'com.shapay.app',
      jsEngine: 'hermes',
      versionCode: 1,
      permissions: [
        'INTERNET',
        'VIBRATE',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
      ],
      allowBackup: false,
      networkSecurityConfig: 'network_security_config',
    },
    web: {
      bundler: 'metro',
      build: {
        babel: {
          include: ['@expo/vector-icons'],
        },
      },
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            enableHermes: true,
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
          ios: {
            enableHermes: true,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'ba8d2c34-e052-4ddd-9246-40c805c0ecae',
      },
      // Environment variables accessible via expo-constants
      ...getEnvVars(),
      // Feature flags
      enableBiometricAuth: process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH === 'true',
      enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
      enableSSLPinning: process.env.EXPO_PUBLIC_ENABLE_SSL_PINNING === 'true',
      enableRootDetection: process.env.EXPO_PUBLIC_ENABLE_ROOT_DETECTION === 'true',
      // Payment configuration
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      paystackPublicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY,
    },
  },
};