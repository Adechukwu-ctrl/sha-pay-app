import React from 'react';
import { View, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import ThemedBadge from './ThemedBadge';
import { colors, spacing, shadows } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * ThemedTabBar component provides consistent tab bar styling
 */
const ThemedTabBar = ({
  tabs = [],
  activeIndex = 0,
  onTabPress,
  backgroundColor = colors.background.paper,
  activeColor = colors.primary,
  inactiveColor = colors.text.secondary,
  showLabels = true,
  showIndicator = true,
  indicatorColor = colors.primary,
  elevation = true,
  style,
  tabStyle,
  labelStyle,
  iconStyle,
  ...props
}) => {
  const insets = useSafeAreaInsets();
  const indicatorAnimation = React.useRef(new Animated.Value(0)).current;
  const tabWidth = screenWidth / tabs.length;
  
  React.useEffect(() => {
    Animated.spring(indicatorAnimation, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeIndex, tabWidth]);
  
  const getTabBarStyles = () => ({
    backgroundColor,
    paddingBottom: insets.bottom,
    paddingTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 60 + insets.bottom,
    ...(elevation && shadows.lg),
  });
  
  const renderTab = (tab, index) => {
    const isActive = index === activeIndex;
    const tabColor = isActive ? activeColor : inactiveColor;
    
    return (
      <TouchableOpacity
        key={tab.key || index}
        onPress={() => onTabPress?.(index, tab)}
        style={[
          {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing[2],
            position: 'relative',
          },
          tabStyle,
        ]}
        activeOpacity={0.7}
      >
        {/* Icon with badge */}
        <View style={{ position: 'relative', marginBottom: showLabels ? spacing[1] : 0 }}>
          <Icon
            name={isActive ? tab.activeIcon || tab.icon : tab.icon}
            size={tab.iconSize || 24}
            color={tabColor}
            style={iconStyle}
          />
          {tab.badge && (
            <ThemedBadge
              variant="error"
              size="small"
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 16,
                height: 16,
              }}
            >
              {tab.badge > 99 ? '99+' : tab.badge}
            </ThemedBadge>
          )}
        </View>
        
        {/* Label */}
        {showLabels && tab.label && (
          <ThemedText
            variant="caption"
            style={[
              {
                color: tabColor,
                fontSize: 12,
                fontWeight: isActive ? '600' : '400',
                textAlign: 'center',
              },
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };
  
  const tabBarStyles = getTabBarStyles();
  
  return (
    <View style={[tabBarStyles, style]} {...props}>
      {/* Tabs */}
      {tabs.map(renderTab)}
      
      {/* Active indicator */}
      {showIndicator && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: indicatorAnimation,
            width: tabWidth,
            height: 3,
            backgroundColor: indicatorColor,
            borderRadius: 2,
          }}
        />
      )}
    </View>
  );
};

// Convenience component for bottom tab navigation
export const BottomTabBar = ({
  state,
  descriptors,
  navigation,
  ...props
}) => {
  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label = options.tabBarLabel || options.title || route.name;
    const icon = options.tabBarIcon;
    const badge = options.tabBarBadge;
    
    return {
      key: route.key,
      label,
      icon: typeof icon === 'string' ? icon : 'circle',
      badge,
      route,
    };
  });
  
  const handleTabPress = (index, tab) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: tab.route.key,
      canPreventDefault: true,
    });
    
    if (!event.defaultPrevented) {
      navigation.navigate(tab.route.name);
    }
  };
  
  return (
    <ThemedTabBar
      tabs={tabs}
      activeIndex={state.index}
      onTabPress={handleTabPress}
      {...props}
    />
  );
};

// Convenience component for top tab navigation
export const TopTabBar = ({
  tabs = [],
  activeIndex = 0,
  onTabPress,
  scrollEnabled = false,
  ...props
}) => {
  const scrollViewRef = React.useRef(null);
  
  React.useEffect(() => {
    if (scrollEnabled && scrollViewRef.current) {
      const tabWidth = 120; // Approximate tab width
      const scrollX = activeIndex * tabWidth - screenWidth / 2 + tabWidth / 2;
      scrollViewRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
    }
  }, [activeIndex, scrollEnabled]);
  
  if (scrollEnabled) {
    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          backgroundColor: colors.background.paper,
          ...shadows.sm,
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.key || index}
              onPress={() => onTabPress?.(index, tab)}
              style={{
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderBottomWidth: 2,
                borderBottomColor: index === activeIndex ? colors.primary : 'transparent',
              }}
            >
              <ThemedText
                variant="body2"
                style={{
                  color: index === activeIndex ? colors.primary : colors.text.secondary,
                  fontWeight: index === activeIndex ? '600' : '400',
                }}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }
  
  return (
    <ThemedTabBar
      tabs={tabs}
      activeIndex={activeIndex}
      onTabPress={onTabPress}
      showLabels={true}
      showIndicator={true}
      elevation={true}
      style={{
        paddingBottom: 0,
        minHeight: 48,
      }}
      {...props}
    />
  );
};

// Convenience component for segmented control
export const SegmentedControl = ({
  segments = [],
  selectedIndex = 0,
  onSelectionChange,
  backgroundColor = colors.background.default,
  selectedColor = colors.primary,
  unselectedColor = colors.text.secondary,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor,
          borderRadius: 8,
          padding: 4,
          margin: spacing[4],
        },
        style,
      ]}
      {...props}
    >
      {segments.map((segment, index) => {
        const isSelected = index === selectedIndex;
        
        return (
          <TouchableOpacity
            key={segment.key || index}
            onPress={() => onSelectionChange?.(index, segment)}
            style={{
              flex: 1,
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[3],
              borderRadius: 6,
              backgroundColor: isSelected ? colors.background.paper : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isSelected && shadows.sm),
            }}
          >
            <ThemedText
              variant="body2"
              style={{
                color: isSelected ? selectedColor : unselectedColor,
                fontWeight: isSelected ? '600' : '400',
              }}
            >
              {segment.label || segment}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ThemedTabBar;