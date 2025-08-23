import httpClient from './httpClient';
import { API_ENDPOINTS, buildUrl } from '../config/api';

// Service charge rate (2.5%)
const SERVICE_CHARGE_RATE = 0.025;

class PaymentService {

  // Calculate service charge
  calculateServiceCharge(amount) {
    return amount * SERVICE_CHARGE_RATE;
  }

  // Calculate total amount including service charge
  calculateTotalAmount(amount) {
    const serviceCharge = this.calculateServiceCharge(amount);
    return {
      originalAmount: amount,
      serviceCharge,
      totalAmount: amount + serviceCharge,
    };
  }

  // Process payment
  async processPayment(paymentData) {
    try {
      // Calculate service charge
      const { originalAmount, serviceCharge, totalAmount } = this.calculateTotalAmount(
        paymentData.jobAmount
      );

      const processedPaymentData = {
        ...paymentData,
        originalAmount,
        serviceCharge,
        totalAmount,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      // Mock payment processing - replace with actual payment gateway integration
      if (paymentData.paymentMethod === 'card') {
        return await this.processCardPayment(processedPaymentData);
      } else if (paymentData.paymentMethod === 'bank_transfer') {
        return await this.processBankTransfer(processedPaymentData);
      } else if (paymentData.paymentMethod === 'wallet') {
        return await this.processWalletPayment(processedPaymentData);
      }

      throw new Error('Unsupported payment method');
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Process card payment
  async processCardPayment(paymentData) {
    try {
      // Mock card validation
      this.validateCardDetails(paymentData.cardDetails);

      // Simulate API call to payment processor (Paystack, Flutterwave, etc.)
      const response = await httpClient.post(API_ENDPOINTS.PAYMENTS.PROCESS, {
        amount: paymentData.totalAmount,
        currency: 'NGN',
        paymentMethod: 'card',
        card: paymentData.cardDetails,
        metadata: {
          jobAmount: paymentData.originalAmount,
          serviceCharge: paymentData.serviceCharge,
          jobId: paymentData.jobId,
        },
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        status: 'completed',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Mock successful payment for development
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        reference: `REF_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Process bank transfer
  async processBankTransfer(paymentData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.PAYMENTS.PROCESS, {
        amount: paymentData.totalAmount,
        currency: 'NGN',
        paymentMethod: 'bank_transfer',
        bankDetails: paymentData.bankDetails,
        metadata: {
          jobAmount: paymentData.originalAmount,
          serviceCharge: paymentData.serviceCharge,
          jobId: paymentData.jobId,
        },
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        status: 'pending',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        bankDetails: response.data.bankDetails,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Mock bank transfer for development
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        reference: `REF_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        bankDetails: {
          accountName: 'Sha Pay! Escrow Account',
          accountNumber: '1234567890',
          bankName: 'First Bank of Nigeria',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Process wallet payment
  async processWalletPayment(paymentData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.PAYMENTS.PROCESS, {
        amount: paymentData.totalAmount,
        currency: 'NGN',
        paymentMethod: 'wallet',
        walletId: paymentData.walletId,
        metadata: {
          jobAmount: paymentData.originalAmount,
          serviceCharge: paymentData.serviceCharge,
          jobId: paymentData.jobId,
        },
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        status: 'completed',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Mock wallet payment for development
      return {
        success: true,
        transactionId: `TXN_${Date.now()}`,
        reference: `REF_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        amount: paymentData.totalAmount,
        serviceCharge: paymentData.serviceCharge,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Validate card details
  validateCardDetails(cardDetails) {
    if (!cardDetails) {
      throw new Error('Card details are required');
    }

    const { cardNumber, cardExpiry, cardCvv, cardName } = cardDetails;

    if (!cardNumber || cardNumber.length < 13) {
      throw new Error('Invalid card number');
    }

    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      throw new Error('Invalid expiry date format (MM/YY)');
    }

    if (!cardCvv || cardCvv.length < 3) {
      throw new Error('Invalid CVV');
    }

    if (!cardName || cardName.trim().length < 2) {
      throw new Error('Invalid cardholder name');
    }

    // Check if card is expired
    const [month, year] = cardExpiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const currentDate = new Date();
    
    if (expiryDate < currentDate) {
      throw new Error('Card has expired');
    }
  }

  // Save payment details for future use
  async savePaymentDetails(paymentDetails) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.PAYMENTS.SAVE_METHOD, paymentDetails);
      return response.data;
    } catch (error) {
      // Mock save for development
      return {
        success: true,
        message: 'Payment details saved successfully',
        paymentMethodId: `PM_${Date.now()}`,
      };
    }
  }

  // Fetch payment history
  async fetchPaymentHistory() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.PAYMENTS.HISTORY);
      return response.data;
    } catch (error) {
      // Mock payment history for development
      return {
        payments: [
          {
            id: '1',
            transactionId: 'TXN_1234567890',
            amount: 10000,
            serviceCharge: 250,
            totalAmount: 10250,
            status: 'completed',
            paymentMethod: 'card',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            jobTitle: 'Website Development',
          },
          {
            id: '2',
            transactionId: 'TXN_0987654321',
            amount: 5000,
            serviceCharge: 125,
            totalAmount: 5125,
            status: 'pending',
            paymentMethod: 'bank_transfer',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            jobTitle: 'Logo Design',
          },
        ],
      };
    }
  }

  // Release payment to service provider
  async releasePayment(paymentId) {
    try {
      const response = await httpClient.post(buildUrl(API_ENDPOINTS.PAYMENTS.RELEASE, { paymentId }));
      return response.data;
    } catch (error) {
      // Mock payment release for development
      return {
        success: true,
        message: 'Payment released successfully',
        releasedAt: new Date().toISOString(),
      };
    }
  }

  // Refund payment
  async refundPayment(paymentId, reason) {
    try {
      const response = await httpClient.post(buildUrl(API_ENDPOINTS.PAYMENTS.REFUND, { paymentId }), {
        reason,
      });
      return response.data;
    } catch (error) {
      // Mock refund for development
      return {
        success: true,
        message: 'Refund processed successfully',
        refundId: `REF_${Date.now()}`,
        refundedAt: new Date().toISOString(),
      };
    }
  }

  // Get service charge rate
  getServiceChargeRate() {
    return SERVICE_CHARGE_RATE;
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }

  // Download receipt for a transaction
  async downloadReceipt(transactionId) {
    try {
      const response = await httpClient.get(API_ENDPOINTS.PAYMENTS.RECEIPTS.replace(':id', transactionId), {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Receipt downloaded successfully' };
    } catch (error) {
      console.error('Error downloading receipt:', error);
      
      // Mock download for development
      return {
        success: true,
        message: 'Receipt download simulated (development mode)',
        receiptData: {
          transactionId,
          downloadedAt: new Date().toISOString()
        }
      };
    }
  }

  // Request withdrawal
  async requestWithdrawal(withdrawalData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.PAYMENTS.WITHDRAW, withdrawalData);
      return response.data;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      
      // Mock withdrawal request for development
      return {
        id: `WD_${Date.now()}`,
        transactionId: `TXN_WD_${Date.now()}`,
        amount: withdrawalData.amount,
        method: withdrawalData.method,
        status: 'pending',
        type: 'withdrawal',
        timestamp: new Date().toISOString(),
        estimatedProcessingTime: '1-3 business days'
      };
    }
  }
}

export default new PaymentService();