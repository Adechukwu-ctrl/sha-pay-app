import React from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';
import { colors, spacing, borderRadius, shadows } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * ThemedModal component provides consistent modal styling throughout the app
 * with various sizes and configurations
 */
const ThemedModal = ({
  visible = false,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'fade',
  transparent = true,
  scrollable = false,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  ...props
}) => {
  // Get modal size styles
  const getModalSizeStyles = () => {
    const baseStyle = {
      backgroundColor: colors.background.paper,
      borderRadius: borderRadius.lg,
      ...shadows.lg,
    };
    
    switch (size) {
      case 'small':
        return {
          ...baseStyle,
          width: Math.min(screenWidth * 0.8, 320),
          maxHeight: screenHeight * 0.6,
        };
      case 'large':
        return {
          ...baseStyle,
          width: Math.min(screenWidth * 0.95, 600),
          maxHeight: screenHeight * 0.9,
        };
      case 'fullscreen':
        return {
          ...baseStyle,
          width: screenWidth,
          height: screenHeight,
          borderRadius: 0,
        };
      default: // medium
        return {
          ...baseStyle,
          width: Math.min(screenWidth * 0.9, 400),
          maxHeight: screenHeight * 0.8,
        };
    }
  };
  
  // Get modal position styles
  const getModalPositionStyles = () => {
    const baseStyle = {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    };
    
    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: spacing[8],
        };
      case 'bottom':
        return {
          ...baseStyle,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: spacing[8],
        };
      case 'left':
        return {
          ...baseStyle,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingLeft: spacing[4],
        };
      case 'right':
        return {
          ...baseStyle,
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingRight: spacing[4],
        };
      default: // center
        return {
          ...baseStyle,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        };
    }
  };
  
  // Get header styles
  const getHeaderStyles = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: title ? 1 : 0,
    borderBottomColor: colors.border.light,
  });
  
  // Get content styles
  const getContentStyles = () => ({
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    flex: scrollable ? 1 : 0,
  });
  
  const modalSizeStyles = getModalSizeStyles();
  const modalPositionStyles = getModalPositionStyles();
  const headerStyles = getHeaderStyles();
  const contentStyles = getContentStyles();
  
  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };
  
  // Render modal content
  const renderContent = () => {
    const ContentWrapper = scrollable ? ScrollView : View;
    const contentWrapperProps = scrollable ? {
      showsVerticalScrollIndicator: false,
      bounces: false,
    } : {};
    
    return (
      <View style={[modalSizeStyles, style]}>
        {/* Header */}
        {(title || showCloseButton) && (
          <View style={[headerStyles, headerStyle]}>
            {title && (
              <ThemedText variant="h6" style={{ flex: 1 }}>
                {title}
              </ThemedText>
            )}
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                style={{
                  padding: spacing[2],
                  marginRight: -spacing[2],
                }}
              >
                <Icon
                  name="close"
                  size={24}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Content */}
        <ContentWrapper
          style={[contentStyles, contentStyle]}
          {...contentWrapperProps}
        >
          {children}
        </ContentWrapper>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
      {...props}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={modalPositionStyles}>
          <TouchableWithoutFeedback>
            {renderContent()}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Convenience components for common modal types
export const AlertModal = ({
  visible,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
  ...props
}) => {
  const getTypeConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          iconColor: colors.success,
          confirmVariant: 'success',
        };
      case 'warning':
        return {
          icon: 'alert',
          iconColor: colors.warning,
          confirmVariant: 'warning',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: colors.error,
          confirmVariant: 'danger',
        };
      default: // info
        return {
          icon: 'information',
          iconColor: colors.info,
          confirmVariant: 'primary',
        };
    }
  };
  
  const config = getTypeConfig(type);
  
  return (
    <ThemedModal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      closeOnBackdrop={false}
      showCloseButton={false}
      {...props}
    >
      <View style={{ alignItems: 'center', marginBottom: spacing[6] }}>
        <Icon
          name={config.icon}
          size={48}
          color={config.iconColor}
          style={{ marginBottom: spacing[4] }}
        />
        <ThemedText
          variant="body1"
          style={{ textAlign: 'center', lineHeight: 24 }}
        >
          {message}
        </ThemedText>
      </View>
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing[3],
      }}>
        {onCancel && (
          <ThemedButton
            variant="outline"
            onPress={() => {
              onCancel();
              onClose();
            }}
          >
            {cancelText}
          </ThemedButton>
        )}
        <ThemedButton
          variant={config.confirmVariant}
          onPress={() => {
            onConfirm?.();
            onClose();
          }}
        >
          {confirmText}
        </ThemedButton>
      </View>
    </ThemedModal>
  );
};

export const ConfirmModal = ({
  visible,
  onClose,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  ...props
}) => (
  <AlertModal
    visible={visible}
    onClose={onClose}
    title={title}
    message={message}
    confirmText={confirmText}
    cancelText={cancelText}
    onConfirm={onConfirm}
    onCancel={onCancel || onClose}
    type={destructive ? 'error' : 'info'}
    {...props}
  />
);

export const BottomSheetModal = ({
  visible,
  onClose,
  children,
  title,
  ...props
}) => (
  <ThemedModal
    visible={visible}
    onClose={onClose}
    title={title}
    position="bottom"
    animationType="slide"
    style={{
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      width: screenWidth,
      maxHeight: screenHeight * 0.9,
    }}
    {...props}
  >
    {children}
  </ThemedModal>
);

export const FullScreenModal = ({
  visible,
  onClose,
  children,
  title,
  ...props
}) => (
  <ThemedModal
    visible={visible}
    onClose={onClose}
    title={title}
    size="fullscreen"
    animationType="slide"
    scrollable
    {...props}
  >
    {children}
  </ThemedModal>
);

export const LoadingModal = ({
  visible,
  message = 'Loading...',
  ...props
}) => (
  <ThemedModal
    visible={visible}
    size="small"
    showCloseButton={false}
    closeOnBackdrop={false}
    {...props}
  >
    <View style={{
      alignItems: 'center',
      paddingVertical: spacing[4],
    }}>
      <ActivityIndicator
        size="large"
        color={colors.primary[500]}
        style={{ marginBottom: spacing[4] }}
      />
      <ThemedText variant="body2" color="text.secondary">
        {message}
      </ThemedText>
    </View>
  </ThemedModal>
);

export default ThemedModal;