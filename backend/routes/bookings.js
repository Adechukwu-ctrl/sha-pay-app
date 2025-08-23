const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
  getUserBookings,
  getUpcomingBookings,
  getBookingStats
} = require('../controllers/bookingController');
const {
  bookingValidations,
  handleValidationErrors
} = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const {
  verifyToken,
  requireAdmin,
  requireBookingAccess
} = require('../middleware/auth');
const { generalRateLimit } = require('../middleware/security');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (Admin only)
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  requireAdmin,
  generalRateLimit,
  getAllBookings
);

/**
 * @route   GET /api/bookings/my
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/my',
  verifyToken,
  generalRateLimit,
  getUserBookings
);

/**
 * @route   GET /api/bookings/upcoming
 * @desc    Get upcoming bookings for current user
 * @access  Private
 */
router.get('/upcoming',
  verifyToken,
  generalRateLimit,
  getUpcomingBookings
);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics for current user
 * @access  Private
 */
router.get('/stats',
  verifyToken,
  generalRateLimit,
  getBookingStats
);

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/',
  verifyToken,
  generalRateLimit,
  ...bookingValidations.create,
  handleValidationErrors,
  createBooking
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (Booking participants or Admin)
 */
router.get('/:id',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid booking ID'),
  handleValidationErrors,
  requireBookingAccess,
  getBookingById
);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Private (Booking participants or Admin)
 */
router.put('/:id/status',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid booking ID'),
  ...bookingValidations.update,
  handleValidationErrors,
  requireBookingAccess,
  updateBookingStatus
);

/**
 * @route   PUT /api/bookings/:id/reschedule
 * @desc    Reschedule booking
 * @access  Private (Booking participants or Admin)
 */
router.put('/:id/reschedule',
  verifyToken,
  requireBookingAccess,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid booking ID'),
  body('scheduledDate').isISO8601().withMessage('Scheduled date must be a valid date'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors,
  rescheduleBooking
);

module.exports = router;