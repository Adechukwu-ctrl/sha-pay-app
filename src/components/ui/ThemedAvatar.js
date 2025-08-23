import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import { colors, spacing, borderRadius } from '../../theme';

/**
 * ThemedAvatar component provides consistent avatar styling throughout the app
 * with support for images, initials, icons, and various sizes
 */
const ThemedAvatar = ({
  source,
  initials,
  icon = 'account',
  size = 'medium',
  variant = 'circular',
  backgroundColor,
  textColor,
  borderColor,
  borderWidth = 0,
  onPress,
  disabled = false,
  showOnlineIndicator = false,
  isOnline = false,
  style,
  ...props
}) => {
  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'xs':
        return { width: 24, height: 24, fontSize: 10, iconSize: 12 };
      case 'small':
        return { width: 32, height: 32, fontSize: 12, iconSize: 16 };
      case 'medium':
        return { width: 40, height: 40, fontSize: 14, iconSize: 20 };
      case 'large':
        return { width: 56, height: 56, fontSize: 18, iconSize: 28 };
      case 'xl':
        return { width: 72, height: 72, fontSize: 24, iconSize: 36 };
      case 'xxl':
        return { width: 96, height: 96, fontSize: 32, iconSize: 48 };
      default:
        return { width: 40, height: 40, fontSize: 14, iconSize: 20 };
    }
  };
  
  // Get avatar styles
  const getAvatarStyles = () => {
    const dimensions = getSizeDimensions();
    
    const baseStyle = {
      width: dimensions.width,
      height: dimensions.height,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: backgroundColor || colors.primary[100],
      borderWidth,
      borderColor: borderColor || colors.border.light,
    };
    
    const variantStyles = {
      circular: {
        borderRadius: dimensions.width / 2,
      },
      rounded: {
        borderRadius: borderRadius.base,
      },
      square: {
        borderRadius: 0,
      },
    };
    
    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.6 }),
    };
  };
  
  // Get online indicator styles
  const getOnlineIndicatorStyles = () => {
    const dimensions = getSizeDimensions();
    const indicatorSize = Math.max(8, dimensions.width * 0.25);
    
    return {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: isOnline ? colors.success : colors.neutral[400],
      borderWidth: 2,
      borderColor: colors.background.paper,
    };
  };
  
  // Generate initials from name
  const generateInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generate background color from string
  const generateBackgroundColor = (str) => {
    if (!str) return colors.primary[100];
    
    const avatarColors = [
      colors.primary[100],
      colors.secondary[100],
      colors.accent[100],
      '#FFE5E5', // Light red
      '#E5F3FF', // Light blue
      '#E5FFE5', // Light green
      '#FFF5E5', // Light orange
      '#F5E5FF', // Light purple
      '#FFFFE5', // Light yellow
      '#E5FFFF', // Light cyan
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };
  
  const dimensions = getSizeDimensions();
  const avatarStyles = getAvatarStyles();
  const onlineIndicatorStyles = getOnlineIndicatorStyles();
  
  // Determine what to display
  const displayInitials = initials || (typeof source === 'string' ? generateInitials(source) : '');
  const finalBackgroundColor = backgroundColor || generateBackgroundColor(displayInitials);
  const finalTextColor = textColor || colors.text.primary;
  
  // Render avatar content
  const renderContent = () => {
    // If source is an image URI or require()
    if (source && (typeof source === 'object' || (typeof source === 'string' && source.startsWith('http')))) {
      return (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
          {...props}
        />
      );
    }
    
    // If we have initials to display
    if (displayInitials) {
      return (
        <ThemedText
          style={{
            fontSize: dimensions.fontSize,
            fontWeight: '600',
            color: finalTextColor,
          }}
        >
          {displayInitials}
        </ThemedText>
      );
    }
    
    // Default to icon
    return (
      <Icon
        name={icon}
        size={dimensions.iconSize}
        color={finalTextColor}
      />
    );
  };
  
  const avatarComponent = (
    <View style={[avatarStyles, { backgroundColor: finalBackgroundColor }, style]}>
      {renderContent()}
      
      {/* Online Indicator */}
      {showOnlineIndicator && (
        <View style={onlineIndicatorStyles} />
      )}
    </View>
  );
  
  // Wrap in TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {avatarComponent}
      </TouchableOpacity>
    );
  }
  
  return avatarComponent;
};

// Convenience components for common avatar types
export const UserAvatar = ({ user, ...props }) => (
  <ThemedAvatar
    source={user?.avatar || user?.profileImage}
    initials={user?.name || user?.firstName + ' ' + user?.lastName}
    showOnlineIndicator
    isOnline={user?.isOnline}
    {...props}
  />
);

export const ServiceProviderAvatar = ({ provider, ...props }) => (
  <ThemedAvatar
    source={provider?.avatar}
    initials={provider?.businessName || provider?.name}
    backgroundColor={colors.primary[100]}
    {...props}
  />
);

export const ChatAvatar = ({ participant, ...props }) => (
  <ThemedAvatar
    source={participant?.avatar}
    initials={participant?.name}
    size="small"
    showOnlineIndicator
    isOnline={participant?.isOnline}
    {...props}
  />
);

export const GroupAvatar = ({ group, ...props }) => (
  <ThemedAvatar
    source={group?.avatar}
    initials={group?.name}
    icon="account-group"
    backgroundColor={colors.secondary[100]}
    {...props}
  />
);

// Avatar group component for showing multiple avatars
export const AvatarGroup = ({ 
  avatars = [], 
  max = 3, 
  size = 'medium',
  spacing: avatarSpacing = -8,
  style,
  onPress,
  ...props 
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);
  
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={avatar.id || index}
          style={{
            marginLeft: index > 0 ? avatarSpacing : 0,
            zIndex: visibleAvatars.length - index,
          }}
        >
          <ThemedAvatar
            {...avatar}
            size={size}
            borderWidth={2}
            borderColor={colors.background.paper}
            onPress={onPress ? () => onPress(avatar, index) : undefined}
            {...props}
          />
        </View>
      ))}
      
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: avatarSpacing,
            zIndex: 0,
          }}
        >
          <ThemedAvatar
            initials={`+${remainingCount}`}
            size={size}
            backgroundColor={colors.neutral[200]}
            textColor={colors.text.secondary}
            borderWidth={2}
            borderColor={colors.background.paper}
            onPress={onPress ? () => onPress(null, -1) : undefined}
            {...props}
          />
        </View>
      )}
    </View>
  );
};

export default ThemedAvatar;