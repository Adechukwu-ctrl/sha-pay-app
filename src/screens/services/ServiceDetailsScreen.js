import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Share,
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
  IconButton,
  Surface,
  Badge,
  List,
  Portal,
  Modal,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { fetchServiceDetails, bookService } from '../../store/slices/servicesSlice';
import { showNotification } from '../../store/slices/notificationSlice';

const { width: screenWidth } = Dimensions.get('window');

const ServiceDetailsScreen = ({ route, navigation }) => {
  const { serviceId } = route.params;
  const dispatch = useDispatch();
  const { currentService, loading } = useSelector(state => state.services);
  const { user } = useSelector(state => state.auth);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date());
  const [bookingLoading, setBookingLoading] = useState(false);
  
  useEffect(() => {
    if (serviceId) {
      dispatch(fetchServiceDetails(serviceId));
    }
  }, [serviceId, dispatch]);
  
  const handleBookService = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a service package');
      return;
    }
    
    setBookingLoading(true);
    try {
      await dispatch(bookService({
        serviceId,
        packageId: selectedPackage.id,
        notes: bookingNotes,
        preferredDate,
      })).unwrap();
      
      setShowBookingModal(false);
      dispatch(showNotification({
        type: 'success',
        message: 'Service booked successfully!'
      }));
      
      navigation.navigate('BookingConfirmation', { 
        serviceId,
        packageId: selectedPackage.id 
      });
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Unable to book service');
    } finally {
      setBookingLoading(false);
    }
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this service: ${currentService?.title} by ${currentService?.provider?.name}`,
        url: `https://shapay.ng/services/${serviceId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const handleContactProvider = () => {
    navigation.navigate('Chat', {
      providerId: currentService?.provider?.id,
      serviceId,
    });
  };
  
  if (loading || !currentService) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading service details...</Text>
      </View>
    );
  }
  
  const renderServiceHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.serviceInfo}>
            <Title style={styles.serviceTitle}>{currentService.title}</Title>
            <View style={styles.providerRow}>
              <Avatar.Image 
                size={32} 
                source={{ uri: currentService.provider?.avatar || 'https://via.placeholder.com/32' }}
              />
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>
                  {currentService.provider?.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Badge style={styles.ratingBadge}>
                    ⭐ {currentService.provider?.rating?.toFixed(1) || 'New'}
                  </Badge>
                  <Text style={styles.reviewCount}>
                    ({currentService.provider?.reviewCount || 0} reviews)
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <IconButton
              icon="share-variant"
              mode="outlined"
              onPress={handleShare}
              style={styles.actionButton}
            />
            <IconButton
              icon="heart-outline"
              mode="outlined"
              onPress={() => {/* Add to favorites */}}
              style={styles.actionButton}
            />
          </View>
        </View>
        
        <View style={styles.tagsRow}>
          <Chip mode="outlined" style={styles.categoryChip}>
            {currentService.category}
          </Chip>
          {currentService.isVerified && (
            <Chip 
              mode="flat" 
              style={styles.verifiedChip}
              icon="check-decagram"
            >
              Verified
            </Chip>
          )}
          {currentService.isUrgent && (
            <Chip 
              mode="flat" 
              style={styles.urgentChip}
              icon="clock-fast"
            >
              Urgent
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderDescription = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Description</Title>
        <Paragraph style={styles.description}>
          {currentService.description}
        </Paragraph>
        
        {currentService.requirements?.length > 0 && (
          <View style={styles.requirementsSection}>
            <Text style={styles.subsectionTitle}>Requirements:</Text>
            {currentService.requirements.map((req, index) => (
              <Text key={index} style={styles.requirementItem}>
                • {req}
              </Text>
            ))}
          </View>
        )}
        
        {currentService.skills?.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.subsectionTitle}>Skills:</Text>
            <View style={styles.skillsContainer}>
              {currentService.skills.map((skill, index) => (
                <Chip key={index} mode="outlined" style={styles.skillChip}>
                  {skill}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderPackages = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Service Packages</Title>
        {currentService.packages?.map((pkg, index) => (
          <Surface key={pkg.id} style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packagePrice}>₦{pkg.price?.toLocaleString()}</Text>
            </View>
            <Text style={styles.packageDescription}>{pkg.description}</Text>
            
            {pkg.features?.length > 0 && (
              <View style={styles.featuresContainer}>
                {pkg.features.map((feature, idx) => (
                  <Text key={idx} style={styles.featureItem}>
                    ✓ {feature}
                  </Text>
                ))}
              </View>
            )}
            
            <View style={styles.packageFooter}>
              <Text style={styles.deliveryTime}>
                📅 {pkg.deliveryTime || 'Flexible timing'}
              </Text>
              <Button
                mode={selectedPackage?.id === pkg.id ? 'contained' : 'outlined'}
                onPress={() => setSelectedPackage(pkg)}
                compact
              >
                {selectedPackage?.id === pkg.id ? 'Selected' : 'Select'}
              </Button>
            </View>
          </Surface>
        ))}
      </Card.Content>
    </Card>
  );
  
  const renderProviderInfo = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>About the Provider</Title>
        <List.Item
          title={currentService.provider?.name}
          description={currentService.provider?.bio || 'Professional service provider'}
          left={() => (
            <Avatar.Image 
              size={50} 
              source={{ uri: currentService.provider?.avatar || 'https://via.placeholder.com/50' }}
            />
          )}
          right={() => (
            <View style={styles.providerStats}>
              <Text style={styles.statText}>
                ⭐ {currentService.provider?.rating?.toFixed(1) || 'New'}
              </Text>
              <Text style={styles.statText}>
                📋 {currentService.provider?.completedJobs || 0} jobs
              </Text>
              <Text style={styles.statText}>
                📅 Joined {new Date(currentService.provider?.createdAt).getFullYear()}
              </Text>
            </View>
          )}
        />
        
        <Divider style={styles.divider} />
        
        <View style={styles.contactButtons}>
          <Button
            mode="outlined"
            onPress={handleContactProvider}
            style={styles.contactButton}
            icon="message"
          >
            Message
          </Button>
          <Button
            mode="outlined"
            onPress={() => {/* View profile */}}
            style={styles.contactButton}
            icon="account"
          >
            View Profile
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderBookingModal = () => (
    <Portal>
      <Modal
        visible={showBookingModal}
        onDismiss={() => setShowBookingModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Title style={styles.modalTitle}>Book Service</Title>
        
        {selectedPackage && (
          <View style={styles.selectedPackageInfo}>
            <Text style={styles.modalSubtitle}>Selected Package:</Text>
            <Text style={styles.packageNameModal}>{selectedPackage.name}</Text>
            <Text style={styles.packagePriceModal}>
              ₦{selectedPackage.price?.toLocaleString()}
            </Text>
          </View>
        )}
        
        <View style={styles.modalActions}>
          <Button
            mode="outlined"
            onPress={() => setShowBookingModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleBookService}
            loading={bookingLoading}
            style={styles.modalButton}
          >
            Confirm Booking
          </Button>
        </View>
      </Modal>
    </Portal>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderServiceHeader()}
        {renderDescription()}
        {renderPackages()}
        {renderProviderInfo()}
      </ScrollView>
      
      <Surface style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>
            ₦{currentService.basePrice?.toLocaleString()}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={() => setShowBookingModal(true)}
          style={styles.bookButton}
          disabled={!selectedPackage}
        >
          Book Now
        </Button>
      </Surface>
      
      {renderBookingModal()}
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
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerDetails: {
    marginLeft: spacing.sm,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: colors.primary + '20',
    marginRight: spacing.xs,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.onSurface + '80',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  verifiedChip: {
    backgroundColor: colors.primary + '20',
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  urgentChip: {
    backgroundColor: colors.error + '20',
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
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
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.onSurface + 'DD',
  },
  requirementsSection: {
    marginTop: spacing.md,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  requirementItem: {
    fontSize: 13,
    color: colors.onSurface + 'CC',
    marginBottom: 2,
  },
  skillsSection: {
    marginTop: spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  packageCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    elevation: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  packageDescription: {
    fontSize: 13,
    color: colors.onSurface + 'CC',
    marginBottom: spacing.sm,
  },
  featuresContainer: {
    marginBottom: spacing.sm,
  },
  featureItem: {
    fontSize: 12,
    color: colors.onSurface + 'AA',
    marginBottom: 2,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 12,
    color: colors.onSurface + '80',
  },
  providerStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 11,
    color: colors.onSurface + '80',
    marginBottom: 2,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    flex: 0.45,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    elevation: 8,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.onSurface + '80',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bookButton: {
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  selectedPackageInfo: {
    backgroundColor: colors.primaryContainer,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.onPrimaryContainer + '80',
  },
  packageNameModal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimaryContainer,
  },
  packagePriceModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onPrimaryContainer,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 0.4,
  },
});

export default ServiceDetailsScreen;