import React from 'react';
import { Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { typography, colors } from '../../theme';

/**
 * ThemedText component provides consistent typography throughout the app
 * with built-in theme support and semantic text styles
 */
const ThemedText = ({
  variant = 'bodyMedium',
  color,
  style,
  children,
  numberOfLines,
  ellipsizeMode = 'tail',
  selectable = false,
  ...props
}) => {
  const theme = useTheme();
  
  // Get typography style based on variant
  const getTypographyStyle = () => {
    return typography[variant] || typography.bodyMedium;
  };
  
  // Get text color
  const getTextColor = () => {
    if (color) {
      // If color is a theme color path (e.g., 'primary.500')
      if (typeof color === 'string' && color.includes('.')) {
        const [colorGroup, shade] = color.split('.');
        return colors[colorGroup]?.[shade] || colors.text.primary;
      }
      // If color is a direct color value
      return color;
    }
    
    // Default color based on variant
    switch (variant) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return colors.text.primary;
      case 'caption':
      case 'overline':
        return colors.text.secondary;
      case 'labelSmall':
        return colors.text.hint;
      default:
        return colors.text.primary;
    }
  };
  
  const typographyStyle = getTypographyStyle();
  const textColor = getTextColor();
  
  return (
    <Text
      style={[
        typographyStyle,
        { color: textColor },
        style,
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      {...props}
    >
      {children}
    </Text>
  );
};

// Convenience components for common text variants
export const Heading1 = (props) => <ThemedText variant="h1" {...props} />;
export const Heading2 = (props) => <ThemedText variant="h2" {...props} />;
export const Heading3 = (props) => <ThemedText variant="h3" {...props} />;
export const Heading4 = (props) => <ThemedText variant="h4" {...props} />;
export const Heading5 = (props) => <ThemedText variant="h5" {...props} />;
export const Heading6 = (props) => <ThemedText variant="h6" {...props} />;

export const BodyLarge = (props) => <ThemedText variant="bodyLarge" {...props} />;
export const BodyMedium = (props) => <ThemedText variant="bodyMedium" {...props} />;
export const BodySmall = (props) => <ThemedText variant="bodySmall" {...props} />;

export const LabelLarge = (props) => <ThemedText variant="labelLarge" {...props} />;
export const LabelMedium = (props) => <ThemedText variant="labelMedium" {...props} />;
export const LabelSmall = (props) => <ThemedText variant="labelSmall" {...props} />;

export const Caption = (props) => <ThemedText variant="caption" {...props} />;
export const Overline = (props) => <ThemedText variant="overline" {...props} />;

export const PriceText = (props) => <ThemedText variant="price" color="secondary.500" {...props} />;
export const RatingText = (props) => <ThemedText variant="rating" {...props} />;

export default ThemedText;