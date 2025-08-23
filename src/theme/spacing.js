// Spacing scale based on 4px grid system
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Semantic spacing
export const semanticSpacing = {
  // Padding
  paddingXS: spacing[1], // 4px
  paddingSM: spacing[2], // 8px
  paddingMD: spacing[4], // 16px
  paddingLG: spacing[6], // 24px
  paddingXL: spacing[8], // 32px
  
  // Margin
  marginXS: spacing[1], // 4px
  marginSM: spacing[2], // 8px
  marginMD: spacing[4], // 16px
  marginLG: spacing[6], // 24px
  marginXL: spacing[8], // 32px
  
  // Component spacing
  componentSpacing: spacing[4], // 16px
  sectionSpacing: spacing[6], // 24px
  screenPadding: spacing[4], // 16px
  
  // Form spacing
  formFieldSpacing: spacing[4], // 16px
  formSectionSpacing: spacing[6], // 24px
  
  // Card spacing
  cardPadding: spacing[4], // 16px
  cardMargin: spacing[4], // 16px
  
  // List spacing
  listItemPadding: spacing[4], // 16px
  listItemSpacing: spacing[2], // 8px
  
  // Button spacing
  buttonPadding: spacing[3], // 12px
  buttonMargin: spacing[2], // 8px
  
  // Icon spacing
  iconSpacing: spacing[2], // 8px
  iconPadding: spacing[1], // 4px
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow definitions
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  lg: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  xl: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,
    elevation: 20,
  },
};

// Layout dimensions
export const layout = {
  // Screen dimensions (will be set dynamically)
  screenWidth: 0,
  screenHeight: 0,
  
  // Header heights
  headerHeight: 56,
  tabBarHeight: 60,
  statusBarHeight: 24,
  
  // Component dimensions
  buttonHeight: {
    small: 32,
    medium: 40,
    large: 48,
  },
  
  inputHeight: {
    small: 32,
    medium: 40,
    large: 48,
  },
  
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
    '3xl': 96,
  },
  
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  },
  
  // Container widths
  containerWidth: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Minimum touch target size (accessibility)
  minTouchTarget: 44,
};

// Helper functions
export const getSpacing = (size) => spacing[size] || size;

export const createSpacingStyle = ({
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  marginHorizontal,
  marginVertical,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  paddingHorizontal,
  paddingVertical,
}) => ({
  ...(margin !== undefined && { margin: getSpacing(margin) }),
  ...(marginTop !== undefined && { marginTop: getSpacing(marginTop) }),
  ...(marginRight !== undefined && { marginRight: getSpacing(marginRight) }),
  ...(marginBottom !== undefined && { marginBottom: getSpacing(marginBottom) }),
  ...(marginLeft !== undefined && { marginLeft: getSpacing(marginLeft) }),
  ...(marginHorizontal !== undefined && { marginHorizontal: getSpacing(marginHorizontal) }),
  ...(marginVertical !== undefined && { marginVertical: getSpacing(marginVertical) }),
  ...(padding !== undefined && { padding: getSpacing(padding) }),
  ...(paddingTop !== undefined && { paddingTop: getSpacing(paddingTop) }),
  ...(paddingRight !== undefined && { paddingRight: getSpacing(paddingRight) }),
  ...(paddingBottom !== undefined && { paddingBottom: getSpacing(paddingBottom) }),
  ...(paddingLeft !== undefined && { paddingLeft: getSpacing(paddingLeft) }),
  ...(paddingHorizontal !== undefined && { paddingHorizontal: getSpacing(paddingHorizontal) }),
  ...(paddingVertical !== undefined && { paddingVertical: getSpacing(paddingVertical) }),
});

export const createShadowStyle = (shadowLevel = 'base') => {
  return shadows[shadowLevel] || shadows.base;
};