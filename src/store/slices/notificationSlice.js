import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { httpClient } from '../../services/httpClient';

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data for development when backend is not available
      if (__DEV__) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          notifications: [
            {
              id: '1',
              type: 'job_application',
              title: 'New Job Application',
              message: 'You have received a new job application.',
              read: false,
              createdAt: new Date().toISOString(),
              data: { jobId: 'job_123' }
            },
            {
              id: '2',
              type: 'payment_received',
              title: 'Payment Received',
              message: 'You have received a payment of ₦5,000.',
              read: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              data: { amount: 5000 }
            }
          ],
          unreadCount: 1
        };
      }
      
      const response = await httpClient.get('/notifications');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      // Mock response for development
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id: notificationId, read: true };
      }
      
      const response = await httpClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      // Mock response for development
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }
      
      const response = await httpClient.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      // Mock response for development
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return notificationId;
      }
      
      await httpClient.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      // Mock response for development
      if (__DEV__) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
      
      await httpClient.delete('/notifications/clear-all');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear all notifications');
    }
  }
);

const initialState = {
  notifications: [],
  loading: false,
  refreshing: false,
  unreadCount: 0,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    updateNotificationSettings: (state, action) => {
      // Handle notification settings updates
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload?.notifications || [];
        state.unreadCount = action.payload?.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notifications';
        // Provide fallback empty data to prevent crashes
        state.notifications = [];
        state.unreadCount = 0;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload?.id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark notification as read';
      })
      
      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload || 'Failed to mark all notifications as read';
      })
      
      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete notification';
      })
      
      // Clear all notifications
      .addCase(clearAllNotifications.pending, (state) => {
        state.error = null;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload || 'Failed to clear all notifications';
      });
  },
});

export const { clearError, addNotification, updateNotificationSettings } = notificationSlice.actions;
export default notificationSlice.reducer;