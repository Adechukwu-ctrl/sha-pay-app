const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { RateLimitError } = require('./errorHandler');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      throw new RateLimitError(message, Math.ceil(windowMs / 1000));
    }
  });
};

// General rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later',
  true // skip successful requests
);

// Password reset rate limiting
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 password reset requests per hour
  'Too many password reset attempts, please try again later'
);

// Registration rate limiting
const registrationLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 registration attempts per hour
  'Too many registration attempts, please try again later'
);

// File upload rate limiting
const uploadLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 upload requests per windowMs
  'Too many file upload attempts, please try again later'
);

// Payment rate limiting
const paymentLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // limit each IP to 20 payment requests per hour
  'Too many payment attempts, please try again later'
);

// API rate limiting for authenticated users
const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 requests per windowMs
  'API rate limit exceeded, please try again later'
);

// Slow down middleware for repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: () => 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // maximum delay of 20 seconds
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:8081',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'X-Client-Version',
    'X-Platform'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

// Helmet security configuration
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: {
    policy: process.env.NODE_ENV === 'production' ? 'cross-origin' : 'same-site'
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: {
    action: 'deny'
  },
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
};

// Compression configuration
const compressionOptions = {
  filter: (req, res) => {
    // Don't compress responses if this request has a 'x-no-compression' header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
  memLevel: 8 // Memory usage level (1-9)
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  res.setHeader('X-Response-Time', Date.now() - req.startTime);
  
  // Prevent caching of sensitive endpoints
  if (req.path.includes('/auth/') || req.path.includes('/payment/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  
  next();
};

// Request timing middleware
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // In development, allow all IPs
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Check if IP is in whitelist
    const isAllowed = allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR notation support would require additional library
        return false;
      }
      return clientIP === allowedIP;
    });
    
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        errorCode: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

// API key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  // Skip API key validation in development
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_API_KEY) {
    return next();
  }
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key',
      errorCode: 'INVALID_API_KEY'
    });
  }
  
  next();
};

// Request size limiting middleware
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength && contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request too large. Maximum size is ${maxSize}`,
        errorCode: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

// User agent validation middleware
const validateUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  
  // Block requests without user agent (potential bots)
  if (!userAgent && process.env.REQUIRE_USER_AGENT === 'true') {
    return res.status(400).json({
      success: false,
      message: 'User agent is required',
      errorCode: 'MISSING_USER_AGENT'
    });
  }
  
  // Block known bad user agents
  const blockedUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  if (process.env.BLOCK_BOTS === 'true' && userAgent) {
    const isBlocked = blockedUserAgents.some(pattern => pattern.test(userAgent));
    
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errorCode: 'BLOCKED_USER_AGENT'
      });
    }
  }
  
  next();
};

module.exports = {
  // Rate limiters
  generalLimiter,
  generalRateLimit: generalLimiter,
  authLimiter,
  authRateLimit: authLimiter,
  passwordResetLimiter,
  passwordResetRateLimit: passwordResetLimiter,
  registrationLimiter,
  registrationRateLimit: registrationLimiter,
  uploadLimiter,
  uploadRateLimit: uploadLimiter,
  paymentLimiter,
  paymentRateLimit: paymentLimiter,
  apiLimiter,
  speedLimiter,
  
  // Security configurations
  corsOptions,
  helmetOptions,
  compressionOptions,
  
  // Middleware functions
  securityHeaders,
  requestTiming,
  ipWhitelist,
  validateApiKey,
  requestSizeLimit,
  validateUserAgent,
  
  // Configured middleware
  cors: cors(corsOptions),
  helmet: helmet(helmetOptions),
  compression: compression(compressionOptions)
};