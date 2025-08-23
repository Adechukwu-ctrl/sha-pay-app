import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Button,
  Divider,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Modal = ({
  visible,
  onDismiss,
  children,
  title,
  subtitle,
  dismissable = true,
  animationType = 'slide', // 'slide', 'fade', 'none'
  position = 'bottom', // 'center', 'bottom', 'top'
  size = 'medium', // 'small', 'medium', 'large', 'fullscreen'
  showCloseButton = true,
  actions,
  style,
  contentStyle,
  overlayStyle,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [visible, dismissable]);

  const handleBackPress = () => {
    if (visible && dismissable) {
      onDismiss();
      return true;
    }
    return false;
  };

  const showModal = () => {
    const animations = [];

    if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'fade' || position === 'center') {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    }

    if (position === 'center') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const hideModal = () => {
    const animations = [];

    if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'fade' || position === 'center') {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      );
    }

    if (position === 'center') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const getModalSize = () => {
    switch (size) {
      case 'small':
        return {
          width: screenWidth * 0.8,
          maxHeight: screenHeight * 0.4,
        };
      case 'medium':
        return {
          width: screenWidth * 0.9,
          maxHeight: screenHeight * 0.6,
        };
      case 'large':
        return {
          width: screenWidth * 0.95,
          maxHeight: screenHeight * 0.8,
        };
      case 'fullscreen':
        return {
          width: screenWidth,
          height: screenHeight,
        };
      default:
        return {
          width: screenWidth * 0.9,
          maxHeight: screenHeight * 0.6,
        };
    }
  };

  const getTransform = () => {
    const transforms = [];

    if (animationType === 'slide') {
      if (position === 'bottom') {
        transforms.push({
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [screenHeight, 0],
          }),
        });
      } else if (position === 'top') {
        transforms.push({
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenHeight, 0],
          }),
        });
      }
    }

    if (position === 'center') {
      transforms.push({ scale: scaleAnim });
    }

    return transforms;
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'center':
        return styles.centerPosition;
      case 'top':
        return styles.topPosition;
      case 'bottom':
      default:
        return styles.bottomPosition;
    }
  };

  const handleOverlayPress = () => {
    if (dismissable) {
      onDismiss();
    }
  };

  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerText}>
          {title && (
            <Text variant="titleLarge" style={styles.title}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {showCloseButton && (
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            iconColor={colors.onSurface}
          />
        )}
      </View>
    );
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <>
        <Divider style={styles.divider} />
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Button
              key={index}
              mode={action.mode || 'text'}
              onPress={action.onPress}
              style={[styles.actionButton, action.style]}
              labelStyle={action.labelStyle}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBackPress}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: animationType === 'fade' || position === 'center' ? fadeAnim : 1,
            },
            overlayStyle,
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modal,
                getPositionStyle(),
                getModalSize(),
                {
                  transform: getTransform(),
                },
                style,
              ]}
            >
              <Surface style={[styles.surface, size === 'fullscreen' && styles.fullscreenSurface]}>
                {renderHeader()}
                <View style={[styles.content, contentStyle]}>
                  {children}
                </View>
                {renderActions()}
              </Surface>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Specialized Modal Components
const ConfirmationModal = ({
  visible,
  onDismiss,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor = colors.primary,
  cancelButtonColor = colors.onSurface,
  ...props
}) => {
  const actions = [
    {
      label: cancelText,
      mode: 'text',
      onPress: onDismiss,
      labelStyle: { color: cancelButtonColor },
    },
    {
      label: confirmText,
      mode: 'contained',
      onPress: onConfirm,
      style: { backgroundColor: confirmButtonColor },
    },
  ];

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      position="center"
      size="small"
      actions={actions}
      {...props}
    >
      <Text variant="bodyMedium" style={styles.confirmationMessage}>
        {message}
      </Text>
    </Modal>
  );
};

const ActionSheetModal = ({
  visible,
  onDismiss,
  title,
  options = [],
  ...props
}) => {
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      position="bottom"
      size="medium"
      {...props}
    >
      <View style={styles.actionSheet}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionSheetOption,
              option.destructive && styles.destructiveOption,
            ]}
            onPress={() => {
              option.onPress && option.onPress();
              onDismiss();
            }}
            disabled={option.disabled}
          >
            <Text
              style={[
                styles.actionSheetOptionText,
                option.destructive && styles.destructiveOptionText,
                option.disabled && styles.disabledOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'transparent',
  },
  centerPosition: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -screenWidth * 0.45 }, { translateY: -screenHeight * 0.3 }],
  },
  topPosition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  surface: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 8,
  },
  fullscreenSurface: {
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.onSurface + '80',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    maxHeight: screenHeight * 0.6,
  },
  divider: {
    marginHorizontal: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    minWidth: 80,
  },
  confirmationMessage: {
    color: colors.onSurface,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionSheet: {
    paddingVertical: spacing.sm,
  },
  actionSheetOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline + '20',
  },
  actionSheetOptionText: {
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
  },
  destructiveOption: {
    backgroundColor: colors.errorContainer + '20',
  },
  destructiveOptionText: {
    color: colors.error,
    fontWeight: '600',
  },
  disabledOptionText: {
    color: colors.onSurface + '40',
  },
});

export default Modal;
export { ConfirmationModal, ActionSheetModal };