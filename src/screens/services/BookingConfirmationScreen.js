import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Chip,
  Avatar,
  Divider,
  Surface,
  List,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { fetchBookingDetails, cancelBooking } from '../../store/slices/servicesSlice';
import { showNotification } from '../../store/slices/notificationSlice';

const { width: screenWidth } = Dimensions.get('window');

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { bookingId, serviceId, packageId } = route.params;
  const dispatch = useDispatch();
  const { currentBooking, loading } = useSelector(state => state.services);
  const { user } = useSelector(state => state.auth);
  
  const [cancelling, setCancelling] = useState(false);
  
  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingDetails(bookingId));
    }
  }, [bookingId, dispatch]);
  
  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {
          text: 'No, Keep Booking',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await dispatch(cancelBooking(bookingId)).unwrap();
              dispatch(showNotification({
                type: 'success',
                message: 'Booking cancelled successfully'
              }));
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };
  
  const handleContactProvider = () => {
    navigation.navigate('Chat', {
      providerId: currentBooking?.service?.provider?.id,
      bookingId,
    });
  };
  
  const handleMakePayment = () => {
    navigation.navigate('Payment', {
      bookingId,
      amount: currentBooking?.totalAmount,
      serviceTitle: currentBooking?.service?.title,
    });
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return colors.primary;
      case 'pending':
        return colors.warning || '#FF9800';
      case 'in_progress':
        return colors.info || '#2196F3';
      case 'completed':
        return colors.success || '#4CAF50';
      case 'cancelled':
        return colors.error;
      default:
        return colors.onSurface + '60';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'in_progress':
        return 'progress-clock';
      case 'completed':
        return 'check-all';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };
  
  if (loading || !currentBooking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading booking details...</Text>
      </View>
    );
  }
  
  const renderBookingHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.bookingInfo}>
            <Title style={styles.bookingTitle}>Booking Confirmed</Title>
            <Text style={styles.bookingId}>Booking ID: #{currentBooking.id}</Text>
            
            <View style={styles.statusRow}>
              <Chip 
                mode="flat" 
                style={[styles.statusChip, { backgroundColor: getStatusColor(currentBooking.status) + '20' }]}
                icon={getStatusIcon(currentBooking.status)}
                textStyle={{ color: getStatusColor(currentBooking.status) }}
              >
                {currentBooking.status?.toUpperCase()}
              </Chip>
              
              {currentBooking.isPaid && (
                <Chip 
                  mode="flat" 
                  style={styles.paidChip}
                  icon="check-circle"
                >
                  PAID
                </Chip>
              )}
            </View>
          </View>
          
          <IconButton
            icon="share-variant"
            mode="outlined"
            onPress={() => {/* Share booking details */}}
            style={styles.shareButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderServiceDetails = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Service Details</Title>
        
        <List.Item
          title={currentBooking.service?.title}
          description={currentBooking.service?.category}
          left={() => (
            <Avatar.Image 
              size={50} 
              source={{ uri: currentBooking.service?.image || 'https://via.placeholder.com/50' }}
            />
          )}
          titleStyle={styles.serviceTitle}
          descriptionStyle={styles.serviceCategory}
        />
        
        <Divider style={styles.divider} />
        
        <View style={styles.packageInfo}>
          <Text style={styles.packageLabel}>Selected Package:</Text>
          <Text style={styles.packageName}>{currentBooking.package?.name}</Text>
          <Text style={styles.packageDescription}>
            {currentBooking.package?.description}
          </Text>
        </View>
        
        {currentBooking.package?.features?.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={styles.featuresLabel}>Included Features:</Text>
            {currentBooking.package.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                ✓ {feature}
              </Text>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderProviderDetails = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Service Provider</Title>
        
        <List.Item
          title={currentBooking.service?.provider?.name}
          description={`⭐ ${currentBooking.service?.provider?.rating?.toFixed(1) || 'New'} • ${currentBooking.service?.provider?.completedJobs || 0} jobs completed`}
          left={() => (
            <Avatar.Image 
              size={50} 
              source={{ uri: currentBooking.service?.provider?.avatar || 'https://via.placeholder.com/50' }}
            />
          )}
          right={() => (
            <Button
              mode="outlined"
              onPress={handleContactProvider}
              compact
            >
              Message
            </Button>
          )}
          titleStyle={styles.providerName}
          descriptionStyle={styles.providerStats}
        />
      </Card.Content>
    </Card>
  );
  
  const renderBookingDetails = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Booking Information</Title>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Date:</Text>
          <Text style={styles.detailValue}>
            {new Date(currentBooking.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        {currentBooking.preferredDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentBooking.preferredDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        )}
        
        {currentBooking.scheduledDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentBooking.scheduledDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
        
        {currentBooking.estimatedDuration && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Duration:</Text>
            <Text style={styles.detailValue}>{currentBooking.estimatedDuration}</Text>
          </View>
        )}
        
        {currentBooking.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.detailLabel}>Additional Notes:</Text>
            <Text style={styles.notesText}>{currentBooking.notes}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderPricingDetails = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Pricing Breakdown</Title>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Service Fee:</Text>
          <Text style={styles.priceValue}>
            ₦{currentBooking.package?.price?.toLocaleString()}
          </Text>
        </View>
        
        {currentBooking.platformFee && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Fee:</Text>
            <Text style={styles.priceValue}>
              ₦{currentBooking.platformFee?.toLocaleString()}
            </Text>
          </View>
        )}
        
        {currentBooking.discount && (
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.success }]}>Discount:</Text>
            <Text style={[styles.priceValue, { color: colors.success }]}>
              -₦{currentBooking.discount?.toLocaleString()}
            </Text>
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>
            ₦{currentBooking.totalAmount?.toLocaleString()}
          </Text>
        </View>
        
        {!currentBooking.isPaid && (
          <Button
            mode="contained"
            onPress={handleMakePayment}
            style={styles.paymentButton}
            icon="credit-card"
          >
            Make Payment
          </Button>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderActionButtons = () => {
    const canCancel = ['pending', 'confirmed'].includes(currentBooking.status?.toLowerCase());
    
    return (
      <Surface style={styles.actionBar}>
        <View style={styles.actionButtons}>
          {canCancel && (
            <Button
              mode="outlined"
              onPress={handleCancelBooking}
              loading={cancelling}
              style={styles.cancelButton}
              buttonColor={colors.error + '10'}
              textColor={colors.error}
            >
              Cancel Booking
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={handleContactProvider}
            style={styles.contactButton}
            icon="message"
          >
            Contact Provider
          </Button>
        </View>
      </Surface>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderBookingHeader()}
        {renderServiceDetails()}
        {renderProviderDetails()}
        {renderBookingDetails()}
        {renderPricingDetails()}
      </ScrollView>
      
      {renderActionButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: spacing.md,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  bookingId: {
    fontSize: 14,
    color: colors.onSurface + '80',
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: spacing.sm,
  },
  paidChip: {
    backgroundColor: colors.success + '20',
  },
  shareButton: {
    marginLeft: spacing.sm,
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
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  serviceCategory: {
    fontSize: 14,
    color: colors.onSurface + '80',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  packageInfo: {
    marginTop: spacing.sm,
  },
  packageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  packageDescription: {
    fontSize: 14,
    color: colors.onSurface + 'CC',
  },
  featuresSection: {
    marginTop: spacing.sm,
  },
  featuresLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  featureItem: {
    fontSize: 13,
    color: colors.onSurface + 'AA',
    marginBottom: 2,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  providerStats: {
    fontSize: 13,
    color: colors.onSurface + '80',
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    flex: 1.5,
    textAlign: 'right',
  },
  notesSection: {
    marginTop: spacing.sm,
  },
  notesText: {
    fontSize: 14,
    color: colors.onSurface + 'CC',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.onSurface + '80',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  paymentButton: {
    marginTop: spacing.md,
  },
  actionBar: {
    padding: spacing.md,
    elevation: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.45,
  },
  contactButton: {
    flex: 0.45,
  },
});

export default BookingConfirmationScreen;