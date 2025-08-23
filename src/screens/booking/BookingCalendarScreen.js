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
  Surface,
  List,
  TextInput,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { colors, spacing } from '../../theme';
import { createBooking, fetchProviderAvailability } from '../../store/slices/servicesSlice';
import { showNotification } from '../../store/slices/notificationSlice';

const { width: screenWidth } = Dimensions.get('window');

const BookingCalendarScreen = ({ route, navigation }) => {
  const { serviceId, packageId, providerId } = route.params;
  const dispatch = useDispatch();
  const { currentService, providerAvailability, loading } = useSelector(state => state.services);
  const { user } = useSelector(state => state.auth);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  
  useEffect(() => {
    if (providerId) {
      dispatch(fetchProviderAvailability(providerId));
    }
  }, [providerId, dispatch]);
  
  useEffect(() => {
    // Mark available and unavailable dates
    if (providerAvailability) {
      const marked = {};
      const today = new Date().toISOString().split('T')[0];
      
      // Mark available dates
      providerAvailability.availableDates?.forEach(date => {
        marked[date] = {
          marked: true,
          dotColor: colors.primary,
          activeOpacity: 0.7,
        };
      });
      
      // Mark unavailable dates
      providerAvailability.unavailableDates?.forEach(date => {
        marked[date] = {
          disabled: true,
          disableTouchEvent: true,
          textColor: colors.onSurface + '40',
        };
      });
      
      // Mark selected date
      if (selectedDate) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: colors.primary,
          selectedTextColor: colors.onPrimary,
        };
      }
      
      setMarkedDates(marked);
    }
  }, [providerAvailability, selectedDate]);
  
  const handleDateSelect = (day) => {
    const dateString = day.dateString;
    const today = new Date().toISOString().split('T')[0];
    
    if (dateString < today) {
      Alert.alert('Invalid Date', 'Please select a future date');
      return;
    }
    
    if (providerAvailability?.unavailableDates?.includes(dateString)) {
      Alert.alert('Unavailable', 'This date is not available for booking');
      return;
    }
    
    setSelectedDate(dateString);
    setSelectedTimeSlot(''); // Reset time slot when date changes
  };
  
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !providerAvailability?.timeSlots) {
      return [];
    }
    
    const dayOfWeek = new Date(selectedDate).getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    return providerAvailability.timeSlots[dayName] || [];
  };
  
  const handleCreateBooking = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    
    setBookingLoading(true);
    try {
      const bookingData = {
        serviceId,
        packageId,
        providerId,
        scheduledDate: selectedDate,
        timeSlot: selectedTimeSlot,
        notes: bookingNotes,
        urgencyLevel,
        clientId: user.id,
      };
      
      const result = await dispatch(createBooking(bookingData)).unwrap();
      
      dispatch(showNotification({
        type: 'success',
        message: 'Booking created successfully!'
      }));
      
      navigation.navigate('BookingConfirmation', { 
        bookingId: result.id,
        serviceId,
        packageId 
      });
    } catch (error) {
      Alert.alert('Booking Failed', error.message || 'Unable to create booking');
    } finally {
      setBookingLoading(false);
    }
  };
  
  const renderCalendarSection = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Select Date</Title>
        <Text style={styles.sectionDescription}>
          Choose your preferred date for the service
        </Text>
        
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: colors.surface,
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.onSurface,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.onPrimary,
            todayTextColor: colors.primary,
            dayTextColor: colors.onSurface,
            textDisabledColor: colors.onSurface + '40',
            dotColor: colors.primary,
            selectedDotColor: colors.onPrimary,
            arrowColor: colors.primary,
            monthTextColor: colors.onSurface,
            indicatorColor: colors.primary,
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          minDate={new Date().toISOString().split('T')[0]}
          hideExtraDays={true}
          firstDay={1}
        />
        
        {selectedDate && (
          <Surface style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateLabel}>Selected Date:</Text>
            <Text style={styles.selectedDateValue}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </Surface>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderTimeSlotSection = () => {
    const timeSlots = getAvailableTimeSlots();
    
    if (!selectedDate) {
      return null;
    }
    
    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Select Time Slot</Title>
          <Text style={styles.sectionDescription}>
            Available time slots for {new Date(selectedDate).toLocaleDateString()}
          </Text>
          
          {timeSlots.length === 0 ? (
            <Surface style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsText}>
                No available time slots for this date
              </Text>
            </Surface>
          ) : (
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((slot, index) => (
                <Surface
                  key={index}
                  style={[
                    styles.timeSlotCard,
                    selectedTimeSlot === slot.time && styles.selectedTimeSlot
                  ]}
                >
                  <Button
                    mode={selectedTimeSlot === slot.time ? 'contained' : 'outlined'}
                    onPress={() => setSelectedTimeSlot(slot.time)}
                    style={styles.timeSlotButton}
                    disabled={!slot.available}
                  >
                    {slot.time}
                  </Button>
                  {!slot.available && (
                    <Text style={styles.unavailableText}>Booked</Text>
                  )}
                </Surface>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  const renderUrgencySection = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Urgency Level</Title>
        <Text style={styles.sectionDescription}>
          How urgent is this service request?
        </Text>
        
        <RadioButton.Group
          onValueChange={setUrgencyLevel}
          value={urgencyLevel}
        >
          <View style={styles.urgencyOption}>
            <RadioButton value="normal" />
            <View style={styles.urgencyInfo}>
              <Text style={styles.urgencyTitle}>Normal</Text>
              <Text style={styles.urgencyDescription}>
                Standard service delivery timeline
              </Text>
            </View>
          </View>
          
          <View style={styles.urgencyOption}>
            <RadioButton value="urgent" />
            <View style={styles.urgencyInfo}>
              <Text style={styles.urgencyTitle}>Urgent</Text>
              <Text style={styles.urgencyDescription}>
                Faster delivery (may incur additional charges)
              </Text>
            </View>
          </View>
          
          <View style={styles.urgencyOption}>
            <RadioButton value="emergency" />
            <View style={styles.urgencyInfo}>
              <Text style={styles.urgencyTitle}>Emergency</Text>
              <Text style={styles.urgencyDescription}>
                Immediate attention required (premium charges apply)
              </Text>
            </View>
          </View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );
  
  const renderNotesSection = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Additional Notes</Title>
        <Text style={styles.sectionDescription}>
          Any specific requirements or instructions for the service provider
        </Text>
        
        <TextInput
          mode="outlined"
          placeholder="Enter any special instructions, requirements, or preferences..."
          value={bookingNotes}
          onChangeText={setBookingNotes}
          multiline
          numberOfLines={4}
          style={styles.notesInput}
        />
      </Card.Content>
    </Card>
  );
  
  const renderBookingSummary = () => {
    if (!selectedDate || !selectedTimeSlot) {
      return null;
    }
    
    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Booking Summary</Title>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{currentService?.title}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTimeSlot}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Urgency:</Text>
            <Chip 
              mode="flat" 
              style={[
                styles.urgencyChip,
                urgencyLevel === 'urgent' && styles.urgentChip,
                urgencyLevel === 'emergency' && styles.emergencyChip
              ]}
            >
              {urgencyLevel.toUpperCase()}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total:</Text>
            <Text style={styles.totalValue}>
              ₦{currentService?.basePrice?.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderCalendarSection()}
        {renderTimeSlotSection()}
        {renderUrgencySection()}
        {renderNotesSection()}
        {renderBookingSummary()}
      </ScrollView>
      
      <Surface style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleCreateBooking}
          loading={bookingLoading}
          disabled={!selectedDate || !selectedTimeSlot}
          style={styles.bookButton}
          icon="calendar-check"
        >
          Confirm Booking
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
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.onSurface + '80',
    marginBottom: spacing.md,
  },
  calendar: {
    borderRadius: 8,
    elevation: 1,
  },
  selectedDateInfo: {
    padding: spacing.md,
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
  },
  selectedDateLabel: {
    fontSize: 14,
    color: colors.onPrimaryContainer + '80',
  },
  selectedDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimaryContainer,
    marginTop: spacing.xs,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotCard: {
    width: '48%',
    marginBottom: spacing.sm,
    borderRadius: 8,
    elevation: 1,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primaryContainer,
  },
  timeSlotButton: {
    margin: spacing.xs,
  },
  unavailableText: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noSlotsContainer: {
    padding: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.errorContainer,
  },
  noSlotsText: {
    textAlign: 'center',
    color: colors.onErrorContainer,
    fontSize: 14,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  urgencyInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  urgencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  urgencyDescription: {
    fontSize: 13,
    color: colors.onSurface + '80',
    marginTop: 2,
  },
  notesInput: {
    marginTop: spacing.sm,
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    elevation: 4,
    backgroundColor: colors.primaryContainer,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.onPrimaryContainer + '80',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimaryContainer,
  },
  urgencyChip: {
    backgroundColor: colors.surface,
  },
  urgentChip: {
    backgroundColor: colors.warning + '20' || '#FF9800' + '20',
  },
  emergencyChip: {
    backgroundColor: colors.error + '20',
  },
  divider: {
    marginVertical: spacing.sm,
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
  bottomBar: {
    padding: spacing.md,
    elevation: 8,
  },
  bookButton: {
    paddingVertical: spacing.xs,
  },
});

export default BookingCalendarScreen;