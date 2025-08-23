const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    // Disable the problematic Metro plugin that's causing issues
    mode: env.mode || 'development',
  }, argv);

  // Override problematic configurations
  if (config.resolve) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": false,
      "stream": false,
      "assert": false,
      "http": false,
      "https": false,
      "os": false,
      "url": false,
      "zlib": false,
      "path": false,
      "fs": false,
    };
  }

  // Remove problematic plugins that might be causing Metro issues
  if (config.plugins) {
    config.plugins = config.plugins.filter(plugin => {
      // Filter out any Metro-related plugins that might be causing issues
      return !plugin.constructor.name.includes('Metro');
    });
  }

  return config;
};