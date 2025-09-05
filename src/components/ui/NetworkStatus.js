/**
 * Network Status Component
 * Displays network connectivity status and fallback mode indicators
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ERROR_MESSAGES } from '../../config/api';
import httpClient from '../../services/httpClient';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Check initial network status
    setIsOnline(navigator.onLine);
    setCurrentUrl(httpClient.baseURL);
    setIsOfflineMode(httpClient.isOfflineMode);

    // Listen for network changes
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
      // Try to reset to primary URL when back online
      if (httpClient.resetToPrimaryUrl) {
        httpClient.resetToPrimaryUrl();
        setCurrentUrl(httpClient.baseURL);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for HTTP client status
    const statusInterval = setInterval(() => {
      setIsOfflineMode(httpClient.isOfflineMode);
      setCurrentUrl(httpClient.baseURL);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    // Animate status bar when status changes
    if (!isOnline || isOfflineMode) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, isOfflineMode, fadeAnim]);

  // Don't render if everything is normal
  if (isOnline && !isOfflineMode) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        message: 'No Internet Connection',
        submessage: 'Please check your network settings',
        color: '#dc3545',
        icon: '📶',
      };
    }
    
    if (isOfflineMode) {
      const isUsingFallback = !currentUrl.includes('sha-pay-backend.onrender.com');
      return {
        message: isUsingFallback ? 'Using Backup Server' : 'Limited Connectivity',
        submessage: isUsingFallback 
          ? 'Connected to backup server'
          : ERROR_MESSAGES.FALLBACK_MODE,
        color: '#ffc107',
        icon: isUsingFallback ? '🔄' : '⚠️',
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: statusInfo.color, opacity: fadeAnim }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{statusInfo.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{statusInfo.message}</Text>
          <Text style={styles.submessage}>{statusInfo.submessage}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 40, // Account for status bar
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  message: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submessage: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default NetworkStatus;