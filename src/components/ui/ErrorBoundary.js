/**
 * Error Boundary Component
 * Handles network errors and provides fallback UI with user-friendly messages
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ERROR_MESSAGES } from '../../config/api';
import httpClient from '../../services/httpClient';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isNetworkError: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      isNetworkError: error.message && (
        error.message.includes('unreachable') ||
        error.message.includes('timeout') ||
        error.message.includes('Network error') ||
        error.message.includes('Failed to fetch')
      ),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = async () => {
    try {
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isNetworkError: false,
      });

      // Try to reset HTTP client to primary URL
      if (httpClient.resetToPrimaryUrl) {
        httpClient.resetToPrimaryUrl();
      }

      // Force re-render
      this.forceUpdate();
    } catch (error) {
      console.error('Error during retry:', error);
      Alert.alert(
        'Retry Failed',
        'Unable to retry at this moment. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  };

  handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Here you could implement issue reporting
            Alert.alert(
              'Thank You',
              'Your issue has been reported. Our team will investigate.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      const { isNetworkError, error } = this.state;
      
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            
            <Text style={styles.errorTitle}>
              {isNetworkError ? 'Connection Problem' : 'Something Went Wrong'}
            </Text>
            
            <Text style={styles.errorMessage}>
              {isNetworkError 
                ? ERROR_MESSAGES.BACKEND_UNREACHABLE
                : error?.message || ERROR_MESSAGES.UNKNOWN_ERROR
              }
            </Text>
            
            {isNetworkError && (
              <Text style={styles.helpText}>
                • Check your internet connection{"\n"}
                • Our servers may be temporarily unavailable{"\n"}
                • Try again in a few moments
              </Text>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.reportButton]} 
                onPress={this.handleReportIssue}
              >
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 350,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  helpText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'left',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
  },
  reportButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;