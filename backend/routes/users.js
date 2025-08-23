const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserStats,
  deactivateAccount,
  reactivateAccount,
  deleteUser,
  searchUsers
} = require('../controllers/userController');
const {
  handleValidationErrors,
  userValidations
} = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const {
  verifyToken,
  requireRole,
  requireAdmin,
  requireOwnership
} = require('../middleware/auth');
const { generalRateLimit, uploadRateLimit } = require('../middleware/security');
const multer = require('multer');
const path = require('path');
const { uploadSingle, uploadMultiple } = require('../config/cloudStorage');

// Use cloud storage configuration for file uploads
const upload = uploadSingle('profilePicture');
const uploadDocuments = uploadMultiple('documents', 5); // For future document uploads

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/',
  verifyToken,
  requireAdmin,
  generalRateLimit,
  getAllUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search',
  verifyToken,
  generalRateLimit,
  query('q').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
  query('userType').optional().isIn(['provider', 'requester']).withMessage('Invalid user type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  searchUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get current user statistics
 * @access  Private
 */
router.get('/stats',
  verifyToken,
  generalRateLimit,
  getUserStats
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner or Admin)
 */
router.put('/:id',
  verifyToken,
  requireOwnership,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  body('firstName').optional().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
  handleValidationErrors,
  updateProfile
);

/**
 * @route   POST /api/users/:id/upload-picture
 * @desc    Upload profile picture
 * @access  Private (Owner or Admin)
 */
router.post('/:id/upload-picture',
  verifyToken,
  requireOwnership,
  uploadRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  upload,
  uploadProfilePicture
);

/**
 * @route   DELETE /api/users/:id/profile-picture
 * @desc    Delete profile picture
 * @access  Private (Owner or Admin)
 */
router.delete('/:id/profile-picture',
  verifyToken,
  requireOwnership,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  deleteProfilePicture
);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics by ID
 * @access  Private (Owner or Admin)
 */
router.get('/:id/stats',
  verifyToken,
  requireOwnership,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  getUserStats
);

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user account
 * @access  Private (Owner or Admin)
 */
router.post('/:id/deactivate',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  requireOwnership,
  deactivateAccount
);

/**
 * @route   POST /api/users/:id/reactivate
 * @desc    Reactivate user account
 * @access  Private (Admin only)
 */
router.post('/:id/reactivate',
  verifyToken,
  requireAdmin,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  reactivateAccount
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account
 * @access  Private (Admin only)
 */
router.delete('/:id',
  verifyToken,
  requireAdmin,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  deleteUser
);

// Middleware to handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;