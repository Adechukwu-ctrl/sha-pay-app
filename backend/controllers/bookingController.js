const { Booking, Service, User, Payment, Review } = require('../models');
const { asyncHandler, AppError, ValidationError, NotFoundError, AuthorizationError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const paymentService = require('../services/paymentService');

// Get all bookings with filtering
const getAllBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status,
    providerId,
    requesterId,
    serviceId,
    startDate,
    endDate
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // Build where clause
  const where = {};

  if (status) {
    where.status = status;
  }

  if (providerId) {
    where.providerId = providerId;
  }

  if (requesterId) {
    where.requesterId = requesterId;
  }

  if (serviceId) {
    where.serviceId = serviceId;
  }

  if (startDate && endDate) {
    where.scheduledDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    where.scheduledDate = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    where.scheduledDate = {
      [Op.lte]: new Date(endDate)
    };
  }

  const { count, rows: bookings } = await Booking.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'title', 'price', 'currency', 'duration']
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'email']
      },
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'email']
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['id', 'status', 'amount', 'currency', 'paymentMethod']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get booking by ID
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const booking = await Booking.findByPk(id, {
    include: [
      {
        model: Service,
        as: 'service',
        include: [
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'email', 'phone']
          }
        ]
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture', 'email', 'phone']
      },
      {
        model: Payment,
        as: 'payment'
      },
      {
        model: Review,
        as: 'review'
      }
    ]
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check access permissions
  if (!isAdmin && booking.requesterId !== userId && booking.providerId !== userId) {
    throw new AuthorizationError('Access denied');
  }

  res.json({
    success: true,
    data: { booking }
  });
});

// Create new booking
const createBooking = asyncHandler(async (req, res) => {
  const requesterId = req.user.id;
  const {
    serviceId,
    scheduledDate,
    notes,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude
  } = req.body;

  // Get service details
  const service = await Service.findByPk(serviceId, {
    include: [
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  if (!service.isActive) {
    throw new ValidationError('Service is not available for booking');
  }

  // Check if user is trying to book their own service
  if (service.providerId === requesterId) {
    throw new ValidationError('You cannot book your own service');
  }

  // Check provider availability (simplified - would need more complex scheduling logic)
  const conflictingBooking = await Booking.findOne({
    where: {
      providerId: service.providerId,
      scheduledDate: {
        [Op.between]: [
          new Date(new Date(scheduledDate).getTime() - service.duration * 60000),
          new Date(new Date(scheduledDate).getTime() + service.duration * 60000)
        ]
      },
      status: { [Op.in]: ['confirmed', 'in_progress'] }
    }
  });

  if (conflictingBooking) {
    throw new ValidationError('Provider is not available at the selected time');
  }

  // Calculate pricing
  const baseAmount = parseFloat(service.price);
  const platformFee = baseAmount * 0.05; // 5% platform fee
  const totalAmount = baseAmount + platformFee;

  // Create booking
  const booking = await Booking.create({
    serviceId,
    requesterId,
    providerId: service.providerId,
    scheduledDate: new Date(scheduledDate),
    status: 'pending',
    notes,
    address,
    city,
    state,
    country,
    zipCode,
    latitude,
    longitude,
    baseAmount,
    platformFee,
    totalAmount,
    currency: service.currency,
    timeline: [{
      status: 'pending',
      timestamp: new Date(),
      note: 'Booking created'
    }]
  });

  // Load booking with related data
  const createdBooking = await Booking.findByPk(booking.id, {
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'title', 'price', 'currency', 'duration']
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      },
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      }
    ]
  });

  // Send notifications
  try {
    // Email to provider
    await emailService.sendBookingNotification(
      service.provider.email,
      'new_booking',
      {
        providerName: service.provider.firstName,
        serviceName: service.title,
        requesterName: req.user.firstName,
        scheduledDate: scheduledDate,
        bookingId: booking.id
      }
    );

    // In-app notification to provider
    await notificationService.createNotification({
      userId: service.providerId,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${req.user.firstName} ${req.user.lastName} has requested to book your service "${service.title}"`,
      data: { bookingId: booking.id }
    });
  } catch (error) {
    console.error('Failed to send booking notifications:', error.message, '\nStack:', error.stack);
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking: createdBooking }
  });
});

// Update booking status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.userType === 'admin';

  const booking = await Booking.findByPk(id, {
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
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check permissions based on status change
  const canUpdate = isAdmin || 
    (status === 'confirmed' && booking.providerId === userId) ||
    (status === 'cancelled' && (booking.requesterId === userId || booking.providerId === userId)) ||
    (status === 'in_progress' && booking.providerId === userId) ||
    (status === 'completed' && booking.providerId === userId);

  if (!canUpdate) {
    throw new AuthorizationError('You are not authorized to update this booking status');
  }

  // Validate status transitions
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // Cannot change from completed
    cancelled: [] // Cannot change from cancelled
  };

  if (!validTransitions[booking.status].includes(status)) {
    throw new ValidationError(`Cannot change status from ${booking.status} to ${status}`);
  }

  // Update booking
  const timeline = booking.timeline || [];
  timeline.push({
    status,
    timestamp: new Date(),
    note: notes || `Status changed to ${status}`,
    updatedBy: userId
  });

  await booking.update({
    status,
    timeline,
    ...(status === 'confirmed' && { confirmedAt: new Date() }),
    ...(status === 'in_progress' && { startedAt: new Date() }),
    ...(status === 'completed' && { completedAt: new Date() }),
    ...(status === 'cancelled' && { cancelledAt: new Date(), cancellationReason: notes })
  });

  // Handle status-specific actions
  if (status === 'confirmed') {
    // Send confirmation emails
    try {
      await emailService.sendBookingNotification(
        booking.requester.email,
        'booking_confirmed',
        {
          requesterName: booking.requester.firstName,
          serviceName: booking.service.title,
          providerName: booking.provider.firstName,
          scheduledDate: booking.scheduledDate,
          bookingId: booking.id
        }
      );
    } catch (error) {
      console.error('Failed to send confirmation email:', error.message, '\nStack:', error.stack);
    }
  } else if (status === 'completed') {
    // Update service booking count
    await booking.service.updateBookingCount();
    
    // Process payment if not already processed
    if (booking.payment && booking.payment.status === 'pending') {
      try {
        await paymentService.processPayment(booking.payment.id);
      } catch (error) {
        console.error('Failed to process payment:', error.message, '\nStack:', error.stack);
      }
    }
  } else if (status === 'cancelled') {
    // Handle refunds if applicable
    if (booking.payment && booking.payment.status === 'completed') {
      try {
        await paymentService.processRefund(booking.payment.id, 'Booking cancelled');
      } catch (error) {
        console.error('Failed to process refund:', error.message, '\nStack:', error.stack);
      }
    }
  }

  // Send notifications
  try {
    const notificationData = {
      bookingId: booking.id,
      serviceName: booking.service.title,
      status
    };

    if (booking.providerId !== userId) {
      await notificationService.createNotification({
        userId: booking.providerId,
        type: 'booking_status_update',
        title: 'Booking Status Updated',
        message: `Booking for "${booking.service.title}" has been ${status}`,
        data: notificationData
      });
    }

    if (booking.requesterId !== userId) {
      await notificationService.createNotification({
        userId: booking.requesterId,
        type: 'booking_status_update',
        title: 'Booking Status Updated',
        message: `Your booking for "${booking.service.title}" has been ${status}`,
        data: notificationData
      });
    }
  } catch (error) {
    console.error('Failed to send status update notifications:', error.message, '\nStack:', error.stack);
  }

  res.json({
    success: true,
    message: `Booking ${status} successfully`,
    data: { booking }
  });
});

// Reschedule booking
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newScheduledDate, reason } = req.body;
  const userId = req.user.id;

  const booking = await Booking.findByPk(id, {
    include: [
      {
        model: Service,
        as: 'service'
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
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Check permissions
  if (booking.requesterId !== userId && booking.providerId !== userId) {
    throw new AuthorizationError('You can only reschedule your own bookings');
  }

  // Check if booking can be rescheduled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ValidationError('Only pending or confirmed bookings can be rescheduled');
  }

  // Check if new date is in the future
  if (new Date(newScheduledDate) <= new Date()) {
    throw new ValidationError('New scheduled date must be in the future');
  }

  // Check provider availability at new time
  const conflictingBooking = await Booking.findOne({
    where: {
      id: { [Op.ne]: id },
      providerId: booking.providerId,
      scheduledDate: {
        [Op.between]: [
          new Date(new Date(newScheduledDate).getTime() - booking.service.duration * 60000),
          new Date(new Date(newScheduledDate).getTime() + booking.service.duration * 60000)
        ]
      },
      status: { [Op.in]: ['confirmed', 'in_progress'] }
    }
  });

  if (conflictingBooking) {
    throw new ValidationError('Provider is not available at the new scheduled time');
  }

  // Update booking
  const timeline = booking.timeline || [];
  timeline.push({
    status: 'rescheduled',
    timestamp: new Date(),
    note: `Rescheduled from ${booking.scheduledDate} to ${newScheduledDate}. Reason: ${reason}`,
    updatedBy: userId
  });

  const rescheduleHistory = booking.rescheduleHistory || [];
  rescheduleHistory.push({
    oldDate: booking.scheduledDate,
    newDate: newScheduledDate,
    reason,
    rescheduledBy: userId,
    rescheduledAt: new Date()
  });

  await booking.update({
    scheduledDate: new Date(newScheduledDate),
    timeline,
    rescheduleHistory,
    rescheduleCount: (booking.rescheduleCount || 0) + 1
  });

  // Send notifications
  try {
    const otherUserId = booking.requesterId === userId ? booking.providerId : booking.requesterId;
    const otherUser = booking.requesterId === userId ? booking.provider : booking.requester;
    
    await emailService.sendBookingNotification(
      otherUser.email,
      'booking_rescheduled',
      {
        userName: otherUser.firstName,
        serviceName: booking.service.title,
        oldDate: booking.scheduledDate,
        newDate: newScheduledDate,
        reason,
        bookingId: booking.id
      }
    );

    await notificationService.createNotification({
      userId: otherUserId,
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `Booking for "${booking.service.title}" has been rescheduled`,
      data: {
        bookingId: booking.id,
        oldDate: booking.scheduledDate,
        newDate: newScheduledDate
      }
    });
  } catch (error) {
    console.error('Failed to send reschedule notifications:', error.message, '\nStack:', error.stack);
  }

  res.json({
    success: true,
    message: 'Booking rescheduled successfully',
    data: { booking }
  });
});

// Get user bookings
const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    type = 'all', // 'requested', 'provided', 'all'
    status,
    page = 1,
    limit = 20,
    sortBy = 'scheduledDate',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;
  const order = [[sortBy, sortOrder.toUpperCase()]];

  // Build where clause
  const where = {};

  if (type === 'requested') {
    where.requesterId = userId;
  } else if (type === 'provided') {
    where.providerId = userId;
  } else {
    where[Op.or] = [
      { requesterId: userId },
      { providerId: userId }
    ];
  }

  if (status) {
    where.status = status;
  }

  const { count, rows: bookings } = await Booking.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order,
    include: [
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'title', 'price', 'currency', 'duration', 'images']
      },
      {
        model: User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      },
      {
        model: User,
        as: 'provider',
        attributes: ['id', 'firstName', 'lastName', 'profilePicture']
      },
      {
        model: Payment,
        as: 'payment',
        attributes: ['id', 'status', 'amount', 'currency']
      }
    ]
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBookings: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
});

// Get upcoming bookings
const getUpcomingBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10 } = req.query;

  const bookings = await Booking.getUpcomingBookings(userId, parseInt(limit));

  res.json({
    success: true,
    data: { bookings }
  });
});

// Get booking statistics
const getBookingStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period = '30d' } = req.query;

  const stats = await Booking.getBookingStats(userId, period);

  res.json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
  getUserBookings,
  getUpcomingBookings,
  getBookingStats
};