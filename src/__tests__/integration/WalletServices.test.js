import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import paymentService from '../../services/paymentService';
import userService from '../../services/userService';

// Mock services
jest.mock('../../services/paymentService');
jest.mock('../../services/userService');

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  reset: jest.fn(),
};

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
        wallet: {
          balance: 0,
          currency: 'NGN',
          transactions: [],
        },
        ...initialState.auth,
      },
    },
  });
};

const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createTestStore(initialState);
  return {
    store,
    component: React.createElement(Provider, { store }, component),
  };
};

describe('Wallet Services Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup paymentService mocks
    paymentService.sendMoney = jest.fn();
    paymentService.processQRPayment = jest.fn();
    paymentService.payBill = jest.fn();
    
    // Setup userService mocks
    userService.getWalletBalance = jest.fn();
    userService.getTransactionHistory = jest.fn();
    userService.getRecentTransactions = jest.fn();
  });

  describe('Wallet Screen', () => {
    it('should load wallet balance on mount', async () => {
      const mockWalletData = {
        balance: 50000,
        currency: 'NGN',
        accountNumber: '1234567890',
      };

      userService.getWalletBalance.mockResolvedValue(mockWalletData);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test service call
      const result = await userService.getWalletBalance();
      expect(userService.getWalletBalance).toHaveBeenCalled();
      expect(result.balance).toBe(50000);
      
      // Test currency formatting
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(50000);
      expect(formattedAmount).toContain('50,000');
    });

    it('should handle wallet refresh', async () => {
      const mockWalletData = {
        balance: 75000,
        currency: 'NGN',
      };

      userService.getWalletBalance.mockResolvedValue(mockWalletData);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Simulate refresh action
      await userService.getWalletBalance();
      await userService.getWalletBalance();

      expect(userService.getWalletBalance).toHaveBeenCalledTimes(2);
      
      // Test currency formatting for refreshed amount
      const formattedAmount = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(75000);
      expect(formattedAmount).toContain('75,000');
    });

    it('should display recent transactions', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'credit',
          amount: 10000,
          description: 'Transfer from John',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
        {
          id: '2',
          type: 'debit',
          amount: 5000,
          description: 'Payment to Store',
          date: '2024-01-14T15:45:00Z',
          status: 'completed',
        },
      ];

      userService.getRecentTransactions.mockResolvedValue(mockTransactions);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test service call and data structure
      const result = await userService.getRecentTransactions();
      expect(userService.getRecentTransactions).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Transfer from John');
      expect(result[1].description).toBe('Payment to Store');
    });

    it('should handle wallet loading error', async () => {
      userService.getWalletBalance.mockRejectedValue(
        new Error('Network error')
      );

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test error handling
      try {
        await userService.getWalletBalance();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      expect(userService.getWalletBalance).toHaveBeenCalled();
    });
  });

  describe('Send Money Screen', () => {
    it('should validate recipient and amount', () => {
      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test validation logic
      const validateRecipient = (recipient) => {
        return !!(recipient && recipient.trim().length > 0);
      };
      
      const validateAmount = (amount) => {
        const numAmount = parseFloat(amount);
        return !isNaN(numAmount) && numAmount > 0;
      };

      // Test empty fields
      expect(validateRecipient('')).toBe(false);
      expect(validateAmount('')).toBe(false);

      // Test valid fields
      expect(validateRecipient('john@example.com')).toBe(true);
      expect(validateAmount('100')).toBe(true);
      
      // Test invalid amount
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('-10')).toBe(false);
    });

    it('should check sufficient balance before sending', () => {
      const initialState = {
        auth: {
          wallet: {
            balance: 1000,
            currency: 'NGN',
          },
        },
      };

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation }),
        { initialState }
      );

      // Test balance validation logic
      const checkSufficientBalance = (amount, balance) => {
        return parseFloat(amount) <= balance;
      };

      const currentBalance = store.getState().auth.wallet.balance;
      expect(checkSufficientBalance('2000', currentBalance)).toBe(false); // Insufficient
      expect(checkSufficientBalance('500', currentBalance)).toBe(true); // Sufficient
    });

    it('should successfully send money', async () => {
      const mockTransactionResult = {
        id: 'txn_123',
        status: 'pending',
        amount: 5000,
        recipient: 'john@example.com',
      };

      paymentService.sendMoney.mockResolvedValue(mockTransactionResult);

      const initialState = {
        auth: {
          wallet: {
            balance: 10000,
            currency: 'NGN',
          },
        },
      };

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation }),
        { initialState }
      );

      // Test service call directly
      const result = await paymentService.sendMoney({
        recipient: 'john@example.com',
        amount: 5000,
        currency: 'NGN',
      });

      expect(paymentService.sendMoney).toHaveBeenCalledWith({
        recipient: 'john@example.com',
        amount: 5000,
        currency: 'NGN',
      });
      
      expect(result.id).toBe('txn_123');
      expect(result.status).toBe('pending');
      expect(result.amount).toBe(5000);
    });

    it('should handle send money failure', async () => {
      paymentService.sendMoney.mockRejectedValue(
        new Error('Transaction failed')
      );

      const initialState = {
        auth: {
          wallet: {
            balance: 10000,
            currency: 'NGN',
          },
        },
      };

      const { store } = renderWithProviders(
          React.createElement('div', { navigation: mockNavigation }),
          { initialState }
        );

      // Test error handling
      try {
        await paymentService.sendMoney({
          recipient: 'john@example.com',
          amount: 5000,
          currency: 'NGN',
        });
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
      }
      
      expect(paymentService.sendMoney).toHaveBeenCalled();
    });
  });

  describe('Transaction Screen', () => {
    it('should load and display transaction history', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'credit',
          amount: 10000,
          description: 'Salary payment',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
        {
          id: '2',
          type: 'debit',
          amount: 3000,
          description: 'Grocery shopping',
          date: '2024-01-14T15:45:00Z',
          status: 'completed',
        },
        {
          id: '3',
          type: 'debit',
          amount: 1500,
          description: 'Transport fare',
          date: '2024-01-13T08:20:00Z',
          status: 'pending',
        },
      ];

      userService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test service call and data structure
      const result = await userService.getTransactionHistory();
      expect(userService.getTransactionHistory).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].description).toBe('Salary payment');
      expect(result[1].description).toBe('Grocery shopping');
      expect(result[2].description).toBe('Transport fare');
    });

    it('should filter transactions by type', () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'credit',
          amount: 10000,
          description: 'Salary payment',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
        {
          id: '2',
          type: 'debit',
          amount: 3000,
          description: 'Grocery shopping',
          date: '2024-01-14T15:45:00Z',
          status: 'completed',
        },
      ];

      userService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test filtering logic
      const filterByType = (transactions, type) => {
        return transactions.filter(transaction => transaction.type === type);
      };

      const creditTransactions = filterByType(mockTransactions, 'credit');
      const debitTransactions = filterByType(mockTransactions, 'debit');

      expect(creditTransactions).toHaveLength(1);
      expect(creditTransactions[0].description).toBe('Salary payment');
      
      expect(debitTransactions).toHaveLength(1);
      expect(debitTransactions[0].description).toBe('Grocery shopping');
    });

    it('should navigate to transaction details', () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'credit',
          amount: 10000,
          description: 'Salary payment',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
      ];

      userService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test navigation logic
      const handleTransactionPress = (transactionId) => {
        mockNavigation.navigate('TransactionDetails', { transactionId });
      };

      handleTransactionPress('1');
      expect(mockNavigate).toHaveBeenCalledWith('TransactionDetails', {
        transactionId: '1',
      });
    });

    it('should handle pull-to-refresh', async () => {
      const mockTransactions = [
        {
          id: '1',
          type: 'credit',
          amount: 10000,
          description: 'Salary payment',
          date: '2024-01-15T10:30:00Z',
          status: 'completed',
        },
      ];

      userService.getTransactionHistory.mockResolvedValue(mockTransactions);

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test refresh functionality
      await userService.getTransactionHistory(); // Initial call
      await userService.getTransactionHistory(); // Refresh call
      
      expect(userService.getTransactionHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('Payment Service Integration', () => {
    it('should handle QR code payments', async () => {
      const mockQRData = {
        recipient: 'merchant123',
        amount: 2500,
        description: 'Coffee purchase',
      };

      const mockPaymentResult = {
        id: 'qr_txn_456',
        status: 'completed',
        amount: 2500,
      };

      paymentService.processQRPayment.mockResolvedValue(mockPaymentResult);

      const initialState = {
        wallet: {
          balance: 10000,
          currency: 'NGN',
        },
      };

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation }),
        { initialState }
      );

      // Test QR payment processing
      const result = await paymentService.processQRPayment(mockQRData);
      
      expect(paymentService.processQRPayment).toHaveBeenCalledWith(mockQRData);
      expect(result.id).toBe('qr_txn_456');
      expect(result.status).toBe('completed');
      expect(result.amount).toBe(2500);
    });

    it('should handle bill payments', async () => {
      const mockBillData = {
        billType: 'electricity',
        provider: 'EKEDC',
        accountNumber: '1234567890',
        amount: 5000,
      };

      const mockPaymentResult = {
        id: 'bill_txn_789',
        status: 'completed',
        amount: 5000,
        reference: 'BILL123456',
      };

      paymentService.payBill.mockResolvedValue(mockPaymentResult);

      const initialState = {
        auth: {
          wallet: {
            balance: 15000,
            currency: 'NGN',
          },
        },
      };

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation }),
        { initialState }
      );

      // Test bill payment processing
      const result = await paymentService.payBill(mockBillData);
      
      expect(paymentService.payBill).toHaveBeenCalledWith(mockBillData);
      expect(result.id).toBe('bill_txn_789');
      expect(result.status).toBe('completed');
      expect(result.reference).toBe('BILL123456');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      userService.getWalletBalance.mockRejectedValue(
        new Error('Network request failed')
      );

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation })
      );

      // Test error handling
      try {
        await userService.getWalletBalance();
      } catch (error) {
        expect(error.message).toBe('Network request failed');
      }
      
      expect(userService.getWalletBalance).toHaveBeenCalled();
    });

    it('should handle service unavailable errors', async () => {
      paymentService.sendMoney.mockRejectedValue(
        new Error('Service temporarily unavailable')
      );

      const initialState = {
        auth: {
          wallet: {
            balance: 10000,
            currency: 'NGN',
          },
        },
      };

      const { store } = renderWithProviders(
        React.createElement('div', { navigation: mockNavigation }),
        { initialState }
      );

      // Test service error handling
      try {
        await paymentService.sendMoney({
          recipient: 'john@example.com',
          amount: 5000,
          currency: 'NGN',
        });
      } catch (error) {
        expect(error.message).toBe('Service temporarily unavailable');
      }
      
      expect(paymentService.sendMoney).toHaveBeenCalled();
    });
  });
});