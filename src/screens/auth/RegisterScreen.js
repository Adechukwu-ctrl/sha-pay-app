import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Title,
  HelperText,
  RadioButton,
  Card,
  Paragraph,
  Snackbar,
  Checkbox,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('requirer');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  // Validation errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^+0-9]/g, '');
    // Check if it's a valid phone number (10-15 digits, optionally starting with +)
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(cleanPhone);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setFullNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate full name
    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setFullNameError('Full name must be at least 2 characters');
      isValid = false;
    } else {
      // Check if name has valid characters
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!nameRegex.test(fullName.trim())) {
        setFullNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
        isValid = false;
      }
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate phone
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid phone number');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    // Validate terms and privacy agreement
    if (!agreeToTerms || !acceptPrivacy) {
      Alert.alert('Agreement Required', 'Please agree to both the Terms of Service and Privacy Policy to continue.');
      isValid = false;
    }

    return isValid;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User'; // Fallback to firstName or 'User' if no lastName
      
      const result = await dispatch(register({
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: phone.replace(/[^+0-9]/g, ''), // Clean phone number
        password,
        confirmPassword,
        userType,
        acceptTerms: agreeToTerms,
        acceptPrivacy: acceptPrivacy
      })).unwrap();
      
      Alert.alert(
        'Registration Successful',
        'Please check your email for verification instructions.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      // Error will be handled by Redux and shown in Snackbar
      console.error('Registration failed:', error);
    }
  };
  
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Title style={styles.logo}>Sha_Pay!</Title>
          <Paragraph style={styles.tagline}>
            Join our trusted community
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Create Account</Title>
            <Paragraph style={styles.cardSubtitle}>
              Start connecting with service providers today
            </Paragraph>

            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              error={!!fullNameError}
              disabled={loading}
            />
            {fullNameError ? (
              <HelperText type="error" visible={!!fullNameError}>
                {fullNameError}
              </HelperText>
            ) : null}

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!emailError}
              disabled={loading}
            />
            {emailError ? (
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            ) : null}

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="+234 xxx xxx xxxx"
              error={!!phoneError}
              disabled={loading}
            />
            {phoneError ? (
              <HelperText type="error" visible={!!phoneError}>
                {phoneError}
              </HelperText>
            ) : null}

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={secureTextEntry}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye' : 'eye-off'}
                  onPress={toggleSecureEntry}
                />
              }
              error={!!passwordError}
              disabled={loading}
            />
            {passwordError ? (
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>
            ) : null}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={secureTextEntry}
              error={!!confirmPasswordError}
              disabled={loading}
            />
            {confirmPasswordError ? (
              <HelperText type="error" visible={!!confirmPasswordError}>
                {confirmPasswordError}
              </HelperText>
            ) : null}

            <Text style={styles.sectionTitle}>Account Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioCard,
                  userType === 'requirer' && styles.radioCardSelected
                ]}
                onPress={() => setUserType('requirer')}
                disabled={loading}
              >
                <RadioButton
                  value="requirer"
                  status={userType === 'requirer' ? 'checked' : 'unchecked'}
                  color="#007AFF"
                />
                <View style={styles.radioContent}>
                  <Text style={styles.radioTitle}>Service Requirer</Text>
                  <Text style={styles.radioDescription}>Find and hire service providers</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioCard,
                  userType === 'provider' && styles.radioCardSelected
                ]}
                onPress={() => setUserType('provider')}
                disabled={loading}
              >
                <RadioButton
                  value="provider"
                  status={userType === 'provider' ? 'checked' : 'unchecked'}
                  color="#007AFF"
                />
                <View style={styles.radioContent}>
                  <Text style={styles.radioTitle}>Service Provider</Text>
                  <Text style={styles.radioDescription}>Offer your services and earn money</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.termsContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={agreeToTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  color="#007AFF"
                  disabled={loading}
                />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms of Service</Text>
                </Text>
              </View>
              
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={acceptPrivacy ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                  color="#007AFF"
                  disabled={loading}
                />
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              loading={loading}
              disabled={loading || !agreeToTerms || !acceptPrivacy}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
                compact
              >
                Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!error}
        onDismiss={handleDismissError}
        duration={4000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  radioGroup: {
    marginBottom: 20,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  radioCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  radioContent: {
    marginLeft: 8,
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  radioDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  termsContainer: {
    marginVertical: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  registerButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});

export default RegisterScreen;