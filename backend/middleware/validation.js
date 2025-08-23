const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    throw new ValidationError('Validation failed', formattedErrors);
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
    
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  confirmPassword: body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  phone: body('phone')
    .optional()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
    
  phoneRequired: body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters'),
    
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`),
    
  id: (paramName = 'id') => param(paramName)
    .isUUID(4)
    .withMessage(`${paramName} must be a valid UUID`),
    
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer between 1 and 1000')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be a positive integer between 1 and 100')
      .toInt(),
    query('sortBy')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('SortBy must be between 1 and 50 characters')
      .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      .withMessage('SortBy must be a valid field name'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('SortOrder must be either asc or desc')
  ],
  
  location: [
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Address must be between 5 and 255 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters'),
    body('zipCode')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Zip code must be between 3 and 20 characters')
  ]
};

// User validation schemas
const userValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.confirmPassword,
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.phoneRequired,
    body('userType')
      .isIn(['provider', 'requester'])
      .withMessage('User type must be either provider or requester'),
    body('agreeToTerms')
      .isBoolean()
      .withMessage('Agreement to terms must be a boolean')
      .custom((value) => {
        if (!value) {
          throw new Error('You must agree to the terms and conditions');
        }
        return true;
      }),
    body('agreeToPrivacy')
      .isBoolean()
      .withMessage('Agreement to privacy policy must be a boolean')
      .custom((value) => {
        if (!value) {
          throw new Error('You must agree to the privacy policy');
        }
        return true;
      }),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean'),
    handleValidationErrors
  ],
  
  updateProfile: [
    commonValidations.name('firstName').optional(),
    commonValidations.name('lastName').optional(),
    commonValidations.phone,
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Bio must not exceed 1000 characters'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Date of birth must be a valid date')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 18 || age > 120) {
          throw new Error('Age must be between 18 and 120 years');
        }
        return true;
      }),
    ...commonValidations.location,
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    commonValidations.confirmPassword,
    handleValidationErrors
  ],
  
  forgotPassword: [
    commonValidations.email,
    handleValidationErrors
  ],
  
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 32, max: 128 })
      .withMessage('Invalid reset token format'),
    commonValidations.password,
    commonValidations.confirmPassword,
    handleValidationErrors
  ]
};

// Service validation schemas
const serviceValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    body('subcategory')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Subcategory must be between 2 and 50 characters'),
    body('price')
      .isFloat({ min: 0, max: 999999.99 })
      .withMessage('Price must be a positive number up to 999,999.99'),
    body('currency')
      .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'])
      .withMessage('Currency must be a valid currency code'),
    body('duration')
      .isInt({ min: 15, max: 10080 })
      .withMessage('Duration must be between 15 minutes and 1 week (10080 minutes)'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Tags must be an array with maximum 10 items'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 2, max: 30 })
      .withMessage('Each tag must be between 2 and 30 characters'),
    body('requirements')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Requirements must not exceed 1000 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    ...commonValidations.location,
    handleValidationErrors
  ],
  
  update: [
    commonValidations.id(),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0, max: 999999.99 })
      .withMessage('Price must be a positive number up to 999,999.99'),
    body('duration')
      .optional()
      .isInt({ min: 15, max: 10080 })
      .withMessage('Duration must be between 15 minutes and 1 week'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    handleValidationErrors
  ],
  
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    query('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),
    query('radius')
      .optional()
      .isFloat({ min: 1, max: 100 })
      .withMessage('Radius must be between 1 and 100 km'),
    ...commonValidations.pagination,
    handleValidationErrors
  ]
};

// Booking validation schemas
const bookingValidations = {
  create: [
    body('serviceId')
      .isUUID(4)
      .withMessage('Service ID must be a valid UUID'),
    body('scheduledDate')
      .isISO8601()
      .withMessage('Scheduled date must be a valid date')
      .custom((value) => {
        const scheduledDate = new Date(value);
        const now = new Date();
        
        if (scheduledDate <= now) {
          throw new Error('Scheduled date must be in the future');
        }
        
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        
        if (scheduledDate > maxDate) {
          throw new Error('Scheduled date cannot be more than 1 year in the future');
        }
        
        return true;
      }),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    ...commonValidations.location,
    handleValidationErrors
  ],
  
  update: [
    commonValidations.id(),
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be a valid booking status'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid date'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    handleValidationErrors
  ],
  
  addRating: [
    commonValidations.id(),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Review must not exceed 1000 characters'),
    handleValidationErrors
  ]
};

// Payment validation schemas
const paymentValidations = {
  create: [
    body('bookingId')
      .isUUID(4)
      .withMessage('Booking ID must be a valid UUID'),
    body('amount')
      .isFloat({ min: 0.01, max: 999999.99 })
      .withMessage('Amount must be between 0.01 and 999,999.99'),
    body('currency')
      .isIn(['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'])
      .withMessage('Currency must be a valid currency code'),
    body('paymentMethod')
      .isIn(['card', 'bank_transfer', 'mobile_money', 'wallet'])
      .withMessage('Payment method must be valid'),
    handleValidationErrors
  ],
  
  webhook: [
    body('event')
      .notEmpty()
      .withMessage('Event is required'),
    body('data')
      .isObject()
      .withMessage('Data must be an object'),
    handleValidationErrors
  ]
};

// File upload validation
const fileValidations = {
  profilePicture: [
    body('type')
      .optional()
      .isIn(['profile', 'service', 'document'])
      .withMessage('File type must be profile, service, or document'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  userValidations,
  serviceValidations,
  bookingValidations,
  paymentValidations,
  fileValidations
};