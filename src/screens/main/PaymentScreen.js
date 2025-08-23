import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, Card, RadioButton, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { processPayment } from '../../store/slices/paymentSlice';

const PaymentScreen = ({ navigation, route }) => {
  const { amount } = route.params;
  const dispatch = useDispatch();
  const { loading, error, serviceCharge } = useSelector(state => state.payment);
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // Calculate service charge and total amount
  const serviceFee = amount * serviceCharge;
  const totalAmount = amount + serviceFee;
  
  const formatCardNumber = (text) => {
    // Format card number with spaces every 4 digits
    const formatted = text.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };
  
  const formatExpiry = (text) => {
    // Format expiry as MM/YY
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      setCardExpiry(cleaned);
    } else {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    }
  };
  
  const handlePayment = () => {
    const paymentData = {
      amount: totalAmount,
      jobAmount: amount,
      serviceFee,
      paymentMethod,
      cardDetails: paymentMethod === 'card' ? {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvv,
        cardName,
      } : null,
    };
    
    dispatch(processPayment(paymentData))
      .unwrap()
      .then(() => {
        // Navigate back to jobs screen or confirmation
        navigation.navigate('MainTabs', { screen: 'Jobs' });
      });
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Title style={styles.title}>Payment</Title>
        <Text style={styles.subtitle}>Complete your payment to post the job</Text>
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
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>₦{totalAmount.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.paymentMethodContainer}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="card"
            status={paymentMethod === 'card' ? 'checked' : 'unchecked'}
            onPress={() => setPaymentMethod('card')}
            color="#007AFF"
          />
          <Text>Debit/Credit Card</Text>
        </View>
        
        <View style={styles.radioOption}>
          <RadioButton
            value="transfer"
            status={paymentMethod === 'transfer' ? 'checked' : 'unchecked'}
            onPress={() => setPaymentMethod('transfer')}
            color="#007AFF"
          />
          <Text>Bank Transfer</Text>
        </View>
      </View>
      
      {paymentMethod === 'card' ? (
        <View style={styles.cardFormContainer}>
          <TextInput
            label="Card Number"
            value={cardNumber}
            onChangeText={formatCardNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            maxLength={19} // 16 digits + 3 spaces
          />
          
          <View style={styles.cardDetailsRow}>
            <TextInput
              label="Expiry (MM/YY)"
              value={cardExpiry}
              onChangeText={formatExpiry}
              mode="outlined"
              style={[styles.input, styles.expiryInput]}
              keyboardType="numeric"
              maxLength={5} // MM/YY
            />
            
            <TextInput
              label="CVV"
              value={cardCvv}
              onChangeText={setCardCvv}
              mode="outlined"
              style={[styles.input, styles.cvvInput]}
              keyboardType="numeric"
              maxLength={3}
              secureTextEntry
            />
          </View>
          
          <TextInput
            label="Cardholder Name"
            value={cardName}
            onChangeText={setCardName}
            mode="outlined"
            style={styles.input}
          />
          
          <View style={styles.cardLogosContainer}>
            <Image 
              source={require('../../assets/visa.png')} 
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/mastercard.png')} 
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/verve.png')} 
              style={styles.cardLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : (
        <Card style={styles.transferInfoCard}>
          <Card.Content>
            <Text style={styles.transferTitle}>Bank Transfer Details</Text>
            <Text style={styles.transferInfo}>Bank: Moniepoint Microfinance Bank</Text>
            <Text style={styles.transferInfo}>Account Number: 8281532312</Text>
            <Text style={styles.transferInfo}>Account Name: Adtron Technology</Text>
            
            <Text style={styles.transferNote}>
              Please make your transfer of ₦{totalAmount.toFixed(2)} to the account above.
              After making the transfer, click the "Confirm Payment" button below.
            </Text>
          </Card.Content>
        </Card>
      )}
      
      {error && <HelperText type="error">{error}</HelperText>}
      
      <Button 
        mode="contained" 
        onPress={handlePayment} 
        style={styles.button}
        loading={loading}
        disabled={loading || (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardName))}
      >
        {paymentMethod === 'card' ? 'Pay Now' : 'Confirm Payment'}
      </Button>
      
      <Button 
        mode="outlined" 
        onPress={() => navigation.goBack()} 
        style={styles.cancelButton}
      >
        Cancel
      </Button>
      
      <Text style={styles.secureText}>
        All payments are secure and encrypted. Your financial information is never stored on our servers.
      </Text>
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
  paymentMethodContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardFormContainer: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryInput: {
    flex: 1,
    marginRight: 10,
  },
  cvvInput: {
    flex: 1,
  },
  cardLogosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  cardLogo: {
    width: 50,
    height: 30,
    marginHorizontal: 10,
  },
  transferInfoCard: {
    marginBottom: 20,
    backgroundColor: '#f5f9ff',
  },
  transferTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  transferInfo: {
    marginBottom: 5,
    fontSize: 15,
  },
  transferNote: {
    marginTop: 15,
    color: '#555',
    fontStyle: 'italic',
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 8,
  },
  secureText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PaymentScreen;