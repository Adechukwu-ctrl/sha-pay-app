import React from 'react';
import { View, TouchableOpacity, FlatList, SectionList } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import ThemedAvatar from './ThemedAvatar';
import ThemedBadge from './ThemedBadge';
import { colors, spacing, borderRadius } from '../../theme';

/**
 * ThemedListItem component provides consistent list item styling
 */
const ThemedListItem = ({
  title,
  subtitle,
  description,
  leftIcon,
  leftAvatar,
  leftComponent,
  rightIcon,
  rightComponent,
  badge,
  onPress,
  disabled = false,
  divider = true,
  style,
  contentStyle,
  ...props
}) => {
  // Get list item styles
  const getListItemStyles = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: divider ? 1 : 0,
    borderBottomColor: colors.border.light,
    ...(disabled && { opacity: 0.6 }),
  });
  
  // Render left component
  const renderLeftComponent = () => {
    if (leftComponent) {
      return (
        <View style={{ marginRight: spacing[3] }}>
          {leftComponent}
        </View>
      );
    }
    
    if (leftAvatar) {
      return (
        <ThemedAvatar
          {...leftAvatar}
          size="medium"
          style={{ marginRight: spacing[3] }}
        />
      );
    }
    
    if (leftIcon) {
      return (
        <Icon
          name={leftIcon}
          size={24}
          color={colors.text.secondary}
          style={{ marginRight: spacing[3] }}
        />
      );
    }
    
    return null;
  };
  
  // Render right component
  const renderRightComponent = () => {
    if (rightComponent) {
      return (
        <View style={{ marginLeft: spacing[3] }}>
          {rightComponent}
        </View>
      );
    }
    
    if (badge) {
      return (
        <ThemedBadge
          {...badge}
          style={{ marginLeft: spacing[3] }}
        />
      );
    }
    
    if (rightIcon) {
      return (
        <Icon
          name={rightIcon}
          size={24}
          color={colors.text.secondary}
          style={{ marginLeft: spacing[3] }}
        />
      );
    }
    
    if (onPress) {
      return (
        <Icon
          name="chevron-right"
          size={24}
          color={colors.text.secondary}
          style={{ marginLeft: spacing[3] }}
        />
      );
    }
    
    return null;
  };
  
  const listItemStyles = getListItemStyles();
  
  const content = (
    <>
      {renderLeftComponent()}
      
      <View style={[{ flex: 1 }, contentStyle]}>
        {title && (
          <ThemedText
            variant="body1"
            style={{ marginBottom: subtitle || description ? spacing[1] : 0 }}
          >
            {title}
          </ThemedText>
        )}
        
        {subtitle && (
          <ThemedText
            variant="body2"
            color="text.secondary"
            style={{ marginBottom: description ? spacing[1] : 0 }}
          >
            {subtitle}
          </ThemedText>
        )}
        
        {description && (
          <ThemedText
            variant="caption"
            color="text.secondary"
            numberOfLines={2}
          >
            {description}
          </ThemedText>
        )}
      </View>
      
      {renderRightComponent()}
    </>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={[listItemStyles, style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[listItemStyles, style]} {...props}>
      {content}
    </View>
  );
};

/**
 * ThemedList component provides consistent list styling
 */
const ThemedList = ({
  data,
  renderItem,
  keyExtractor,
  header,
  footer,
  emptyComponent,
  emptyText = 'No items found',
  loading = false,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.1,
  style,
  contentContainerStyle,
  ...props
}) => {
  // Default render item function
  const defaultRenderItem = ({ item, index }) => {
    if (renderItem) {
      return renderItem({ item, index });
    }
    
    return (
      <ThemedListItem
        title={item.title || item.name}
        subtitle={item.subtitle || item.description}
        leftIcon={item.icon}
        leftAvatar={item.avatar}
        rightIcon={item.rightIcon}
        badge={item.badge}
        onPress={item.onPress}
        divider={index < data.length - 1}
      />
    );
  };
  
  // Default key extractor
  const defaultKeyExtractor = (item, index) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    
    return item.id?.toString() || item.key?.toString() || index.toString();
  };
  
  // Render empty component
  const renderEmptyComponent = () => {
    if (loading) {
      return null;
    }
    
    if (emptyComponent) {
      return emptyComponent;
    }
    
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing[8],
      }}>
        <Icon
          name="inbox-outline"
          size={48}
          color={colors.text.disabled}
          style={{ marginBottom: spacing[4] }}
        />
        <ThemedText
          variant="body2"
          color="text.secondary"
          style={{ textAlign: 'center' }}
        >
          {emptyText}
        </ThemedText>
      </View>
    );
  };
  
  // Render header
  const renderHeader = () => {
    if (!header) return null;
    
    if (typeof header === 'string') {
      return (
        <View style={{
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          backgroundColor: colors.background.default,
        }}>
          <ThemedText variant="h6">
            {header}
          </ThemedText>
        </View>
      );
    }
    
    return header;
  };
  
  // Render footer
  const renderFooter = () => {
    if (!footer) return null;
    
    if (typeof footer === 'string') {
      return (
        <View style={{
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          backgroundColor: colors.background.default,
        }}>
          <ThemedText
            variant="caption"
            color="text.secondary"
            style={{ textAlign: 'center' }}
          >
            {footer}
          </ThemedText>
        </View>
      );
    }
    
    return footer;
  };
  
  return (
    <FlatList
      data={data}
      renderItem={defaultRenderItem}
      keyExtractor={defaultKeyExtractor}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      style={[{ backgroundColor: colors.background.default }, style]}
      contentContainerStyle={[
        { flexGrow: 1 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
};

/**
 * ThemedSectionList component for sectioned lists
 */
const ThemedSectionList = ({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  emptyComponent,
  emptyText = 'No items found',
  style,
  contentContainerStyle,
  ...props
}) => {
  // Default render item function
  const defaultRenderItem = ({ item, index, section }) => {
    if (renderItem) {
      return renderItem({ item, index, section });
    }
    
    return (
      <ThemedListItem
        title={item.title || item.name}
        subtitle={item.subtitle || item.description}
        leftIcon={item.icon}
        leftAvatar={item.avatar}
        rightIcon={item.rightIcon}
        badge={item.badge}
        onPress={item.onPress}
        divider={index < section.data.length - 1}
      />
    );
  };
  
  // Default render section header
  const defaultRenderSectionHeader = ({ section }) => {
    if (renderSectionHeader) {
      return renderSectionHeader({ section });
    }
    
    return (
      <View style={{
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: colors.background.default,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      }}>
        <ThemedText
          variant="subtitle1"
          style={{ fontWeight: '600' }}
        >
          {section.title}
        </ThemedText>
      </View>
    );
  };
  
  // Default key extractor
  const defaultKeyExtractor = (item, index) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    
    return item.id?.toString() || item.key?.toString() || index.toString();
  };
  
  // Render empty component
  const renderEmptyComponent = () => {
    if (emptyComponent) {
      return emptyComponent;
    }
    
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing[8],
      }}>
        <Icon
          name="inbox-outline"
          size={48}
          color={colors.text.disabled}
          style={{ marginBottom: spacing[4] }}
        />
        <ThemedText
          variant="body2"
          color="text.secondary"
          style={{ textAlign: 'center' }}
        >
          {emptyText}
        </ThemedText>
      </View>
    );
  };
  
  return (
    <SectionList
      sections={sections}
      renderItem={defaultRenderItem}
      renderSectionHeader={defaultRenderSectionHeader}
      keyExtractor={defaultKeyExtractor}
      ListEmptyComponent={renderEmptyComponent}
      style={[{ backgroundColor: colors.background.default }, style]}
      contentContainerStyle={[
        { flexGrow: 1 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
};

// Convenience components for common list types
export const JobList = ({ jobs, onJobPress, ...props }) => (
  <ThemedList
    data={jobs}
    renderItem={({ item }) => (
      <ThemedListItem
        title={item.title}
        subtitle={item.category}
        description={`${item.location} • ${item.budget}`}
        leftIcon="briefcase-outline"
        rightComponent={
          <ThemedBadge variant={item.status === 'open' ? 'success' : 'warning'}>
            {item.status}
          </ThemedBadge>
        }
        onPress={() => onJobPress?.(item)}
      />
    )}
    emptyText="No jobs found"
    {...props}
  />
);

export const UserList = ({ users, onUserPress, ...props }) => (
  <ThemedList
    data={users}
    renderItem={({ item }) => (
      <ThemedListItem
        title={item.name}
        subtitle={item.email}
        description={item.location}
        leftAvatar={{
          source: item.avatar,
          initials: item.name,
          showOnlineIndicator: true,
          isOnline: item.isOnline,
        }}
        rightComponent={
          item.rating && (
            <ThemedBadge variant="success" icon="star">
              {item.rating.toFixed(1)}
            </ThemedBadge>
          )
        }
        onPress={() => onUserPress?.(item)}
      />
    )}
    emptyText="No users found"
    {...props}
  />
);

export const PaymentList = ({ payments, onPaymentPress, ...props }) => (
  <ThemedList
    data={payments}
    renderItem={({ item }) => (
      <ThemedListItem
        title={`₦${item.amount.toLocaleString()}`}
        subtitle={item.description}
        description={new Date(item.date).toLocaleDateString()}
        leftIcon="currency-usd"
        rightComponent={
          <ThemedBadge
            variant={item.status === 'completed' ? 'success' : 'warning'}
          >
            {item.status}
          </ThemedBadge>
        }
        onPress={() => onPaymentPress?.(item)}
      />
    )}
    emptyText="No payments found"
    {...props}
  />
);

export { ThemedListItem };
export default ThemedList;
export { ThemedSectionList };