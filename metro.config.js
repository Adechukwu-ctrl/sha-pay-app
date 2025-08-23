const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Hermes for better performance
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Optimize bundle splitting
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Asset optimization
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  // Adds support for `.ttf` files for vector icons
  'ttf',
  // Add support for additional asset types
  'bin',
  'txt',
  'jpg',
  'png',
  'json',
  'svg'
);

// Platform-specific optimizations
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Configure resolver for react-native-vector-icons
config.resolver.alias = {
  ...config.resolver.alias,
  // Map react-native-vector-icons to @expo/vector-icons for web compatibility
  'react-native-vector-icons/MaterialCommunityIcons': '@expo/vector-icons/MaterialCommunityIcons',
  'react-native-vector-icons/Ionicons': '@expo/vector-icons/Ionicons',
  'react-native-vector-icons/MaterialIcons': '@expo/vector-icons/MaterialIcons',
  'react-native-vector-icons/FontAwesome': '@expo/vector-icons/FontAwesome',
  'react-native-vector-icons/AntDesign': '@expo/vector-icons/AntDesign',
};

// Enable tree shaking for smaller bundles
config.transformer.unstable_allowRequireContext = true;

// Configure for web builds
if (process.env.EXPO_PLATFORM === 'web') {
  config.transformer.minifierPath = 'metro-minify-terser';
}

// Optimize for production builds
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig.compress = {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
  };
}

module.exports = config;