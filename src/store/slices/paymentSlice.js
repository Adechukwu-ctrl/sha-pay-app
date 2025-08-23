import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paymentService from '../../services/paymentService';

// Async thunks for payments
export const processPayment = createAsyncThunk(
  'payment/process',
  async (paymentData, { rejectWithValue }) => {
    try {
      return await paymentService.processPayment(paymentData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment processing failed');
    }
  }
);

export const savePaymentDetails = createAsyncThunk(
  'payment/saveDetails',
  async (paymentDetails, { rejectWithValue }) => {
    try {
      return await paymentService.savePaymentDetails(paymentDetails);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save payment details');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await paymentService.fetchPaymentHistory();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }
);

export const releasePayment = createAsyncThunk(
  'payment/release',
  async (paymentId, { rejectWithValue }) => {
    try {
      return await paymentService.releasePayment(paymentId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to release payment');
    }
  }
);

export const downloadReceipt = createAsyncThunk(
  'payment/downloadReceipt',
  async (transactionId, { rejectWithValue }) => {
    try {
      return await paymentService.downloadReceipt(transactionId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download receipt');
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'payment/requestWithdrawal',
  async (withdrawalData, { rejectWithValue }) => {
    try {
      return await paymentService.requestWithdrawal(withdrawalData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Withdrawal request failed');
    }
  }
);

const initialState = {
  payments: [],
  currentPayment: null,
  paymentDetails: null,
  serviceChargeRate: 0.025, // 2.5%
  loading: false,
  error: null,
  paymentMethods: [],
  escrowBalance: 0,
  transactionHistory: [],
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
    calculateServiceCharge: (state, action) => {
      const amount = action.payload;
      return amount * state.serviceChargeRate;
    },
    updateEscrowBalance: (state, action) => {
      state.escrowBalance = action.payload;
    },
    addPaymentMethod: (state, action) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action) => {
      state.paymentMethods = state.paymentMethods.filter(
        method => method.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.push(action.payload);
        state.currentPayment = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save Payment Details
      .addCase(savePaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentDetails = action.payload;
      })
      .addCase(savePaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Payment History
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Release Payment
      .addCase(releasePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(releasePayment.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update payment status in the payments array
        const index = state.payments.findIndex(
          payment => payment.id === action.payload.id
        );
        
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
        
        if (state.currentPayment && state.currentPayment.id === action.payload.id) {
          state.currentPayment = action.payload;
        }
      })
      .addCase(releasePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Download Receipt
      .addCase(downloadReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadReceipt.fulfilled, (state, action) => {
        state.loading = false;
        // Receipt download successful - no state changes needed
      })
      .addCase(downloadReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Request Withdrawal
      .addCase(requestWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        // Add withdrawal request to payments array
        state.payments.unshift(action.payload);
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPayment, clearPaymentError, calculateServiceCharge } = paymentSlice.actions;
export default paymentSlice.reducer;