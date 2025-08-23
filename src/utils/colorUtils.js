/**
 * Color utility functions for handling opacity and color transformations
 */

/**
 * Converts a hex color to rgba with specified opacity
 * @param {string} hexColor - Hex color string (e.g., '#FF0000')
 * @param {number} opacity - Opacity value between 0 and 1 (e.g., 0.2 for 20%)
 * @returns {string} - RGBA color string
 */
export const hexToRgba = (hexColor, opacity) => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Adds opacity to a color (supports both hex and existing rgba)
 * @param {string} color - Color string
 * @param {number|string} opacity - Opacity value (0-1) or percentage string (e.g., '20')
 * @returns {string} - Color with opacity
 */
export const addOpacity = (color, opacity) => {
  // Ensure color is a string
  if (typeof color !== 'string') {
    console.warn('addOpacity: color must be a string, received:', typeof color, color);
    return color;
  }
  
  // Convert percentage string to decimal
  const opacityValue = typeof opacity === 'string' 
    ? parseInt(opacity) / 100 
    : opacity;
  
  // If color is already rgba, return as is
  if (color.includes('rgba')) {
    return color;
  }
  
  // If color is hex, convert to rgba
  if (color.startsWith('#')) {
    return hexToRgba(color, opacityValue);
  }
  
  // For other color formats, return as is
  return color;
};

/**
 * Common opacity values for consistent design
 */
export const OPACITY = {
  LIGHT: 0.1,
  MEDIUM: 0.2,
  SEMI: 0.4,
  STRONG: 0.6,
  VERY_STRONG: 0.8
};

/**
 * Pre-defined color variants with opacity for common use cases
 */
export const getColorVariants = (baseColor) => ({
  light: addOpacity(baseColor, OPACITY.LIGHT),
  medium: addOpacity(baseColor, OPACITY.MEDIUM),
  semi: addOpacity(baseColor, OPACITY.SEMI),
  strong: addOpacity(baseColor, OPACITY.STRONG),
  veryStrong: addOpacity(baseColor, OPACITY.VERY_STRONG)
});