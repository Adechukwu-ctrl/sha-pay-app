const { Notification } = require('../models');
const { Op } = require('sequelize');
const winston = require('winston');
const admin = require('firebase-admin');
const webpush = require('web-push');

// Notification service class
class NotificationService {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/notification-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/notification.log' })
      ]
    });

    this.initializeFirebase();
    this.initializeWebPush();
  }

  // Initialize Firebase Admin SDK for push notifications
  initializeFirebase() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
          });
        }
        
        this.logger.info('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.warn('Firebase service account key not provided - push notifications disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', { message: error.message, stack: error.stack });
    }
  }

  // Initialize Web Push for browser notifications
  initializeWebPush() {
    try {
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@shapay.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        
        this.logger.info('Web Push initialized successfully');
      } else {
        this.logger.warn('VAPID keys not provided - web push notifications disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Web Push:', { message: error.message, stack: error.stack });
    }
  }

  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'normal',
    actionUrl = null,
    expiresAt = null
  }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        isRead: false,
        readAt: null
      });

      // Send push notification
      await this.sendPushNotification(userId, {
        title,
        message,
        data: {
          notificationId: notification.id,
          type,
          actionUrl,
          ...data
        }
      });

      this.logger.info('Notification created successfully', {
        notificationId: notification.id,
        userId,
        type,
        title
      });

      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Send push notification to user's devices
  async sendPushNotification(userId, payload) {
    try {
      // Get user's device tokens (you would store these in a UserDevice model)
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        this.logger.info('No device tokens found for user', { userId });
        return;
      }

      const promises = [];

      // Send Firebase push notifications
      if (admin.apps.length > 0) {
        const firebaseTokens = deviceTokens
          .filter(token => token.type === 'firebase')
          .map(token => token.token);

        if (firebaseTokens.length > 0) {
          const message = {
            notification: {
              title: payload.title,
              body: payload.message
            },
            data: {
              ...payload.data,
              click_action: payload.data.actionUrl || 'FLUTTER_NOTIFICATION_CLICK'
            },
            tokens: firebaseTokens
          };

          promises.push(
            admin.messaging().sendMulticast(message)
              .then(response => {
                this.logger.info('Firebase push notifications sent', {
                  userId,
                  successCount: response.successCount,
                  failureCount: response.failureCount
                });
                
                // Handle failed tokens
                if (response.failureCount > 0) {
                  this.handleFailedTokens(response.responses, firebaseTokens);
                }
              })
              .catch(error => {
                this.logger.error('Failed to send Firebase push notifications:', { message: error.message, stack: error.stack });
              })
          );
        }
      }

      // Send Web Push notifications
      const webPushSubscriptions = deviceTokens
        .filter(token => token.type === 'webpush')
        .map(token => JSON.parse(token.token));

      for (const subscription of webPushSubscriptions) {
        promises.push(
          webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: payload.title,
              body: payload.message,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              data: payload.data
            })
          )
          .then(() => {
            this.logger.info('Web push notification sent', { userId });
          })
          .catch(error => {
            this.logger.error('Failed to send web push notification:', { message: error.message, stack: error.stack });
            // Remove invalid subscription
            if (error.statusCode === 410) {
              this.removeDeviceToken(userId, JSON.stringify(subscription));
            }
          })
        );
      }

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('Failed to send push notifications:', { message: error.message, stack: error.stack });
    }
  }

  // Get user's device tokens (mock implementation - you'd implement this based on your UserDevice model)
  async getUserDeviceTokens(userId) {
    // This is a mock implementation
    // In a real app, you'd have a UserDevice model to store device tokens
    return [];
  }

  // Handle failed Firebase tokens
  async handleFailedTokens(responses, tokens) {
    const failedTokens = [];
    
    responses.forEach((response, index) => {
      if (!response.success) {
        const error = response.error;
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          failedTokens.push(tokens[index]);
        }
      }
    });

    // Remove invalid tokens from database
    if (failedTokens.length > 0) {
      // Implementation would remove these tokens from UserDevice model
      this.logger.info('Removed invalid device tokens', { count: failedTokens.length });
    }
  }

  // Remove device token
  async removeDeviceToken(userId, token) {
    // Implementation would remove token from UserDevice model
    this.logger.info('Device token removed', { userId });
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const offset = (page - 1) * limit;
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const where = {
      userId,
      expiresAt: {
        [Op.gt]: new Date()
      }
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      attributes: {
        exclude: ['updatedAt']
      }
    });

    const totalPages = Math.ceil(count / limit);

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalNotifications: count,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.isRead) {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    const result = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      }
    );

    return result[0]; // Number of affected rows
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const result = await Notification.destroy({
      where: {
        id: notificationId,
        userId
      }
    });

    return result > 0;
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        userId,
        isRead: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    return count;
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      this.logger.info('Cleaned up expired notifications', { count: result });
      return result;
    } catch (error) {
      this.logger.error('Failed to cleanup expired notifications:', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(notifications) {
    const promises = notifications.map(notification => 
      this.createNotification(notification)
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    this.logger.info('Bulk notifications sent', { successful, failed });

    return { successful, failed };
  }

  // Send notification to all users of a specific type
  async sendToUserType(userType, notification) {
    // This would require a User model query to get all users of a specific type
    // Implementation depends on your User model structure
    this.logger.info('Sending notification to user type', { userType, notification });
  }

  // Send system-wide announcement
  async sendAnnouncement(announcement) {
    // This would send to all active users
    // Implementation depends on your requirements
    this.logger.info('Sending system announcement', { announcement });
  }

  // Initialize method for external calls
  async initialize() {
    this.logger.info('Notification service initialized');
    return true;
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;