const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  uploadServiceImages,
  deleteServiceImage,
  searchServices,
  getFeaturedServices,
  getPopularServices,
  getCategories,
  getServicesByProvider
} = require('../controllers/serviceController');
const {
  serviceValidations,
  handleValidationErrors
} = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const {
  verifyToken,
  optionalAuth,
  requireProvider,
  requireOwnership
} = require('../middleware/auth');
const { generalRateLimit, uploadRateLimit } = require('../middleware/security');
const multer = require('multer');
const path = require('path');

// Configure multer for service image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * @route   GET /api/services
 * @desc    Get all services with filtering and pagination
 * @access  Public
 */
router.get('/',
  optionalAuth,
  generalRateLimit,
  getAllServices
);

/**
 * @route   GET /api/services/search
 * @desc    Search services
 * @access  Public
 */
router.get('/search',
  optionalAuth,
  generalRateLimit,
  query('q').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
  query('location').optional().isString().withMessage('Location must be a string'),
  handleValidationErrors,
  searchServices
);

/**
 * @route   GET /api/services/featured
 * @desc    Get featured services
 * @access  Public
 */
router.get('/featured',
  optionalAuth,
  generalRateLimit,
  getFeaturedServices
);

/**
 * @route   GET /api/services/popular
 * @desc    Get popular services
 * @access  Public
 */
router.get('/popular',
  optionalAuth,
  generalRateLimit,
  getPopularServices
);

/**
 * @route   GET /api/services/categories
 * @desc    Get service categories
 * @access  Public
 */
router.get('/categories',
  generalRateLimit,
  getCategories
);

/**
 * @route   GET /api/services/provider/:providerId
 * @desc    Get services by provider
 * @access  Public
 */
router.get('/provider/:providerId',
  optionalAuth,
  generalRateLimit,
  getServicesByProvider
);

/**
 * @route   POST /api/services
 * @desc    Create a new service
 * @access  Private (Provider only)
 */
router.post('/',
  verifyToken,
  requireProvider,
  generalRateLimit,
  ...serviceValidations.create,
  handleValidationErrors,
  createService
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id',
  optionalAuth,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid service ID'),
  handleValidationErrors,
  getServiceById
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Owner or Admin)
 */
router.put('/:id',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid service ID'),
  ...serviceValidations.update,
  handleValidationErrors,
  requireOwnership,
  updateService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service
 * @access  Private (Owner or Admin)
 */
router.delete('/:id',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid service ID'),
  handleValidationErrors,
  requireOwnership,
  deleteService
);

/**
 * @route   POST /api/services/:id/images
 * @desc    Upload service images
 * @access  Private (Owner or Admin)
 */
router.post('/:id/images',
  verifyToken,
  uploadRateLimit,
  param('id').isUUID().withMessage('Invalid service ID'),
  handleValidationErrors,
  requireOwnership,
  upload.array('images', 10),
  uploadServiceImages
);

/**
 * @route   DELETE /api/services/:id/images/:imageId
 * @desc    Delete service image
 * @access  Private (Owner or Admin)
 */
router.delete('/:id/images/:imageId',
  verifyToken,
  generalRateLimit,
  param('id').isUUID().withMessage('Invalid service ID'),
  param('imageId').isUUID().withMessage('Invalid image ID'),
  handleValidationErrors,
  requireOwnership,
  deleteServiceImage
);

// Middleware to handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "images" field name.'
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