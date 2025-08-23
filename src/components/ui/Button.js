import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  Button as PaperButton,
  Text,
  IconButton as PaperIconButton,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';

const Button = ({
  children,
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'contained', // 'contained', 'outlined', 'text', 'elevated'
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary', // 'primary', 'secondary', 'success', 'error', 'warning'
  fullWidth = false,
  icon,
  iconPosition = 'left', // 'left', 'right'
  style,
  labelStyle,
  contentStyle,
  ...props
}) => {
  const getButtonColors = () => {
    const colorMap = {
      primary: {
        contained: {
          backgroundColor: colors.primary,
          textColor: colors.onPrimary,
        },
        outlined: {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
        },
        text: {
          backgroundColor: 'transparent',
          textColor: colors.primary,
        },
      },
      secondary: {
        contained: {
          backgroundColor: colors.secondary,
          textColor: colors.onSecondary,
        },
        outlined: {
          backgroundColor: 'transparent',
          textColor: colors.secondary,
          borderColor: colors.secondary,
        },
        text: {
          backgroundColor: 'transparent',
          textColor: colors.secondary,
        },
      },
      success: {
        contained: {
          backgroundColor: colors.success || colors.primary,
          textColor: colors.onSuccess || colors.onPrimary,
        },
        outlined: {
          backgroundColor: 'transparent',
          textColor: colors.success || colors.primary,
          borderColor: colors.success || colors.primary,
        },
        text: {
          backgroundColor: 'transparent',
          textColor: colors.success || colors.primary,
        },
      },
      error: {
        contained: {
          backgroundColor: colors.error,
          textColor: colors.onError,
        },
        outlined: {
          backgroundColor: 'transparent',
          textColor: colors.error,
          borderColor: colors.error,
        },
        text: {
          backgroundColor: 'transparent',
          textColor: colors.error,
        },
      },
      warning: {
        contained: {
          backgroundColor: colors.warning || colors.secondary,
          textColor: colors.onWarning || colors.onSecondary,
        },
        outlined: {
          backgroundColor: 'transparent',
          textColor: colors.warning || colors.secondary,
          borderColor: colors.warning || colors.secondary,
        },
        text: {
          backgroundColor: 'transparent',
          textColor: colors.warning || colors.secondary,
        },
      },
    };

    return colorMap[color]?.[variant] || colorMap.primary.contained;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: spacing.md,
          fontSize: 14,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: spacing.xl,
          fontSize: 16,
        };
      case 'medium':
      default:
        return {
          height: 48,
          paddingHorizontal: spacing.lg,
          fontSize: 15,
        };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: buttonColors.backgroundColor,
      height: sizeStyles.height,
      paddingHorizontal: sizeStyles.paddingHorizontal,
    },
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: buttonColors.borderColor,
    },
    variant === 'elevated' && styles.elevated,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    {
      color: buttonColors.textColor,
      fontSize: sizeStyles.fontSize,
    },
    disabled && styles.disabledText,
    labelStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={buttonColors.textColor}
            style={styles.loadingIndicator}
          />
          {title && (
            <Text style={[textStyle, styles.loadingText]}>
              {title}
            </Text>
          )}
        </View>
      );
    }

    if (icon && title) {
      return (
        <View style={[
          styles.contentContainer,
          iconPosition === 'right' && styles.contentContainerReverse,
        ]}>          {iconPosition === 'left' && (
            <PaperIconButton
              icon={icon}
              size={sizeStyles.fontSize}
              iconColor={buttonColors.textColor}
              style={styles.iconButton}
            />
          )}
          <Text style={textStyle}>{title}</Text>
          {iconPosition === 'right' && (
            <PaperIconButton
              icon={icon}
              size={sizeStyles.fontSize}
              iconColor={buttonColors.textColor}
              style={styles.iconButton}
            />
          )}
        </View>
      );
    }

    if (icon && !title) {
      return (
        <PaperIconButton
          icon={icon}
          size={sizeStyles.fontSize}
          iconColor={buttonColors.textColor}
          style={styles.iconOnlyButton}
        />
      );
    }

    if (children) {
      return children;
    }

    return (
      <Text style={textStyle}>{title}</Text>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Specialized Button Components
const IconButton = ({
  icon,
  onPress,
  size = 'medium',
  color = 'primary',
  variant = 'text',
  disabled = false,
  style,
  ...props
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 28;
      case 'medium':
      default: return 24;
    }
  };

  const getColorValue = () => {
    switch (color) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'error': return colors.error;
      case 'success': return colors.success || colors.primary;
      case 'warning': return colors.warning || colors.secondary;
      default: return colors.onSurface;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconButtonContainer,
        {
          width: getSizeValue() + 16,
          height: getSizeValue() + 16,
        },
        variant === 'contained' && {
          backgroundColor: getColorValue(),
        },
        variant === 'outlined' && {
          borderWidth: 1,
          borderColor: getColorValue(),
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <PaperButton.Icon
        icon={icon}
        size={getSizeValue()}
        iconColor={
          variant === 'contained' && color !== 'primary'
            ? colors.onPrimary
            : getColorValue()
        }
      />
    </TouchableOpacity>
  );
};

const FloatingActionButton = ({
  icon,
  onPress,
  size = 'medium',
  color = 'primary',
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  disabled = false,
  style,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, iconSize: 20 };
      case 'large':
        return { width: 64, height: 64, iconSize: 28 };
      case 'medium':
      default:
        return { width: 56, height: 56, iconSize: 24 };
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute',
      margin: spacing.lg,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyles, bottom: 0, left: 0 };
      case 'top-right':
        return { ...baseStyles, top: 0, right: 0 };
      case 'top-left':
        return { ...baseStyles, top: 0, left: 0 };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: 0, right: 0 };
    }
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();
  const backgroundColor = color === 'primary' ? colors.primary : colors.secondary;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          backgroundColor,
        },
        positionStyles,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <PaperButton.Icon
        icon={icon}
        size={sizeStyles.iconSize}
        iconColor={color === 'primary' ? colors.onPrimary : colors.onSecondary}
      />
    </TouchableOpacity>
  );
};

const ButtonGroup = ({
  buttons = [],
  selectedIndex,
  onPress,
  variant = 'outlined',
  color = 'primary',
  style,
}) => {
  return (
    <View style={[styles.buttonGroup, style]}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          title={button.title || button}
          variant={selectedIndex === index ? 'contained' : variant}
          color={color}
          onPress={() => onPress && onPress(index, button)}
          style={[
            styles.buttonGroupItem,
            index === 0 && styles.buttonGroupFirst,
            index === buttons.length - 1 && styles.buttonGroupLast,
            selectedIndex === index && styles.buttonGroupSelected,
          ]}
          disabled={button.disabled}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  elevated: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainerReverse: {
    flexDirection: 'row-reverse',
  },
  iconButton: {
    margin: 0,
    marginHorizontal: spacing.xs,
  },
  iconOnlyButton: {
    margin: 0,
  },
  iconButtonContainer: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGroupItem: {
    flex: 1,
    borderRadius: 0,
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  buttonGroupFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  buttonGroupLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderRightWidth: 0,
  },
  buttonGroupSelected: {
    elevation: 2,
  },
});

export default Button;
export { IconButton, FloatingActionButton, ButtonGroup };