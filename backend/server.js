const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Import database and models
const { sequelize } = require('./config/database');
const { syncDatabase } = require('./models');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const securityMiddleware = require('./middleware/security');
const { generalRateLimit } = require('./middleware/security');

// Import routes
const routes = require('./routes');

// Import services
const emailService = require('./services/emailService');
const notificationService = require('./services/notificationService');
const uploadService = require('./services/uploadService');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Winston logger
const logger = winston.createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sha-pay-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add console transport in development
if (NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      'exp://localhost:19000', // Expo dev server
      'http://192.168.100.90:19006', // Expo dev server on host IP
      'exp://192.168.100.90:19000', // Expo dev server on host IP
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rate limiting
app.use('/api/', generalRateLimit);

// Security middleware
app.use(securityMiddleware.requestTiming);
app.use(securityMiddleware.securityHeaders);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  const services = [
    { name: 'Email', service: emailService, critical: false },
    { name: 'Notification', service: notificationService, critical: false },
    { name: 'Upload', service: uploadService, critical: false }
  ];
  
  for (const { name, service, critical } of services) {
    try {
      await service.initialize();
      logger.info(`${name} service initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize ${name} service:`, { message: error.message, stack: error.stack });
      
      if (critical) {
        throw error;
      } else {
        logger.warn(`${name} service initialization failed, but continuing startup as it's not critical`);
      }
    }
  }
  
  logger.info('Service initialization completed');
};

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    
    // Test database connection
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    logger.info('Database connection established successfully.');
    
    // Sync database models
    console.log('🔄 Syncing database models...');
    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    } else {
      await sequelize.sync();
      logger.info('Database models verified.');
    }
    console.log('✅ Database models synced.');
    
    // Initialize services
    console.log('🔄 Initializing services...');
    await initializeServices();
    console.log('✅ Services initialized.');
    
    // Start the server
    console.log(`🔄 Starting server on port ${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Health check (network): http://192.168.100.90:${PORT}/health`);
      logger.info(`🔗 API base URL: http://localhost:${PORT}/api`);
      logger.info(`🔗 API base URL (network): http://192.168.100.90:${PORT}/api`);
      
      if (NODE_ENV === 'development') {
        logger.info(`📱 Frontend URL: http://localhost:19006`);
        logger.info(`📱 Frontend URL (network): http://192.168.100.90:19006`);
      }
    });
    
    // Set server timeout
    server.timeout = 30000; // 30 seconds
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
          // Close database connection
          await sequelize.close();
          logger.info('Database connection closed.');
          
          // Cleanup services
          await emailService.cleanup?.();
          await notificationService.cleanup?.();
          await uploadService.cleanup?.();
          logger.info('Services cleaned up.');
          
          logger.info('Graceful shutdown completed.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', { message: error.message, stack: error.stack });
          process.exit(1);
        }
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    logger.error('Failed to start server:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;