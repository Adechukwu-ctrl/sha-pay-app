import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedInput,
  ThemedButton,
  ThemedBadge,
  ThemedModal,
  ThemedListItem,
  LoadingSpinner,
  SegmentedControl,
  CreditRating,
} from '../components/ui';
import { colors, spacing } from '../theme';
import verificationService from '../services/verificationService';
import { selectUser } from '../store/slices/authSlice';
import { fetchUserRating } from '../store/slices/creditRatingSlice';

const VerificationScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [otp, setOtp] = useState('');
  
  // Form data
  const [nimcData, setNimcData] = useState({
    nin: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
  });
  
  const [bvnData, setBvnData] = useState({
    bvn: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
  });
  
  const [cbnData, setCbnData] = useState({
    accountNumber: '',
    bankCode: '',
    bvn: '',
  });
  
  const [contactData, setContactData] = useState({
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
  });
  
  const verificationSteps = [
    { id: 'nimc', title: 'NIMC Verification', required: true },
    { id: 'bvn', title: 'BVN Verification', required: true },
    { id: 'cbn', title: 'CBN Compliance', required: false },
    { id: 'contact', title: 'Contact Verification', required: true },
  ];
  
  useEffect(() => {
    loadVerificationStatus();
  }, []);
  
  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const result = await verificationService.getVerificationStatus(user.id);
      
      if (result.success) {
        setVerificationStatus(result.status);
        
        // Set active step to first incomplete step
        const incompleteStep = verificationSteps.findIndex(step => 
          !result.verifications[step.id]?.verified
        );
        setActiveStep(incompleteStep >= 0 ? incompleteStep : 0);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNIMCVerification = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.verifyNIMC({
        ...nimcData,
        phoneNumber: contactData.phoneNumber,
      });
      
      if (result.success && result.verified) {
        Alert.alert('Success', 'NIMC verification completed successfully!');
        await loadVerificationStatus();
        dispatch(fetchUserRating(user.id));
        setActiveStep(1); // Move to BVN verification
      } else {
        Alert.alert('Verification Failed', result.error || 'NIMC verification failed');
      }
    } catch (error) {
      console.error('NIMC verification error:', error);
      Alert.alert('Error', 'An error occurred during NIMC verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBVNVerification = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.verifyBVN({
        ...bvnData,
        phoneNumber: contactData.phoneNumber,
      });
      
      if (result.success && result.verified) {
        Alert.alert('Success', 'BVN verification completed successfully!');
        await loadVerificationStatus();
        dispatch(fetchUserRating(user.id));
        setActiveStep(2); // Move to CBN compliance
      } else {
        Alert.alert('Verification Failed', result.error || 'BVN verification failed');
      }
    } catch (error) {
      console.error('BVN verification error:', error);
      Alert.alert('Error', 'An error occurred during BVN verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCBNVerification = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.verifyCBNCompliance({
        ...cbnData,
        userId: user.id,
      });
      
      if (result.success && result.compliant) {
        Alert.alert('Success', 'CBN compliance verification completed!');
        await loadVerificationStatus();
        dispatch(fetchUserRating(user.id));
        setActiveStep(3); // Move to contact verification
      } else {
        Alert.alert('Verification Failed', result.error || 'CBN compliance verification failed');
      }
    } catch (error) {
      console.error('CBN verification error:', error);
      Alert.alert('Error', 'An error occurred during CBN verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhoneVerification = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.verifyPhoneNumber(contactData.phoneNumber);
      
      if (result.success && result.otpSent) {
        setOtpData({
          verificationId: result.verificationId,
          type: 'phone',
          contact: contactData.phoneNumber,
        });
        setShowOTPModal(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert('Error', 'An error occurred during phone verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailVerification = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.verifyEmail(contactData.email);
      
      if (result.success && result.emailSent) {
        Alert.alert(
          'Verification Email Sent',
          'Please check your email and click the verification link.'
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', 'An error occurred during email verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOTPConfirmation = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.confirmPhoneVerification(
        otpData.verificationId,
        otp
      );
      
      if (result.success && result.verified) {
        Alert.alert('Success', 'Phone number verified successfully!');
        setShowOTPModal(false);
        setOtp('');
        setOtpData(null);
        await loadVerificationStatus();
        dispatch(fetchUserRating(user.id));
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP confirmation error:', error);
      Alert.alert('Error', 'An error occurred during OTP verification');
    } finally {
      setLoading(false);
    }
  };
  
  const getStepStatus = (stepId) => {
    if (!verificationStatus?.verifications) return 'pending';
    
    const verification = verificationStatus.verifications[stepId];
    if (verification?.verified) return 'completed';
    if (verification?.pending) return 'pending';
    return 'not_started';
  };
  
  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      default:
        return colors.text.secondary;
    }
  };
  
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {verificationSteps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isActive = index === activeStep;
        
        return (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: isActive
                    ? colors.primary.main
                    : getStepColor(status),
                  borderColor: isActive
                    ? colors.primary.main
                    : getStepColor(status),
                },
              ]}
            >
              <ThemedText
                variant="caption"
                style={[
                  styles.stepNumber,
                  { color: status === 'completed' ? colors.background.paper : colors.text.primary },
                ]}
              >
                {status === 'completed' ? '✓' : index + 1}
              </ThemedText>
            </View>
            
            <ThemedText
              variant="caption"
              style={[
                styles.stepLabel,
                { color: isActive ? colors.primary.main : colors.text.secondary },
              ]}
            >
              {step.title}
            </ThemedText>
            
            {step.required && (
              <ThemedBadge
                variant="outline"
                size="small"
                style={styles.requiredBadge}
              >
                Required
              </ThemedBadge>
            )}
          </View>
        );
      })}
    </View>
  );
  
  const renderNIMCForm = () => (
    <ThemedCard style={styles.formCard}>
      <ThemedText variant="h6" style={styles.formTitle}>
        NIMC Verification
      </ThemedText>
      
      <ThemedText variant="body2" style={styles.formDescription}>
        Verify your National Identity Number to increase your trust score.
      </ThemedText>
      
      <ThemedInput
        label="National Identity Number (NIN)"
        value={nimcData.nin}
        onChangeText={(text) => setNimcData({ ...nimcData, nin: text })}
        placeholder="Enter your 11-digit NIN"
        keyboardType="numeric"
        maxLength={11}
        style={styles.input}
      />
      
      <ThemedInput
        label="First Name"
        value={nimcData.firstName}
        onChangeText={(text) => setNimcData({ ...nimcData, firstName: text })}
        placeholder="Enter your first name"
        style={styles.input}
      />
      
      <ThemedInput
        label="Last Name"
        value={nimcData.lastName}
        onChangeText={(text) => setNimcData({ ...nimcData, lastName: text })}
        placeholder="Enter your last name"
        style={styles.input}
      />
      
      <ThemedInput
        label="Date of Birth"
        value={nimcData.dateOfBirth}
        onChangeText={(text) => setNimcData({ ...nimcData, dateOfBirth: text })}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />
      
      <ThemedButton
        variant="primary"
        onPress={handleNIMCVerification}
        loading={loading}
        disabled={!nimcData.nin || !nimcData.firstName || !nimcData.lastName || !nimcData.dateOfBirth}
        style={styles.submitButton}
      >
        Verify NIMC
      </ThemedButton>
    </ThemedCard>
  );
  
  const renderBVNForm = () => (
    <ThemedCard style={styles.formCard}>
      <ThemedText variant="h6" style={styles.formTitle}>
        BVN Verification
      </ThemedText>
      
      <ThemedText variant="body2" style={styles.formDescription}>
        Verify your Bank Verification Number for financial trust.
      </ThemedText>
      
      <ThemedInput
        label="Bank Verification Number (BVN)"
        value={bvnData.bvn}
        onChangeText={(text) => setBvnData({ ...bvnData, bvn: text })}
        placeholder="Enter your 11-digit BVN"
        keyboardType="numeric"
        maxLength={11}
        style={styles.input}
      />
      
      <ThemedInput
        label="First Name"
        value={bvnData.firstName}
        onChangeText={(text) => setBvnData({ ...bvnData, firstName: text })}
        placeholder="Enter your first name"
        style={styles.input}
      />
      
      <ThemedInput
        label="Last Name"
        value={bvnData.lastName}
        onChangeText={(text) => setBvnData({ ...bvnData, lastName: text })}
        placeholder="Enter your last name"
        style={styles.input}
      />
      
      <ThemedInput
        label="Date of Birth"
        value={bvnData.dateOfBirth}
        onChangeText={(text) => setBvnData({ ...bvnData, dateOfBirth: text })}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />
      
      <ThemedButton
        variant="primary"
        onPress={handleBVNVerification}
        loading={loading}
        disabled={!bvnData.bvn || !bvnData.firstName || !bvnData.lastName || !bvnData.dateOfBirth}
        style={styles.submitButton}
      >
        Verify BVN
      </ThemedButton>
    </ThemedCard>
  );
  
  const renderCBNForm = () => (
    <ThemedCard style={styles.formCard}>
      <ThemedText variant="h6" style={styles.formTitle}>
        CBN Compliance
      </ThemedText>
      
      <ThemedText variant="body2" style={styles.formDescription}>
        Verify CBN compliance for enhanced financial services.
      </ThemedText>
      
      <ThemedInput
        label="Account Number"
        value={cbnData.accountNumber}
        onChangeText={(text) => setCbnData({ ...cbnData, accountNumber: text })}
        placeholder="Enter your account number"
        keyboardType="numeric"
        style={styles.input}
      />
      
      <ThemedInput
        label="Bank Code"
        value={cbnData.bankCode}
        onChangeText={(text) => setCbnData({ ...cbnData, bankCode: text })}
        placeholder="Enter bank code"
        style={styles.input}
      />
      
      <ThemedInput
        label="BVN"
        value={cbnData.bvn}
        onChangeText={(text) => setCbnData({ ...cbnData, bvn: text })}
        placeholder="Enter your BVN"
        keyboardType="numeric"
        maxLength={11}
        style={styles.input}
      />
      
      <ThemedButton
        variant="primary"
        onPress={handleCBNVerification}
        loading={loading}
        disabled={!cbnData.accountNumber || !cbnData.bankCode || !cbnData.bvn}
        style={styles.submitButton}
      >
        Verify CBN Compliance
      </ThemedButton>
    </ThemedCard>
  );
  
  const renderContactForm = () => (
    <ThemedCard style={styles.formCard}>
      <ThemedText variant="h6" style={styles.formTitle}>
        Contact Verification
      </ThemedText>
      
      <ThemedText variant="body2" style={styles.formDescription}>
        Verify your phone number and email address.
      </ThemedText>
      
      <View style={styles.contactSection}>
        <ThemedText variant="body1" style={styles.sectionTitle}>
          Phone Number
        </ThemedText>
        
        <ThemedInput
          label="Phone Number"
          value={contactData.phoneNumber}
          onChangeText={(text) => setContactData({ ...contactData, phoneNumber: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          style={styles.input}
        />
        
        <ThemedButton
          variant="outline"
          onPress={handlePhoneVerification}
          loading={loading}
          disabled={!contactData.phoneNumber}
          style={styles.verifyButton}
        >
          Verify Phone
        </ThemedButton>
      </View>
      
      <View style={styles.contactSection}>
        <ThemedText variant="body1" style={styles.sectionTitle}>
          Email Address
        </ThemedText>
        
        <ThemedInput
          label="Email Address"
          value={contactData.email}
          onChangeText={(text) => setContactData({ ...contactData, email: text })}
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        
        <ThemedButton
          variant="outline"
          onPress={handleEmailVerification}
          loading={loading}
          disabled={!contactData.email}
          style={styles.verifyButton}
        >
          Verify Email
        </ThemedButton>
      </View>
    </ThemedCard>
  );
  
  const renderCurrentStep = () => {
    switch (activeStep) {
      case 0:
        return renderNIMCForm();
      case 1:
        return renderBVNForm();
      case 2:
        return renderCBNForm();
      case 3:
        return renderContactForm();
      default:
        return null;
    }
  };
  
  const renderOTPModal = () => (
    <ThemedModal
      visible={showOTPModal}
      onClose={() => setShowOTPModal(false)}
      title="Enter OTP"
    >
      <View style={styles.otpModalContent}>
        <ThemedText variant="body2" style={styles.otpDescription}>
          We've sent a verification code to {otpData?.contact}
        </ThemedText>
        
        <ThemedInput
          label="Verification Code"
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit code"
          keyboardType="numeric"
          maxLength={6}
          style={styles.otpInput}
        />
        
        <View style={styles.otpActions}>
          <ThemedButton
            variant="outline"
            onPress={() => setShowOTPModal(false)}
            style={styles.otpButton}
          >
            Cancel
          </ThemedButton>
          
          <ThemedButton
            variant="primary"
            onPress={handleOTPConfirmation}
            loading={loading}
            disabled={otp.length !== 6}
            style={styles.otpButton}
          >
            Verify
          </ThemedButton>
        </View>
      </View>
    </ThemedModal>
  );
  
  if (loading && !verificationStatus) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Identity Verification"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Credit Rating Display */}
        <CreditRating
          userId={user?.id}
          showDetails={false}
          showRecommendations={false}
          style={styles.creditRating}
        />
        
        {/* Step Indicator */}
        {renderStepIndicator()}
        
        {/* Current Step Form */}
        {renderCurrentStep()}
        
        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          <ThemedButton
            variant="outline"
            onPress={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            style={styles.navButton}
          >
            Previous
          </ThemedButton>
          
          <ThemedButton
            variant="outline"
            onPress={() => setActiveStep(Math.min(verificationSteps.length - 1, activeStep + 1))}
            disabled={activeStep === verificationSteps.length - 1}
            style={styles.navButton}
          >
            Next
          </ThemedButton>
        </View>
        
        {/* Verification Status */}
        {verificationStatus && (
          <ThemedCard style={styles.statusCard}>
            <ThemedText variant="h6" style={styles.statusTitle}>
              Verification Progress
            </ThemedText>
            
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${verificationStatus.completionPercentage || 0}%`,
                  },
                ]}
              />
            </View>
            
            <ThemedText variant="body2" style={styles.progressText}>
              {verificationStatus.completionPercentage || 0}% Complete
            </ThemedText>
          </ThemedCard>
        )}
      </ScrollView>
      
      {renderOTPModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  creditRating: {
    marginBottom: spacing[6],
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[2],
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  stepNumber: {
    fontWeight: 'bold',
  },
  stepLabel: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: spacing[1],
  },
  requiredBadge: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  formCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  formTitle: {
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
  formDescription: {
    marginBottom: spacing[4],
    color: colors.text.secondary,
  },
  input: {
    marginBottom: spacing[3],
  },
  submitButton: {
    marginTop: spacing[2],
  },
  contactSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
    fontWeight: '600',
  },
  verifyButton: {
    marginTop: spacing[2],
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing[4],
  },
  navButton: {
    flex: 0.45,
  },
  statusCard: {
    padding: spacing[4],
    marginTop: spacing[4],
  },
  statusTitle: {
    marginBottom: spacing[3],
    color: colors.text.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  otpModalContent: {
    paddingVertical: spacing[4],
  },
  otpDescription: {
    textAlign: 'center',
    marginBottom: spacing[4],
    color: colors.text.secondary,
  },
  otpInput: {
    marginBottom: spacing[4],
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpButton: {
    flex: 0.45,
  },
});

export default VerificationScreen;