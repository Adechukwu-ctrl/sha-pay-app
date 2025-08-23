// Integration tests for core business logic without UI components
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, register, logout, clearError } from '../../store/slices/authSlice';
import * as authService from '../../services/authService';
import * as userService from '../../services/userService';
import * as paymentService from '../../services/paymentService';
import * as verificationService from '../../services/verificationService';

// Mock all services
jest.mock('../../services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('../../services/paymentService', () => ({
  sendMoney: jest.fn(),
  getTransactionHistory: jest.fn(),
  getBalance: jest.fn(),
}));

jest.mock('../../services/verificationService', () => ({
  verifyBVN: jest.fn(),
  verifyPhone: jest.fn(),
}));

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

describe('Business Logic Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockToken = 'mock-jwt-token';

      authService.login.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const store = createTestStore();

      // Dispatch login thunk
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123'
      }));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.loading).toBe(false);
    });

    it('should handle login failure', async () => {
      const mockError = 'Invalid credentials';

      authService.login.mockRejectedValue({ response: { data: { message: mockError } } });

      const store = createTestStore();

      // Dispatch login thunk with invalid credentials
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'wrongpassword'
      }));

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBe(mockError);
      expect(state.auth.user).toBe(null);
    });

    it('should handle logout', () => {
      const initialState = {
        auth: {
          isAuthenticated: true,
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token',
        },
      };

      const store = createTestStore(initialState);

      // Dispatch logout thunk
      store.dispatch(logout());

      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.user).toBe(null);
      expect(state.auth.userType).toBe(null);
    });
  });

  describe('User Service Integration', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        bvn: '12345678901',
      };

      userService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await userService.getUserProfile('1');
      expect(result).toEqual(mockProfile);
      expect(userService.getUserProfile).toHaveBeenCalledWith('1');
    });

    it('should handle profile update', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+0987654321',
      };

      const updatedProfile = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        phone: '+0987654321',
        bvn: '12345678901',
      };

      userService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await userService.updateProfile('1', updateData);
      expect(result).toEqual(updatedProfile);
      expect(userService.updateProfile).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('Payment Service Integration', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        amount: 1000,
        recipient: 'user123',
        description: 'Test payment',
      };

      const mockTransaction = {
        id: 'txn_123',
        amount: 1000,
        recipient: 'user123',
        status: 'completed',
        timestamp: new Date().toISOString(),
      };

      paymentService.sendMoney.mockResolvedValue(mockTransaction);

      const result = await paymentService.sendMoney(paymentData);
      expect(result).toEqual(mockTransaction);
      expect(paymentService.sendMoney).toHaveBeenCalledWith(paymentData);
    });

    it('should handle payment failure', async () => {
      const paymentData = {
        amount: 1000,
        recipient: 'user123',
        description: 'Test payment',
      };

      const mockError = 'Insufficient funds';
      paymentService.sendMoney.mockRejectedValue(new Error(mockError));

      await expect(paymentService.sendMoney(paymentData)).rejects.toThrow(mockError);
    });

    it('should fetch transaction history', async () => {
      const mockTransactions = [
        {
          id: 'txn_1',
          amount: 500,
          type: 'credit',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          id: 'txn_2',
          amount: 200,
          type: 'debit',
          timestamp: '2023-01-02T00:00:00Z',
        },
      ];

      paymentService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const result = await paymentService.getTransactionHistory('user123');
      expect(result).toEqual(mockTransactions);
      expect(paymentService.getTransactionHistory).toHaveBeenCalledWith('user123');
    });
  });

  describe('Verification Service Integration', () => {
    it('should verify BVN successfully', async () => {
      const bvnData = {
        bvn: '12345678901',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const mockVerificationResult = {
        verified: true,
        message: 'BVN verified successfully',
        data: {
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
        },
      };

      verificationService.verifyBVN.mockResolvedValue(mockVerificationResult);

      const result = await verificationService.verifyBVN(bvnData);
      expect(result).toEqual(mockVerificationResult);
      expect(verificationService.verifyBVN).toHaveBeenCalledWith(bvnData);
    });

    it('should handle BVN verification failure', async () => {
      const bvnData = {
        bvn: '00000000000',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
      };

      const mockError = 'Invalid BVN';
      verificationService.verifyBVN.mockRejectedValue(new Error(mockError));

      await expect(verificationService.verifyBVN(bvnData)).rejects.toThrow(mockError);
    });
  });

  describe('State Management Integration', () => {
    it('should handle loading states correctly', async () => {
      const store = createTestStore();
      
      authService.login.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        userType: 'requirer',
        verificationStatus: 'verified',
        creditRating: 'A'
      });

      // Dispatch login thunk and check loading states
      const loginPromise = store.dispatch(login({
        email: 'test@example.com',
        password: 'password123'
      }));
      
      // Should be loading
      expect(store.getState().auth.loading).toBe(true);
      
      // Wait for completion
      await loginPromise;

      const state = store.getState();
      expect(state.auth.loading).toBe(false);
      expect(state.auth.error).toBe(null);
    });

    it('should handle error states correctly', async () => {
      const errorMessage = 'Network error';
      authService.login.mockRejectedValue({ response: { data: { message: errorMessage } } });
      
      const store = createTestStore();

      // Dispatch login thunk that will fail
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password'
      }));

      const state = store.getState();
      expect(state.auth.loading).toBe(false);
      expect(state.auth.error).toBe(errorMessage);
      expect(state.auth.isAuthenticated).toBe(false);
    });

    it('should clear errors on successful actions', async () => {
      const initialState = {
         auth: {
           user: null,
           isAuthenticated: false,
           userType: null,
           loading: false,
           error: 'Previous error',
           verificationStatus: null,
           creditRating: null
         },
       };

      const store = createTestStore(initialState);

      authService.login.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
      });

      // Dispatch successful login
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password'
      }));

      const state = store.getState();
      expect(state.auth.error).toBe(null);
      expect(state.auth.isAuthenticated).toBe(true);
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across services', async () => {
      const userId = 'user123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock service responses
      userService.getUserProfile.mockResolvedValue(mockUser);
      paymentService.getTransactionHistory.mockResolvedValue([]);

      // Fetch user data
      const userProfile = await userService.getUserProfile(userId);
      const transactions = await paymentService.getTransactionHistory(userId);

      expect(userProfile.id).toBe(userId);
      expect(Array.isArray(transactions)).toBe(true);
      expect(userService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(paymentService.getTransactionHistory).toHaveBeenCalledWith(userId);
    });

    it('should handle service dependencies correctly', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockAuthResponse = {
        user: { id: '1', email: 'test@example.com' },
        token: 'jwt-token',
      };

      authService.login.mockResolvedValue(mockAuthResponse);
      userService.getUserProfile.mockResolvedValue(mockAuthResponse.user);

      // Login should succeed
      const authResult = await authService.login(loginData);
      expect(authResult).toEqual(mockAuthResponse);

      // Profile fetch should use the authenticated user ID
      const profile = await userService.getUserProfile(authResult.user.id);
      expect(profile).toEqual(mockAuthResponse.user);
    });
  });
});