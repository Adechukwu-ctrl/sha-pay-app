// Color palette for Sha Pay! app
export const colors = {
  // Primary brand colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main primary
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  
  // Secondary colors (Green for success/money)
  secondary: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main secondary
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  
  // Accent colors
  accent: {
    orange: '#FF9800',
    purple: '#9C27B0',
    teal: '#009688',
    indigo: '#3F51B5',
  },
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // Background colors
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    disabled: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Border colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
  },
  
  // Chat specific colors
  chat: {
    ownMessage: '#2196F3',
    otherMessage: '#F5F5F5',
    ownText: '#FFFFFF',
    otherText: '#212121',
    typing: '#9E9E9E',
    online: '#4CAF50',
    offline: '#F44336',
  },
  
  // Job status colors
  jobStatus: {
    pending: '#FF9800',
    active: '#2196F3',
    completed: '#4CAF50',
    cancelled: '#F44336',
    disputed: '#9C27B0',
  },
  
  // Payment status colors
  paymentStatus: {
    pending: '#FF9800',
    processing: '#2196F3',
    completed: '#4CAF50',
    failed: '#F44336',
    refunded: '#9C27B0',
  },
  
  // Rating colors
  rating: {
    excellent: '#4CAF50', // 4.5-5 stars
    good: '#8BC34A',      // 3.5-4.4 stars
    average: '#FF9800',   // 2.5-3.4 stars
    poor: '#FF5722',      // 1.5-2.4 stars
    terrible: '#F44336',  // 0-1.4 stars
  },
};

// Helper function to get color with opacity
export const getColorWithOpacity = (color, opacity) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Helper function to get status color
export const getStatusColor = (status, type = 'job') => {
  const statusColors = type === 'payment' ? colors.paymentStatus : colors.jobStatus;
  return statusColors[status.toLowerCase()] || colors.neutral[500];
};

// Helper function to get rating color
export const getRatingColor = (rating) => {
  if (rating >= 4.5) return colors.rating.excellent;
  if (rating >= 3.5) return colors.rating.good;
  if (rating >= 2.5) return colors.rating.average;
  if (rating >= 1.5) return colors.rating.poor;
  return colors.rating.terrible;
};