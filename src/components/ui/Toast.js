import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanGestureHandler,
  State,
} from 'react-native';
import {
  Surface,
  Text,
  IconButton,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

const Toast = ({
  visible,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  duration = 4000,
  position = 'top', // 'top', 'bottom'
  onDismiss,
  action,
  style,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      showToast();
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss && onDismiss();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.successContainer,
          textColor: colors.onSuccessContainer,
          icon: 'check-circle',
          iconColor: colors.success,
        };
      case 'error':
        return {
          backgroundColor: colors.errorContainer,
          textColor: colors.onErrorContainer,
          icon: 'alert-circle',
          iconColor: colors.error,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningContainer || colors.secondaryContainer,
          textColor: colors.onWarningContainer || colors.onSecondaryContainer,
          icon: 'alert',
          iconColor: colors.warning || colors.secondary,
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primaryContainer,
          textColor: colors.onPrimaryContainer,
          icon: 'information',
          iconColor: colors.primary,
        };
    }
  };

  const config = getToastConfig();

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleGestureStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (Math.abs(translationY) > 50 || Math.abs(velocityY) > 500) {
        hideToast();
      } else {
        // Snap back to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, position === 'bottom' && styles.bottomContainer]}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              transform: [
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
        >
          <Surface
            style={[
              styles.toast,
              {
                backgroundColor: config.backgroundColor,
              },
              style,
            ]}
            elevation={4}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <IconButton
                  icon={config.icon}
                  size={20}
                  iconColor={config.iconColor}
                  style={styles.icon}
                />
              </View>
              
              <View style={styles.messageContainer}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.message,
                    { color: config.textColor },
                  ]}
                  numberOfLines={3}
                >
                  {message}
                </Text>
              </View>

              {action && (
                <TouchableOpacity
                  style={styles.actionContainer}
                  onPress={action.onPress}
                >
                  <Text
                    style={[
                      styles.actionText,
                      { color: config.iconColor },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeContainer}
                onPress={hideToast}
              >
                <IconButton
                  icon="close"
                  size={18}
                  iconColor={config.textColor + '80'}
                  style={styles.closeButton}
                />
              </TouchableOpacity>
            </View>
          </Surface>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Toast Manager Hook
const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const showToast = React.useCallback((config) => {
    const id = Date.now().toString();
    const toast = {
      id,
      ...config,
      visible: true,
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration
    if (config.duration !== 0) {
      setTimeout(() => {
        hideToast(id);
      }, config.duration || 4000);
    }

    return id;
  }, []);

  const hideToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const success = React.useCallback((message, options = {}) => {
    return showToast({ ...options, message, type: 'success' });
  }, [showToast]);

  const error = React.useCallback((message, options = {}) => {
    return showToast({ ...options, message, type: 'error' });
  }, [showToast]);

  const warning = React.useCallback((message, options = {}) => {
    return showToast({ ...options, message, type: 'warning' });
  }, [showToast]);

  const info = React.useCallback((message, options = {}) => {
    return showToast({ ...options, message, type: 'info' });
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    success,
    error,
    warning,
    info,
  };
};

// Toast Container Component
const ToastContainer = ({ toasts, onDismiss }) => {
  return (
    <View style={styles.toastContainer}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={0} // Managed by useToast hook
          position={toast.position}
          action={toast.action}
          onDismiss={() => onDismiss(toast.id)}
          style={{
            marginTop: index > 0 ? spacing.sm : 0,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  bottomContainer: {
    top: 'auto',
    bottom: 100,
  },
  toastWrapper: {
    width: '100%',
  },
  toast: {
    borderRadius: 12,
    minHeight: 60,
    maxWidth: screenWidth - (spacing.md * 2),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingRight: spacing.xs,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  icon: {
    margin: 0,
  },
  messageContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actionContainer: {
    marginRight: spacing.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  closeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    margin: 0,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});

export default Toast;
export { useToast, ToastContainer };