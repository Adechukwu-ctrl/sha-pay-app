const { Payment, Booking, User, Service } = require('../models');
const { asyncHandler, AppError, ValidationError, NotFoundError, AuthorizationError, logger } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const paymentService = require('../services/paymentService');

// Create payment intent
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId, paymentMethod = 'stripe' } = req.body;
  const userId = req.user.id;

  // Get booking details
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'title', 'price', 'currency']
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'email']
      },
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'email']
      }
    ]
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check if user is the requester
  if (booking.requesterId !== userId) {
    throw new AuthorizationError('You can only create payments for your own bookings');
  }

  // Check if booking is in correct status
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ValidationError('Payment can only be created for pending or confirmed bookings');
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({
    where: {
      bookingId,
      status: { [Op.in]: ['pending', 'processing', 'completed'] }
    }
  });

  if (existingPayment) {
    throw new ValidationError('Payment already exists for this booking');
  }

  let paymentIntent;
  let gatewayTransactionId;
  let gatewayData = {};

  try {
    if (paymentMethod === 'stripe') {
      // Create Stripe payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.totalAmount * 100), // Convert to cents
        currency: booking.currency.toLowerCase(),
        metadata: {
          bookingId: booking.id,
          userId: userId,
          serviceTitle: booking.service.title
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      gatewayTransactionId = paymentIntent.id;
      gatewayData = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } else if (paymentMethod === 'paystack') {
      // Initialize Paystack transaction using secure service
      const paystackResponse = await paymentService.initializePaystackTransaction(
        booking.totalAmount,
        booking.currency,
        booking.requester.email,
        {
          bookingId: booking.id,
          userId: userId,
          serviceTitle: booking.service.title
        }
      );

      gatewayTransactionId = paystackResponse.reference;
      gatewayData = {
        authorizationUrl: paystackResponse.authorizationUrl,
        accessCode: paystackResponse.accessCode,
        reference: paystackResponse.reference
      };
    } else {
      throw new ValidationError('Unsupported payment method');
    }

    // Create payment record
    const payment = await Payment.create({
      bookingId,
      userId,
      amount: booking.totalAmount,
      currency: booking.currency,
      paymentType: 'booking_payment',
      paymentMethod,
      gateway: paymentMethod,
      status: 'pending',
      description: `Payment for service: ${booking.service.title}`,
      gatewayTransactionId,
      gatewayData,
      breakdown: {
        baseAmount: booking.baseAmount,
        platformFee: booking.platformFee,
        totalAmount: booking.totalAmount
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod,
          gatewayData
        }
      }
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error.message, '\nStack:', error.stack);
    throw new AppError('Failed to create payment intent', 500);
  }
});

// Confirm payment
const confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { gatewayTransactionId } = req.body;
  const userId = req.user.id;

  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'title']
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      }
    ]
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.userId !== userId) {
    throw new AuthorizationError('You can only confirm your own payments');
  }

  if (payment.status !== 'pending') {
    throw new ValidationError('Payment is not in pending status');
  }

  try {
    let gatewayPayment;

    if (payment.gateway === 'stripe') {
      // Retrieve payment intent from Stripe
      gatewayPayment = await stripe.paymentIntents.retrieve(gatewayTransactionId);
      
      if (gatewayPayment.status !== 'succeeded') {
        throw new ValidationError('Payment not completed on Stripe');
      }
    } else if (payment.gateway === 'paystack') {
      // Verify transaction with Paystack using secure service
      const verification = await paymentService.verifyPaystackTransaction(gatewayTransactionId);
      
      if (verification.status !== 'success') {
        throw new ValidationError('Payment not completed on Paystack');
      }
      
      gatewayPayment = verification;
    }

    // Update payment status
    await payment.update({
      status: 'completed',
      completedAt: new Date(),
      gatewayResponse: gatewayPayment,
      actualAmount: gatewayPayment.amount_received || gatewayPayment.amount,
      gatewayFee: gatewayPayment.application_fee_amount || 0
    });

    // Update booking status if it's still pending
    if (payment.booking.status === 'pending') {
      await payment.booking.update({
        status: 'confirmed',
        confirmedAt: new Date()
      });
    }

    // Send notifications
    try {
      // Email to requester
      await emailService.sendPaymentConfirmation(
        payment.booking.requester.email,
        {
          requesterName: payment.booking.requester.firstName,
          serviceName: payment.booking.service.title,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId,
          bookingId: payment.bookingId
        }
      );

      // Email to provider
      await emailService.sendBookingNotification(
        payment.booking.provider.email,
        'payment_received',
        {
          providerName: payment.booking.provider.firstName,
          serviceName: payment.booking.service.title,
          requesterName: payment.booking.requester.firstName,
          amount: payment.amount,
          currency: payment.currency,
          bookingId: payment.bookingId
        }
      );

      // In-app notifications
      await notificationService.createNotification({
        userId: payment.booking.providerId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment received for booking of "${payment.booking.service.title}"`,
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount
        }
      });
    } catch (error) {
      console.error('Failed to send payment confirmation notifications:', error.message, '\nStack:', error.stack);
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { payment }
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error.message, '\nStack:', error.stack);
    
    // Update payment status to failed
    await payment.update({
      status: 'failed',
      failureReason: error.message,
      failedAt: new Date()
    });

    throw new AppError('Payment confirmation failed', 500);
  }
});

// Process refund
const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, amount } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'title']
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      }
    ]
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Check permissions
  const canRefund = isAdmin || 
    payment.payerId === userId || 
    payment.booking.providerId === userId;

  if (!canRefund) {
    throw new AuthorizationError('You are not authorized to process this refund');
  }

  if (payment.status !== 'completed') {
    throw new ValidationError('Only completed payments can be refunded');
  }

  if (payment.refundStatus === 'completed') {
    throw new ValidationError('Payment has already been refunded');
  }

  // Calculate refund amount
  const maxRefundAmount = payment.amount - (payment.refundedAmount || 0);
  const refundAmount = amount ? Math.min(amount, maxRefundAmount) : maxRefundAmount;

  if (refundAmount <= 0) {
    throw new ValidationError('Invalid refund amount');
  }

  try {
    let gatewayRefund;

    if (payment.paymentGateway === 'stripe') {
      // Create Stripe refund
      gatewayRefund = await stripe.refunds.create({
        payment_intent: payment.gatewayTransactionId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          bookingId: payment.bookingId,
          refundReason: reason
        }
      });
    } else if (payment.paymentGateway === 'paystack') {
      // Create Paystack refund using secure service
      gatewayRefund = await paymentService.createPaystackRefund(
        payment.gatewayTransactionId,
        refundAmount,
        payment.currency,
        reason
      );
    }

    // Update payment with refund information
    const refundDetails = payment.refundDetails || [];
    refundDetails.push({
      amount: refundAmount,
      reason,
      processedBy: userId,
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

    // Send notifications
    try {
      await emailService.sendRefundNotification(
        payment.booking.requester.email,
        {
          requesterName: payment.booking.requester.firstName,
          serviceName: payment.booking.service.title,
          refundAmount,
          currency: payment.currency,
          reason,
          transactionId: payment.transactionId
        }
      );

      await notificationService.createNotification({
        userId: payment.userId,
        type: 'refund_processed',
        title: 'Refund Processed',
        message: `Refund of ${refundAmount} ${payment.currency} has been processed for your booking`,
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          refundAmount
        }
      });
    } catch (error) {
      console.error('Failed to send refund notifications:', error.message, '\nStack:', error.stack);
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund: {
          amount: refundAmount,
          currency: payment.currency,
          status: refundStatus,
          gatewayRefundId: gatewayRefund.id
        }
      }
    });
  } catch (error) {
    console.error('Refund processing failed:', error.message, '\nStack:', error.stack);
    throw new AppError('Failed to process refund', 500);
  }
});

// Handle webhook from payment gateway
const handleWebhook = asyncHandler(async (req, res) => {
  const { gateway } = req.params;
  const signature = req.headers['stripe-signature'] || req.headers['x-paystack-signature'];
  
  let event;

  try {
    if (gateway === 'stripe') {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else if (gateway === 'paystack') {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== signature) {
        throw new Error('Invalid signature');
      }
      
      event = req.body;
    } else {
      throw new Error('Unsupported gateway');
    }

    // Handle different event types
    switch (event.type || event.event) {
      case 'payment_intent.succeeded':
      case 'charge.success':
        await handlePaymentSuccess(event.data.object, gateway);
        break;
      
      case 'payment_intent.payment_failed':
      case 'charge.failed':
        await handlePaymentFailure(event.data.object, gateway);
        break;
      
      case 'charge.dispute.created':
        await handleDispute(event.data.object, gateway);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type || event.event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message, '\nStack:', error.stack);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Helper function to handle payment success
const handlePaymentSuccess = async (paymentData, gateway) => {
  const gatewayTransactionId = paymentData.id || paymentData.reference;
  
  const payment = await Payment.findOne({
    where: { gatewayTransactionId },
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          { model: Service, as: 'service' },
          { model: User, as: 'requester' },
          { model: User, as: 'provider' }
        ]
      }
    ]
  });

  if (payment && payment.status === 'pending') {
    await payment.update({
      status: 'completed',
      completedAt: new Date(),
      gatewayResponse: paymentData,
      webhookData: paymentData
    });

    // Update booking status
    if (payment.booking.status === 'pending') {
      await payment.booking.update({
        status: 'confirmed',
        confirmedAt: new Date()
      });
    }
  }
};

// Helper function to handle payment failure
const handlePaymentFailure = async (paymentData, gateway) => {
  const gatewayTransactionId = paymentData.id || paymentData.reference;
  
  const payment = await Payment.findOne({
    where: { gatewayTransactionId }
  });

  if (payment && payment.status === 'pending') {
    await payment.update({
      status: 'failed',
      failedAt: new Date(),
      failureReason: paymentData.failure_message || paymentData.gateway_response,
      gatewayResponse: paymentData,
      webhookData: paymentData
    });
  }
};

// Helper function to handle disputes
const handleDispute = async (disputeData, gateway) => {
  const gatewayTransactionId = disputeData.charge || disputeData.transaction;
  
  const payment = await Payment.findOne({
    where: { gatewayTransactionId }
  });

  if (payment) {
    await payment.update({
      disputeStatus: 'created',
      disputeDetails: {
        id: disputeData.id,
        amount: disputeData.amount,
        reason: disputeData.reason,
        status: disputeData.status,
        createdAt: new Date()
      },
      webhookData: disputeData
    });
  }
};

// Get payment by ID
const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'title']
          },
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ]
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Check access permissions
  const hasAccess = isAdmin || 
    payment.userId === userId || 
    payment.booking.providerId === userId;

  if (!hasAccess) {
    throw new AuthorizationError('Access denied');
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// Get user payments
const getUserPayments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  const where = { userId };
  if (status) {
    where.status = status;
  }

  const { count, rows: payments } = await Payment.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    include: [
      {
        model: Booking,
        as: 'booking',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'title']
          }
        ]
      }
    ]
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPayments: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get provider balance
const getProviderBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;

  // Only providers can access balance
  if (userType !== 'provider') {
    throw new AuthorizationError('Only providers can access balance information');
  }

  // For now, return mock data to test the endpoint
  // TODO: Implement actual balance calculation
  const mockBalance = {
    balance: 1500.00,
    pendingBalance: 250.00,
    totalEarnings: 2000.00,
    currency: 'NGN'
  };

  res.json({
    success: true,
    data: mockBalance
  });
});

// Get payment statistics
const getPaymentStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const isAdmin = req.user.userType === 'admin';

  if (!isAdmin) {
    throw new AuthorizationError('Admin access required');
  }

  const stats = await Payment.getPaymentStats(period);

  res.json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  handleWebhook,
  getPaymentById,
  getUserPayments,
  getPaymentStats,
  getProviderBalance
};