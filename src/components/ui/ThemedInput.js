import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import ThemedText from './ThemedText';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * ThemedInput component provides consistent input styling throughout the app
 * with validation, icons, and various states
 */
const ThemedInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  style,
  inputStyle,
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  // Get container styles based on variant and state
  const getContainerStyles = () => {
    const baseStyle = {
      marginBottom: spacing[4],
    };
    
    return {
      ...baseStyle,
    };
  };
  
  // Get input container styles
  const getInputContainerStyles = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      borderRadius: borderRadius.base,
      paddingHorizontal: spacing[3],
    };
    
    // Size-based styles
    const sizeStyles = {
      small: {
        minHeight: 36,
        paddingVertical: spacing[2],
      },
      medium: {
        minHeight: 44,
        paddingVertical: spacing[3],
      },
      large: {
        minHeight: 52,
        paddingVertical: spacing[4],
      },
    };
    
    // Variant-based styles
    const variantStyles = {
      outlined: {
        borderWidth: 1,
        borderColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary[500] 
            : colors.border.light,
        backgroundColor: disabled ? colors.neutral[100] : colors.background.paper,
      },
      filled: {
        backgroundColor: disabled 
          ? colors.neutral[200] 
          : isFocused 
            ? colors.background.paper 
            : colors.neutral[100],
        borderBottomWidth: 2,
        borderBottomColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary[500] 
            : colors.border.light,
      },
      underlined: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: error 
          ? colors.error 
          : isFocused 
            ? colors.primary[500] 
            : colors.border.light,
        borderRadius: 0,
        paddingHorizontal: 0,
      },
    };
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(multiline && { paddingTop: spacing[3] }),
    };
  };
  
  // Get text input styles
  const getTextInputStyles = () => {
    const baseStyle = {
      flex: 1,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: disabled ? colors.text.disabled : colors.text.primary,
      textAlignVertical: multiline ? 'top' : 'center',
    };
    
    return {
      ...baseStyle,
      ...(multiline && { minHeight: numberOfLines * 20 }),
    };
  };
  
  // Get icon size based on input size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };
  
  const containerStyles = getContainerStyles();
  const inputContainerStyles = getInputContainerStyles();
  const textInputStyles = getTextInputStyles();
  const iconSize = getIconSize();
  const iconColor = disabled ? colors.text.disabled : colors.text.secondary;
  
  // Determine if we should show password toggle
  const showPasswordToggle = secureTextEntry && !rightIcon;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;
  
  return (
    <View style={[containerStyles, containerStyle]}>
      {/* Label */}
      {label && (
        <ThemedText 
          variant="label" 
          color={error ? 'error' : isFocused ? 'primary.500' : 'text.secondary'}
          style={{ marginBottom: spacing[1] }}
        >
          {label}
          {required && (
            <ThemedText color="error"> *</ThemedText>
          )}
        </ThemedText>
      )}
      
      {/* Input Container */}
      <View style={[inputContainerStyles, style]}>
        {/* Left Icon */}
        {leftIcon && (
          <Icon 
            name={leftIcon} 
            size={iconSize} 
            color={iconColor}
            style={{ marginRight: spacing[2] }}
          />
        )}
        
        {/* Text Input */}
        <TextInput
          style={[textInputStyles, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.placeholder}
          secureTextEntry={actualSecureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          {...props}
        />
        
        {/* Right Icon or Password Toggle */}
        {(rightIcon || showPasswordToggle) && (
          <TouchableOpacity
            onPress={showPasswordToggle 
              ? () => setIsPasswordVisible(!isPasswordVisible)
              : onRightIconPress
            }
            disabled={disabled}
            style={{ marginLeft: spacing[2] }}
          >
            <Icon 
              name={showPasswordToggle 
                ? (isPasswordVisible ? 'eye-off' : 'eye')
                : rightIcon
              } 
              size={iconSize} 
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Helper Text or Error */}
      {(error || helperText) && (
        <ThemedText 
          variant="caption" 
          color={error ? 'error' : 'text.secondary'}
          style={{ marginTop: spacing[1] }}
        >
          {error || helperText}
        </ThemedText>
      )}
      
      {/* Character Count */}
      {maxLength && value && (
        <ThemedText 
          variant="caption" 
          color={value.length > maxLength * 0.9 ? 'warning' : 'text.secondary'}
          style={{ 
            marginTop: spacing[1], 
            textAlign: 'right',
            fontSize: 12,
          }}
        >
          {value.length}/{maxLength}
        </ThemedText>
      )}
    </View>
  );
};

// Convenience components for common input types
export const PasswordInput = (props) => (
  <ThemedInput 
    secureTextEntry 
    autoCapitalize="none" 
    autoCorrect={false}
    {...props} 
  />
);

export const EmailInput = (props) => (
  <ThemedInput 
    keyboardType="email-address" 
    autoCapitalize="none" 
    autoCorrect={false}
    leftIcon="email"
    {...props} 
  />
);

export const PhoneInput = (props) => (
  <ThemedInput 
    keyboardType="phone-pad" 
    leftIcon="phone"
    {...props} 
  />
);

export const SearchInput = (props) => (
  <ThemedInput 
    leftIcon="magnify" 
    placeholder="Search..."
    {...props} 
  />
);

export const TextAreaInput = (props) => (
  <ThemedInput 
    multiline 
    numberOfLines={4}
    {...props} 
  />
);

export default ThemedInput;