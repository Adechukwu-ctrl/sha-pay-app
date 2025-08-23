const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'services',
      key: 'id'
    }
  },
  providerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'disputed',
      'refunded'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  estimatedDuration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: false,
    defaultValue: 60
  },
  actualStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      type: 'client_location', // 'client_location', 'provider_location', 'remote', 'custom'
      address: null,
      city: null,
      state: null,
      country: 'Nigeria',
      postalCode: null,
      coordinates: {
        latitude: null,
        longitude: null
      },
      instructions: null
    }
  },
  serviceDetails: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      title: null,
      description: null,
      category: null,
      requirements: [],
      specialInstructions: null
    }
  },
  pricing: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      basePrice: 0,
      addOns: [],
      discounts: [],
      subtotal: 0,
      tax: 0,
      serviceFee: 0,
      total: 0,
      currency: 'NGN'
    }
  },
  paymentStatus: {
    type: DataTypes.ENUM(
      'pending',
      'partial',
      'paid',
      'refunded',
      'disputed',
      'failed'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'bank_transfer', 'cash', 'wallet'),
    allowNull: true
  },
  advancePayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  remainingPayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'NGN'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requesterNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  providerNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      beforeImages: [],
      afterImages: [],
      documents: [],
      receipts: []
    }
  },
  rating: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      requesterRating: null,
      providerRating: null,
      requesterReview: null,
      providerReview: null,
      ratedAt: null
    }
  },
  timeline: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  cancellation: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      cancelledBy: null, // 'requester', 'provider', 'admin'
      reason: null,
      cancelledAt: null,
      refundAmount: 0,
      refundStatus: 'pending'
    }
  },
  reschedule: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      requestedBy: null,
      requestedDate: null,
      requestedTime: null,
      reason: null,
      status: null, // 'pending', 'approved', 'rejected'
      respondedAt: null,
      rescheduleCount: 0
    }
  },
  communication: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      lastMessageAt: null,
      messageCount: 0,
      unreadCount: {
        requester: 0,
        provider: 0
      }
    }
  },
  tracking: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      providerLocation: null,
      estimatedArrival: null,
      actualArrival: null,
      trackingEnabled: false
    }
  },
  quality: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      qualityScore: null,
      issues: [],
      resolution: null,
      satisfactionLevel: null
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      source: 'mobile_app', // 'mobile_app', 'web_app', 'api'
      deviceInfo: null,
      userAgent: null,
      ipAddress: null,
      referrer: null
    }
  },
  reminders: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      sent: [],
      scheduled: []
    }
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      frequency: null, // 'daily', 'weekly', 'monthly'
      interval: 1,
      endDate: null,
      occurrences: null
    }
  },
  parentBookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['service_id']
    },
    {
      fields: ['provider_id']
    },
    {
      fields: ['requester_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['scheduled_date']
    },
    {
      fields: ['booking_number']
    },
    {
      fields: ['is_urgent']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['parent_booking_id']
    }
  ]
});

// Hooks
Booking.beforeCreate(async (booking) => {
  // Generate unique booking number
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  booking.bookingNumber = `SP${timestamp}${random}`;
  
  // Set expiration time for pending bookings (24 hours)
  if (booking.status === 'pending') {
    booking.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  // Initialize timeline
  booking.timeline = [{
    event: 'booking_created',
    timestamp: new Date(),
    description: 'Booking request created',
    actor: 'requester'
  }];
});

// Instance methods
Booking.prototype.addTimelineEvent = async function(event, description, actor = 'system') {
  const timeline = [...this.timeline, {
    event,
    timestamp: new Date(),
    description,
    actor
  }];
  
  return this.update({ timeline });
};

Booking.prototype.confirm = async function() {
  const updates = {
    status: 'confirmed',
    confirmedAt: new Date(),
    expiresAt: null
  };
  
  await this.addTimelineEvent('booking_confirmed', 'Booking confirmed by provider', 'provider');
  return this.update(updates);
};

Booking.prototype.start = async function() {
  const updates = {
    status: 'in_progress',
    startedAt: new Date(),
    actualStartTime: new Date()
  };
  
  await this.addTimelineEvent('service_started', 'Service started', 'provider');
  return this.update(updates);
};

Booking.prototype.complete = async function() {
  const updates = {
    status: 'completed',
    completedAt: new Date(),
    actualEndTime: new Date()
  };
  
  await this.addTimelineEvent('service_completed', 'Service completed', 'provider');
  return this.update(updates);
};

Booking.prototype.cancel = async function(reason, cancelledBy = 'requester') {
  const cancellation = {
    cancelledBy,
    reason,
    cancelledAt: new Date(),
    refundAmount: this.calculateRefundAmount(),
    refundStatus: 'pending'
  };
  
  const updates = {
    status: 'cancelled',
    cancelledAt: new Date(),
    cancellation
  };
  
  await this.addTimelineEvent('booking_cancelled', `Booking cancelled by ${cancelledBy}: ${reason}`, cancelledBy);
  return this.update(updates);
};

Booking.prototype.calculateRefundAmount = function() {
  const now = new Date();
  const scheduledDateTime = new Date(`${this.scheduledDate} ${this.scheduledTime}`);
  const hoursUntilService = (scheduledDateTime - now) / (1000 * 60 * 60);
  
  // Refund policy based on cancellation time
  if (hoursUntilService >= 24) {
    return this.totalAmount; // 100% refund
  } else if (hoursUntilService >= 12) {
    return this.totalAmount * 0.75; // 75% refund
  } else if (hoursUntilService >= 2) {
    return this.totalAmount * 0.50; // 50% refund
  } else {
    return 0; // No refund
  }
};

Booking.prototype.requestReschedule = async function(newDate, newTime, reason, requestedBy = 'requester') {
  const reschedule = {
    requestedBy,
    requestedDate: newDate,
    requestedTime: newTime,
    reason,
    status: 'pending',
    respondedAt: null,
    rescheduleCount: (this.reschedule?.rescheduleCount || 0) + 1
  };
  
  await this.addTimelineEvent('reschedule_requested', `Reschedule requested by ${requestedBy}`, requestedBy);
  return this.update({ reschedule });
};

Booking.prototype.approveReschedule = async function() {
  const reschedule = {
    ...this.reschedule,
    status: 'approved',
    respondedAt: new Date()
  };
  
  const updates = {
    scheduledDate: reschedule.requestedDate,
    scheduledTime: reschedule.requestedTime,
    reschedule
  };
  
  await this.addTimelineEvent('reschedule_approved', 'Reschedule request approved', 'provider');
  return this.update(updates);
};

Booking.prototype.rejectReschedule = async function(reason) {
  const reschedule = {
    ...this.reschedule,
    status: 'rejected',
    respondedAt: new Date(),
    rejectionReason: reason
  };
  
  await this.addTimelineEvent('reschedule_rejected', `Reschedule request rejected: ${reason}`, 'provider');
  return this.update({ reschedule });
};

Booking.prototype.addRating = async function(rating, review, ratedBy = 'requester') {
  const ratingData = {
    ...this.rating,
    [`${ratedBy}Rating`]: rating,
    [`${ratedBy}Review`]: review,
    ratedAt: new Date()
  };
  
  await this.addTimelineEvent('rating_added', `Rating added by ${ratedBy}: ${rating}/5`, ratedBy);
  return this.update({ rating: ratingData });
};

Booking.prototype.updatePaymentStatus = async function(status, method = null) {
  const updates = { paymentStatus: status };
  
  if (method) {
    updates.paymentMethod = method;
  }
  
  await this.addTimelineEvent('payment_updated', `Payment status updated to ${status}`, 'system');
  return this.update(updates);
};

Booking.prototype.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

Booking.prototype.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Booking.prototype.canBeRescheduled = function() {
  return ['pending', 'confirmed'].includes(this.status) && 
         (this.reschedule?.rescheduleCount || 0) < 3;
};

Booking.prototype.getDuration = function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // Duration in minutes
  }
  return this.estimatedDuration;
};

Booking.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed fields
  values.isExpired = this.isExpired();
  values.canBeCancelled = this.canBeCancelled();
  values.canBeRescheduled = this.canBeRescheduled();
  values.actualDuration = this.getDuration();
  
  return values;
};

// Static methods
Booking.getUpcomingBookings = async function(userId, userType = 'requester') {
  const whereClause = {
    status: ['confirmed', 'in_progress'],
    scheduledDate: {
      [sequelize.Op.gte]: new Date()
    }
  };
  
  whereClause[`${userType}Id`] = userId;
  
  return this.findAll({
    where: whereClause,
    order: [['scheduledDate', 'ASC'], ['scheduledTime', 'ASC']]
  });
};

Booking.getBookingHistory = async function(userId, userType = 'requester', limit = 20) {
  const whereClause = {};
  whereClause[`${userType}Id`] = userId;
  
  return this.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit
  });
};

Booking.getBookingStats = async function(userId, userType = 'requester') {
  const whereClause = {};
  whereClause[`${userType}Id`] = userId;
  
  const stats = await this.findAll({
    where: whereClause,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
  
  return stats.reduce((acc, stat) => {
    acc[stat.status] = parseInt(stat.get('count'));
    return acc;
  }, {});
};

module.exports = Booking;