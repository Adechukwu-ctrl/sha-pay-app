import { isRejectedWithValue } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

/**
 * Error handling middleware for Redux actions
 * Catches rejected actions and provides centralized error handling
 */
export const errorHandlingMiddleware = (api) => (next) => (action) => {
  // Check if action is a rejected action with value
  if (isRejectedWithValue(action)) {
    const errorMessage = action.payload || 'An unexpected error occurred';
    
    // Log error for debugging
    console.error('Redux Action Error:', {
      type: action.type,
      error: errorMessage,
      meta: action.meta,
    });

    // Handle specific error types
    if (action.type.includes('auth/')) {
      handleAuthError(errorMessage, action.type);
    } else if (action.type.includes('payment/')) {
      handlePaymentError(errorMessage, action.type);
    } else if (action.type.includes('jobs/')) {
      handleJobError(errorMessage, action.type);
    } else if (action.type.includes('chat/')) {
      handleChatError(errorMessage, action.type);
    } else {
      handleGenericError(errorMessage);
    }
  }

  return next(action);
};

/**
 * Handle authentication-related errors
 */
const handleAuthError = (error, actionType) => {
  if (actionType.includes('login')) {
    // Don't show alert for login errors - let the component handle it
    return;
  }
  
  if (actionType.includes('register')) {
    // Don't show alert for registration errors - let the component handle it
    return;
  }
  
  if (actionType.includes('verify')) {
    Alert.alert(
      'Verification Error',
      error,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Handle payment-related errors
 */
const handlePaymentError = (error, actionType) => {
  if (actionType.includes('process')) {
    Alert.alert(
      'Payment Error',
      `Payment processing failed: ${error}`,
      [{ text: 'OK' }]
    );
  } else if (actionType.includes('release')) {
    Alert.alert(
      'Payment Release Error',
      `Failed to release payment: ${error}`,
      [{ text: 'OK' }]
    );
  } else {
    Alert.alert(
      'Payment Error',
      error,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Handle job-related errors
 */
const handleJobError = (error, actionType) => {
  if (actionType.includes('create')) {
    Alert.alert(
      'Job Creation Error',
      `Failed to create job: ${error}`,
      [{ text: 'OK' }]
    );
  } else if (actionType.includes('accept')) {
    Alert.alert(
      'Job Acceptance Error',
      `Failed to accept job: ${error}`,
      [{ text: 'OK' }]
    );
  } else if (actionType.includes('complete')) {
    Alert.alert(
      'Job Completion Error',
      `Failed to complete job: ${error}`,
      [{ text: 'OK' }]
    );
  } else {
    Alert.alert(
      'Job Error',
      error,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Handle chat-related errors
 */
const handleChatError = (error, actionType) => {
  if (actionType.includes('send')) {
    // Don't show alert for message send errors - let the component handle it
    return;
  }
  
  Alert.alert(
    'Chat Error',
    error,
    [{ text: 'OK' }]
  );
};

/**
 * Handle generic errors
 */
const handleGenericError = (error) => {
  Alert.alert(
    'Error',
    error,
    [{ text: 'OK' }]
  );
};

/**
 * Network error handler
 */
export const handleNetworkError = (error) => {
  if (!error.response) {
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  } else if (error.response.status === 401) {
    Alert.alert(
      'Authentication Error',
      'Your session has expired. Please log in again.',
      [{ text: 'OK' }]
    );
  } else if (error.response.status >= 500) {
    Alert.alert(
      'Server Error',
      'Our servers are experiencing issues. Please try again later.',
      [{ text: 'OK' }]
    );
  }
};