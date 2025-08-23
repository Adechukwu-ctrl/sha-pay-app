const { Payment, Booking, User } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');
const winston = require('winston');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Payment service class
class PaymentService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/payment-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/payment.log' })
      ]
    });

    this.platformFeeRate = parseFloat(process.env.PLATFORM_FEE_RATE || '0.05'); // 5% default
    this.initializeGateways();
  }

  // Initialize payment gateways
  initializeGateways() {
    try {
      // Stripe initialization
      if (process.env.STRIPE_SECRET_KEY) {
        this.logger.info('Stripe payment gateway initialized');
      } else {
        this.logger.warn('Stripe secret key not provided');
      }

      // Paystack initialization
      if (process.env.PAYSTACK_SECRET_KEY) {
        this.logger.info('Paystack payment gateway initialized');
      } else {
        this.logger.warn('Paystack secret key not provided');
      }
    } catch (error) {
      this.logger.error('Failed to initialize payment gateways:', error);
    }
  }

  // Calculate payment breakdown
  calculatePaymentBreakdown(baseAmount, currency = 'USD') {
    const base = parseFloat(baseAmount);
    const platformFee = base * this.platformFeeRate;
    const total = base + platformFee;

    return {
      baseAmount: base,
      platformFee: platformFee,
      totalAmount: total,
      currency: currency.toUpperCase()
    };
  }

  // Create payment intent with Stripe
  async createStripePaymentIntent(amount, currency, metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true
        },
        capture_method: 'automatic'
      });

      this.logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent:', error);
      throw new Error(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  // Initialize Paystack transaction
  async initializePaystackTransaction(amount, currency, email, metadata = {}) {
    try {
      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: currency.toUpperCase(),
        metadata,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info('Paystack transaction initialized', {
        reference: response.data.data.reference,
        amount,
        currency
      });

      return {
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code
      };
    } catch (error) {
      this.logger.error('Failed to initialize Paystack transaction:', error);
      throw new Error(`Paystack transaction initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Verify Stripe payment
  async verifyStripePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: paymentIntent.payment_method,
        charges: paymentIntent.charges.data
      };
    } catch (error) {
      this.logger.error('Failed to verify Stripe payment:', error);
      throw new Error(`Stripe payment verification failed: ${error.message}`);
    }
  }

  // Verify Paystack transaction
  async verifyPaystackTransaction(reference) {
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const transaction = response.data.data;
      
      return {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount / 100,
        currency: transaction.currency,
        paidAt: transaction.paid_at,
        channel: transaction.channel,
        fees: transaction.fees / 100
      };
    } catch (error) {
      this.logger.error('Failed to verify Paystack transaction:', error);
      throw new Error(`Paystack transaction verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Create Paystack refund
  async createPaystackRefund(transactionId, amount, currency, reason) {
    try {
      const response = await axios.post('https://api.paystack.co/refund', {
        transaction: transactionId,
        amount: Math.round(amount * 100), // Convert to kobo
        currency: currency.toUpperCase(),
        customer_note: reason,
        merchant_note: `Refund for transaction ${transactionId}`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      this.logger.info('Paystack refund created', {
        refundId: response.data.data.id,
        amount,
        currency
      });

      return {
        id: response.data.data.id,
        amount: response.data.data.amount / 100, // Convert from kobo
        currency: response.data.data.currency,
        status: response.data.data.status,
        gatewayResponse: response.data.data
      };
    } catch (error) {
      this.logger.error('Failed to create Paystack refund:', error);
      throw new Error(`Paystack refund creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Process payment completion
  async processPayment(paymentId) {
    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              { model: User, as: 'requester' },
              { model: User, as: 'provider' }
            ]
          }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment is not in pending status');
      }

      let gatewayResponse;

      // Verify payment with gateway
      if (payment.gateway === 'stripe') {
        gatewayResponse = await this.verifyStripePayment(payment.gatewayTransactionId);
        
        if (gatewayResponse.status !== 'succeeded') {
          throw new Error('Payment not completed on Stripe');
        }
      } else if (payment.gateway === 'paystack') {
        gatewayResponse = await this.verifyPaystackTransaction(payment.gatewayTransactionId);
        
        if (gatewayResponse.status !== 'success') {
          throw new Error('Payment not completed on Paystack');
        }
      } else {
        throw new Error('Unsupported payment gateway');
      }

      // Update payment status
      await payment.update({
        status: 'completed',
        completedAt: new Date(),
        gatewayResponse,
        actualAmount: gatewayResponse.amount,
        gatewayFee: gatewayResponse.fees || 0
      });

      // Update booking status if needed
      if (payment.booking && payment.booking.status === 'pending') {
        await payment.booking.update({
          status: 'confirmed',
          confirmedAt: new Date()
        });
      }

      this.logger.info('Payment processed successfully', {
        paymentId,
        amount: payment.amount,
        gateway: payment.gateway
      });

      return payment;
    } catch (error) {
      this.logger.error('Failed to process payment:', error);
      
      // Update payment status to failed
      await Payment.update(
        {
          status: 'failed',
          failedAt: new Date(),
          failureReason: error.message
        },
        { where: { id: paymentId } }
      );
      
      throw error;
    }
  }

  // Process refund
  async processRefund(paymentId, reason, amount = null) {
    try {
      const payment = await Payment.findByPk(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
      }

      const maxRefundAmount = payment.amount - (payment.refundedAmount || 0);
      const refundAmount = amount ? Math.min(amount, maxRefundAmount) : maxRefundAmount;

      if (refundAmount <= 0) {
        throw new Error('Invalid refund amount');
      }

      let gatewayRefund;

      // Process refund with gateway
      if (payment.gateway === 'stripe') {
        gatewayRefund = await stripe.refunds.create({
          payment_intent: payment.gatewayTransactionId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
            paymentId: payment.id,
            refundReason: reason
          }
        });
      } else if (payment.gateway === 'paystack') {
        gatewayRefund = await this.createPaystackRefund(
          payment.gatewayTransactionId,
          refundAmount,
          payment.currency,
          reason
        );
      } else {
        throw new Error('Unsupported payment gateway for refunds');
      }

      // Update payment with refund information
      const refundDetails = payment.refundDetails || [];
      refundDetails.push({
        amount: refundAmount,
        reason,
        processedAt: new Date(),
        gatewayRefundId: gatewayRefund.id,
        gatewayResponse: gatewayRefund
      });

      const totalRefunded = (payment.refundedAmount || 0) + refundAmount;
      const refundStatus = totalRefunded >= payment.amount ? 'completed' : 'partial';

      await payment.update({
        refundStatus,
        refundedAmount: totalRefunded,
        refundDetails,
        refundedAt: refundStatus === 'completed' ? new Date() : payment.refundedAt
      });

      this.logger.info('Refund processed successfully', {
        paymentId,
        refundAmount,
        gateway: payment.gateway,
        gatewayRefundId: gatewayRefund.id
      });

      return {
        refundId: gatewayRefund.id,
        amount: refundAmount,
        status: refundStatus
      };
    } catch (error) {
      this.logger.error('Failed to process refund:', error);
      throw error;
    }
  }

  // Calculate refund amount based on cancellation policy
  calculateRefundAmount(payment, booking, cancellationTime) {
    const scheduledTime = new Date(booking.scheduledDate);
    const hoursUntilService = (scheduledTime - cancellationTime) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    
    // Refund policy based on cancellation time
    if (hoursUntilService >= 48) {
      refundPercentage = 1.0; // 100% refund
    } else if (hoursUntilService >= 24) {
      refundPercentage = 0.75; // 75% refund
    } else if (hoursUntilService >= 12) {
      refundPercentage = 0.5; // 50% refund
    } else if (hoursUntilService >= 2) {
      refundPercentage = 0.25; // 25% refund
    } else {
      refundPercentage = 0; // No refund
    }
    
    const refundAmount = payment.amount * refundPercentage;
    
    return {
      refundAmount,
      refundPercentage,
      hoursUntilService
    };
  }

  // Get payment statistics
  async getPaymentStatistics(period = '30d', filters = {}) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on period
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const where = {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        ...filters
      };

      // Get payment statistics
      const totalPayments = await Payment.count({ where });
      
      const completedPayments = await Payment.count({
        where: { ...where, status: 'completed' }
      });
      
      const failedPayments = await Payment.count({
        where: { ...where, status: 'failed' }
      });
      
      const totalRevenue = await Payment.sum('amount', {
        where: { ...where, status: 'completed' }
      }) || 0;
      
      const totalRefunded = await Payment.sum('refundedAmount', {
        where: { ...where, refundStatus: { [Op.in]: ['partial', 'completed'] } }
      }) || 0;

      const averageTransactionValue = completedPayments > 0 ? totalRevenue / completedPayments : 0;
      const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

      return {
        period,
        totalPayments,
        completedPayments,
        failedPayments,
        totalRevenue,
        totalRefunded,
        netRevenue: totalRevenue - totalRefunded,
        averageTransactionValue,
        successRate
      };
    } catch (error) {
      this.logger.error('Failed to get payment statistics:', error);
      throw error;
    }
  }

  // Retry failed payments
  async retryFailedPayments(limit = 10) {
    try {
      const failedPayments = await Payment.findAll({
        where: {
          status: 'failed',
          retryCount: {
            [Op.lt]: 3 // Maximum 3 retry attempts
          },
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Only retry payments from last 24 hours
          }
        },
        limit,
        order: [['createdAt', 'ASC']]
      });

      const results = [];

      for (const payment of failedPayments) {
        try {
          await this.processPayment(payment.id);
          results.push({ paymentId: payment.id, status: 'success' });
        } catch (error) {
          await payment.update({
            retryCount: (payment.retryCount || 0) + 1,
            lastRetryAt: new Date()
          });
          results.push({ paymentId: payment.id, status: 'failed', error: error.message });
        }
      }

      this.logger.info('Failed payments retry completed', {
        attempted: failedPayments.length,
        successful: results.filter(r => r.status === 'success').length
      });

      return results;
    } catch (error) {
      this.logger.error('Failed to retry failed payments:', error);
      throw error;
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, secret, gateway) {
    try {
      if (gateway === 'stripe') {
        return stripe.webhooks.constructEvent(payload, signature, secret);
      } else if (gateway === 'paystack') {
        const hash = crypto
          .createHmac('sha512', secret)
          .update(payload)
          .digest('hex');
        return hash === signature;
      }
      return false;
    } catch (error) {
      this.logger.error('Webhook signature validation failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const paymentService = new PaymentService();
module.exports = paymentService;