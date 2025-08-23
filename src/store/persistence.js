// Note: AsyncStorage and redux-persist are not installed
// This file provides the structure for future persistence implementation
// To enable persistence, install: @react-native-async-storage/async-storage redux-persist

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobsSlice';
import chatReducer from './slices/chatSlice';
import userReducer from './slices/userSlice';
import paymentReducer from './slices/paymentSlice';

/**
 * Redux Persist Configuration
 * Handles state persistence across app sessions
 */

// Standard root reducer without persistence
export const rootReducer = combineReducers({
  auth: authReducer,
  jobs: jobsReducer,
  chat: chatReducer,
  user: userReducer,
  payment: paymentReducer,
});

// For future persistence implementation:
/*
// Root persist config
const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Only persist auth and user data
  blacklist: ['jobs', 'chat', 'payment'], // Don't persist these (they should be fresh on app start)
};

// Auth persist config - persist most auth data but not loading states
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'isAuthenticated', 'userType', 'verificationStatus', 'creditRating'],
  blacklist: ['loading', 'error'], // Don't persist loading and error states
};

// User persist config - persist profile data
const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
  whitelist: ['profile', 'skills', 'ratings', 'currentCategory'],
  blacklist: ['loading', 'error'],
};

// Jobs persist config - only persist selected job for navigation
const jobsPersistConfig = {
  key: 'jobs',
  storage: AsyncStorage,
  whitelist: ['selectedJob'],
  blacklist: ['jobs', 'jobRequests', 'jobOffers', 'activeJobs', 'completedJobs', 'disputes', 'loading', 'error'],
};

// Payment persist config - persist payment methods and details
const paymentPersistConfig = {
  key: 'payment',
  storage: AsyncStorage,
  whitelist: ['paymentMethods', 'paymentDetails', 'serviceChargeRate'],
  blacklist: ['payments', 'currentPayment', 'loading', 'error', 'transactionHistory'],
};

// Chat persist config - don't persist chat data (should be fresh)
const chatPersistConfig = {
  key: 'chat',
  storage: AsyncStorage,
  whitelist: [],
  blacklist: ['conversations', 'currentConversation', 'messages', 'loading', 'error', 'unreadCount'],
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
const persistedJobsReducer = persistReducer(jobsPersistConfig, jobsReducer);
const persistedPaymentReducer = persistReducer(paymentPersistConfig, paymentReducer);
const persistedChatReducer = persistReducer(chatPersistConfig, chatReducer);

// Combine all reducers with persistence
const persistedRootReducer = combineReducers({
  auth: persistedAuthReducer,
  jobs: persistedJobsReducer,
  chat: persistedChatReducer,
  user: persistedUserReducer,
  payment: persistedPaymentReducer,
});

// Create the persisted root reducer
export const persistedReducer = persistReducer(rootPersistConfig, persistedRootReducer);
*/

/**
 * Utility functions for manual persistence operations
 * (Commented out until AsyncStorage is installed)
 */

/*
// Clear all persisted data (useful for logout)
export const clearPersistedData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'persist:root',
      'persist:auth',
      'persist:user',
      'persist:jobs',
      'persist:payment',
      'persist:chat',
    ]);
    console.log('✅ Persisted data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing persisted data:', error);
  }
};

// Clear specific slice data
export const clearSliceData = async (sliceName) => {
  try {
    await AsyncStorage.removeItem(`persist:${sliceName}`);
    console.log(`✅ ${sliceName} data cleared successfully`);
  } catch (error) {
    console.error(`❌ Error clearing ${sliceName} data:`, error);
  }
};

// Get persisted data for debugging
export const getPersistedData = async (sliceName = null) => {
  try {
    if (sliceName) {
      const data = await AsyncStorage.getItem(`persist:${sliceName}`);
      return data ? JSON.parse(data) : null;
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const persistKeys = keys.filter(key => key.startsWith('persist:'));
      const data = await AsyncStorage.multiGet(persistKeys);
      return data.reduce((acc, [key, value]) => {
        acc[key] = value ? JSON.parse(value) : null;
        return acc;
      }, {});
    }
  } catch (error) {
    console.error('❌ Error getting persisted data:', error);
    return null;
  }
};

// Migration function for handling schema changes
export const migratePersistedData = async (currentVersion = 1) => {
  try {
    const storedVersion = await AsyncStorage.getItem('persist:version');
    const version = storedVersion ? parseInt(storedVersion, 10) : 0;
    
    if (version < currentVersion) {
      console.log(`🔄 Migrating persisted data from v${version} to v${currentVersion}`);
      
      // Add migration logic here based on version differences
      switch (version) {
        case 0:
          // Migration from v0 to v1
          await clearPersistedData(); // Clear all data for major schema changes
          break;
        default:
          break;
      }
      
      await AsyncStorage.setItem('persist:version', currentVersion.toString());
      console.log('✅ Data migration completed');
    }
  } catch (error) {
    console.error('❌ Error during data migration:', error);
  }
};

// Development utilities

// Debug function to log all persisted data
export const debugPersistedData = async () => {
  if (__DEV__) {
    const data = await getPersistedData();
    console.log('🔍 Persisted Data Debug:', data);
  }
};

// Function to reset specific user data while keeping auth
export const resetUserData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'persist:user',
      'persist:jobs',
      'persist:payment',
      'persist:chat',
    ]);
    console.log('✅ User data reset successfully');
  } catch (error) {
    console.error('❌ Error resetting user data:', error);
  }
};
*/