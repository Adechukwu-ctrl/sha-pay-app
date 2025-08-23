import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { store } from './store';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { paperTheme } from './theme';
import { Platform } from 'react-native';

// Configure icon provider for web
if (Platform.OS === 'web') {
  // Import MaterialCommunityIcons for web
  const MaterialCommunityIcons = require('@expo/vector-icons/MaterialCommunityIcons').default;
  
  // Configure react-native-paper to use Expo vector icons on web
  paperTheme.fonts = {
    ...paperTheme.fonts,
    // Override icon font configuration for web
  };
}

export default function App() {
  useEffect(() => {
    // Verify Hermes JavaScript Engine is running
    if (global.HermesInternal) {
      console.log('✅ Hermes JavaScript Engine is enabled');
      const hermesVersion = global.HermesInternal.getRuntimeProperties?.()?.['OSS Release Version'];
      if (hermesVersion) {
        console.log(`📱 Hermes version: ${hermesVersion}`);
      }
    } else {
      console.log('❌ Hermes is not enabled - using default JavaScript engine');
    }
  }, []);

  return (
    <StoreProvider store={store}>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </StoreProvider>
  );
}