import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import { colors, spacing, borderRadius } from '../../theme';

/**
 * ThemedBadge component provides consistent badge styling throughout the app
 * for status indicators, notifications, and labels
 */
const ThemedBadge = ({
  children,
  variant = 'default',
  size = 'medium',
  color,
  backgroundColor,
  textColor,
  icon,
  iconPosition = 'left',
  onPress,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
          minHeight: 20,
          fontSize: 10,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          minHeight: 32,
          fontSize: 14,
          iconSize: 16,
        };
      default: // medium
        return {
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1],
          minHeight: 24,
          fontSize: 12,
          iconSize: 14,
        };
    }
  };
  
  // Get variant styles
  const getVariantStyles = () => {
    const variantStyles = {
      default: {
        backgroundColor: colors.neutral[200],
        textColor: colors.text.primary,
      },
      primary: {
        backgroundColor: colors.primary[500],
        textColor: colors.text.inverse,
      },
      secondary: {
        backgroundColor: colors.secondary[500],
        textColor: colors.text.inverse,
      },
      success: {
        backgroundColor: colors.success,
        textColor: colors.text.inverse,
      },
      warning: {
        backgroundColor: colors.warning,
        textColor: colors.text.primary,
      },
      error: {
        backgroundColor: colors.error,
        textColor: colors.text.inverse,
      },
      info: {
        backgroundColor: colors.info,
        textColor: colors.text.inverse,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border.base,
        textColor: colors.text.primary,
      },
      'outline-primary': {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary[500],
        textColor: colors.primary[500],
      },
      'outline-success': {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.success,
        textColor: colors.success,
      },
      'outline-warning': {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.warning,
        textColor: colors.warning,
      },
      'outline-error': {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.error,
        textColor: colors.error,
      },
      light: {
        backgroundColor: colors.primary[50],
        textColor: colors.primary[700],
      },
      'light-success': {
        backgroundColor: colors.success + '20',
        textColor: colors.success,
      },
      'light-warning': {
        backgroundColor: colors.warning + '20',
        textColor: colors.warning,
      },
      'light-error': {
        backgroundColor: colors.error + '20',
        textColor: colors.error,
      },
    };
    
    return variantStyles[variant] || variantStyles.default;
  };
  
  // Get badge styles
  const getBadgeStyles = () => {
    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();
    
    const baseStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    };
    
    return {
      ...baseStyle,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      minHeight: sizeStyles.minHeight,
      backgroundColor: backgroundColor || variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth || 0,
      borderColor: variantStyles.borderColor,
      ...(disabled && { opacity: 0.6 }),
    };
  };
  
  // Get text styles
  const getTextStyles = () => {
    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();
    
    return {
      fontSize: sizeStyles.fontSize,
      fontWeight: '600',
      color: textColor || variantStyles.textColor,
    };
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const badgeStyles = getBadgeStyles();
  const textStyles = getTextStyles();
  
  // Render badge content
  const renderContent = () => {
    const iconElement = icon && (
      <Icon
        name={icon}
        size={sizeStyles.iconSize}
        color={textColor || variantStyles.textColor}
        style={{
          marginRight: iconPosition === 'left' && children ? spacing[1] : 0,
          marginLeft: iconPosition === 'right' && children ? spacing[1] : 0,
        }}
      />
    );
    
    return (
      <>
        {iconPosition === 'left' && iconElement}
        {children && (
          <ThemedText style={[textStyles, textStyle]}>
            {children}
          </ThemedText>
        )}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };
  
  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={[badgeStyles, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[badgeStyles, style]} {...props}>
      {renderContent()}
    </View>
  );
};

// Convenience components for common badge types
export const StatusBadge = ({ status, ...props }) => {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'available':
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
      case 'in_progress':
      case 'processing':
        return 'warning';
      case 'inactive':
      case 'offline':
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return 'error';
      case 'draft':
      case 'paused':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  return (
    <ThemedBadge
      variant={getStatusVariant(status)}
      {...props}
    >
      {status}
    </ThemedBadge>
  );
};

export const NotificationBadge = ({ count, max = 99, ...props }) => {
  if (!count || count <= 0) return null;
  
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <ThemedBadge
      variant="error"
      size="small"
      {...props}
    >
      {displayCount}
    </ThemedBadge>
  );
};

export const JobStatusBadge = ({ status, ...props }) => {
  const getJobStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'posted':
      case 'open':
        return { variant: 'primary', icon: 'briefcase-outline' };
      case 'in_progress':
      case 'assigned':
        return { variant: 'warning', icon: 'clock-outline' };
      case 'completed':
        return { variant: 'success', icon: 'check-circle-outline' };
      case 'cancelled':
        return { variant: 'error', icon: 'close-circle-outline' };
      case 'disputed':
        return { variant: 'error', icon: 'alert-circle-outline' };
      case 'draft':
        return { variant: 'outline', icon: 'file-outline' };
      default:
        return { variant: 'default', icon: 'help-circle-outline' };
    }
  };
  
  const config = getJobStatusConfig(status);
  
  return (
    <ThemedBadge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {status}
    </ThemedBadge>
  );
};

export const PaymentStatusBadge = ({ status, ...props }) => {
  const getPaymentStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return { variant: 'success', icon: 'check-circle' };
      case 'pending':
      case 'processing':
        return { variant: 'warning', icon: 'clock' };
      case 'failed':
      case 'declined':
        return { variant: 'error', icon: 'close-circle' };
      case 'refunded':
        return { variant: 'info', icon: 'undo' };
      case 'partial':
        return { variant: 'warning', icon: 'minus-circle' };
      default:
        return { variant: 'default', icon: 'currency-usd' };
    }
  };
  
  const config = getPaymentStatusConfig(status);
  
  return (
    <ThemedBadge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {status}
    </ThemedBadge>
  );
};

export const RatingBadge = ({ rating, maxRating = 5, ...props }) => {
  const getRatingVariant = (rating) => {
    const percentage = (rating / maxRating) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };
  
  return (
    <ThemedBadge
      variant={getRatingVariant(rating)}
      icon="star"
      {...props}
    >
      {rating.toFixed(1)}
    </ThemedBadge>
  );
};

export const CategoryBadge = ({ category, ...props }) => (
  <ThemedBadge
    variant="light"
    icon="tag"
    {...props}
  >
    {category}
  </ThemedBadge>
);

export const PriorityBadge = ({ priority, ...props }) => {
  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return { variant: 'error', icon: 'arrow-up' };
      case 'medium':
      case 'normal':
        return { variant: 'warning', icon: 'minus' };
      case 'low':
        return { variant: 'success', icon: 'arrow-down' };
      default:
        return { variant: 'default', icon: 'equal' };
    }
  };
  
  const config = getPriorityConfig(priority);
  
  return (
    <ThemedBadge
      variant={config.variant}
      icon={config.icon}
      {...props}
    >
      {priority}
    </ThemedBadge>
  );
};

export default ThemedBadge;