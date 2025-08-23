import httpClient from './httpClient';
import { API_ENDPOINTS, buildUrl, STORAGE_KEYS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class NotificationService {
  // Get all notifications for a user
  async getNotifications(userId, page = 1, limit = 20) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.NOTIFICATIONS.LIST, { userId }), {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      // Mock notifications for development
      return {
        notifications: [
          {
            id: 'notif_1',
            userId,
            type: 'job_application',
            title: 'New Job Application',
            message: 'John Doe applied for your Website Development job',
            data: {
              jobId: 'job_123',
              applicantId: 'user_456',
              applicantName: 'John Doe'
            },
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            priority: 'high'
          },
          {
            id: 'notif_2',
            userId,
            type: 'payment_received',
            title: 'Payment Received',
            message: 'You received ₦45,000 for Logo Design project',
            data: {
              paymentId: 'pay_789',
              amount: 45000,
              jobId: 'job_456'
            },
            read: false,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            priority: 'medium'
          },
          {
            id: 'notif_3',
            userId,
            type: 'job_completed',
            title: 'Job Completed',
            message: 'Mobile App Development project has been marked as completed',
            data: {
              jobId: 'job_789',
              completedBy: 'user_123'
            },
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            priority: 'medium'
          },
          {
            id: 'notif_4',
            userId,
            type: 'message_received',
            title: 'New Message',
            message: 'Jane Smith sent you a message about Website Development',
            data: {
              conversationId: 'conv_123',
              senderId: 'user_789',
              senderName: 'Jane Smith'
            },
            read: true,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            priority: 'low'
          },
          {
            id: 'notif_5',
            userId,
            type: 'verification_approved',
            title: 'Verification Approved',
            message: 'Your identity verification has been approved. Credit rating: A',
            data: {
              verificationType: 'identity',
              creditRating: 'A'
            },
            read: true,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            priority: 'high'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalNotifications: 5,
          hasMore: false
        },
        unreadCount: 2
      };
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds) {
    try {
      const response = await httpClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, {
        notificationIds
      });
      return response.data;
    } catch (error) {
      // Mock mark as read for development
      return {
        success: true,
        markedCount: notificationIds.length,
        markedAt: new Date().toISOString()
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const response = await httpClient.put(buildUrl(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, { userId }));
      return response.data;
    } catch (error) {
      // Mock mark all as read for development
      return {
        success: true,
        message: 'All notifications marked as read',
        markedAt: new Date().toISOString()
      };
    }
  }

  // Delete notifications
  async deleteNotifications(notificationIds) {
    try {
      const response = await httpClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE, {
        data: { notificationIds }
      });
      return response.data;
    } catch (error) {
      // Mock delete for development
      return {
        success: true,
        deletedCount: notificationIds.length,
        deletedAt: new Date().toISOString()
      };
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, { userId }));
      return response.data;
    } catch (error) {
      // Mock unread count for development
      return {
        unreadCount: 3,
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Update notification preferences
  async updatePreferences(userId, preferences) {
    try {
      const response = await httpClient.put(buildUrl(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, { userId }), preferences);
      return response.data;
    } catch (error) {
      // Mock preferences update for development
      return {
        success: true,
        preferences,
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Get notification preferences
  async getPreferences(userId) {
    try {
      const response = await httpClient.get(buildUrl(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, { userId }));
      return response.data;
    } catch (error) {
      // Mock preferences for development
      return {
        preferences: {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          jobApplications: true,
          paymentUpdates: true,
          messageNotifications: true,
          jobCompletions: true,
          verificationUpdates: true,
          marketingEmails: false,
          weeklyDigest: true,
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00'
          }
        }
      };
    }
  }

  // Send push notification (for admin/system use)
  async sendNotification(notificationData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, notificationData);
      return response.data;
    } catch (error) {
      // Mock send notification for development
      return {
        success: true,
        notificationId: `notif_${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipients: notificationData.recipients || []
      };
    }
  }

  // Register device for push notifications
  async registerDevice(deviceToken, platform) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE, {
        deviceToken,
        platform, // 'ios' or 'android'
        appVersion: '1.0.0'
      });
      
      // Store device token locally
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
      
      return response.data;
    } catch (error) {
      // Mock device registration for development
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
      return {
        success: true,
        deviceId: `device_${Date.now()}`,
        registeredAt: new Date().toISOString()
      };
    }
  }

  // Unregister device from push notifications
  async unregisterDevice() {
    try {
      const deviceToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      if (deviceToken) {
        const response = await httpClient.delete(API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_DEVICE, {
          data: { deviceToken }
        });
        
        // Remove device token from local storage
        await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN);
        
        return response.data;
      }
      return { success: true, message: 'No device token found' };
    } catch (error) {
      // Mock device unregistration for development
      await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN);
      return {
        success: true,
        unregisteredAt: new Date().toISOString()
      };
    }
  }

  // Handle notification tap/click
  handleNotificationTap(notification) {
    try {
      // Mark notification as read
      this.markAsRead([notification.id]);
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'job_application':
          return {
            screen: 'JobDetails',
            params: { jobId: notification.data.jobId }
          };
        case 'payment_received':
        case 'payment_sent':
          return {
            screen: 'PaymentHistory',
            params: { paymentId: notification.data.paymentId }
          };
        case 'job_completed':
        case 'job_accepted':
          return {
            screen: 'JobDetails',
            params: { jobId: notification.data.jobId }
          };
        case 'message_received':
          return {
            screen: 'Chat',
            params: { conversationId: notification.data.conversationId }
          };
        case 'verification_approved':
        case 'verification_rejected':
          return {
            screen: 'Profile',
            params: { tab: 'verification' }
          };
        default:
          return {
            screen: 'Notifications'
          };
      }
    } catch (error) {
      console.error('Error handling notification tap:', error);
      return { screen: 'Notifications' };
    }
  }

  // Format notification for display
  formatNotification(notification) {
    const timeAgo = this.getTimeAgo(notification.createdAt);
    
    return {
      ...notification,
      timeAgo,
      icon: this.getNotificationIcon(notification.type),
      color: this.getNotificationColor(notification.priority)
    };
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      job_application: 'briefcase',
      payment_received: 'credit-card',
      payment_sent: 'send',
      job_completed: 'check-circle',
      job_accepted: 'thumbs-up',
      message_received: 'message-circle',
      verification_approved: 'shield-check',
      verification_rejected: 'shield-x',
      system_update: 'info',
      promotion: 'gift'
    };
    return icons[type] || 'bell';
  }

  // Get notification color based on priority
  getNotificationColor(priority) {
    const colors = {
      high: '#FF4444',
      medium: '#FF8800',
      low: '#4CAF50'
    };
    return colors[priority] || '#666666';
  }

  // Get time ago string
  getTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Show local notification (for testing)
  showLocalNotification(title, message, data = {}) {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Dismiss',
          style: 'cancel'
        },
        {
          text: 'View',
          onPress: () => {
            // Handle notification tap
            const navigation = this.handleNotificationTap({ type: data.type, data });
            console.log('Navigate to:', navigation);
          }
        }
      ]
    );
  }

  // Validate notification data
  validateNotificationData(data) {
    const requiredFields = ['type', 'title', 'message', 'recipients'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
      throw new Error('Recipients must be a non-empty array');
    }
    
    return true;
  }
}

export default new NotificationService();