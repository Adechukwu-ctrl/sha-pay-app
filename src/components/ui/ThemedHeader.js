import React from 'react';
import { View, TouchableOpacity, StatusBar, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import ThemedAvatar from './ThemedAvatar';
import ThemedBadge from './ThemedBadge';
import { colors, spacing, shadows } from '../../theme';

/**
 * ThemedHeader component provides consistent header styling throughout the app
 */
const ThemedHeader = ({
  title,
  subtitle,
  leftIcon = 'arrow-left',
  leftComponent,
  rightIcon,
  rightComponent,
  onLeftPress,
  onRightPress,
  showBackButton = true,
  backgroundColor = colors.background.paper,
  textColor = colors.text.primary,
  statusBarStyle = 'dark-content',
  elevation = true,
  centerTitle = true,
  style,
  titleStyle,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  
  // Get header styles
  const getHeaderStyles = () => ({
    backgroundColor,
    paddingTop: insets.top,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56 + insets.top,
    ...(elevation && shadows.sm),
    ...(Platform.OS === 'android' && elevation && {
      elevation: 4,
    }),
  });
  
  // Render left component
  const renderLeftComponent = () => {
    if (leftComponent) {
      return leftComponent;
    }
    
    if (showBackButton || leftIcon) {
      return (
        <TouchableOpacity
          onPress={onLeftPress}
          style={{
            padding: spacing[2],
            marginLeft: -spacing[2],
          }}
        >
          <Icon
            name={leftIcon}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
      );
    }
    
    return <View style={{ width: 40 }} />;
  };
  
  // Render title component
  const renderTitleComponent = () => {
    if (!title) return null;
    
    return (
      <View style={{
        flex: 1,
        alignItems: centerTitle ? 'center' : 'flex-start',
        marginHorizontal: spacing[3],
      }}>
        <ThemedText
          variant="h6"
          style={[
            {
              color: textColor,
              fontWeight: '600',
            },
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText
            variant="caption"
            style={{
              color: textColor,
              opacity: 0.7,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>
    );
  };
  
  // Render right component
  const renderRightComponent = () => {
    if (rightComponent) {
      return rightComponent;
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity
          onPress={onRightPress}
          style={{
            padding: spacing[2],
            marginRight: -spacing[2],
          }}
        >
          <Icon
            name={rightIcon}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
      );
    }
    
    return <View style={{ width: 40 }} />;
  };
  
  const headerStyles = getHeaderStyles();
  
  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      <View style={[headerStyles, style]} {...props}>
        {renderLeftComponent()}
        {renderTitleComponent()}
        {renderRightComponent()}
      </View>
    </>
  );
};

// Convenience components for common header types
export const HomeHeader = ({
  user,
  notificationCount = 0,
  onProfilePress,
  onNotificationPress,
  ...props
}) => (
  <ThemedHeader
    title="Sha Pay!"
    showBackButton={false}
    leftComponent={
      <TouchableOpacity onPress={onProfilePress}>
        <ThemedAvatar
          source={user?.avatar}
          initials={user?.name}
          size="small"
          showOnlineIndicator
          isOnline={user?.isOnline}
        />
      </TouchableOpacity>
    }
    rightComponent={
      <TouchableOpacity
        onPress={onNotificationPress}
        style={{ position: 'relative' }}
      >
        <Icon
          name="bell-outline"
          size={24}
          color={colors.text.primary}
        />
        {notificationCount > 0 && (
          <ThemedBadge
            variant="error"
            size="small"
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 18,
              height: 18,
            }}
          >
            {notificationCount > 99 ? '99+' : notificationCount}
          </ThemedBadge>
        )}
      </TouchableOpacity>
    }
    {...props}
  />
);

export const ChatHeader = ({
  participant,
  onBackPress,
  onCallPress,
  onVideoPress,
  onInfoPress,
  ...props
}) => (
  <ThemedHeader
    title={participant?.name}
    subtitle={participant?.isOnline ? 'Online' : 'Last seen recently'}
    onLeftPress={onBackPress}
    centerTitle={false}
    leftComponent={
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={onBackPress}
          style={{
            padding: spacing[2],
            marginRight: spacing[2],
          }}
        >
          <Icon
            name="arrow-left"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <ThemedAvatar
          source={participant?.avatar}
          initials={participant?.name}
          size="small"
          showOnlineIndicator
          isOnline={participant?.isOnline}
        />
      </View>
    }
    rightComponent={
      <View style={{ flexDirection: 'row' }}>
        {onCallPress && (
          <TouchableOpacity
            onPress={onCallPress}
            style={{ padding: spacing[2], marginRight: spacing[1] }}
          >
            <Icon
              name="phone"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
        {onVideoPress && (
          <TouchableOpacity
            onPress={onVideoPress}
            style={{ padding: spacing[2], marginRight: spacing[1] }}
          >
            <Icon
              name="video"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
        {onInfoPress && (
          <TouchableOpacity
            onPress={onInfoPress}
            style={{ padding: spacing[2] }}
          >
            <Icon
              name="information-outline"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    }
    {...props}
  />
);

export const SearchHeader = ({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onBackPress,
  placeholder = 'Search...',
  ...props
}) => {
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  
  return (
    <ThemedHeader
      showBackButton={false}
      leftComponent={
        <TouchableOpacity
          onPress={onBackPress}
          style={{
            padding: spacing[2],
            marginLeft: -spacing[2],
          }}
        >
          <Icon
            name="arrow-left"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      }
      rightComponent={
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.default,
          borderRadius: 8,
          paddingHorizontal: spacing[3],
          marginLeft: spacing[3],
        }}>
          <Icon
            name="magnify"
            size={20}
            color={colors.text.secondary}
            style={{ marginRight: spacing[2] }}
          />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            placeholder={placeholder}
            placeholderTextColor={colors.text.placeholder}
            style={{
              flex: 1,
              fontSize: 16,
              color: colors.text.primary,
              paddingVertical: spacing[2],
            }}
            returnKeyType="search"
          />
          {searchValue && (
            <TouchableOpacity
              onPress={() => onSearchChange?.('')}
              style={{ padding: spacing[1] }}
            >
              <Icon
                name="close"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      }
      {...props}
    />
  );
};

export const JobHeader = ({
  job,
  onBackPress,
  onSharePress,
  onFavoritePress,
  onMorePress,
  isFavorite = false,
  ...props
}) => (
  <ThemedHeader
    title={job?.title}
    subtitle={job?.category}
    onLeftPress={onBackPress}
    centerTitle={false}
    rightComponent={
      <View style={{ flexDirection: 'row' }}>
        {onSharePress && (
          <TouchableOpacity
            onPress={onSharePress}
            style={{ padding: spacing[2], marginRight: spacing[1] }}
          >
            <Icon
              name="share-variant"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
        {onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            style={{ padding: spacing[2], marginRight: spacing[1] }}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.error : colors.text.primary}
            />
          </TouchableOpacity>
        )}
        {onMorePress && (
          <TouchableOpacity
            onPress={onMorePress}
            style={{ padding: spacing[2] }}
          >
            <Icon
              name="dots-vertical"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    }
    {...props}
  />
);

export default ThemedHeader;