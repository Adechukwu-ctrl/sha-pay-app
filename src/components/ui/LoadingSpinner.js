import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors, spacing } from '../../theme';

const LoadingSpinner = ({ 
  size = 'large', 
  color = colors.primary, 
  message = 'Loading...', 
  showMessage = true,
  style,
  overlay = false 
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    style
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={size} 
        color={color} 
        style={styles.spinner}
      />
      {showMessage && (
        <Text style={[styles.message, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  spinner: {
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingSpinner;