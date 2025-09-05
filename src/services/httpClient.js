/**
 * HTTP Client Service
 * Handles all API requests with authentication, error handling, and interceptors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  HTTP_STATUS,
  ERROR_MESSAGES,
  DEFAULT_HEADERS,
  FALLBACK_URLS,
  RETRY_CONFIG,
  getNextFallbackUrl,
  checkApiHealth,
} from '../config/api';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

class HttpClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.fallbackUrls = FALLBACK_URLS;
    this.currentUrlIndex = 0;
    this.timeout = REQUEST_TIMEOUT.DEFAULT;
    this.defaultHeaders = DEFAULT_HEADERS;
    this.interceptors = {
      request: [],
      response: [],
    };
    this.isOfflineMode = false;
  }

  // Switch to next fallback URL
  switchToFallbackUrl() {
    if (this.currentUrlIndex < this.fallbackUrls.length - 1) {
      this.currentUrlIndex++;
      this.baseURL = this.fallbackUrls[this.currentUrlIndex];
      console.log(`🔄 Switched to fallback URL: ${this.baseURL}`);
      return true;
    }
    return false;
  }

  // Reset to primary URL
  resetToPrimaryUrl() {
    this.currentUrlIndex = 0;
    this.baseURL = this.fallbackUrls[0];
    this.isOfflineMode = false;
    console.log(`🔄 Reset to primary URL: ${this.baseURL}`);
  }

  // Check if current URL is healthy
  async checkCurrentUrlHealth() {
    return await checkApiHealth(this.baseURL);
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Get stored token
  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Set token
  async setToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  // Remove token
  async removeToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Build headers
  async buildHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = await this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Apply request interceptors
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    
    return modifiedConfig;
  }

  // Apply response interceptors
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse);
      } catch (error) {
        console.error('Response interceptor error:', error);
      }
    }
    
    return modifiedResponse;
  }

  // Handle response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new HttpError(response.status, data.message || ERROR_MESSAGES.UNKNOWN_ERROR, data);
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
      ok: response.ok,
    };
  }

  // Handle errors
  handleError(error) {
    if (error instanceof HttpError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new HttpError(0, ERROR_MESSAGES.TIMEOUT);
    }

    if (!navigator.onLine) {
      return new HttpError(0, ERROR_MESSAGES.NETWORK_ERROR);
    }

    // Check for network connectivity issues
    if (error.message && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('ERR_INTERNET_DISCONNECTED')
    )) {
      return new HttpError(0, ERROR_MESSAGES.BACKEND_UNREACHABLE);
    }

    return new HttpError(0, ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  // Retry request with exponential backoff
  async retryRequest(url, options, attempt = 1) {
    const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
    
    console.log(`⏳ Retrying request (attempt ${attempt}/${RETRY_CONFIG.MAX_RETRIES}) after ${delay}ms delay`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.makeRequest(url, options, attempt);
  }

  // Make request with fallback support
  async makeRequest(url, options, retryAttempt = 0) {
    const {
      method = 'GET',
      headers: customHeaders = {},
      body,
      timeout = this.timeout,
      skipAuth = false,
      retryOnAuthFailure = true,
      ...otherOptions
    } = options;

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Build headers
    const headers = skipAuth 
      ? { ...this.defaultHeaders, ...customHeaders }
      : await this.buildHeaders(customHeaders);

    // Create request config
    let config = {
      method,
      headers,
      body,
      ...otherOptions,
    };

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`🌐 Making ${method} request to: ${fullUrl}`);
      
      // Make request
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === HTTP_STATUS.UNAUTHORIZED && retryOnAuthFailure && !skipAuth) {
        try {
          await this.refreshToken();
          // Retry request with new token
          return this.makeRequest(url, { ...options, retryOnAuthFailure: false }, retryAttempt);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await this.removeToken();
          throw new HttpError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }
      }

      // Handle response
      let result = await this.handleResponse(response);
      
      // Apply response interceptors
      result = await this.applyResponseInterceptors(result);
      
      // Reset to primary URL on successful request
      if (this.currentUrlIndex > 0) {
        console.log('✅ Request successful, resetting to primary URL');
        this.resetToPrimaryUrl();
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const handledError = this.handleError(error);
      
      // Check if we should retry with fallback URL
      const shouldRetryWithFallback = (
        (handledError.message.includes('timeout') || 
         handledError.message.includes('Network') ||
         handledError.message.includes('unreachable')) &&
        this.switchToFallbackUrl()
      );
      
      // Check if we should retry with same URL
      const shouldRetryWithSameUrl = (
        retryAttempt < RETRY_CONFIG.MAX_RETRIES &&
        (RETRY_CONFIG.RETRY_ON_NETWORK_ERROR || RETRY_CONFIG.RETRY_ON_TIMEOUT)
      );
      
      if (shouldRetryWithFallback) {
        console.log(`🔄 Retrying with fallback URL: ${this.baseURL}`);
        return this.makeRequest(url, options, 0); // Reset retry attempt for new URL
      } else if (shouldRetryWithSameUrl) {
        return this.retryRequest(url, options, retryAttempt + 1);
      }
      
      // All retries exhausted
      if (retryAttempt >= RETRY_CONFIG.MAX_RETRIES) {
        console.error(`❌ All retry attempts exhausted for ${fullUrl}`);
        this.isOfflineMode = true;
      }
      
      throw handledError;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      await this.setToken(accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      
      return accessToken;
    } catch (error) {
      await this.removeToken();
      throw error;
    }
  }

  // Main request method
  async request(url, options = {}) {
    const {
      method = 'GET',
      headers: customHeaders = {},
      body,
      timeout = this.timeout,
      skipAuth = false,
      retryOnAuthFailure = true,
      ...otherOptions
    } = options;

    // Build full URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // Build headers
    const headers = skipAuth 
      ? { ...this.defaultHeaders, ...customHeaders }
      : await this.buildHeaders(customHeaders);

    // Create request config
    let config = {
      method,
      headers,
      body,
      ...otherOptions,
    };

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Make request
      const response = await fetch(fullUrl, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === HTTP_STATUS.UNAUTHORIZED && retryOnAuthFailure && !skipAuth) {
        try {
          await this.refreshToken();
          // Retry request with new token
          return this.request(url, { ...options, retryOnAuthFailure: false });
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await this.removeToken();
          throw new HttpError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }
      }

      // Handle response
      let result = await this.handleResponse(response);
      
      // Apply response interceptors
      result = await this.applyResponseInterceptors(result);
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // Upload file
  async upload(url, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional fields if provided
    if (options.fields) {
      Object.keys(options.fields).forEach(key => {
        formData.append(key, options.fields[key]);
      });
    }

    return this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
        ...options.headers,
      },
      timeout: REQUEST_TIMEOUT.UPLOAD,
    });
  }

  // Download file
  async download(url, options = {}) {
    const response = await this.request(url, {
      ...options,
      timeout: REQUEST_TIMEOUT.DOWNLOAD,
    });

    return response;
  }
}

// Custom HTTP Error class
class HttpError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isUnauthorized() {
    return this.status === HTTP_STATUS.UNAUTHORIZED;
  }

  get isForbidden() {
    return this.status === HTTP_STATUS.FORBIDDEN;
  }

  get isNotFound() {
    return this.status === HTTP_STATUS.NOT_FOUND;
  }

  get isValidationError() {
    return this.status === HTTP_STATUS.UNPROCESSABLE_ENTITY;
  }
}

// Create and configure HTTP client instance
const httpClient = new HttpClient();

// Add default request interceptor for logging
httpClient.addRequestInterceptor(async (config) => {
  if (__DEV__) {
    console.log('🚀 Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });
  }
  return config;
});

// Add default response interceptor for logging
httpClient.addResponseInterceptor(async (response) => {
  if (__DEV__) {
    console.log('📥 Response:', {
      status: response.status,
      data: response.data,
    });
  }
  return response;
});

// Export HTTP client and error class
export { HttpError, STORAGE_KEYS };
export default httpClient;