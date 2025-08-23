import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Chip,
  Surface,
  List,
  TextInput,
  RadioButton,
  Divider,
  IconButton,
  Switch,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { processPayment, createPaymentIntent } from '../../store/slices/paymentSlice';
import { showNotification } from '../../store/slices/notificationSlice';

const { width: screenWidth } = Dimensions.get('window');

const PaymentScreen = ({ route, navigation }) => {
  const { bookingId, amount, serviceTitle, providerId } = route.params;
  const dispatch = useDispatch();
  const { paymentMethods, loading, paymentIntent } = useSelector(state => state.payment);
  const { user } = useSelector(state => state.auth);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);
  
  useEffect(() => {
    // Calculate fees
    const fee = amount * 0.025; // 2.5% platform fee
    setPlatformFee(fee);
  }, [amount]);
  
  useEffect(() => {
    // Create payment intent when component mounts
    if (bookingId && amount) {
      dispatch(createPaymentIntent({
        bookingId,
        amount: amount + platformFee - discount,
        currency: 'NGN'
      }));
    }
  }, [bookingId, amount, platformFee, discount, dispatch]);
  
  const formatCardNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
  };
  
  const formatExpiryDate = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };
  
  const validateCardDetails = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV');
      return false;
    }
    
    if (!cardHolderName.trim()) {
      Alert.alert('Invalid Name', 'Please enter the card holder name');
      return false;
    }
    
    return true;
  };
  
  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }
    
    if (selectedPaymentMethod === 'new_card' && !validateCardDetails()) {
      return;
    }
    
    setProcessing(true);
    try {
      const paymentData = {
        bookingId,
        amount: amount + platformFee - discount,
        paymentMethodId: selectedPaymentMethod,
        paymentIntentId: paymentIntent?.id,
        saveCard,
      };
      
      if (selectedPaymentMethod === 'new_card') {
        paymentData.cardDetails = {
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: expiryDate.split('/')[0],
          expiryYear: '20' + expiryDate.split('/')[1],
          cvv,
          holderName: cardHolderName,
        };
      }
      
      const result = await dispatch(processPayment(paymentData)).unwrap();
      
      dispatch(showNotification({
        type: 'success',
        message: 'Payment processed successfully!'
      }));
      
      navigation.navigate('PaymentSuccess', {
        paymentId: result.id,
        bookingId,
        amount: paymentData.amount,
      });
    } catch (error) {
      Alert.alert('Payment Failed', error.message || 'Unable to process payment');
    } finally {
      setProcessing(false);
    }
  };
  
  const applyPromoCode = () => {
    // Mock promo code validation
    if (promoCode.toLowerCase() === 'shapay10') {
      setDiscount(amount * 0.1); // 10% discount
      dispatch(showNotification({
        type: 'success',
        message: 'Promo code applied! 10% discount'
      }));
    } else if (promoCode.toLowerCase() === 'first20') {
      setDiscount(amount * 0.2); // 20% discount for first-time users
      dispatch(showNotification({
        type: 'success',
        message: 'Promo code applied! 20% discount'
      }));
    } else {
      Alert.alert('Invalid Code', 'The promo code you entered is not valid');
    }
  };
  
  const renderPaymentSummary = () => (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Payment Summary</Title>
        
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{serviceTitle}</Text>
          <Text style={styles.bookingId}>Booking ID: #{bookingId}</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Service Fee:</Text>
          <Text style={styles.priceValue}>₦{amount?.toLocaleString()}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Platform Fee (2.5%):</Text>
          <Text style={styles.priceValue}>₦{platformFee?.toLocaleString()}</Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.success }]}>Discount:</Text>
            <Text style={[styles.priceValue, { color: colors.success }]}>
              -₦{discount?.toLocaleString()}
            </Text>
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>
            ₦{(amount + platformFee - discount)?.toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderPromoCode = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Promo Code</Title>
        
        <View style={styles.promoContainer}>
          <TextInput
            mode="outlined"
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            style={styles.promoInput}
            autoCapitalize="characters"
          />
          <Button
            mode="contained"
            onPress={applyPromoCode}
            style={styles.promoButton}
            compact
          >
            Apply
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderPaymentMethods = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Payment Method</Title>
        
        <RadioButton.Group
          onValueChange={(value) => {
            setSelectedPaymentMethod(value);
            setShowCardForm(value === 'new_card');
          }}
          value={selectedPaymentMethod}
        >
          {/* Saved Cards */}
          {paymentMethods?.savedCards?.map((card) => (
            <View key={card.id} style={styles.paymentOption}>
              <RadioButton value={card.id} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  **** **** **** {card.last4}
                </Text>
                <Text style={styles.cardDetails}>
                  {card.brand.toUpperCase()} • Expires {card.expMonth}/{card.expYear}
                </Text>
              </View>
              <Text style={styles.cardBrand}>{card.brand.toUpperCase()}</Text>
            </View>
          ))}
          
          {/* New Card Option */}
          <View style={styles.paymentOption}>
            <RadioButton value="new_card" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Add New Card</Text>
              <Text style={styles.cardDetails}>Credit or Debit Card</Text>
            </View>
            <IconButton icon="credit-card-plus" size={24} />
          </View>
          
          {/* Bank Transfer */}
          <View style={styles.paymentOption}>
            <RadioButton value="bank_transfer" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Bank Transfer</Text>
              <Text style={styles.cardDetails}>Direct bank transfer</Text>
            </View>
            <IconButton icon="bank" size={24} />
          </View>
          
          {/* Wallet */}
          <View style={styles.paymentOption}>
            <RadioButton value="wallet" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Sha Pay Wallet</Text>
              <Text style={styles.cardDetails}>
                Balance: ₦{user?.walletBalance?.toLocaleString() || '0'}
              </Text>
            </View>
            <IconButton icon="wallet" size={24} />
          </View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );
  
  const renderCardForm = () => {
    if (!showCardForm) return null;
    
    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Card Details</Title>
          
          <TextInput
            mode="outlined"
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            keyboardType="numeric"
            style={styles.cardInput}
            left={<TextInput.Icon icon="credit-card" />}
          />
          
          <TextInput
            mode="outlined"
            label="Card Holder Name"
            placeholder="John Doe"
            value={cardHolderName}
            onChangeText={setCardHolderName}
            style={styles.cardInput}
            autoCapitalize="words"
          />
          
          <View style={styles.cardRow}>
            <TextInput
              mode="outlined"
              label="Expiry Date"
              placeholder="MM/YY"
              value={expiryDate}
              onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
              keyboardType="numeric"
              style={[styles.cardInput, styles.halfWidth]}
            />
            
            <TextInput
              mode="outlined"
              label="CVV"
              placeholder="123"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              style={[styles.cardInput, styles.halfWidth]}
              secureTextEntry
            />
          </View>
          
          <View style={styles.saveCardRow}>
            <Text style={styles.saveCardLabel}>Save card for future payments</Text>
            <Switch
              value={saveCard}
              onValueChange={setSaveCard}
              color={colors.primary}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderSecurityInfo = () => (
    <Surface style={styles.securityInfo}>
      <View style={styles.securityRow}>
        <IconButton icon="shield-check" size={20} iconColor={colors.success} />
        <Text style={styles.securityText}>
          Your payment information is encrypted and secure
        </Text>
      </View>
    </Surface>
  );
  
  const totalAmount = amount + platformFee - discount;
  const canPay = selectedPaymentMethod && (selectedPaymentMethod !== 'wallet' || user?.walletBalance >= totalAmount);
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderPaymentSummary()}
        {renderPromoCode()}
        {renderPaymentMethods()}
        {renderCardForm()}
        {renderSecurityInfo()}
      </ScrollView>
      
      <Surface style={styles.bottomBar}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            ₦{totalAmount?.toLocaleString()}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={handlePayment}
          loading={processing}
          disabled={!canPay}
          style={styles.payButton}
          icon="credit-card"
        >
          Pay Now
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: spacing.md,
    elevation: 4,
    backgroundColor: colors.primaryContainer,
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  serviceInfo: {
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimaryContainer,
  },
  bookingId: {
    fontSize: 14,
    color: colors.onPrimaryContainer + '80',
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.onPrimaryContainer + '80',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimaryContainer,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onPrimaryContainer,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onPrimaryContainer,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  promoButton: {
    paddingHorizontal: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline + '20',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cardDetails: {
    fontSize: 13,
    color: colors.onSurface + '80',
    marginTop: 2,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardInput: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  saveCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveCardLabel: {
    fontSize: 14,
    color: colors.onSurface,
  },
  securityInfo: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.successContainer || colors.primaryContainer,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    fontSize: 13,
    color: colors.onSuccessContainer || colors.onPrimaryContainer,
    marginLeft: spacing.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    elevation: 8,
  },
  totalInfo: {
    flex: 1,
  },
  payButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});

export default PaymentScreen;