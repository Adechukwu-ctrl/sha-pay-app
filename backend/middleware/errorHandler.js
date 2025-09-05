const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sha-pay-backend' },
  transports: process.env.NODE_ENV === 'production' ? [
    // In production, use console logging only
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ] : [
    new winston.transports.File({ 
      filename: process.env.ERROR_LOG_FILE || 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || 'logs/app.log'
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// Database error class
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

// Authentication error class
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error class
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Not found error class
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// Rate limit error class
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

// Payment error class
class PaymentError extends AppError {
  constructor(message, paymentErrorCode = null) {
    super(message, 402, 'PAYMENT_ERROR');
    this.paymentErrorCode = paymentErrorCode;
  }
}

// Service unavailable error class
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// Handle Sequelize validation errors
const handleSequelizeValidationError = (error) => {
  const errors = error.errors.map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }));
  
  return new ValidationError('Validation failed', errors);
};

// Handle Sequelize unique constraint errors
const handleSequelizeUniqueConstraintError = (error) => {
  const field = error.errors[0]?.path || 'field';
  const value = error.errors[0]?.value || 'value';
  
  return new ValidationError(
    `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`,
    [{
      field,
      message: `${field} must be unique`,
      value
    }]
  );
};

// Handle Sequelize foreign key constraint errors
const handleSequelizeForeignKeyConstraintError = (error) => {
  return new ValidationError(
    'Invalid reference to related resource',
    [{
      field: error.fields?.[0] || 'reference',
      message: 'Referenced resource does not exist',
      value: error.value
    }]
  );
};

// Handle JWT errors
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  return new AuthenticationError('Authentication failed');
};

// Handle Multer errors (file upload)
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File too large');
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field');
  }
  
  return new ValidationError('File upload error');
};

// Send error response in development
const sendErrorDev = (err, req, res) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      stack: err.stack,
      errors: err.errors || undefined,
      originalError: err.originalError?.message || undefined
    },
    request: {
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // Log error (without sensitive information)
  logger.error({
    error: err.message,
    errorCode: err.errorCode,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    isOperational: err.isOperational
  });
  
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
      errorCode: err.errorCode
    };
    
    // Add additional fields for specific error types
    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }
    
    if (err instanceof RateLimitError && err.retryAfter) {
      response.retryAfter = err.retryAfter;
      res.set('Retry-After', err.retryAfter);
    }
    
    if (err instanceof PaymentError && err.paymentErrorCode) {
      response.paymentErrorCode = err.paymentErrorCode;
    }
    
    res.status(err.statusCode).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('PROGRAMMING ERROR:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      errorCode: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  
  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(err);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraintError(err);
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = handleSequelizeForeignKeyConstraintError(err);
  } else if (err.name === 'SequelizeDatabaseError') {
    error = new DatabaseError('Database operation failed', err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  } else if (err.code === 'ECONNREFUSED') {
    error = new ServiceUnavailableError('Database connection failed');
  } else if (err.code === 'ENOTFOUND') {
    error = new ServiceUnavailableError('External service unavailable');
  } else if (err.type === 'entity.parse.failed') {
    error = new ValidationError('Invalid JSON in request body');
  } else if (err.type === 'entity.too.large') {
    error = new ValidationError('Request body too large');
  }
  
  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  process.exit(1);
});

module.exports = {
  errorHandler,
  asyncHandler,
  logger,
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  PaymentError,
  ServiceUnavailableError
};