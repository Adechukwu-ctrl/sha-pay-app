import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { showNotification } from '../../store/slices/notificationSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { paymentId, bookingId, amount } = route.params;
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  
  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Show success notification
    dispatch(showNotification({
      type: 'success',
      message: 'Payment completed successfully!'
    }));
  }, [scaleAnim, fadeAnim, dispatch]);
  
  const handleViewBooking = () => {
    navigation.navigate('BookingConfirmation', { bookingId });
  };
  
  const handleBackToHome = () => {
    navigation.navigate('Home');
  };
  
  const handleDownloadReceipt = () => {
    // Mock receipt download
    dispatch(showNotification({
      type: 'info',
      message: 'Receipt download started'
    }));
  };
  
  const handleShareReceipt = () => {
    // Mock receipt sharing
    dispatch(showNotification({
      type: 'info',
      message: 'Receipt shared successfully'
    }));
  };
  
  const renderSuccessIcon = () => (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.successIconWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Surface style={styles.successIcon}>
          <IconButton
            icon="check"
            size={60}
            iconColor={colors.onPrimary}
          />
        </Surface>
      </Animated.View>
    </View>
  );
  
  const renderSuccessMessage = () => (
    <Animated.View
      style={[
        styles.messageContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Title style={styles.successTitle}>Payment Successful!</Title>
      <Paragraph style={styles.successMessage}>
        Your payment has been processed successfully. You will receive a confirmation email shortly.
      </Paragraph>
    </Animated.View>
  );
  
  const renderPaymentDetails = () => (
    <Animated.View
      style={[
        styles.detailsContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Title style={styles.detailsTitle}>Payment Details</Title>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID:</Text>
            <Text style={styles.detailValue}>#{paymentId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>#{bookingId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.amountValue}>₦{amount?.toLocaleString()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Date:</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>Credit Card</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
  
  const renderReceiptActions = () => (
    <Animated.View
      style={[
        styles.receiptContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Card style={styles.receiptCard}>
        <Card.Content>
          <Title style={styles.receiptTitle}>Receipt Options</Title>
          
          <View style={styles.receiptActions}>
            <Button
              mode="outlined"
              onPress={handleDownloadReceipt}
              style={styles.receiptButton}
              icon="download"
            >
              Download
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleShareReceipt}
              style={styles.receiptButton}
              icon="share"
            >
              Share
            </Button>
          </View>
          
          <Paragraph style={styles.receiptNote}>
            A copy of your receipt has been sent to {user?.email}
          </Paragraph>
        </Card.Content>
      </Card>
    </Animated.View>
  );
  
  const renderNextSteps = () => (
    <Animated.View
      style={[
        styles.nextStepsContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Card style={styles.nextStepsCard}>
        <Card.Content>
          <Title style={styles.nextStepsTitle}>What's Next?</Title>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Service Provider Notification</Text>
              <Text style={styles.stepDescription}>
                The service provider has been notified and will contact you soon
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Schedule Confirmation</Text>
              <Text style={styles.stepDescription}>
                You'll receive a confirmation with the final schedule details
              </Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Service Delivery</Text>
              <Text style={styles.stepDescription}>
                The service will be delivered as per the agreed schedule
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
  
  const renderActionButtons = () => (
    <Animated.View
      style={[
        styles.actionContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Button
        mode="contained"
        onPress={handleViewBooking}
        style={styles.primaryButton}
        icon="eye"
      >
        View Booking Details
      </Button>
      
      <Button
        mode="outlined"
        onPress={handleBackToHome}
        style={styles.secondaryButton}
        icon="home"
      >
        Back to Home
      </Button>
    </Animated.View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderSuccessIcon()}
        {renderSuccessMessage()}
        {renderPaymentDetails()}
        {renderReceiptActions()}
        {renderNextSteps()}
        {renderActionButtons()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: 16,
    color: colors.onSurface + 'CC',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  detailsContainer: {
    marginBottom: spacing.lg,
  },
  detailsCard: {
    elevation: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.onSurface + '80',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success || '#4CAF50',
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success || '#4CAF50',
  },
  receiptContainer: {
    marginBottom: spacing.lg,
  },
  receiptCard: {
    elevation: 2,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  receiptButton: {
    flex: 0.4,
  },
  receiptNote: {
    fontSize: 12,
    color: colors.onSurface + '80',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextStepsContainer: {
    marginBottom: spacing.xl,
  },
  nextStepsCard: {
    elevation: 2,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 13,
    color: colors.onSurface + '80',
    lineHeight: 18,
  },
  actionContainer: {
    gap: spacing.md,
  },
  primaryButton: {
    paddingVertical: spacing.xs,
  },
  secondaryButton: {
    paddingVertical: spacing.xs,
  },
});

export default PaymentSuccessScreen;