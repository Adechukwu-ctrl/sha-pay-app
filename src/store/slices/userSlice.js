import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/userService';

// Async thunks for user management
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      return await userService.fetchUserProfile(userId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      return await userService.updateUserProfile(profileData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const switchUserCategory = createAsyncThunk(
  'user/switchCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      return await userService.switchUserCategory(categoryData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to switch user category');
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
  skills: [],
  ratings: [],
  currentCategory: null, // 'provider' or 'requirer'
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setTemporaryCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.skills = action.payload.skills || [];
        state.ratings = action.payload.ratings || [];
        state.currentCategory = action.payload.currentCategory;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.skills = action.payload.skills || state.skills;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Switch User Category
      .addCase(switchUserCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(switchUserCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload.category;
      })
      .addCase(switchUserCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError, setTemporaryCategory } = userSlice.actions;
export default userSlice.reducer;