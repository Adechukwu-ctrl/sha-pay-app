import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import creditRatingService from '../../services/creditRatingService';
import httpClient from '../../services/httpClient';

// Async thunks
export const calculateUserRating = createAsyncThunk(
  'creditRating/calculateUserRating',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const rating = creditRatingService.calculateCreditRating(userData);
      
      // Save rating to backend
      await httpClient.post(`/users/${userId}/rating`, rating);
      
      return { userId, rating };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserRating = createAsyncThunk(
  'creditRating/fetchUserRating',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await httpClient.get(`/users/${userId}/rating`);
      return { userId, rating: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRatingHistory = createAsyncThunk(
  'creditRating/fetchRatingHistory',
  async ({ userId, period = '6months' }, { rejectWithValue }) => {
    try {
      const response = await httpClient.get(`/users/${userId}/rating/history`, {
        params: { period },
      });
      return { userId, history: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateRatingFeedback = createAsyncThunk(
  'creditRating/updateRatingFeedback',
  async ({ userId, transactionId, rating, feedback }, { rejectWithValue }) => {
    try {
      const response = await httpClient.post(`/transactions/${transactionId}/rating`, {
        rating,
        feedback,
      });
      
      // Recalculate user rating after feedback
      const userDataResponse = await httpClient.get(`/users/${userId}/rating-data`);
      const newRating = creditRatingService.calculateCreditRating(userDataResponse.data);
      
      await httpClient.post(`/users/${userId}/rating`, newRating);
      
      return { userId, rating: newRating, feedback: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRatingRecommendations = createAsyncThunk(
  'creditRating/fetchRatingRecommendations',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userRating = state.creditRating.ratings[userId];
      
      if (!userRating) {
        throw new Error('User rating not found');
      }
      
      const recommendations = creditRatingService.getRatingRecommendations(userRating);
      return { userId, recommendations };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkUpdateRatings = createAsyncThunk(
  'creditRating/bulkUpdateRatings',
  async (userIds, { rejectWithValue }) => {
    try {
      const updates = [];
      
      for (const userId of userIds) {
        try {
          const userDataResponse = await httpClient.get(`/users/${userId}/rating-data`);
          const rating = creditRatingService.calculateCreditRating(userDataResponse.data);
          
          await httpClient.post(`/users/${userId}/rating`, rating);
          updates.push({ userId, rating });
        } catch (error) {
          console.error(`Error updating rating for user ${userId}:`, error);
        }
      }
      
      return updates;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  ratings: {}, // { userId: ratingObject }
  ratingHistory: {}, // { userId: [ratingHistory] }
  recommendations: {}, // { userId: [recommendations] }
  trends: {}, // { userId: trendObject }
  loading: false,
  error: null,
  lastUpdated: null,
};

const creditRatingSlice = createSlice({
  name: 'creditRating',
  initialState,
  reducers: {
    clearRatingError: (state) => {
      state.error = null;
    },
    
    updateLocalRating: (state, action) => {
      const { userId, rating } = action.payload;
      state.ratings[userId] = rating;
      state.lastUpdated = new Date().toISOString();
    },
    
    clearUserRating: (state, action) => {
      const userId = action.payload;
      delete state.ratings[userId];
      delete state.ratingHistory[userId];
      delete state.recommendations[userId];
      delete state.trends[userId];
    },
    
    setRatingTrend: (state, action) => {
      const { userId, trend } = action.payload;
      state.trends[userId] = trend;
    },
    
    markRecommendationCompleted: (state, action) => {
      const { userId, recommendationId } = action.payload;
      if (state.recommendations[userId]) {
        state.recommendations[userId] = state.recommendations[userId].map(rec =>
          rec.id === recommendationId
            ? { ...rec, completed: true, completedAt: new Date().toISOString() }
            : rec
        );
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Calculate User Rating
      .addCase(calculateUserRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateUserRating.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, rating } = action.payload;
        state.ratings[userId] = rating;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(calculateUserRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch User Rating
      .addCase(fetchUserRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRating.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, rating } = action.payload;
        state.ratings[userId] = rating;
      })
      .addCase(fetchUserRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Rating History
      .addCase(fetchRatingHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRatingHistory.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, history } = action.payload;
        state.ratingHistory[userId] = history;
        
        // Calculate trend
        const trend = creditRatingService.calculateRatingTrend(history);
        state.trends[userId] = trend;
      })
      .addCase(fetchRatingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Rating Feedback
      .addCase(updateRatingFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRatingFeedback.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, rating } = action.payload;
        state.ratings[userId] = rating;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateRatingFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Rating Recommendations
      .addCase(fetchRatingRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRatingRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, recommendations } = action.payload;
        state.recommendations[userId] = recommendations.map((rec, index) => ({
          ...rec,
          id: `${userId}_${index}`,
          completed: false,
        }));
      })
      .addCase(fetchRatingRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Bulk Update Ratings
      .addCase(bulkUpdateRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateRatings.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach(({ userId, rating }) => {
          state.ratings[userId] = rating;
        });
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(bulkUpdateRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearRatingError,
  updateLocalRating,
  clearUserRating,
  setRatingTrend,
  markRecommendationCompleted,
} = creditRatingSlice.actions;

// Selectors
export const selectUserRating = (state, userId) => state.creditRating.ratings[userId];
export const selectUserRatingHistory = (state, userId) => state.creditRating.ratingHistory[userId];
export const selectUserRecommendations = (state, userId) => state.creditRating.recommendations[userId];
export const selectUserTrend = (state, userId) => state.creditRating.trends[userId];
export const selectRatingLoading = (state) => state.creditRating.loading;
export const selectRatingError = (state) => state.creditRating.error;
export const selectLastUpdated = (state) => state.creditRating.lastUpdated;

// Complex selectors
export const selectRatingStats = (state) => {
  const ratings = Object.values(state.creditRating.ratings);
  
  if (ratings.length === 0) {
    return {
      totalUsers: 0,
      averageRating: 0,
      distribution: {},
    };
  }
  
  const totalUsers = ratings.length;
  const averageRating = ratings.reduce((sum, rating) => sum + rating.score, 0) / totalUsers;
  
  const distribution = ratings.reduce((acc, rating) => {
    const tier = rating.tier;
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalUsers,
    averageRating: Math.round(averageRating * 10) / 10,
    distribution,
  };
};

export const selectTopRatedUsers = (state, limit = 10) => {
  const ratingsEntries = Object.entries(state.creditRating.ratings);
  
  return ratingsEntries
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, limit)
    .map(([userId, rating]) => ({ userId, rating }));
};

export const selectUsersNeedingRatingUpdate = (state) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return Object.entries(state.creditRating.ratings)
    .filter(([, rating]) => new Date(rating.lastUpdated) < oneWeekAgo)
    .map(([userId]) => userId);
};

export default creditRatingSlice.reducer;