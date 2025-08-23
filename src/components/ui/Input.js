import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Text,
  IconButton,
  HelperText,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';

const Input = ({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  showPasswordToggle = false,
  validation,
  validateOnChange = true,
  validateOnBlur = true,
  style,
  inputStyle,
  containerStyle,
  mode = 'outlined', // 'flat', 'outlined'
  dense = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [validationError, setValidationError] = useState('');
  const [hasBeenBlurred, setHasBeenBlurred] = useState(false);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    if (validateOnChange && value && validation) {
      validateInput(value);
    }
  }, [value, validateOnChange, validation]);

  const validateInput = (inputValue) => {
    if (!validation) return true;

    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (required && (!inputValue || inputValue.trim() === '')) {
      isValid = false;
      errorMessage = `${label || 'This field'} is required`;
    }
    
    // Custom validation function
    else if (validation.validator && typeof validation.validator === 'function') {
      const result = validation.validator(inputValue);
      if (result !== true) {
        isValid = false;
        errorMessage = result || validation.message || 'Invalid input';
      }
    }
    
    // Pattern validation
    else if (validation.pattern && !validation.pattern.test(inputValue)) {
      isValid = false;
      errorMessage = validation.message || 'Invalid format';
    }
    
    // Min length validation
    else if (validation.minLength && inputValue.length < validation.minLength) {
      isValid = false;
      errorMessage = `Minimum ${validation.minLength} characters required`;
    }
    
    // Max length validation
    else if (validation.maxLength && inputValue.length > validation.maxLength) {
      isValid = false;
      errorMessage = `Maximum ${validation.maxLength} characters allowed`;
    }

    setValidationError(errorMessage);
    return isValid;
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setHasBeenBlurred(true);
    
    if (validateOnBlur && validation) {
      validateInput(value);
    }
    
    onBlur && onBlur(e);
  };

  const handleChangeText = (text) => {
    onChangeText(text);
    
    // Clear validation error when user starts typing
    if (validationError && text !== value) {
      setValidationError('');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const getDisplayError = () => {
    return error || (hasBeenBlurred && validationError);
  };

  const getHelperText = () => {
    const displayError = getDisplayError();
    if (displayError) return displayError;
    if (helperText) return helperText;
    if (maxLength) return `${value?.length || 0}/${maxLength}`;
    return '';
  };

  const getRightIcon = () => {
    if (showPasswordToggle && secureTextEntry) {
      return (
        <IconButton
          icon={isPasswordVisible ? 'eye-off' : 'eye'}
          size={20}
          onPress={togglePasswordVisibility}
          iconColor={colors.onSurface + '60'}
        />
      );
    }
    
    if (rightIcon) {
      return (
        <IconButton
          icon={rightIcon}
          size={20}
          onPress={onRightIconPress}
          iconColor={colors.onSurface + '60'}
        />
      );
    }
    
    return null;
  };

  const getLeftIcon = () => {
    if (leftIcon) {
      return (
        <IconButton
          icon={leftIcon}
          size={20}
          iconColor={colors.onSurface + '60'}
        />
      );
    }
    
    return null;
  };

  const animatedBorderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.outline, colors.primary],
  });

  const animatedLabelColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.onSurface + '60', colors.primary],
  });

  const displayError = getDisplayError();
  const displayHelperText = getHelperText();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputContainer, style]}>
        <TextInput
          ref={inputRef}
          label={label}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          error={!!displayError}
          disabled={disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          mode={mode}
          dense={dense}
          style={[
            styles.input,
            inputStyle,
            {
              borderColor: displayError ? colors.error : animatedBorderColor,
            },
          ]}
          theme={
            {
              colors: {
                primary: displayError ? colors.error : colors.primary,
                text: colors.onSurface,
                placeholder: colors.onSurface + '60',
                background: colors.surface,
                surface: colors.surface,
              },
            }
          }
          left={getLeftIcon()}
          right={getRightIcon()}
          {...props}
        />
        
        {required && (
          <Text style={styles.requiredIndicator}>*</Text>
        )}
      </View>
      
      {displayHelperText && (
        <HelperText
          type={displayError ? 'error' : 'info'}
          visible={!!displayHelperText}
          style={styles.helperText}
        >
          {displayHelperText}
        </HelperText>
      )}
    </View>
  );
};

// Specialized Input Components
const EmailInput = (props) => {
  const emailValidation = {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  };

  return (
    <Input
      {...props}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      validation={emailValidation}
      leftIcon="email"
    />
  );
};

const PasswordInput = (props) => {
  const passwordValidation = {
    minLength: 8,
    validator: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      return true;
    },
  };

  return (
    <Input
      {...props}
      secureTextEntry
      showPasswordToggle
      validation={passwordValidation}
      leftIcon="lock"
    />
  );
};

const PhoneInput = (props) => {
  const phoneValidation = {
    pattern: /^[+]?[1-9]?[0-9]{7,15}$/,
    message: 'Please enter a valid phone number',
  };

  return (
    <Input
      {...props}
      keyboardType="phone-pad"
      validation={phoneValidation}
      leftIcon="phone"
    />
  );
};

const SearchInput = ({ onSearch, ...props }) => {
  const handleSubmit = () => {
    onSearch && onSearch(props.value);
  };

  return (
    <Input
      {...props}
      placeholder="Search..."
      leftIcon="magnify"
      rightIcon={props.value ? "close" : undefined}
      onRightIconPress={props.value ? () => props.onChangeText('') : undefined}
      onSubmitEditing={handleSubmit}
      returnKeyType="search"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface,
  },
  requiredIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperText: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.sm,
  },
});

export default Input;
export { EmailInput, PasswordInput, PhoneInput, SearchInput };