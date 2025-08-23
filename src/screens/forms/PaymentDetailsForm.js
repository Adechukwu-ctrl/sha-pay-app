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
  Card,
  Divider,
  HelperText,
  Snackbar,
  Chip,
  List,
  RadioButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { savePaymentDetails } from '../../store/slices/paymentSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const PaymentDetailsForm = ({ navigation, route }) => {
  const { jobId, amount, jobDetails } = route.params;
  const dispatch = useDispatch();
  const { loading, error, serviceCharge } = useSelector(state => state.payment);
  
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [validationErrors, setValidationErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showBankList, setShowBankList] = useState(false);
  
  // Nigerian banks list (sample)
  const nigerianBanks = [
    { name: 'Access Bank', code: '044' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Ecobank Nigeria', code: '050' },
  ];
  
  // Calculate amounts
  const serviceFee = amount * (serviceCharge || 0.025); // 2.5% service charge
  const totalAmount = amount + serviceFee;
  
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
    }
  }, [error]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!accountName.trim()) {
      errors.accountName = 'Account name is required';
    }
    
    if (!accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    } else if (accountNumber.length < 10) {
      errors.accountNumber = 'Account number must be at least 10 digits';
    }
    
    if (paymentMethod === 'bank_transfer' && !bankName.trim()) {
      errors.bankName = 'Bank name is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors before submitting');
      setSnackbarVisible(true);
      return;
    }
    
    const paymentData = {
      jobId,
      amount,
      serviceFee,
      totalAmount,
      paymentMethod,
      accountDetails: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        bankCode,
      },
    };
    
    try {
      await dispatch(savePaymentDetails(paymentData)).unwrap();
      
      Alert.alert(
        'Payment Details Saved',
        'Your payment details have been saved successfully. The payment will be processed once the job is completed and approved.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      setSnackbarMessage('Failed to save payment details. Please try again.');
      setSnackbarVisible(true);
    }
  };
  
  const handleBankSelect = (bank) => {
    setBankName(bank.name);
    setBankCode(bank.code);
    setShowBankList(false);
  };
  
  const renderBankList = () => {
    if (!showBankList) return null;
    
    return (
      <Card style={styles.bankListCard}>
        <Card.Content>
          <Title style={styles.bankListTitle}>Select Bank</Title>
          <ScrollView style={styles.bankList} nestedScrollEnabled>
            {nigerianBanks.map((bank, index) => (
              <List.Item
                key={index}
                title={bank.name}
                description={`Code: ${bank.code}`}
                left={props => <List.Icon {...props} icon="bank" />}
                onPress={() => handleBankSelect(bank)}
                style={styles.bankItem}
              />
            ))}
          </ScrollView>
          <Button
            mode="text"
            onPress={() => setShowBankList(false)}
            style={styles.closeBankListButton}
          >
            Close
          </Button>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Icon name="credit-card" size={24} color="#007AFF" />
              <Title style={styles.title}>Payment Details</Title>
            </View>
            <Text style={styles.subtitle}>
              Set up payment details for: {jobDetails?.title || 'Job'}
            </Text>
          </Card.Content>
        </Card>
        
        {/* Amount Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Payment Summary</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Job Amount:</Text>
              <Text style={styles.summaryValue}>₦{amount?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee (2.5%):</Text>
              <Text style={styles.summaryValue}>₦{serviceFee.toFixed(2)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₦{totalAmount.toFixed(2)}</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Payment Method Card */}
        <Card style={styles.methodCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Payment Method</Title>
            <RadioButton.Group
              onValueChange={value => setPaymentMethod(value)}
              value={paymentMethod}
            >
              <View style={styles.radioOption}>
                <RadioButton value="bank_transfer" />
                <Text style={styles.radioText}>Bank Transfer</Text>
                <Icon name="bank" size={20} color="#666" style={styles.radioIcon} />
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="card" />
                <Text style={styles.radioText}>Debit/Credit Card</Text>
                <Icon name="credit-card" size={20} color="#666" style={styles.radioIcon} />
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>
        
        {/* Account Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account Details</Title>
            
            <TextInput
              label="Account Holder Name"
              value={accountName}
              onChangeText={setAccountName}
              mode="outlined"
              style={styles.input}
              error={!!validationErrors.accountName}
              disabled={loading}
              left={<TextInput.Icon icon="account" />}
            />
            {validationErrors.accountName && (
              <HelperText type="error" visible={!!validationErrors.accountName}>
                {validationErrors.accountName}
              </HelperText>
            )}
            
            <TextInput
              label="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              maxLength={10}
              error={!!validationErrors.accountNumber}
              disabled={loading}
              left={<TextInput.Icon icon="numeric" />}
            />
            {validationErrors.accountNumber && (
              <HelperText type="error" visible={!!validationErrors.accountNumber}>
                {validationErrors.accountNumber}
              </HelperText>
            )}
            
            {paymentMethod === 'bank_transfer' && (
              <>
                <TextInput
                  label="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  mode="outlined"
                  style={styles.input}
                  error={!!validationErrors.bankName}
                  disabled={loading}
                  right={
                    <TextInput.Icon
                      icon="chevron-down"
                      onPress={() => setShowBankList(true)}
                    />
                  }
                  left={<TextInput.Icon icon="bank" />}
                  onFocus={() => setShowBankList(true)}
                />
                {validationErrors.bankName && (
                  <HelperText type="error" visible={!!validationErrors.bankName}>
                    {validationErrors.bankName}
                  </HelperText>
                )}
              </>
            )}
          </Card.Content>
        </Card>
        
        {renderBankList()}
        
        {/* Important Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <Icon name="information" size={20} color="#FF9800" />
              <Text style={styles.infoTitle}>Important Information</Text>
            </View>
            <Text style={styles.infoText}>
              • Payment will be held in escrow until job completion
            </Text>
            <Text style={styles.infoText}>
              • Funds will be released after job satisfaction confirmation
            </Text>
            <Text style={styles.infoText}>
              • Service fee covers platform maintenance and security
            </Text>
            <Text style={styles.infoText}>
              • All transactions are secured and encrypted
            </Text>
          </Card.Content>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={loading}
            loading={loading}
            icon="check"
          >
            {loading ? 'Saving...' : 'Save Payment Details'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
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
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  divider: {
    marginVertical: 12,
  },
  methodCard: {
    marginBottom: 16,
    elevation: 2,
  },
  detailsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  radioIcon: {
    marginLeft: 8,
  },
  input: {
    marginBottom: 8,
  },
  bankListCard: {
    marginBottom: 16,
    elevation: 4,
    maxHeight: 300,
  },
  bankListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  bankList: {
    maxHeight: 200,
  },
  bankItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBankListButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 24,
    elevation: 2,
    backgroundColor: '#FFF8E1',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FF8F00',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    paddingVertical: 8,
    borderColor: '#666',
  },
  snackbar: {
    backgroundColor: '#333',
  },
});

export default PaymentDetailsForm;