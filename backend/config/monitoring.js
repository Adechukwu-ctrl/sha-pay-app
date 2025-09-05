const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists (only in development)
const logsDir = path.join(__dirname, '..', 'logs');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'sha-pay-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: process.env.NODE_ENV === 'production' ? [
    // In production, use console logging only
    new winston.transports.Console({
      format: consoleFormat
    })
  ] : [
    // In development, use file logging
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Application logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  
  // Handle exceptions
  exceptionHandlers: process.env.NODE_ENV === 'production' ? [
    new winston.transports.Console({
      format: consoleFormat
    })
  ] : [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle rejections
  rejectionHandlers: process.env.NODE_ENV === 'production' ? [
    new winston.transports.Console({
      format: consoleFormat
    })
  ] : [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: []
    };
    
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }
  
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memoryUsage.push({
      timestamp: new Date(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });
    
    this.metrics.cpuUsage.push({
      timestamp: new Date(),
      user: cpuUsage.user,
      system: cpuUsage.system
    });
    
    // Keep only last 100 entries
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }
    
    if (this.metrics.cpuUsage.length > 100) {
      this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-100);
    }
    
    // Log system metrics
    logger.info('System metrics collected', {
      memory: memUsage,
      cpu: cpuUsage,
      uptime: process.uptime()
    });
  }
  
  recordRequest(responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push({
      timestamp: new Date(),
      time: responseTime
    });
    
    // Keep only last 1000 entries
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }
  }
  
  recordError() {
    this.metrics.errors++;
  }
  
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((sum, entry) => sum + entry.time, 0) / this.metrics.responseTime.length
      : 0;
    
    return {
      ...this.metrics,
      averageResponseTime: avgResponseTime,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
    };
  }
  
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      memoryUsage: [],
      cpuUsage: []
    };
  }
}

// Health check function
const healthCheck = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  try {
    // Check database connection
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'unhealthy';
    logger.error('Database health check failed', { error: error.message });
  }
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (memUsagePercent > 90) {
    health.status = 'warning';
    health.warnings = health.warnings || [];
    health.warnings.push('High memory usage');
  }
  
  return health;
};

// Alert system
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      errorRate: 5, // 5%
      responseTime: 5000, // 5 seconds
      memoryUsage: 90 // 90%
    };
  }
  
  checkAlerts(metrics) {
    const alerts = [];
    
    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
        severity: 'high',
        timestamp: new Date()
      });
    }
    
    // Check average response time
    if (metrics.averageResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        message: `High response time: ${metrics.averageResponseTime.toFixed(2)}ms`,
        severity: 'medium',
        timestamp: new Date()
      });
    }
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory_usage',
        message: `High memory usage: ${memUsagePercent.toFixed(2)}%`,
        severity: 'high',
        timestamp: new Date()
      });
    }
    
    // Log alerts
    alerts.forEach(alert => {
      logger.warn('Alert triggered', alert);
      this.alerts.push(alert);
    });
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    return alerts;
  }
  
  getAlerts() {
    return this.alerts;
  }
}

// Create instances
const performanceMonitor = new PerformanceMonitor();
const alertSystem = new AlertSystem();

// Export everything
module.exports = {
  logger,
  performanceMonitor,
  alertSystem,
  healthCheck
};