import React from 'react';
import { View, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from 'react-native-paper';
import ThemedText from './ThemedText';
import { colors, spacing } from '../../theme';

/**
 * ThemedLoading component provides consistent loading indicators throughout the app
 * with various sizes and overlay options
 */
const ThemedLoading = ({
  size = 'medium',
  color,
  text,
  overlay = false,
  visible = true,
  style,
  textStyle,
  ...props
}) => {
  const theme = useTheme();
  
  // Get size for ActivityIndicator
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'small'; // React Native only supports 'small' and 'large'
    }
  };
  
  // Get container styles
  const getContainerStyles = () => {
    const baseStyle = {
      justifyContent: 'center',
      alignItems: 'center',
    };
    
    if (overlay) {
      return {
        ...baseStyle,
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      };
    }
    
    return {
      ...baseStyle,
      padding: spacing[4],
    };
  };
  
  // Get loading content styles
  const getLoadingContentStyles = () => {
    if (overlay) {
      return {
        backgroundColor: colors.background.paper,
        borderRadius: 12,
        padding: spacing[6],
        alignItems: 'center',
        minWidth: 120,
      };
    }
    
    return {
      alignItems: 'center',
    };
  };
  
  const containerStyles = getContainerStyles();
  const loadingContentStyles = getLoadingContentStyles();
  const indicatorColor = color || colors.primary[500];
  
  // Render loading content
  const renderLoadingContent = () => (
    <View style={[loadingContentStyles, style]}>
      <ActivityIndicator
        size={getSize()}
        color={indicatorColor}
        {...props}
      />
      {text && (
        <ThemedText
          variant="body2"
          color="text.secondary"
          style={[
            {
              marginTop: spacing[3],
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {text}
        </ThemedText>
      )}
    </View>
  );
  
  if (!visible) {
    return null;
  }
  
  // If overlay is true, wrap in Modal
  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
      >
        <View style={containerStyles}>
          {renderLoadingContent()}
        </View>
      </Modal>
    );
  }
  
  // Regular loading component
  return (
    <View style={containerStyles}>
      {renderLoadingContent()}
    </View>
  );
};

// Convenience components for common loading scenarios
export const LoadingOverlay = ({ visible, text = 'Loading...', ...props }) => (
  <ThemedLoading
    overlay
    visible={visible}
    text={text}
    size="large"
    {...props}
  />
);

export const LoadingSpinner = ({ size = 'small', ...props }) => (
  <ThemedLoading
    size={size}
    {...props}
  />
);

export const LoadingButton = ({ loading, children, ...props }) => {
  if (loading) {
    return (
      <ThemedLoading
        size="small"
        style={{ paddingVertical: spacing[2] }}
        {...props}
      />
    );
  }
  
  return children;
};

export const LoadingCard = ({ loading, children, text = 'Loading...', ...props }) => {
  if (loading) {
    return (
      <View style={{
        padding: spacing[6],
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
      }}>
        <ThemedLoading
          text={text}
          {...props}
        />
      </View>
    );
  }
  
  return children;
};

export const LoadingScreen = ({ text = 'Loading...', ...props }) => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  }}>
    <ThemedLoading
      size="large"
      text={text}
      {...props}
    />
  </View>
);

// Skeleton loading components
export const SkeletonLine = ({ width = '100%', height = 16, style }) => (
  <View
    style={[
      {
        width,
        height,
        backgroundColor: colors.neutral[200],
        borderRadius: 4,
        marginVertical: spacing[1],
      },
      style,
    ]}
  />
);

export const SkeletonCircle = ({ size = 40, style }) => (
  <View
    style={[
      {
        width: size,
        height: size,
        backgroundColor: colors.neutral[200],
        borderRadius: size / 2,
      },
      style,
    ]}
  />
);

export const SkeletonCard = ({ style }) => (
  <View
    style={[
      {
        padding: spacing[4],
        backgroundColor: colors.background.paper,
        borderRadius: 8,
        marginVertical: spacing[2],
      },
      style,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
      <SkeletonCircle size={40} style={{ marginRight: spacing[3] }} />
      <View style={{ flex: 1 }}>
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width="40%" height={12} />
      </View>
    </View>
    <SkeletonLine width="100%" height={12} />
    <SkeletonLine width="80%" height={12} />
    <SkeletonLine width="90%" height={12} />
  </View>
);

export const SkeletonList = ({ count = 3, style }) => (
  <View style={style}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </View>
);

export default ThemedLoading;