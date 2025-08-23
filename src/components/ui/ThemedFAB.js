import React from 'react';
import { TouchableOpacity, Animated, View, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import { colors, spacing, shadows, borderRadius } from '../../theme';

/**
 * ThemedFAB component provides consistent floating action button styling
 */
const ThemedFAB = ({
  icon = 'plus',
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  position = 'bottom-right',
  backgroundColor,
  iconColor,
  labelColor,
  disabled = false,
  loading = false,
  extended = false,
  style,
  iconStyle,
  labelStyle,
  ...props
}) => {
  const scaleAnimation = React.useRef(new Animated.Value(1)).current;
  const rotateAnimation = React.useRef(new Animated.Value(0)).current;
  
  // Get variant colors
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: backgroundColor || colors.primary,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
      case 'secondary':
        return {
          background: backgroundColor || colors.secondary,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
      case 'success':
        return {
          background: backgroundColor || colors.success,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
      case 'warning':
        return {
          background: backgroundColor || colors.warning,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
      case 'error':
        return {
          background: backgroundColor || colors.error,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
      case 'surface':
        return {
          background: backgroundColor || colors.background.paper,
          icon: iconColor || colors.text.primary,
          label: labelColor || colors.text.primary,
        };
      default:
        return {
          background: backgroundColor || colors.primary,
          icon: iconColor || colors.background.paper,
          label: labelColor || colors.background.paper,
        };
    }
  };
  
  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 40,
          iconSize: 20,
          fontSize: 12,
        };
      case 'medium':
        return {
          width: 56,
          height: 56,
          iconSize: 24,
          fontSize: 14,
        };
      case 'large':
        return {
          width: 72,
          height: 72,
          iconSize: 32,
          fontSize: 16,
        };
      default:
        return {
          width: 56,
          height: 56,
          iconSize: 24,
          fontSize: 14,
        };
    }
  };
  
  // Get position styles
  const getPositionStyles = () => {
    const basePosition = {
      position: 'absolute',
      zIndex: 1000,
    };
    
    switch (position) {
      case 'top-left':
        return {
          ...basePosition,
          top: spacing[6],
          left: spacing[4],
        };
      case 'top-right':
        return {
          ...basePosition,
          top: spacing[6],
          right: spacing[4],
        };
      case 'bottom-left':
        return {
          ...basePosition,
          bottom: spacing[6],
          left: spacing[4],
        };
      case 'bottom-right':
        return {
          ...basePosition,
          bottom: spacing[6],
          right: spacing[4],
        };
      case 'center':
        return {
          ...basePosition,
          top: '50%',
          left: '50%',
          transform: [{ translateX: -28 }, { translateY: -28 }],
        };
      default:
        return {
          ...basePosition,
          bottom: spacing[6],
          right: spacing[4],
        };
    }
  };
  
  const variantColors = getVariantColors();
  const dimensions = getSizeDimensions();
  const positionStyles = getPositionStyles();
  
  // Handle press animations
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }),
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }),
      Animated.timing(rotateAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePress = () => {
    if (!disabled && !loading) {
      onPress?.();
    }
  };
  
  // Get rotation interpolation
  const rotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  
  // Get FAB styles
  const getFABStyles = () => ({
    ...positionStyles,
    width: extended ? 'auto' : dimensions.width,
    height: dimensions.height,
    backgroundColor: disabled ? colors.neutral[300] : variantColors.background,
    borderRadius: extended ? borderRadius.full : dimensions.width / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: extended ? 'row' : 'column',
    paddingHorizontal: extended ? spacing[4] : 0,
    ...shadows.lg,
    opacity: disabled ? 0.6 : 1,
  });
  
  const fabStyles = getFABStyles();
  
  return (
    <Animated.View
      style={[
        fabStyles,
        {
          transform: [{ scale: scaleAnimation }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: extended ? 'row' : 'column',
        }}
        activeOpacity={0.8}
        {...props}
      >
        {/* Icon */}
        <Animated.View
          style={[
            {
              transform: [{ rotate: rotation }],
            },
            extended && { marginRight: spacing[2] },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size={dimensions.iconSize}
              color={variantColors.icon}
            />
          ) : (
            <Icon
              name={icon}
              size={dimensions.iconSize}
              color={disabled ? colors.text.disabled : variantColors.icon}
              style={iconStyle}
            />
          )}
        </Animated.View>
        
        {/* Label for extended FAB */}
        {extended && (label || loading) && (
          <ThemedText
            variant="button"
            style={[
              {
                color: disabled ? colors.text.disabled : variantColors.label,
                fontSize: dimensions.fontSize,
                fontWeight: '600',
              },
              labelStyle,
            ]}
          >
            {loading ? 'Loading...' : label}
          </ThemedText>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Convenience components for common FAB types
export const AddFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="plus"
    onPress={onPress}
    {...props}
  />
);

export const EditFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="pencil"
    variant="secondary"
    onPress={onPress}
    {...props}
  />
);

export const ChatFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="message-text"
    variant="primary"
    onPress={onPress}
    {...props}
  />
);

export const CallFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="phone"
    variant="success"
    onPress={onPress}
    {...props}
  />
);

export const ShareFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="share-variant"
    variant="surface"
    onPress={onPress}
    {...props}
  />
);

export const FilterFAB = ({ onPress, ...props }) => (
  <ThemedFAB
    icon="filter-variant"
    variant="surface"
    onPress={onPress}
    {...props}
  />
);

// Speed dial FAB component
export const SpeedDialFAB = ({
  actions = [],
  isOpen = false,
  onToggle,
  mainIcon = 'plus',
  closeIcon = 'close',
  ...props
}) => {
  const animationValues = React.useRef(
    actions.map(() => new Animated.Value(0))
  ).current;
  
  React.useEffect(() => {
    if (isOpen) {
      // Stagger the animations
      const animations = animationValues.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 200,
          delay: index * 50,
          useNativeDriver: true,
        })
      );
      Animated.parallel(animations).start();
    } else {
      const animations = animationValues.map((value) =>
        Animated.timing(value, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      );
      Animated.parallel(animations).start();
    }
  }, [isOpen]);
  
  return (
    <View style={{ position: 'absolute', bottom: spacing[6], right: spacing[4] }}>
      {/* Action buttons */}
      {actions.map((action, index) => {
        const translateY = animationValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(70 * (index + 1))],
        });
        
        const scale = animationValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        
        return (
          <Animated.View
            key={action.key || index}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              transform: [{ translateY }, { scale }],
            }}
          >
            <ThemedFAB
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
              variant={action.variant || 'surface'}
              size="small"
              position="static"
              extended={!!action.label}
              style={{ position: 'relative' }}
            />
          </Animated.View>
        );
      })}
      
      {/* Main FAB */}
      <ThemedFAB
        icon={isOpen ? closeIcon : mainIcon}
        onPress={onToggle}
        position="static"
        style={{ position: 'relative' }}
        {...props}
      />
    </View>
  );
};

export default ThemedFAB;