import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async thunk for clearing all app data
export const clearAllData = createAsyncThunk(
  'app/clearAllData',
  async (_, { rejectWithValue }) => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear any other app-specific data
      // You can add more cleanup logic here
      
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  theme: 'light', // 'light' or 'dark'
  language: 'en', // 'en', 'es', 'fr', etc.
  isFirstLaunch: true,
  appVersion: '1.0.0',
  loading: false,
  error: null,
  settings: {
    notifications: true,
    biometricAuth: false,
    autoBackup: true,
    dataUsage: 'wifi', // 'wifi', 'cellular', 'both'
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setFirstLaunch: (state, action) => {
      state.isFirstLaunch = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetAppState: (state) => {
      return { ...initialState, isFirstLaunch: false };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearAllData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearAllData.fulfilled, (state) => {
        state.loading = false;
        // Reset to initial state but keep some settings
        return {
          ...initialState,
          isFirstLaunch: false,
          theme: state.theme,
          language: state.language,
        };
      })
      .addCase(clearAllData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setTheme,
  setLanguage,
  setFirstLaunch,
  updateSettings,
  resetAppState,
  clearError,
} = appSlice.actions;

// Selectors
export const selectTheme = (state) => state.app.theme;
export const selectLanguage = (state) => state.app.language;
export const selectAppSettings = (state) => state.app.settings;
export const selectIsFirstLaunch = (state) => state.app.isFirstLaunch;

export default appSlice.reducer;