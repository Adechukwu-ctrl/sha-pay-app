import { DefaultTheme as PaperDefaultTheme, MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { addOpacity } from '../utils/colorUtils';
import { typography, fontFamilies } from './typography';
import { spacing, borderRadius, shadows, layout } from './spacing';

// Custom theme for React Native Paper
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[500],
    primaryContainer: colors.primary[100],
    secondary: colors.secondary[500],
    secondaryContainer: colors.secondary[100],
    tertiary: colors.accent.orange,
    tertiaryContainer: addOpacity(colors.accent.orange, '20'),
    surface: colors.background.paper,
    surfaceVariant: colors.neutral[100],
    background: colors.background.default,
    error: colors.error,
    errorContainer: addOpacity(colors.error, '20'),
    onPrimary: colors.text.inverse,
    onPrimaryContainer: colors.primary[700],
    onSecondary: colors.text.inverse,
    onSecondaryContainer: colors.secondary[700],
    onTertiary: colors.text.inverse,
    onTertiaryContainer: colors.accent.orange,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    onBackground: colors.text.primary,
    onError: colors.text.inverse,
    onErrorContainer: colors.error,
    outline: colors.border.medium,
    outlineVariant: colors.border.light,
    inverseSurface: colors.neutral[800],
    inverseOnSurface: colors.text.inverse,
    inversePrimary: colors.primary[200],
    shadow: colors.neutral[900],
    scrim: colors.background.overlay,
    backdrop: colors.background.overlay,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: {
      fontFamily: fontFamilies.regular,
      fontWeight: '400',
    },
    medium: {
      fontFamily: fontFamilies.medium,
      fontWeight: '500',
    },
    light: {
      fontFamily: fontFamilies.light,
      fontWeight: '300',
    },
    thin: {
      fontFamily: fontFamilies.light,
      fontWeight: '100',
    },
  },
};

// Complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  
  // Component-specific styles
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.base,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        ...shadows.sm,
      },
      secondary: {
        backgroundColor: colors.secondary[500],
        borderRadius: borderRadius.base,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        ...shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary[500],
        borderRadius: borderRadius.base,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
      },
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
      },
    },
    
    // Card styles
    card: {
      default: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        margin: spacing[2],
        ...shadows.base,
      },
      elevated: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        margin: spacing[2],
        ...shadows.lg,
      },
      outlined: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
        padding: spacing[4],
        margin: spacing[2],
      },
    },
    
    // Input styles
    input: {
      default: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.base,
        borderWidth: 1,
        borderColor: colors.border.light,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: typography.bodyMedium.fontSize,
        fontFamily: typography.bodyMedium.fontFamily,
      },
      focused: {
        borderColor: colors.primary[500],
        borderWidth: 2,
      },
      error: {
        borderColor: colors.error,
        borderWidth: 2,
      },
    },
    
    // List item styles
    listItem: {
      default: {
        backgroundColor: colors.background.paper,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      },
      pressed: {
        backgroundColor: colors.neutral[100],
      },
    },
    
    // Header styles
    header: {
      default: {
        backgroundColor: colors.primary[500],
        height: layout.headerHeight,
        paddingHorizontal: spacing[4],
        ...shadows.sm,
      },
    },
    
    // Tab bar styles
    tabBar: {
      default: {
        backgroundColor: colors.background.paper,
        height: layout.tabBarHeight,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        ...shadows.sm,
      },
    },
    
    // Modal styles
    modal: {
      default: {
        backgroundColor: colors.background.paper,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        margin: spacing[4],
        ...shadows.xl,
      },
      overlay: {
        backgroundColor: colors.background.overlay,
      },
    },
    
    // Badge styles
    badge: {
      default: {
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        minWidth: spacing[5],
        alignItems: 'center',
        justifyContent: 'center',
      },
      success: {
        backgroundColor: colors.success,
      },
      warning: {
        backgroundColor: colors.warning,
      },
      error: {
        backgroundColor: colors.error,
      },
    },
    
    // Avatar styles
    avatar: {
      small: {
        width: layout.avatarSize.sm,
        height: layout.avatarSize.sm,
        borderRadius: layout.avatarSize.sm / 2,
      },
      medium: {
        width: layout.avatarSize.md,
        height: layout.avatarSize.md,
        borderRadius: layout.avatarSize.md / 2,
      },
      large: {
        width: layout.avatarSize.lg,
        height: layout.avatarSize.lg,
        borderRadius: layout.avatarSize.lg / 2,
      },
    },
  },
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
  },
};

// Helper functions
export const getThemeColor = (colorPath) => {
  const paths = colorPath.split('.');
  let result = colors;
  
  for (const path of paths) {
    result = result[path];
    if (!result) return colors.primary[500]; // fallback
  }
  
  return result;
};

export const getComponentStyle = (component, variant = 'default') => {
  return theme.components[component]?.[variant] || {};
};

export const createThemedStyle = (styleFunction) => {
  return styleFunction(theme);
};

// Export individual theme parts
export { colors } from './colors';
export { typography, fontFamilies } from './typography';
export { spacing, borderRadius, shadows, layout } from './spacing';

// Default export
export default theme;