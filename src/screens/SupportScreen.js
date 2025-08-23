import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedInput,
  ThemedButton,
  ThemedListItem,
  ThemedModal,
  ThemedBadge,
  SegmentedControl,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  submitSupportTicket,
  fetchFAQs,
  fetchSupportTickets,
} from '../store/slices/supportSlice';
import { selectUser } from '../store/slices/authSlice';

const SupportScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const {
    faqs,
    supportTickets,
    loading,
  } = useSelector((state) => state.support);
  
  const [activeTab, setActiveTab] = useState(0); // 0: Help, 1: Contact, 2: My Tickets
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium',
  });
  
  const [errors, setErrors] = useState({});
  
  const tabOptions = [
    { label: 'Help', key: 'help' },
    { label: 'Contact', key: 'contact' },
    { label: 'My Tickets', key: 'tickets' },
  ];
  
  const contactCategories = [
    { label: 'General Inquiry', key: 'general' },
    { label: 'Payment Issue', key: 'payment' },
    { label: 'Account Problem', key: 'account' },
    { label: 'Job Dispute', key: 'dispute' },
    { label: 'Technical Issue', key: 'technical' },
    { label: 'Report Abuse', key: 'abuse' },
  ];
  
  const priorityLevels = [
    { label: 'Low', key: 'low' },
    { label: 'Medium', key: 'medium' },
    { label: 'High', key: 'high' },
    { label: 'Urgent', key: 'urgent' },
  ];
  
  const quickActions = [
    {
      title: 'Call Support',
      subtitle: '+234 800 123 4567',
      icon: 'phone',
      action: () => Linking.openURL('tel:+2348001234567'),
    },
    {
      title: 'Email Support',
      subtitle: 'support@shapay.com',
      icon: 'mail',
      action: () => Linking.openURL('mailto:support@shapay.com'),
    },
    {
      title: 'Live Chat',
      subtitle: 'Chat with our team',
      icon: 'message-circle',
      action: () => navigation.navigate('LiveChat'),
    },
    {
      title: 'WhatsApp',
      subtitle: 'Message us on WhatsApp',
      icon: 'message-square',
      action: () => Linking.openURL('https://wa.me/2348001234567'),
    },
  ];
  
  useEffect(() => {
    loadSupportData();
  }, []);
  
  const loadSupportData = async () => {
    try {
      await Promise.all([
        dispatch(fetchFAQs()).unwrap(),
        dispatch(fetchSupportTickets(user.id)).unwrap(),
      ]);
    } catch (error) {
      console.error('Error loading support data:', error);
    }
  };
  
  const validateContactForm = () => {
    const newErrors = {};
    
    if (!contactForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!contactForm.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (contactForm.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContactFormChange = (field, value) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleSubmitTicket = async () => {
    if (!validateContactForm()) {
      Alert.alert('Error', 'Please fix the errors before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      
      await dispatch(submitSupportTicket({
        userId: user.id,
        ...contactForm,
      })).unwrap();
      
      setShowContactModal(false);
      setContactForm({
        subject: '',
        category: 'general',
        message: '',
        priority: 'medium',
      });
      
      Alert.alert(
        'Ticket Submitted',
        'Your support ticket has been submitted successfully. We will respond within 24 hours.'
      );
      
      // Refresh tickets
      await dispatch(fetchSupportTickets(user.id)).unwrap();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleFAQPress = (faq) => {
    setSelectedFAQ(faq);
    setShowFAQModal(true);
  };
  
  const getTicketStatusColor = (status) => {
    switch (status) {
      case 'open':
        return colors.info;
      case 'in_progress':
        return colors.warning;
      case 'resolved':
        return colors.success;
      case 'closed':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };
  
  const getTicketStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };
  
  const renderHelpTab = () => (
    <View style={styles.tabContent}>
      {/* Quick Actions */}
      <ThemedCard style={styles.section}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        
        {quickActions.map((action, index) => (
          <ThemedListItem
            key={index}
            title={action.title}
            subtitle={action.subtitle}
            leftComponent={
              <View style={styles.actionIcon}>
                {/* Icon would be rendered here */}
              </View>
            }
            onPress={action.action}
            style={styles.actionItem}
          />
        ))}
      </ThemedCard>
      
      {/* FAQs */}
      <ThemedCard style={styles.section}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Frequently Asked Questions
        </ThemedText>
        
        {loading ? (
          <LoadingSpinner size="small" />
        ) : faqs && faqs.length > 0 ? (
          faqs.slice(0, 5).map((faq, index) => (
            <ThemedListItem
              key={index}
              title={faq.question}
              subtitle={`${faq.answer.substring(0, 100)}...`}
              onPress={() => handleFAQPress(faq)}
              style={styles.faqItem}
            />
          ))
        ) : (
          <ThemedText variant="body2" style={styles.emptyText}>
            No FAQs available at the moment.
          </ThemedText>
        )}
        
        {faqs && faqs.length > 5 && (
          <ThemedButton
            variant="text"
            onPress={() => navigation.navigate('FAQs')}
            style={styles.viewAllButton}
          >
            View All FAQs
          </ThemedButton>
        )}
      </ThemedCard>
      
      {/* Help Categories */}
      <ThemedCard style={styles.section}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Help Categories
        </ThemedText>
        
        <ThemedListItem
          title="Getting Started"
          subtitle="Learn how to use Sha Pay!"
          onPress={() => navigation.navigate('GettingStarted')}
          style={styles.categoryItem}
        />
        
        <ThemedListItem
          title="Account & Profile"
          subtitle="Manage your account settings"
          onPress={() => navigation.navigate('AccountHelp')}
          style={styles.categoryItem}
        />
        
        <ThemedListItem
          title="Jobs & Services"
          subtitle="How to post and find jobs"
          onPress={() => navigation.navigate('JobsHelp')}
          style={styles.categoryItem}
        />
        
        <ThemedListItem
          title="Payments & Billing"
          subtitle="Payment methods and billing"
          onPress={() => navigation.navigate('PaymentsHelp')}
          style={styles.categoryItem}
        />
        
        <ThemedListItem
          title="Safety & Security"
          subtitle="Stay safe on our platform"
          onPress={() => navigation.navigate('SafetyHelp')}
          style={styles.categoryItem}
        />
      </ThemedCard>
    </View>
  );
  
  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <ThemedCard style={styles.section}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Contact Support
        </ThemedText>
        
        <ThemedText variant="body2" style={styles.contactDescription}>
          Need help? Our support team is here to assist you. Choose the best way to reach us:
        </ThemedText>
        
        {quickActions.map((action, index) => (
          <ThemedListItem
            key={index}
            title={action.title}
            subtitle={action.subtitle}
            leftComponent={
              <View style={styles.actionIcon}>
                {/* Icon would be rendered here */}
              </View>
            }
            onPress={action.action}
            style={styles.contactItem}
          />
        ))}
        
        <ThemedButton
          variant="primary"
          onPress={() => setShowContactModal(true)}
          style={styles.submitTicketButton}
        >
          Submit Support Ticket
        </ThemedButton>
      </ThemedCard>
      
      {/* Support Hours */}
      <ThemedCard style={styles.section}>
        <ThemedText variant="h6" style={styles.sectionTitle}>
          Support Hours
        </ThemedText>
        
        <View style={styles.supportHours}>
          <View style={styles.hourRow}>
            <ThemedText variant="body2">Monday - Friday:</ThemedText>
            <ThemedText variant="body2" style={styles.hourTime}>9:00 AM - 6:00 PM</ThemedText>
          </View>
          
          <View style={styles.hourRow}>
            <ThemedText variant="body2">Saturday:</ThemedText>
            <ThemedText variant="body2" style={styles.hourTime}>10:00 AM - 4:00 PM</ThemedText>
          </View>
          
          <View style={styles.hourRow}>
            <ThemedText variant="body2">Sunday:</ThemedText>
            <ThemedText variant="body2" style={styles.hourTime}>Closed</ThemedText>
          </View>
        </View>
        
        <ThemedText variant="caption" style={styles.timezoneNote}>
          All times are in West Africa Time (WAT)
        </ThemedText>
      </ThemedCard>
    </View>
  );
  
  const renderTicketsTab = () => (
    <View style={styles.tabContent}>
      <ThemedCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="h6" style={styles.sectionTitle}>
            My Support Tickets
          </ThemedText>
          
          <ThemedButton
            variant="outline"
            size="small"
            onPress={() => setShowContactModal(true)}
          >
            New Ticket
          </ThemedButton>
        </View>
        
        {loading ? (
          <LoadingSpinner size="small" />
        ) : supportTickets && supportTickets.length > 0 ? (
          supportTickets.map((ticket, index) => (
            <ThemedListItem
              key={index}
              title={ticket.subject}
              subtitle={`Category: ${contactCategories.find(c => c.key === ticket.category)?.label || ticket.category}`}
              description={`Created: ${new Date(ticket.createdAt).toLocaleDateString()}`}
              rightComponent={
                <View style={styles.ticketRight}>
                  <ThemedBadge
                    variant="outline"
                    style={{
                      backgroundColor: getTicketStatusColor(ticket.status) + '20',
                      borderColor: getTicketStatusColor(ticket.status),
                    }}
                  >
                    {getTicketStatusText(ticket.status)}
                  </ThemedBadge>
                </View>
              }
              onPress={() => navigation.navigate('TicketDetails', { ticketId: ticket.id })}
              style={styles.ticketItem}
            />
          ))
        ) : (
          <View style={styles.emptyTickets}>
            <ThemedText variant="body2" style={styles.emptyText}>
              No support tickets yet.
            </ThemedText>
            
            <ThemedButton
              variant="outline"
              onPress={() => setShowContactModal(true)}
              style={styles.createTicketButton}
            >
              Create Your First Ticket
            </ThemedButton>
          </View>
        )}
      </ThemedCard>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Support"
        onLeftPress={() => navigation.goBack()}
      />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedControl
          segments={tabOptions}
          selectedIndex={activeTab}
          onSelectionChange={setActiveTab}
        />
      </View>
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 && renderHelpTab()}
        {activeTab === 1 && renderContactTab()}
        {activeTab === 2 && renderTicketsTab()}
      </ScrollView>
      
      {/* Contact Modal */}
      <ThemedModal
        visible={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setContactForm({
            subject: '',
            category: 'general',
            message: '',
            priority: 'medium',
          });
          setErrors({});
        }}
        title="Submit Support Ticket"
        size="large"
      >
        <ScrollView style={styles.contactModalContent}>
          <ThemedInput
            label="Subject"
            placeholder="Brief description of your issue"
            value={contactForm.subject}
            onChangeText={(value) => handleContactFormChange('subject', value)}
            error={errors.subject}
            style={styles.modalInput}
          />
          
          <ThemedText variant="body2" style={styles.modalLabel}>
            Category
          </ThemedText>
          
          <SegmentedControl
            segments={contactCategories.slice(0, 3)}
            selectedIndex={contactCategories.findIndex(c => c.key === contactForm.category)}
            onSelectionChange={(index) => handleContactFormChange('category', contactCategories[index].key)}
            style={styles.modalSegmented}
          />
          
          <ThemedText variant="body2" style={styles.modalLabel}>
            Priority
          </ThemedText>
          
          <SegmentedControl
            segments={priorityLevels}
            selectedIndex={priorityLevels.findIndex(p => p.key === contactForm.priority)}
            onSelectionChange={(index) => handleContactFormChange('priority', priorityLevels[index].key)}
            style={styles.modalSegmented}
          />
          
          <ThemedInput
            label="Message"
            placeholder="Describe your issue in detail..."
            value={contactForm.message}
            onChangeText={(value) => handleContactFormChange('message', value)}
            error={errors.message}
            multiline
            numberOfLines={6}
            style={styles.modalInput}
          />
          
          <View style={styles.modalActions}>
            <ThemedButton
              variant="outline"
              onPress={() => {
                setShowContactModal(false);
                setContactForm({
                  subject: '',
                  category: 'general',
                  message: '',
                  priority: 'medium',
                });
                setErrors({});
              }}
              style={{ flex: 1, marginRight: spacing[2] }}
              disabled={submitting}
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              variant="primary"
              onPress={handleSubmitTicket}
              style={{ flex: 1 }}
              loading={submitting}
              disabled={submitting}
            >
              Submit Ticket
            </ThemedButton>
          </View>
        </ScrollView>
      </ThemedModal>
      
      {/* FAQ Modal */}
      <ThemedModal
        visible={showFAQModal}
        onClose={() => {
          setShowFAQModal(false);
          setSelectedFAQ(null);
        }}
        title={selectedFAQ?.question || 'FAQ'}
        size="medium"
      >
        {selectedFAQ && (
          <View style={styles.faqModalContent}>
            <ThemedText variant="body1" style={styles.faqAnswer}>
              {selectedFAQ.answer}
            </ThemedText>
            
            {selectedFAQ.helpful !== undefined && (
              <View style={styles.faqFeedback}>
                <ThemedText variant="body2" style={styles.feedbackLabel}>
                  Was this helpful?
                </ThemedText>
                
                <View style={styles.feedbackButtons}>
                  <ThemedButton
                    variant="outline"
                    size="small"
                    style={{ marginRight: spacing[2] }}
                  >
                    👍 Yes
                  </ThemedButton>
                  
                  <ThemedButton
                    variant="outline"
                    size="small"
                  >
                    👎 No
                  </ThemedButton>
                </View>
              </View>
            )}
          </View>
        )}
      </ThemedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  tabContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: spacing[6],
  },
  section: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    marginBottom: spacing[4],
    color: colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  actionItem: {
    marginBottom: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  faqItem: {
    marginBottom: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  categoryItem: {
    marginBottom: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  contactItem: {
    marginBottom: spacing[3],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  ticketItem: {
    marginBottom: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing[4],
  },
  viewAllButton: {
    marginTop: spacing[2],
  },
  contactDescription: {
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  submitTicketButton: {
    marginTop: spacing[4],
  },
  supportHours: {
    marginBottom: spacing[3],
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  hourTime: {
    fontWeight: '600',
  },
  timezoneNote: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  ticketRight: {
    alignItems: 'flex-end',
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  createTicketButton: {
    marginTop: spacing[4],
  },
  contactModalContent: {
    maxHeight: 500,
  },
  modalInput: {
    marginBottom: spacing[4],
  },
  modalLabel: {
    marginBottom: spacing[2],
    color: colors.text.secondary,
  },
  modalSegmented: {
    marginBottom: spacing[4],
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing[4],
  },
  faqModalContent: {
    paddingVertical: spacing[2],
  },
  faqAnswer: {
    lineHeight: 24,
    marginBottom: spacing[4],
  },
  faqFeedback: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  feedbackLabel: {
    marginBottom: spacing[3],
    color: colors.text.secondary,
  },
  feedbackButtons: {
    flexDirection: 'row',
  },
});

export default SupportScreen;