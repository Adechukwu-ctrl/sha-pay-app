/**
 * API Configuration
 * Contains all API endpoints and configuration settings
 */

import { Platform } from 'react-native';

// Environment detection
const ENV = __DEV__ ? 'development' : 'production';

// Get environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  // In Expo, environment variables are prefixed with EXPO_PUBLIC_
  const value = process.env[`EXPO_PUBLIC_${key}`] || process.env[key];
  return value || fallback;
};

const getDevelopmentURL = () => {
  if (Platform.OS === 'web') {
    // For web browser, use localhost
    return getEnvVar('API_BASE_URL', 'http://localhost:3000/api');
  } else {
    // For mobile emulator/device, use network IP
    return getEnvVar('API_BASE_URL', 'http://192.168.100.90:3000/api');
  }
};

const getDevelopmentWSURL = () => {
  if (Platform.OS === 'web') {
    // For web browser, use localhost
    return getEnvVar('WS_BASE_URL', 'ws://localhost:3000');
  } else {
    // For mobile emulator/device, use network IP
    return getEnvVar('WS_BASE_URL', 'ws://192.168.100.90:3000');
  }
};

// Base URLs for different environments
const API_URLS = {
  development: getDevelopmentURL(),
  staging: getEnvVar('STAGING_API_BASE_URL', 'https://staging-api.shapay.ng/api'),
  production: getEnvVar('API_BASE_URL', 'https://sha-pay-backend.onrender.com/api'),
};

// WebSocket URLs
const WS_URLS = {
  development: getDevelopmentWSURL(),
  staging: getEnvVar('STAGING_WS_BASE_URL', 'wss://staging-api.shapay.ng'),
  production: getEnvVar('WS_BASE_URL', 'wss://sha-pay-backend.onrender.com'),
};

// Export base URLs
export const API_BASE_URL = API_URLS[ENV];
export const WS_BASE_URL = WS_URLS[ENV];

// Export environment configuration
export const APP_CONFIG = {
  environment: getEnvVar('ENVIRONMENT', ENV),
  appName: getEnvVar('APP_NAME', 'Sha Pay'),
  appVersion: getEnvVar('APP_VERSION', '1.0.0'),
  debugMode: getEnvVar('DEBUG_MODE', __DEV__ ? 'true' : 'false') === 'true',
  logLevel: getEnvVar('LOG_LEVEL', __DEV__ ? 'debug' : 'error'),
};

// Export feature flags
export const FEATURE_FLAGS = {
  enableBiometricAuth: getEnvVar('ENABLE_BIOMETRIC_AUTH', 'true') === 'true',
  enablePushNotifications: getEnvVar('ENABLE_PUSH_NOTIFICATIONS', 'true') === 'true',
  enableAnalytics: getEnvVar('ENABLE_ANALYTICS', __DEV__ ? 'false' : 'true') === 'true',
  enableCrashReporting: getEnvVar('ENABLE_CRASH_REPORTING', __DEV__ ? 'false' : 'true') === 'true',
  enableSSLPinning: getEnvVar('ENABLE_SSL_PINNING', __DEV__ ? 'false' : 'true') === 'true',
  enableRootDetection: getEnvVar('ENABLE_ROOT_DETECTION', __DEV__ ? 'false' : 'true') === 'true',
};

// Export payment configuration
export const PAYMENT_CONFIG = {
  stripePublishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),
  paystackPublicKey: getEnvVar('PAYSTACK_PUBLIC_KEY', ''),
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_PHONE: '/auth/verify-phone',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User Management
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/avatar',
    DELETE_ACCOUNT: '/user/delete',
    CHANGE_PASSWORD: '/user/change-password',
    PREFERENCES: '/user/preferences',
  },

  // Verification
  VERIFICATION: {
    NIMC: '/verification/nimc',
    BVN: '/verification/bvn',
    CBN: '/verification/cbn',
    PHONE_SEND_OTP: '/verification/phone/send-otp',
    PHONE_VERIFY_OTP: '/verification/phone/verify-otp',
    EMAIL_SEND: '/verification/email/send-verification',
    EMAIL_CONFIRM: '/verification/email/confirm',
    DOCUMENT: '/verification/document',
    STATUS: '/verification/status',
    REQUIREMENTS: '/verification/requirements',
  },

  // Jobs
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    DETAILS: '/jobs/:id',
    UPDATE: '/jobs/:id',
    DELETE: '/jobs/:id',
    APPLY: '/jobs/:id/apply',
    ACCEPT: '/jobs/:id/accept',
    COMPLETE: '/jobs/:id/complete',
    CANCEL: '/jobs/:id/cancel',
    RATE: '/jobs/:id/rate',
    DISPUTE: '/jobs/:id/dispute',
    MY_JOBS: '/jobs/my-jobs',
    APPLICATIONS: '/jobs/:id/applications',
    SEARCH: '/jobs/search',
    CATEGORIES: '/jobs/categories',
    SKILLS: '/jobs/skills',
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/conversations/:id/messages',
    SEND_MESSAGE: '/chat/conversations/:id/messages',
    MARK_READ: '/chat/conversations/:id/read',
    UPLOAD_MEDIA: '/chat/upload',
    DELETE_MESSAGE: '/chat/messages/:id',
  },

  // Payments
  PAYMENTS: {
    HISTORY: '/payments/history',
    DETAILS: '/payments/:id',
    INITIATE: '/payments/initiate',
    VERIFY: '/payments/verify',
    WITHDRAW: '/payments/withdraw',
    BALANCE: '/payments/balance',
    METHODS: '/payments/methods',
    ADD_METHOD: '/payments/methods',
    REMOVE_METHOD: '/payments/methods/:id',
    RECEIPTS: '/payments/:id/receipt',
  },

  // Credit Rating
  CREDIT_RATING: {
    GET_RATING: '/credit-rating/:userId',
    CALCULATE: '/credit-rating/calculate',
    HISTORY: '/credit-rating/:userId/history',
    RECOMMENDATIONS: '/credit-rating/:userId/recommendations',
    UPDATE: '/credit-rating/:userId/update',
    BULK_UPDATE: '/credit-rating/bulk-update',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications/:id',
    CLEAR_ALL: '/notifications/clear',
    PREFERENCES: '/notifications/preferences',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe',
  },

  // Support
  SUPPORT: {
    TICKETS: '/support/tickets',
    CREATE_TICKET: '/support/tickets',
    TICKET_DETAILS: '/support/tickets/:id',
    UPDATE_TICKET: '/support/tickets/:id',
    FAQS: '/support/faqs',
    CONTACT: '/support/contact',
  },

  // Admin (if needed)
  ADMIN: {
    USERS: '/admin/users',
    JOBS: '/admin/jobs',
    PAYMENTS: '/admin/payments',
    DISPUTES: '/admin/disputes',
    ANALYTICS: '/admin/analytics',
  },
};

// Request timeout settings
export const REQUEST_TIMEOUT = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 120000, // 2 minutes for file uploads
  DOWNLOAD: 60000, // 1 minute for downloads
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  JOB_CREATED: 'Job created successfully!',
  JOB_APPLIED: 'Job application submitted!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  VERIFICATION_SUCCESS: 'Verification completed successfully!',
};

// Additional App Configuration (merged with main APP_CONFIG above)
// Support contact information
export const SUPPORT_CONFIG = {
  EMAIL: 'support@shapay.ng',
  PHONE: '+234-800-SHAPAY',
  WEBSITE: 'https://shapay.ng',
  PRIVACY_POLICY: 'https://shapay.ng/privacy',
  TERMS_OF_SERVICE: 'https://shapay.ng/terms',
};

// Additional Feature Flags (merged with main FEATURE_FLAGS above)
export const ADDITIONAL_FEATURES = {
  ENABLE_LOCATION_SERVICES: true,
  ENABLE_CHAT_MEDIA: true,
  ENABLE_CREDIT_RATING: true,
  ENABLE_DISPUTE_SYSTEM: true,
};

// Cache Configuration
export const CACHE_CONFIG = {
  USER_PROFILE: 'user_profile',
  JOBS_LIST: 'jobs_list',
  CHAT_MESSAGES: 'chat_messages',
  NOTIFICATIONS: 'notifications',
  CREDIT_RATING: 'credit_rating',
  TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  JOBS_PAGE_SIZE: 10,
  MESSAGES_PAGE_SIZE: 50,
  NOTIFICATIONS_PAGE_SIZE: 25,
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  MAX_IMAGES_PER_JOB: 5,
  AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2MB
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_PROFILE: 'user_profile',
  DEVICE_TOKEN: 'device_token',
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PHONE_PATTERN: /^\+?[1-9]\d{1,14}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NIN_PATTERN: /^\d{11}$/,
  BVN_PATTERN: /^\d{11}$/,
};

// Default Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-App-Version': APP_CONFIG.VERSION,
  'X-Platform': 'mobile',
};

// Helper function to build URL with parameters
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint, params = {}) => {
  return API_BASE_URL + buildUrl(endpoint, params);
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  HTTP_STATUS,
  API_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  APP_CONFIG,
  FEATURE_FLAGS,
  CACHE_CONFIG,
  PAGINATION,
  UPLOAD_CONFIG,
  STORAGE_KEYS,
  VALIDATION,
  DEFAULT_HEADERS,
  buildUrl,
  getApiUrl,
};