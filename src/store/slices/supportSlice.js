import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import httpClient from '../../services/httpClient';

// Async thunks
export const submitSupportTicket = createAsyncThunk(
  'support/submitTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await httpClient.post('/support/tickets', ticketData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit support ticket');
    }
  }
);

export const fetchFAQs = createAsyncThunk(
  'support/fetchFAQs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await httpClient.get('/support/faqs');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch FAQs');
    }
  }
);

export const fetchSupportTickets = createAsyncThunk(
  'support/fetchTickets',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await httpClient.get(`/support/tickets/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch support tickets');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'support/updateTicketStatus',
  async ({ ticketId, status }, { rejectWithValue }) => {
    try {
      const response = await httpClient.patch(`/support/tickets/${ticketId}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ticket status');
    }
  }
);

const initialState = {
  faqs: [],
  supportTickets: [],
  currentTicket: null,
  loading: false,
  submitting: false,
  error: null,
  successMessage: null,
  categories: [
    { id: 1, name: 'Account Issues', icon: 'account-circle' },
    { id: 2, name: 'Payment Problems', icon: 'credit-card' },
    { id: 3, name: 'Technical Support', icon: 'cog' },
    { id: 4, name: 'Job Related', icon: 'briefcase' },
    { id: 5, name: 'Safety & Security', icon: 'shield-check' },
    { id: 6, name: 'Other', icon: 'help-circle' },
  ],
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    resetSupportState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit Support Ticket
      .addCase(submitSupportTicket.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitSupportTicket.fulfilled, (state, action) => {
        state.submitting = false;
        state.supportTickets.unshift(action.payload);
        state.successMessage = 'Support ticket submitted successfully';
      })
      .addCase(submitSupportTicket.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Fetch FAQs
      .addCase(fetchFAQs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
      })
      .addCase(fetchFAQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Support Tickets
      .addCase(fetchSupportTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.supportTickets = action.payload;
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Ticket Status
      .addCase(updateTicketStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTicket = action.payload;
        const index = state.supportTickets.findIndex(ticket => ticket.id === updatedTicket.id);
        if (index !== -1) {
          state.supportTickets[index] = updatedTicket;
        }
        if (state.currentTicket && state.currentTicket.id === updatedTicket.id) {
          state.currentTicket = updatedTicket;
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  setCurrentTicket,
  clearCurrentTicket,
  resetSupportState,
} = supportSlice.actions;

// Selectors
export const selectFAQs = (state) => state.support.faqs;
export const selectSupportTickets = (state) => state.support.supportTickets;
export const selectCurrentTicket = (state) => state.support.currentTicket;
export const selectSupportLoading = (state) => state.support.loading;
export const selectSupportError = (state) => state.support.error;
export const selectSupportCategories = (state) => state.support.categories;

export default supportSlice.reducer;