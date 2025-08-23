const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  handleWebhook,
  getPaymentById,
  getUserPayments,
  getPaymentStats,
  getProviderBalance
} = require('../controllers/paymentController');
const {
  paymentValidations,
  handleValidationErrors
} = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const {
  verifyToken,
  requireAdmin,
  optionalAuth
} = require('../middleware/auth');
const { generalRateLimit, paymentRateLimit } = require('../middleware/security');

/**
 * @route   POST /api/payments/intent
 * @desc    Create payment intent
 * @access  Private
 */
router.post('/intent',
  verifyToken,
  paymentRateLimit,
  ...paymentValidations.create,
  createPaymentIntent
);

/**
 * @route   POST /api/payments/:id/confirm
 * @desc    Confirm payment
 * @access  Private
 */
router.post('/:id/confirm',
  verifyToken,
  paymentRateLimit,
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  handleValidationErrors,
  confirmPayment
);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund
 * @access  Private
 */
router.post('/:id/refund',
  verifyToken,
  paymentRateLimit,
  param('id').isUUID().withMessage('Invalid payment ID'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be a positive number'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors,
  processRefund
);

/**
 * @route   POST /api/payments/webhook/:gateway
 * @desc    Handle payment gateway webhooks
 * @access  Public (but verified by gateway signature)
 */
router.post('/webhook/:gateway',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

/**
 * @route   GET /api/payments/my
 * @desc    Get current user's payments
 * @access  Private
 */
router.get('/my',
  verifyToken,
  generalRateLimit,
  getUserPayments
);

/**
 * @route   GET /api/payments/balance
 * @desc    Get provider balance
 * @access  Private (Provider only)
 */
router.get('/balance',
  verifyToken,
  generalRateLimit,
  getProviderBalance
);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats',
  verifyToken,
  requireAdmin,
  generalRateLimit,
  getPaymentStats
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:id',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid payment ID'),
  handleValidationErrors,
  getPaymentById
);

module.exports = router;