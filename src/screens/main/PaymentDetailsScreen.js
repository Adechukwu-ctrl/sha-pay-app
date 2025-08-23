import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Card, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { savePaymentDetails } from '../../store/slices/paymentSlice';

const PaymentDetailsScreen = ({ navigation, route }) => {
  const { jobId, amount } = route.params;
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.payment);
  const { serviceCharge } = useSelector(state => state.payment);
  
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Calculate the amount after service charge
  const serviceFee = amount * serviceCharge;
  const amountAfterCharge = amount - serviceFee;
  
  const handleSubmit = () => {
    const paymentDetails = {
      jobId,
      accountName,
      accountNumber,
      bankName,
      amount: amountAfterCharge,
      originalAmount: amount,
      serviceFee
    };
    
    dispatch(savePaymentDetails(paymentDetails))
      .unwrap()
      .then(() => {
        navigation.navigate('MainTabs', { screen: 'Jobs' });
      });
  };
  
  const formatAccountNumber = (text) => {
    // Only allow numbers and limit to 10 digits
    const formatted = text.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(formatted);
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Title style={styles.title}>Payment Details</Title>
        <Text style={styles.subtitle}>Enter your bank account details to receive payment</Text>
      </View>
      
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.summaryTitle}>Payment Summary</Title>
          
          <View style={styles.summaryRow}>
            <Text>Job Amount:</Text>
            <Text>₦{amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text>Service Fee (2.5%):</Text>
            <Text>₦{serviceFee.toFixed(2)}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>You will receive:</Text>
            <Text style={styles.totalAmount}>₦{amountAfterCharge.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Bank Account Information</Text>
        
        <TextInput
          label="Account Name"
          value={accountName}
          onChangeText={setAccountName}
          mode="outlined"
          style={styles.input}
          placeholder="Enter account holder name"
        />
        
        <TextInput
          label="Account Number"
          value={accountNumber}
          onChangeText={formatAccountNumber}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter 10-digit account number"
          maxLength={10}
        />
        
        <TextInput
          label="Bank Name"
          value={bankName}
          onChangeText={setBankName}
          mode="outlined"
          style={styles.input}
          placeholder="Enter bank name"
        />
        
        {error && <HelperText type="error">{error}</HelperText>}
        
        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.button}
          loading={loading}
          disabled={loading || !accountName || !accountNumber || !bankName || accountNumber.length < 10}
        >
          Save Payment Details
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()} 
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
      
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>Important Information</Text>
          <Text style={styles.infoText}>
            • Payment will be processed after the Service Requirer submits the Job Satisfaction Form
          </Text>
          <Text style={styles.infoText}>
            • A service fee of 2.5% is deducted from the total job amount
          </Text>
          <Text style={styles.infoText}>
            • Please ensure your bank account details are correct to avoid payment delays
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  divider: {
    marginVertical: 10,
  },
  totalRow: {
    marginTop: 5,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#007AFF',
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
  infoCard: {
    marginBottom: 20,
    backgroundColor: '#f5f9ff',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 8,
    fontSize: 14,
    color: '#555',
  },
});

export default PaymentDetailsScreen;