const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  payerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  payeeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 1.000000
  },
  amountInBaseCurrency: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  paymentType: {
    type: DataTypes.ENUM(
      'booking_payment',
      'advance_payment',
      'remaining_payment',
      'refund',
      'penalty',
      'bonus',
      'commission',
      'withdrawal',
      'deposit',
      'fee'
    ),
    allowNull: false,
    defaultValue: 'booking_payment'
  },
  paymentMethod: {
    type: DataTypes.ENUM(
      'card',
      'bank_transfer',
      'mobile_money',
      'wallet',
      'cash',
      'crypto',
      'paypal',
      'stripe',
      'paystack'
    ),
    allowNull: false
  },
  paymentGateway: {
    type: DataTypes.ENUM(
      'stripe',
      'paystack',
      'flutterwave',
      'paypal',
      'razorpay',
      'internal',
      'manual'
    ),
    allowNull: false,
    defaultValue: 'paystack'
  },
  gatewayTransactionId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gatewayReference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'disputed',
      'expired'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      ipAddress: null,
      userAgent: null,
      deviceInfo: null,
      location: null
    }
  },
  fees: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      platformFee: 0,
      gatewayFee: 0,
      processingFee: 0,
      totalFees: 0
    }
  },
  breakdown: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      subtotal: 0,
      tax: 0,
      discount: 0,
      tip: 0,
      total: 0
    }
  },
  paymentDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      cardLast4: null,
      cardBrand: null,
      bankName: null,
      accountNumber: null,
      authorizationCode: null
    }
  },
  refundDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      refundId: null,
      refundAmount: 0,
      refundReason: null,
      refundedAt: null,
      refundMethod: null
    }
  },
  disputeDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      disputeId: null,
      reason: null,
      evidence: [],
      status: null,
      createdAt: null,
      resolvedAt: null
    }
  },
  escrowDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isEscrowed: false,
      escrowedAt: null,
      releasedAt: null,
      releaseCondition: null,
      holdPeriod: 0
    }
  },
  recurringDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      isRecurring: false,
      frequency: null,
      nextPaymentDate: null,
      subscriptionId: null,
      totalOccurrences: null,
      currentOccurrence: null
    }
  },
  webhookData: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextRetryAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  errorCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isTestPayment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  riskScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  riskFlags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  complianceChecks: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      amlCheck: null,
      kycCheck: null,
      sanctionCheck: null,
      fraudCheck: null
    }
  },
  taxDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      taxRate: 0,
      taxAmount: 0,
      taxType: null,
      taxId: null
    }
  },
  settlementDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      settlementId: null,
      settlementDate: null,
      settlementAmount: 0,
      settlementCurrency: null,
      settlementRate: null
    }
  }
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['transaction_id']
    },
    {
      fields: ['booking_id']
    },
    {
      fields: ['payer_id']
    },
    {
      fields: ['payee_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_method']
    },
    {
      fields: ['payment_gateway']
    },
    {
      fields: ['gateway_transaction_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['completed_at']
    },
    {
      fields: ['amount']
    },
    {
      fields: ['payment_type']
    }
  ]
});

// Hooks
Payment.beforeCreate(async (payment) => {
  // Generate unique transaction ID
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  payment.transactionId = `TXN${timestamp}${random}`;
  
  // Set expiration time (30 minutes for pending payments)
  if (payment.status === 'pending') {
    payment.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  // Calculate amount in base currency
  payment.amountInBaseCurrency = payment.amount * payment.exchangeRate;
  
  // Calculate total fees
  if (payment.fees) {
    payment.fees.totalFees = (payment.fees.platformFee || 0) + 
                            (payment.fees.gatewayFee || 0) + 
                            (payment.fees.processingFee || 0);
  }
});

Payment.beforeUpdate(async (payment) => {
  // Update timestamps based on status changes
  if (payment.changed('status')) {
    const now = new Date();
    
    switch (payment.status) {
      case 'processing':
        payment.processedAt = now;
        break;
      case 'completed':
        payment.completedAt = now;
        break;
      case 'failed':
        payment.failedAt = now;
        break;
      case 'refunded':
        payment.refundedAt = now;
        break;
    }
  }
});

// Instance methods
Payment.prototype.markAsProcessing = async function() {
  return this.update({
    status: 'processing',
    processedAt: new Date()
  });
};

Payment.prototype.markAsCompleted = async function(gatewayData = {}) {
  const updates = {
    status: 'completed',
    completedAt: new Date()
  };
  
  if (gatewayData.transactionId) {
    updates.gatewayTransactionId = gatewayData.transactionId;
  }
  
  if (gatewayData.reference) {
    updates.gatewayReference = gatewayData.reference;
  }
  
  if (gatewayData.webhookData) {
    updates.webhookData = gatewayData.webhookData;
  }
  
  return this.update(updates);
};

Payment.prototype.markAsFailed = async function(errorMessage, errorCode = null) {
  const updates = {
    status: 'failed',
    failedAt: new Date(),
    errorMessage,
    attempts: this.attempts + 1
  };
  
  if (errorCode) {
    updates.errorCode = errorCode;
  }
  
  // Schedule retry if attempts < maxAttempts
  if (this.attempts + 1 < this.maxAttempts) {
    const retryDelay = Math.pow(2, this.attempts) * 60 * 1000; // Exponential backoff
    updates.nextRetryAt = new Date(Date.now() + retryDelay);
    updates.status = 'pending'; // Keep as pending for retry
  }
  
  return this.update(updates);
};

Payment.prototype.processRefund = async function(refundAmount, reason, refundMethod = null) {
  const refundDetails = {
    refundId: `REF${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    refundAmount: refundAmount || this.amount,
    refundReason: reason,
    refundedAt: new Date(),
    refundMethod: refundMethod || this.paymentMethod
  };
  
  return this.update({
    status: 'refunded',
    refundedAt: new Date(),
    refundDetails
  });
};

Payment.prototype.createDispute = async function(reason, evidence = []) {
  const disputeDetails = {
    disputeId: `DIS${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    reason,
    evidence,
    status: 'open',
    createdAt: new Date(),
    resolvedAt: null
  };
  
  return this.update({
    status: 'disputed',
    disputeDetails
  });
};

Payment.prototype.resolveDispute = async function(resolution, winner = null) {
  const disputeDetails = {
    ...this.disputeDetails,
    status: 'resolved',
    resolution,
    winner,
    resolvedAt: new Date()
  };
  
  const newStatus = winner === 'payer' ? 'refunded' : 'completed';
  
  return this.update({
    status: newStatus,
    disputeDetails
  });
};

Payment.prototype.holdInEscrow = async function(holdPeriod = 72, releaseCondition = 'service_completion') {
  const escrowDetails = {
    isEscrowed: true,
    escrowedAt: new Date(),
    releasedAt: null,
    releaseCondition,
    holdPeriod // in hours
  };
  
  return this.update({ escrowDetails });
};

Payment.prototype.releaseFromEscrow = async function() {
  const escrowDetails = {
    ...this.escrowDetails,
    releasedAt: new Date()
  };
  
  return this.update({
    status: 'completed',
    completedAt: new Date(),
    escrowDetails
  });
};

Payment.prototype.calculateFees = function() {
  const amount = parseFloat(this.amount);
  let platformFee = 0;
  let gatewayFee = 0;
  let processingFee = 0;
  
  // Platform fee (2.5% of transaction amount)
  platformFee = amount * 0.025;
  
  // Gateway fees based on payment method
  switch (this.paymentGateway) {
    case 'paystack':
      gatewayFee = amount * 0.015 + 100; // 1.5% + ₦100
      break;
    case 'stripe':
      gatewayFee = amount * 0.029 + 30; // 2.9% + $0.30
      break;
    case 'flutterwave':
      gatewayFee = amount * 0.014; // 1.4%
      break;
    default:
      gatewayFee = amount * 0.02; // 2% default
  }
  
  // Processing fee for international transactions
  if (this.currency !== 'NGN') {
    processingFee = amount * 0.01; // 1% for currency conversion
  }
  
  const totalFees = platformFee + gatewayFee + processingFee;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    gatewayFee: Math.round(gatewayFee * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100
  };
};

Payment.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

Payment.prototype.canBeRetried = function() {
  return this.status === 'failed' && this.attempts < this.maxAttempts;
};

Payment.prototype.shouldRetry = function() {
  return this.canBeRetried() && this.nextRetryAt && new Date() >= this.nextRetryAt;
};

Payment.prototype.getNetAmount = function() {
  const fees = this.fees || this.calculateFees();
  return parseFloat(this.amount) - fees.totalFees;
};

Payment.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.isExpired = this.isExpired();
  values.canBeRetried = this.canBeRetried();
  values.shouldRetry = this.shouldRetry();
  values.netAmount = this.getNetAmount();
  
  // Remove sensitive data
  if (values.paymentDetails) {
    delete values.paymentDetails.authorizationCode;
  }
  
  return values;
};

// Static methods
Payment.getPaymentStats = async function(userId, userType = 'payer') {
  const whereClause = {};
  whereClause[`${userType}Id`] = userId;
  
  const stats = await this.findAll({
    where: {
      ...whereClause,
      status: 'completed'
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount'],
      [sequelize.fn('MAX', sequelize.col('amount')), 'maxAmount'],
      [sequelize.fn('MIN', sequelize.col('amount')), 'minAmount']
    ]
  });
  
  return stats[0] || {};
};

Payment.getMonthlyRevenue = async function(year = new Date().getFullYear()) {
  return this.findAll({
    where: {
      status: 'completed',
      createdAt: {
        [sequelize.Op.gte]: new Date(`${year}-01-01`),
        [sequelize.Op.lt]: new Date(`${year + 1}-01-01`)
      }
    },
    attributes: [
      [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'month'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'transactions']
    ],
    group: [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"'))],
    order: [[sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'ASC']]
  });
};

Payment.getPendingPayments = async function() {
  return this.findAll({
    where: {
      status: 'pending',
      expiresAt: {
        [sequelize.Op.gt]: new Date()
      }
    },
    order: [['createdAt', 'ASC']]
  });
};

Payment.getFailedPaymentsForRetry = async function() {
  return this.findAll({
    where: {
      status: 'pending',
      attempts: {
        [sequelize.Op.gt]: 0,
        [sequelize.Op.lt]: sequelize.col('maxAttempts')
      },
      nextRetryAt: {
        [sequelize.Op.lte]: new Date()
      }
    },
    order: [['nextRetryAt', 'ASC']]
  });
};

module.exports = Payment;