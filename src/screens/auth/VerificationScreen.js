import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
  Chip,
  Card,
  Paragraph,
  ProgressBar,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { verifyUser, clearError } from '../../store/slices/authSlice';

const VerificationScreen = ({ navigation }) => {
  const [bvnNumber, setBvnNumber] = useState('');
  const [nimcNumber, setNimcNumber] = useState('');
  const [selectedVerificationMethods, setSelectedVerificationMethods] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  
  // Validation errors
  const [bvnError, setBvnError] = useState('');
  const [nimcError, setNimcError] = useState('');
  
  const dispatch = useDispatch();
  const { loading, error, verificationStatus, user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Calculate verification progress
    const totalMethods = 4; // BVN, NIMC, CBN, CREDIT
    const progress = selectedVerificationMethods.length / totalMethods;
    setVerificationProgress(progress);
  }, [selectedVerificationMethods]);

  const validateBVN = (bvn) => {
    const bvnRegex = /^[0-9]{11}$/;
    return bvnRegex.test(bvn);
  };

  const validateNIMC = (nimc) => {
    const nimcRegex = /^[0-9]{11}$/;
    return nimcRegex.test(nimc);
  };

  const validateForm = () => {
    let isValid = true;
    setBvnError('');
    setNimcError('');

    if (selectedVerificationMethods.includes('BVN')) {
      if (!bvnNumber.trim()) {
        setBvnError('BVN number is required');
        isValid = false;
      } else if (!validateBVN(bvnNumber)) {
        setBvnError('BVN must be exactly 11 digits');
        isValid = false;
      }
    }

    if (selectedVerificationMethods.includes('NIMC')) {
      if (!nimcNumber.trim()) {
        setNimcError('NIMC number is required');
        isValid = false;
      } else if (!validateNIMC(nimcNumber)) {
        setNimcError('NIMC number must be exactly 11 digits');
        isValid = false;
      }
    }

    return isValid;
  };
  
  const handleVerification = async () => {
    if (selectedVerificationMethods.length === 0) {
      Alert.alert('No Methods Selected', 'Please select at least one verification method.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const verificationData = {
        bvnNumber: bvnNumber.trim(),
        nimcNumber: nimcNumber.trim(),
        methods: selectedVerificationMethods
      };
      
      await dispatch(verifyUser(verificationData)).unwrap();
      
      Alert.alert(
        'Verification Initiated',
        'Your verification request has been submitted. You will be notified once the process is complete.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('MainTabs')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Verification Failed', error || 'Please try again later.');
    }
  };
  
  const toggleVerificationMethod = (method) => {
    if (selectedVerificationMethods.includes(method)) {
      setSelectedVerificationMethods(
        selectedVerificationMethods.filter(m => m !== method)
      );
    } else {
      setSelectedVerificationMethods([...selectedVerificationMethods, method]);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification',
      'You can verify your identity later in your profile settings. Some features may be limited without verification.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.navigate('MainTabs')
        }
      ]
    );
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  const getVerificationMethodInfo = (method) => {
    const info = {
      BVN: {
        title: 'Bank Verification Number',
        description: 'Verify your banking information',
        icon: 'bank',
        color: '#4CAF50'
      },
      NIMC: {
        title: 'National Identity Number',
        description: 'Verify with your National ID',
        icon: 'card-account-details',
        color: '#2196F3'
      },
      CBN: {
        title: 'Central Bank Records',
        description: 'Verify with CBN database',
        icon: 'bank-transfer',
        color: '#FF9800'
      },
      CREDIT: {
        title: 'Credit Bureau Check',
        description: 'Verify your credit history',
        icon: 'chart-line',
        color: '#9C27B0'
      }
    };
    return info[method] || {};
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <IconButton
            icon="shield-check"
            size={48}
            iconColor="#007AFF"
            style={styles.headerIcon}
          />
          <Title style={styles.title}>Identity Verification</Title>
          <Paragraph style={styles.subtitle}>
            Secure your account and build trust with verified credentials
          </Paragraph>
        </View>

        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.progressTitle}>Verification Progress</Text>
            <ProgressBar
              progress={verificationProgress}
              color="#007AFF"
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {selectedVerificationMethods.length} of 4 methods selected
            </Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Why Verify?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <IconButton icon="check-circle" size={20} iconColor="#4CAF50" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>Increase your trust score</Text>
              </View>
              <View style={styles.benefitItem}>
                <IconButton icon="check-circle" size={20} iconColor="#4CAF50" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>Access premium features</Text>
              </View>
              <View style={styles.benefitItem}>
                <IconButton icon="check-circle" size={20} iconColor="#4CAF50" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>Higher transaction limits</Text>
              </View>
              <View style={styles.benefitItem}>
                <IconButton icon="check-circle" size={20} iconColor="#4CAF50" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>Enhanced security</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Choose Verification Methods</Text>
          
          {['BVN', 'NIMC', 'CBN', 'CREDIT'].map((method) => {
            const methodInfo = getVerificationMethodInfo(method);
            const isSelected = selectedVerificationMethods.includes(method);
            
            return (
              <Card
                key={method}
                style={[
                  styles.methodCard,
                  isSelected && styles.methodCardSelected
                ]}
                onPress={() => toggleVerificationMethod(method)}
              >
                <Card.Content style={styles.methodCardContent}>
                  <View style={styles.methodHeader}>
                    <IconButton
                      icon={methodInfo.icon}
                      size={24}
                      iconColor={isSelected ? methodInfo.color : '#666'}
                    />
                    <View style={styles.methodInfo}>
                      <Text style={[
                        styles.methodTitle,
                        isSelected && styles.methodTitleSelected
                      ]}>
                        {methodInfo.title}
                      </Text>
                      <Text style={styles.methodDescription}>
                        {methodInfo.description}
                      </Text>
                    </View>
                    <IconButton
                      icon={isSelected ? 'check-circle' : 'circle-outline'}
                      size={24}
                      iconColor={isSelected ? '#007AFF' : '#ccc'}
                    />
                  </View>
                </Card.Content>
              </Card>
            );
          })}
          
          {selectedVerificationMethods.includes('BVN') && (
            <View style={styles.inputContainer}>
              <TextInput
                label="Bank Verification Number (BVN)"
                value={bvnNumber}
                onChangeText={setBvnNumber}
                mode="outlined"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={11}
                placeholder="Enter your 11-digit BVN"
                error={!!bvnError}
                disabled={loading}
              />
              {bvnError ? (
                <HelperText type="error" visible={!!bvnError}>
                  {bvnError}
                </HelperText>
              ) : null}
            </View>
          )}
          
          {selectedVerificationMethods.includes('NIMC') && (
            <View style={styles.inputContainer}>
              <TextInput
                label="National Identity Number (NIMC)"
                value={nimcNumber}
                onChangeText={setNimcNumber}
                mode="outlined"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={11}
                placeholder="Enter your 11-digit NIMC number"
                error={!!nimcError}
                disabled={loading}
              />
              {nimcError ? (
                <HelperText type="error" visible={!!nimcError}>
                  {nimcError}
                </HelperText>
              ) : null}
            </View>
          )}
          
          <Button
            mode="contained"
            onPress={handleVerification}
            style={styles.verifyButton}
            loading={loading}
            disabled={loading || selectedVerificationMethods.length === 0}
            icon="shield-check"
          >
            {loading ? 'Verifying...' : 'Start Verification'}
          </Button>
          
          <Button
            mode="text"
            onPress={handleSkip}
            style={styles.skipButton}
            disabled={loading}
          >
            Skip for Now
          </Button>
          
          <View style={styles.securityNote}>
            <IconButton icon="lock" size={16} iconColor="#666" />
            <Text style={styles.securityText}>
              Your information is encrypted and securely processed
            </Text>
          </View>
        </View>
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
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    backgroundColor: '#f0f8ff',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    marginBottom: 16,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 24,
    elevation: 2,
    backgroundColor: '#f8fffe',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitIcon: {
    margin: 0,
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  methodCard: {
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  methodCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
    elevation: 3,
  },
  methodCardContent: {
    paddingVertical: 8,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 8,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  methodTitleSelected: {
    color: '#007AFF',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  verifyButton: {
    marginTop: 24,
    marginBottom: 12,
    paddingVertical: 8,
  },
  skipButton: {
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  snackbar: {
    backgroundColor: '#d32f2f',
  },
});

export default VerificationScreen;