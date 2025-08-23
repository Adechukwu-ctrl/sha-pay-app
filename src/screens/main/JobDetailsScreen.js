import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Chip, Divider, Avatar, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobById } from '../../store/slices/jobsSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const JobDetailsScreen = ({ navigation, route }) => {
  const { jobId } = route.params;
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentCategory } = useSelector(state => state.user);
  const { selectedJob, loading } = useSelector(state => state.jobs);
  
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  
  useEffect(() => {
    if (jobId) {
      dispatch(fetchJobById(jobId));
    }
  }, [dispatch, jobId]);
  
  if (loading || !selectedJob) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }
  
  const isServiceProvider = user.id === selectedJob.serviceProviderId;
  const isServiceRequirer = user.id === selectedJob.serviceRequirerId;
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
        return '#007AFF';
      case 'completed':
        return '#4CAF50';
      case 'satisfied':
        return '#4CAF50';
      case 'disputed':
        return '#FF0000';
      default:
        return '#888888';
    }
  };
  
  const handleActionButton = () => {
    switch (selectedJob.status.toLowerCase()) {
      case 'pending':
        if (currentCategory === 'service_provider') {
          navigation.navigate('JobAcceptanceForm', { jobId, jobDetails: selectedJob });
        }
        break;
      case 'accepted':
        if (isServiceProvider) {
          navigation.navigate('JobCompletionForm', { jobId, jobDetails: selectedJob });
        }
        break;
      case 'completed':
        if (isServiceRequirer) {
          navigation.navigate('JobSatisfactionForm', { jobId, jobDetails: selectedJob });
        }
        break;
      default:
        break;
    }
  };
  
  const getActionButtonText = () => {
    switch (selectedJob.status.toLowerCase()) {
      case 'pending':
        return currentCategory === 'service_provider' ? 'Accept Job' : null;
      case 'accepted':
        return isServiceProvider ? 'Mark as Completed' : null;
      case 'completed':
        return isServiceRequirer ? 'Rate & Pay' : null;
      default:
        return null;
    }
  };
  
  const actionButtonText = getActionButtonText();
  
  const handleDisputeConfirm = () => {
    setShowDisputeDialog(false);
    navigation.navigate('JobDisputeForm', { jobId, jobDetails: selectedJob });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title style={styles.title}>{selectedJob.title}</Title>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, { borderColor: getStatusColor(selectedJob.status) }]}
              textStyle={{ color: getStatusColor(selectedJob.status) }}
            >
              {selectedJob.status}
            </Chip>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Icon name="currency-ngn" size={18} color="#555" />
              <Text style={styles.detailText}>₦{selectedJob.amount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="calendar" size={18} color="#555" />
              <Text style={styles.detailText}>
                {new Date(selectedJob.deadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="map-marker" size={18} color="#555" />
              <Text style={styles.detailText}>
                {selectedJob.location}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.description}>
            {selectedJob.description}
          </Paragraph>
          
          {selectedJob.skills && selectedJob.skills.length > 0 && (
            <>
              <Title style={styles.sectionTitle}>Required Skills</Title>
              <View style={styles.skillsContainer}>
                {selectedJob.skills.map((skill, index) => (
                  <Chip key={index} style={styles.skillChip}>
                    {skill}
                  </Chip>
                ))}
              </View>
            </>
          )}
          
          <Divider style={styles.divider} />
          
          <Title style={styles.sectionTitle}>
            {isServiceProvider ? 'Client Information' : 'Service Provider Information'}
          </Title>
          
          {selectedJob.status !== 'pending' ? (
            <View style={styles.userInfoContainer}>
              <Avatar.Text 
                size={50} 
                label={isServiceProvider 
                  ? selectedJob.serviceRequirerName?.substring(0, 2).toUpperCase() 
                  : selectedJob.serviceProviderName?.substring(0, 2).toUpperCase() || 'NA'} 
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {isServiceProvider 
                    ? selectedJob.serviceRequirerName 
                    : selectedJob.serviceProviderName || 'Not assigned yet'}
                </Text>
                {selectedJob.userRating && (
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={16} color="#FFC107" />
                    <Text style={styles.ratingText}>
                      {selectedJob.userRating.toFixed(1)} ({selectedJob.ratingCount || 0})
                    </Text>
                  </View>
                )}
              </View>
              
              {(selectedJob.status === 'accepted' || selectedJob.status === 'completed') && (
                <Button 
                  mode="text" 
                  icon="chat" 
                  onPress={() => {
                    const recipientId = isServiceProvider 
                      ? selectedJob.serviceRequirerId 
                      : selectedJob.serviceProviderId;
                    navigation.navigate('Chat', { recipientId, jobId });
                  }}
                  style={styles.chatButton}
                >
                  Chat
                </Button>
              )}
            </View>
          ) : (
            <Text style={styles.pendingText}>
              {currentCategory === 'service_provider' 
                ? 'Accept this job to see client details' 
                : 'Waiting for a service provider to accept'}
            </Text>
          )}
          
          {selectedJob.additionalNotes && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Additional Notes</Title>
              <Paragraph style={styles.description}>
                {selectedJob.additionalNotes}
              </Paragraph>
            </>
          )}
          
          {selectedJob.completionNotes && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Completion Notes</Title>
              <Paragraph style={styles.description}>
                {selectedJob.completionNotes}
              </Paragraph>
              
              {selectedJob.completionImages && selectedJob.completionImages.length > 0 && (
                <View style={styles.imagesContainer}>
                  {selectedJob.completionImages.map((image, index) => (
                    <Image 
                      key={index}
                      source={{ uri: image }}
                      style={styles.completionImage}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </>
          )}
          
          {selectedJob.feedback && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.sectionTitle}>Client Feedback</Title>
              <View style={styles.feedbackContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Icon 
                      key={star}
                      name={star <= selectedJob.rating ? "star" : "star-outline"}
                      size={24}
                      color={star <= selectedJob.rating ? "#FFC107" : "#CCCCCC"}
                      style={styles.starIcon}
                    />
                  ))}
                </View>
                <Paragraph style={styles.description}>
                  {selectedJob.feedback}
                </Paragraph>
              </View>
            </>
          )}
          
          {selectedJob.disputeDetails && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.disputeContainer}>
                <Title style={[styles.sectionTitle, styles.disputeTitle]}>
                  <Icon name="alert-circle" size={20} color="#FF0000" /> Dispute Information
                </Title>
                <Text style={styles.disputeText}>Reason: {selectedJob.disputeDetails.reason}</Text>
                <Text style={styles.disputeText}>Type: {selectedJob.disputeDetails.type}</Text>
                <Paragraph style={styles.description}>
                  {selectedJob.disputeDetails.description}
                </Paragraph>
                <Text style={styles.disputeText}>Proposed Resolution: {selectedJob.disputeDetails.proposedResolution}</Text>
                
                {selectedJob.disputeDetails.status && (
                  <Chip 
                    mode="outlined" 
                    style={[styles.disputeStatusChip, { 
                      borderColor: selectedJob.disputeDetails.status === 'resolved' ? '#4CAF50' : '#FF9800'
                    }]}
                    textStyle={{ 
                      color: selectedJob.disputeDetails.status === 'resolved' ? '#4CAF50' : '#FF9800'
                    }}
                  >
                    {selectedJob.disputeDetails.status === 'resolved' ? 'Resolved' : 'Pending Resolution'}
                  </Chip>
                )}
              </View>
            </>
          )}
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="text" 
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          >
            Back
          </Button>
          
          {actionButtonText && (
            <Button 
              mode="contained" 
              onPress={handleActionButton}
              style={styles.actionButton}
            >
              {actionButtonText}
            </Button>
          )}
          
          {(selectedJob.status === 'accepted' || selectedJob.status === 'completed') && 
           (isServiceProvider || isServiceRequirer) && (
            <Button 
              mode="outlined" 
              icon="alert-circle"
              onPress={() => setShowDisputeDialog(true)}
              style={styles.disputeButton}
            >
              Raise Dispute
            </Button>
          )}
        </Card.Actions>
      </Card>
      
      <Portal>
        <Dialog visible={showDisputeDialog} onDismiss={() => setShowDisputeDialog(false)}>
          <Dialog.Title>Raise a Dispute</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to raise a dispute for this job? This action should only be taken if there are serious issues with the job or payment that cannot be resolved through direct communication.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button onPress={handleDisputeConfirm}>Continue</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#555',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    color: '#333',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    backgroundColor: '#007AFF',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: '#555',
  },
  pendingText: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  completionImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  feedbackContainer: {
    marginTop: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 4,
  },
  disputeContainer: {
    backgroundColor: '#FFF8F8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  disputeTitle: {
    color: '#FF0000',
    marginBottom: 12,
  },
  disputeText: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  disputeStatusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  cardActions: {
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
  },
  disputeButton: {
    borderColor: '#FF0000',
    marginLeft: 8,
  },
  chatButton: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
  },
});

export default JobDetailsScreen;