import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { addOpacity } from '../../utils/colorUtils';

/**
 * ThemedCard component provides consistent card styling throughout the app
 * with multiple variants and optional press handling
 */
const ThemedCard = ({
  variant = 'default',
  children,
  style,
  onPress,
  disabled = false,
  padding = 'medium',
  margin = 'small',
  ...props
}) => {
  // Get padding based on size
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing[2];
      case 'large':
        return spacing[6];
      case 'xlarge':
        return spacing[8];
      default:
        return spacing[4]; // medium
    }
  };
  
  // Get margin based on size
  const getMargin = () => {
    switch (margin) {
      case 'none':
        return 0;
      case 'small':
        return spacing[2];
      case 'large':
        return spacing[6];
      case 'xlarge':
        return spacing[8];
      default:
        return spacing[4]; // medium
    }
  };
  
  // Get card styles based on variant
  const getCardStyles = () => {
    const baseStyle = {
      borderRadius: borderRadius.lg,
      padding: getPadding(),
      margin: getMargin(),
    };
    
    const variantStyles = {
      default: {
        backgroundColor: colors.background.paper,
        ...shadows.base,
      },
      elevated: {
        backgroundColor: colors.background.paper,
        ...shadows.lg,
      },
      outlined: {
        backgroundColor: colors.background.paper,
        borderWidth: 1,
        borderColor: colors.border.light,
      },
      flat: {
        backgroundColor: colors.background.paper,
      },
      primary: {
        backgroundColor: colors.primary[50],
        borderWidth: 1,
        borderColor: colors.primary[200],
      },
      secondary: {
        backgroundColor: colors.secondary[50],
        borderWidth: 1,
        borderColor: colors.secondary[200],
      },
      success: {
        backgroundColor: addOpacity(colors.success, '10'),
        borderWidth: 1,
        borderColor: addOpacity(colors.success, '30'),
      },
      warning: {
        backgroundColor: addOpacity(colors.warning, '10'),
        borderWidth: 1,
        borderColor: addOpacity(colors.warning, '30'),
      },
      error: {
        backgroundColor: addOpacity(colors.error, '10'),
        borderWidth: 1,
        borderColor: addOpacity(colors.error, '30'),
      },
      transparent: {
        backgroundColor: 'transparent',
      },
    };
    
    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.6 }),
    };
  };
  
  const cardStyles = getCardStyles();
  
  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[cardStyles, style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  // Use Surface for elevation on Android
  if (variant === 'default' || variant === 'elevated') {
    return (
      <Surface
        style={[cardStyles, style]}
        elevation={variant === 'elevated' ? 8 : 4}
        {...props}
      >
        {children}
      </Surface>
    );
  }
  
  // Regular View for other variants
  return (
    <View style={[cardStyles, style]} {...props}>
      {children}
    </View>
  );
};

// Convenience components for common card variants
export const ElevatedCard = (props) => <ThemedCard variant="elevated" {...props} />;
export const OutlinedCard = (props) => <ThemedCard variant="outlined" {...props} />;
export const FlatCard = (props) => <ThemedCard variant="flat" {...props} />;
export const PrimaryCard = (props) => <ThemedCard variant="primary" {...props} />;
export const SecondaryCard = (props) => <ThemedCard variant="secondary" {...props} />;
export const SuccessCard = (props) => <ThemedCard variant="success" {...props} />;
export const WarningCard = (props) => <ThemedCard variant="warning" {...props} />;
export const ErrorCard = (props) => <ThemedCard variant="error" {...props} />;
export const TransparentCard = (props) => <ThemedCard variant="transparent" {...props} />;

// Specialized card components
export const JobCard = ({ job, onPress, ...props }) => (
  <ThemedCard onPress={onPress} {...props}>
    {/* Job card content would go here */}
    {props.children}
  </ThemedCard>
);

export const PaymentCard = ({ payment, onPress, ...props }) => (
  <ThemedCard onPress={onPress} {...props}>
    {/* Payment card content would go here */}
    {props.children}
  </ThemedCard>
);

export const UserCard = ({ user, onPress, ...props }) => (
  <ThemedCard onPress={onPress} {...props}>
    {/* User card content would go here */}
    {props.children}
  </ThemedCard>
);

export default ThemedCard;