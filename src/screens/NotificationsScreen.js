import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  ThemedAvatar,
  ThemedListItem,
  ThemedModal,
  SegmentedControl,
  LoadingSpinner,
  SkeletonCard,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Use individual selectors to avoid destructuring issues
  const notifications = useSelector((state) => {
    try {
      return state?.notifications?.notifications || [];
    } catch (e) {
      return [];
    }
  });
  
  const loading = useSelector((state) => {
    try {
      return state?.notifications?.loading || false;
    } catch (e) {
      return false;
    }
  });
  
  const unreadCount = useSelector((state) => {
    try {
      return state?.notifications?.unreadCount || 0;
    } catch (e) {
      return 0;
    }
  });
  
  const refreshing = useSelector((state) => {
    try {
      return state?.notifications?.refreshing || false;
    } catch (e) {
      return false;
    }
  });
  
  const [filter, setFilter] = useState(0); // 0: All, 1: Unread, 2: Job Related, 3: Payment
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const filterOptions = [
    { label: 'All', key: 'all' },
    { label: 'Unread', key: 'unread' },
    { label: 'Jobs', key: 'job' },
    { label: 'Payments', key: 'payment' },
  ];
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  const loadNotifications = useCallback(async () => {
    try {
      await dispatch(fetchNotifications()).unwrap();
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert(
        'Error',
        'Failed to load notifications. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [dispatch]);
  
  const handleRefresh = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);
  
  const getFilteredNotifications = () => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    switch (filter) {
      case 1: // Unread
        return notifications.filter(n => n && !n.read);
      case 2: // Job Related
        return notifications.filter(n => 
          n && ['job_application', 'job_accepted', 'job_completed', 'job_cancelled', 'job_dispute'].includes(n.type)
        );
      case 3: // Payment
        return notifications.filter(n => 
          n && ['payment_received', 'payment_sent', 'payment_failed', 'withdrawal_completed'].includes(n.type)
        );
      default: // All
        return notifications;
    }
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_application':
        return 'briefcase';
      case 'job_accepted':
      case 'job_completed':
        return 'check-circle';
      case 'job_cancelled':
      case 'job_dispute':
        return 'alert-circle';
      case 'payment_received':
      case 'payment_sent':
        return 'credit-card';
      case 'payment_failed':
        return 'x-circle';
      case 'withdrawal_completed':
        return 'download';
      case 'message':
        return 'message-circle';
      case 'rating':
        return 'star';
      case 'system':
        return 'settings';
      default:
        return 'bell';
    }
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case 'job_accepted':
      case 'job_completed':
      case 'payment_received':
      case 'withdrawal_completed':
        return colors.status.success;
      case 'job_cancelled':
      case 'job_dispute':
      case 'payment_failed':
        return colors.error;
      case 'job_application':
      case 'message':
        return colors.primary.main;
      case 'rating':
        return colors.warning;
      default:
        return colors.text.secondary;
    }
  };
  
  const handleNotificationPress = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await dispatch(markNotificationAsRead(notification.id)).unwrap();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'job_application':
      case 'job_accepted':
      case 'job_completed':
      case 'job_cancelled':
      case 'job_dispute':
        if (notification.data?.jobId) {
          navigation.navigate('JobDetails', { jobId: notification.data.jobId });
        }
        break;
      case 'message':
        if (notification.data?.chatId) {
          navigation.navigate('Chat', { chatId: notification.data.chatId });
        }
        break;
      case 'payment_received':
      case 'payment_sent':
      case 'payment_failed':
      case 'withdrawal_completed':
        navigation.navigate('PaymentHistory');
        break;
      case 'rating':
        navigation.navigate('Profile');
        break;
      default:
        // Show notification details
        setSelectedNotification(notification);
        break;
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      setShowDeleteModal(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };
  
  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearAllNotifications()).unwrap();
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };
  
  const renderNotificationItem = (notification) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    
    return (
      <ThemedListItem
        key={notification.id}
        title={notification.title}
        subtitle={notification.message}
        description={timeAgo}
        leftComponent={
          <View style={styles.notificationIconContainer}>
            <View
              style={[
                styles.notificationIcon,
                {
                  backgroundColor: getNotificationColor(notification.type),
                  opacity: notification.read ? 0.6 : 1,
                },
              ]}
            >
              {/* Icon would be rendered here */}
            </View>
            {!notification.read && (
              <View style={styles.unreadDot} />
            )}
          </View>
        }
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={(e) => {
              e.stopPropagation();
              setSelectedNotification(notification);
              setShowDeleteModal(true);
            }}
          >
            ×
          </ThemedButton>
        }
        onPress={() => handleNotificationPress(notification)}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification,
        ]}
      />
    );
  };
  
  const renderEmptyState = () => {
    const filterText = filterOptions[filter].label.toLowerCase();
    
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          {/* Bell icon would be rendered here */}
        </View>
        <ThemedText variant="h6" style={styles.emptyTitle}>
          No {filterText} notifications
        </ThemedText>
        <ThemedText variant="body2" style={styles.emptyMessage}>
          {filter === 0
            ? "You're all caught up! New notifications will appear here."
            : `No ${filterText} notifications at the moment.`}
        </ThemedText>
      </View>
    );
  };
  
  const renderLoadingState = () => (
    <View style={styles.content}>
      {[...Array(5)].map((_, index) => (
        <SkeletonCard key={index} style={styles.skeletonCard} />
      ))}
    </View>
  );
  
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => setShowSettingsModal(true)}
          >
            •••
          </ThemedButton>
        }
      />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          segments={filterOptions}
          selectedIndex={filter}
          onSelectionChange={setFilter}
        />
      </View>
      
      {loading && !refreshing ? (
        renderLoadingState()
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.notificationsList}>
              {filteredNotifications.map(renderNotificationItem)}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Settings Modal */}
      <ThemedModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Notification Settings"
        size="medium"
      >
        <View style={styles.settingsContent}>
          <ThemedListItem
            title="Mark All as Read"
            subtitle={`${unreadCount} unread notifications`}
            leftIcon="check-circle"
            onPress={() => {
              handleMarkAllAsRead();
              setShowSettingsModal(false);
            }}
            disabled={unreadCount === 0}
          />
          
          <ThemedListItem
            title="Clear All Notifications"
            subtitle="Delete all notifications permanently"
            leftIcon="trash-2"
            onPress={() => {
              setShowSettingsModal(false);
              handleClearAll();
            }}
            disabled={notifications.length === 0}
            style={{ marginTop: spacing[2] }}
          />
          
          <ThemedListItem
            title="Notification Preferences"
            subtitle="Manage notification settings"
            leftIcon="settings"
            rightIcon="chevron-right"
            onPress={() => {
              setShowSettingsModal(false);
              navigation.navigate('NotificationSettings');
            }}
            style={{ marginTop: spacing[2] }}
          />
        </View>
      </ThemedModal>
      
      {/* Delete Confirmation Modal */}
      <ThemedModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedNotification(null);
        }}
        title="Delete Notification"
        size="small"
      >
        <View style={styles.deleteContent}>
          <ThemedText variant="body1" style={{ marginBottom: spacing[4] }}>
            Are you sure you want to delete this notification?
          </ThemedText>
          
          <View style={styles.deleteActions}>
            <ThemedButton
              variant="outline"
              onPress={() => {
                setShowDeleteModal(false);
                setSelectedNotification(null);
              }}
              style={{ flex: 1, marginRight: spacing[2] }}
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              variant="error"
              onPress={() => handleDeleteNotification(selectedNotification?.id)}
              style={{ flex: 1 }}
            >
              Delete
            </ThemedButton>
          </View>
        </View>
      </ThemedModal>
      
      {/* Notification Details Modal */}
      {selectedNotification && !showDeleteModal && (
        <ThemedModal
          visible={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          title={selectedNotification.title}
          size="medium"
        >
          <View style={styles.detailsContent}>
            <ThemedText variant="body1" style={{ marginBottom: spacing[4] }}>
              {selectedNotification.message}
            </ThemedText>
            
            <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
              {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
            </ThemedText>
            
            {selectedNotification.data && (
              <View style={styles.notificationData}>
                <ThemedText variant="body2" style={{ marginTop: spacing[3] }}>
                  Additional Information:
                </ThemedText>
                <ThemedText variant="caption" style={{ marginTop: spacing[1] }}>
                  {JSON.stringify(selectedNotification.data, null, 2)}
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedModal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    paddingVertical: spacing[2],
  },
  notificationItem: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: 12,
    backgroundColor: colors.background.paper,
  },
  unreadNotification: {
    backgroundColor: colors.primary.light + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background.paper,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  skeletonCard: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    height: 80,
  },
  settingsContent: {
    paddingVertical: spacing[2],
  },
  deleteContent: {
    paddingVertical: spacing[2],
  },
  deleteActions: {
    flexDirection: 'row',
  },
  detailsContent: {
    paddingVertical: spacing[2],
  },
  notificationData: {
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.background.surface,
    borderRadius: 8,
  },
});

export default NotificationsScreen;