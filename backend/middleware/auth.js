const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN'
      });
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
        error: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is deactivated.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is blocked.',
        error: 'ACCOUNT_BLOCKED'
      });
    }
    
    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Account is temporarily locked.',
        error: 'ACCOUNT_LOCKED'
      });
    }
    
    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error.message, '\nStack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: 'AUTH_ERROR'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    
    if (user && user.isActive && !user.isBlocked && !user.isAccountLocked()) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Check if user has specific role/userType
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: userRoles,
        current: req.user.userType
      });
    }
    
    next();
  };
};

// Check if user is service provider
const requireProvider = requireRole('provider');

// Check if user is service requester
const requireRequester = requireRole('requirer');

// Check if user is admin (for future admin features)
const requireAdmin = requireRole('admin');

// Check if user owns the resource
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;
    
    // For resources that have userId field
    if (req.body && req.body[userIdField] && req.body[userIdField] !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'OWNERSHIP_REQUIRED'
      });
    }
    
    // Store for further validation in route handlers
    req.resourceId = resourceId;
    req.ownershipRequired = true;
    
    next();
  };
};

// Check if user can access booking (either as provider or requester)
const requireBookingAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user.id;
    
    // This will be validated in the route handler with actual booking data
    req.bookingId = bookingId;
    req.bookingAccessRequired = true;
    
    next();
  } catch (error) {
    console.error('Booking access middleware error:', error.message, '\nStack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization.',
      error: 'AUTH_ERROR'
    });
  }
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get user's request history
    let userRequests = requests.get(userId) || [];
    
    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded the limit
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, value] of requests.entries()) {
        const filteredRequests = value.filter(timestamp => timestamp > windowStart);
        if (filteredRequests.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filteredRequests);
        }
      }
    }
    
    next();
  };
};

// Verify email before certain actions
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to perform this action.',
      error: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

// Verify phone before certain actions
const requirePhoneVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  if (!req.user.isPhoneVerified) {
    return res.status(403).json({
      success: false,
      message: 'Phone verification required to perform this action.',
      error: 'PHONE_VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

// Check account verification status
const requireAccountVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Account verification required to perform this action.',
      error: 'ACCOUNT_VERIFICATION_REQUIRED',
      verificationStatus: req.user.verificationStatus
    });
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRE || '24h') => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Generate both access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  return { accessToken, refreshToken };
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  requireProvider,
  requireRequester,
  requireAdmin,
  requireOwnership,
  requireBookingAccess,
  userRateLimit,
  requireEmailVerification,
  requirePhoneVerification,
  requireAccountVerification,
  generateToken,
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken
};