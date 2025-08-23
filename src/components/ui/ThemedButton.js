import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import { colors, spacing, borderRadius, shadows } from '../../theme';

/**
 * ThemedButton component provides consistent button styling throughout the app
 * with multiple variants and built-in loading states
 */
const ThemedButton = ({
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const theme = useTheme();
  
  // Get button styles based on variant
  const getButtonStyles = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.base,
    };
    
    // Size-based styles
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        minHeight: 32,
      },
      medium: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        minHeight: 40,
      },
      large: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
        minHeight: 48,
      },
    };
    
    // Variant-based styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.neutral[300] : colors.primary[500],
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: disabled ? colors.neutral[300] : colors.secondary[500],
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.neutral[300] : colors.primary[500],
      },
      text: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: disabled ? colors.neutral[300] : colors.error,
        ...shadows.sm,
      },
      success: {
        backgroundColor: disabled ? colors.neutral[300] : colors.success,
        ...shadows.sm,
      },
      warning: {
        backgroundColor: disabled ? colors.neutral[300] : colors.warning,
        ...shadows.sm,
      },
    };
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      opacity: disabled ? 0.6 : 1,
    };
  };
  
  // Get text color based on variant
  const getTextColor = () => {
    if (disabled) {
      return colors.text.disabled;
    }
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
      case 'success':
      case 'warning':
        return colors.text.inverse;
      case 'outline':
        return colors.primary[500];
      case 'text':
        return colors.primary[500];
      default:
        return colors.text.inverse;
    }
  };
  
  // Get text variant based on size
  const getTextVariant = () => {
    switch (size) {
      case 'small':
        return 'buttonSmall';
      case 'large':
        return 'buttonLarge';
      default:
        return 'buttonMedium';
    }
  };
  
  // Get icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };
  
  const buttonStyles = getButtonStyles();
  const textColor = getTextColor();
  const textVariant = getTextVariant();
  const iconSize = getIconSize();
  
  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator 
            size="small" 
            color={textColor} 
            style={{ marginRight: children ? spacing[2] : 0 }}
          />
          {children && (
            <ThemedText 
              variant={textVariant} 
              color={textColor}
              style={textStyle}
            >
              {children}
            </ThemedText>
          )}
        </View>
      );
    }
    
    const iconElement = icon && (
      <Icon 
        name={icon} 
        size={iconSize} 
        color={textColor}
        style={{
          marginRight: iconPosition === 'left' && children ? spacing[2] : 0,
          marginLeft: iconPosition === 'right' && children ? spacing[2] : 0,
        }}
      />
    );
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconPosition === 'left' && iconElement}
        {children && (
          <ThemedText 
            variant={textVariant} 
            color={textColor}
            style={textStyle}
          >
            {children}
          </ThemedText>
        )}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };
  
  return (
    <TouchableOpacity
      style={[buttonStyles, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Convenience components for common button variants
export const PrimaryButton = (props) => <ThemedButton variant="primary" {...props} />;
export const SecondaryButton = (props) => <ThemedButton variant="secondary" {...props} />;
export const OutlineButton = (props) => <ThemedButton variant="outline" {...props} />;
export const TextButton = (props) => <ThemedButton variant="text" {...props} />;
export const DangerButton = (props) => <ThemedButton variant="danger" {...props} />;
export const SuccessButton = (props) => <ThemedButton variant="success" {...props} />;
export const WarningButton = (props) => <ThemedButton variant="warning" {...props} />;

export default ThemedButton;