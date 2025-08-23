import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Chip, Avatar, Divider, FAB, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { fetchUserProfile } from '../../store/slices/userSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { profile, currentCategory } = useSelector(state => state.user);
  const { jobRequests, jobOffers, activeJobs, loading } = useSelector(state => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [dispatch]);
  
  const loadData = () => {
    dispatch(fetchUserProfile());
    dispatch(fetchJobs());
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };
  
  const renderJobCard = (job) => {
    return (
      <Card key={job.id} style={styles.jobCard} onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <Title style={styles.jobTitle}>{job.title}</Title>
            <Chip mode="outlined" style={styles.statusChip}>
              {job.status}
            </Chip>
          </View>
          
          <Paragraph numberOfLines={2} style={styles.jobDescription}>
            {job.description}
          </Paragraph>
          
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <Icon name="currency-ngn" size={16} color="#555" />
              <Text style={styles.jobDetailText}>₦{job.amount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Icon name="calendar" size={16} color="#555" />
              <Text style={styles.jobDetailText}>
                {new Date(job.deadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Icon name="map-marker" size={16} color="#555" />
              <Text style={styles.jobDetailText} numberOfLines={1}>
                {job.location}
              </Text>
            </View>
          </View>
          
          {job.skills && job.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {job.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} style={styles.skillChip} textStyle={styles.skillChipText}>
                  {skill}
                </Chip>
              ))}
              {job.skills.length > 3 && (
                <Chip style={styles.skillChip} textStyle={styles.skillChipText}>
                  +{job.skills.length - 3}
                </Chip>
              )}
            </View>
          )}
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
            style={styles.viewButton}
          >
            View Details
          </Button>
          
          {job.status === 'pending' && currentCategory === 'service_provider' && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobAcceptanceForm', { jobId: job.id, jobDetails: job })}
              style={styles.actionButton}
            >
              Accept Job
            </Button>
          )}
          
          {job.status === 'accepted' && job.serviceProviderId === user.id && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobCompletionForm', { jobId: job.id, jobDetails: job })}
              style={styles.actionButton}
            >
              Mark Complete
            </Button>
          )}
          
          {job.status === 'completed' && job.serviceRequirerId === user.id && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobSatisfactionForm', { jobId: job.id, jobDetails: job })}
              style={styles.actionButton}
            >
              Rate & Pay
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };
  
  const renderWelcomeSection = () => (
    <Card style={styles.welcomeCard}>
      <Card.Content>
        <View style={styles.welcomeHeader}>
          <View>
            <Title style={styles.welcomeTitle}>Welcome back,</Title>
            <Title style={styles.userName}>{user.fullName}</Title>
          </View>
          <Avatar.Text 
            size={50} 
            label={user.fullName.substring(0, 2).toUpperCase()} 
            backgroundColor="#007AFF"
          />
        </View>
        
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Current Role</Text>
            <Chip icon="account" style={styles.categoryChip}>
              {currentCategory === 'service_provider' ? 'Service Provider' : 'Service Requirer'}
            </Chip>
          </View>
          
          <View style={styles.userInfoItem}>
            <Text style={styles.userInfoLabel}>Verification Status</Text>
            <Chip 
              icon={profile?.isVerified ? "check-circle" : "alert-circle"}
              style={[styles.verificationChip, {backgroundColor: profile?.isVerified ? '#E8F5E9' : '#FFEBEE'}]}
            >
              {profile?.isVerified ? 'Verified' : 'Not Verified'}
            </Chip>
          </View>
        </View>
        
        {!profile?.isVerified && (
          <Button 
            mode="outlined" 
            icon="shield-account" 
            onPress={() => navigation.navigate('VerificationScreen')}
            style={styles.verifyButton}
          >
            Complete Verification
          </Button>
        )}
      </Card.Content>
    </Card>
  );
  
  const renderActiveJobsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Jobs</Text>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs' })}
        >
          See All
        </Button>
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : activeJobs.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyCardContent}>
            <Icon name="briefcase-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No active jobs</Text>
            <Text style={styles.emptySubtext}>
              {currentCategory === 'service_provider' 
                ? 'Accept job requests to see them here' 
                : 'Create a job request to get started'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        activeJobs.slice(0, 2).map(job => renderJobCard(job))
      )}
    </View>
  );
  
  const renderJobRequestsSection = () => {
    // Only show for service providers
    if (currentCategory !== 'service_provider') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Job Requests</Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs', params: { tab: 'requests' } })}
          >
            See All
          </Button>
        </View>
        
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
        ) : jobRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <Icon name="file-document-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No job requests</Text>
              <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
            </Card.Content>
          </Card>
        ) : (
          jobRequests.slice(0, 2).map(job => renderJobCard(job))
        )}
      </View>
    );
  };
  
  const renderJobOffersSection = () => {
    // Only show for service requirers
    if (currentCategory !== 'service_requirer') return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Job Offers</Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs', params: { tab: 'offers' } })}
          >
            See All
          </Button>
        </View>
        
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
        ) : jobOffers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyCardContent}>
              <Icon name="file-document-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No job offers</Text>
              <Text style={styles.emptySubtext}>Create a job request to get started</Text>
            </Card.Content>
          </Card>
        ) : (
          jobOffers.slice(0, 2).map(job => renderJobCard(job))
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderWelcomeSection()}
        {renderActiveJobsSection()}
        {renderJobRequestsSection()}
        {renderJobOffersSection()}
      </ScrollView>
      
      {currentCategory === 'service_requirer' && (
        <FAB
          style={styles.fab}
          icon="plus"
          label="New Job"
          onPress={() => navigation.navigate('JobRequestForm')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    color: '#666',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfoItem: {
    flex: 1,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
    height: 30,
  },
  verificationChip: {
    height: 30,
  },
  verifyButton: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobCard: {
    marginBottom: 16,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    flex: 1,
  },
  statusChip: {
    height: 26,
  },
  jobDescription: {
    color: '#555',
    marginBottom: 12,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#555',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
    height: 26,
  },
  skillChipText: {
    fontSize: 12,
  },
  cardActions: {
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewButton: {
    marginRight: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
  },
  emptyCard: {
    marginBottom: 16,
    height: 150,
  },
  emptyCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  loader: {
    marginVertical: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

export default HomeScreen;