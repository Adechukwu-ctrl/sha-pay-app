import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Title, Paragraph, Chip, Divider, FAB, ActivityIndicator, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../../store/slices/jobsSlice';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

const JobsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentCategory } = useSelector(state => state.user);
  const { jobRequests, jobOffers, activeJobs, completedJobs, loading } = useSelector(state => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  useEffect(() => {
    loadJobs();
  }, [dispatch]);
  
  useEffect(() => {
    // If route params specify a tab, switch to it
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params]);
  
  const loadJobs = () => {
    dispatch(fetchJobs());
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
    setRefreshing(false);
  };
  
  const getJobsForTab = () => {
    switch (activeTab) {
      case 'requests':
        return jobRequests;
      case 'offers':
        return jobOffers;
      case 'completed':
        return completedJobs;
      case 'active':
      default:
        return activeJobs;
    }
  };
  
  const filteredJobs = getJobsForTab().filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      (job.skills && job.skills.some(skill => skill.toLowerCase().includes(query)))
    );
  });
  
  const renderJobCard = ({ item }) => {
    return (
      <Card style={styles.jobCard} onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <Title style={styles.jobTitle}>{item.title}</Title>
            <Chip mode="outlined" style={styles.statusChip}>
              {item.status}
            </Chip>
          </View>
          
          <Paragraph numberOfLines={2} style={styles.jobDescription}>
            {item.description}
          </Paragraph>
          
          <View style={styles.jobDetails}>
            <View style={styles.jobDetail}>
              <Icon name="currency-ngn" size={16} color="#555" />
              <Text style={styles.jobDetailText}>₦{item.amount.toFixed(2)}</Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Icon name="calendar" size={16} color="#555" />
              <Text style={styles.jobDetailText}>
                {new Date(item.deadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.jobDetail}>
              <Icon name="map-marker" size={16} color="#555" />
              <Text style={styles.jobDetailText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>
          
          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} style={styles.skillChip} textStyle={styles.skillChipText}>
                  {skill}
                </Chip>
              ))}
              {item.skills.length > 3 && (
                <Chip style={styles.skillChip} textStyle={styles.skillChipText}>
                  +{item.skills.length - 3}
                </Chip>
              )}
            </View>
          )}
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
            style={styles.viewButton}
          >
            View Details
          </Button>
          
          {item.status === 'pending' && currentCategory === 'service_provider' && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobAcceptanceForm', { jobId: item.id, jobDetails: item })}
              style={styles.actionButton}
            >
              Accept Job
            </Button>
          )}
          
          {item.status === 'accepted' && item.serviceProviderId === user.id && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobCompletionForm', { jobId: item.id, jobDetails: item })}
              style={styles.actionButton}
            >
              Mark Complete
            </Button>
          )}
          
          {item.status === 'completed' && item.serviceRequirerId === user.id && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('JobSatisfactionForm', { jobId: item.id, jobDetails: item })}
              style={styles.actionButton}
            >
              Rate & Pay
            </Button>
          )}
          
          {(item.status === 'pending' || item.status === 'accepted' || item.status === 'completed') && (
            <Button 
              mode="text" 
              icon="chat" 
              onPress={() => {
                const recipientId = currentCategory === 'service_provider' ? item.serviceRequirerId : item.serviceProviderId;
                navigation.navigate('Chat', { recipientId, jobId: item.id });
              }}
              style={styles.chatButton}
            >
              Chat
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="file-document-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>
        {activeTab === 'requests' ? 'No job requests found' :
         activeTab === 'offers' ? 'No job offers found' :
         activeTab === 'active' ? 'No active jobs found' :
         'No completed jobs found'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'requests' && currentCategory === 'service_provider' ? 'Check back later for new opportunities' :
         activeTab === 'offers' && currentCategory === 'service_requirer' ? 'Create a job request to get started' :
         activeTab === 'active' ? 'Jobs you are working on will appear here' :
         'Completed jobs will be shown here'}
      </Text>
      
      {activeTab === 'offers' && currentCategory === 'service_requirer' && (
        <Button 
          mode="contained" 
          icon="plus" 
          onPress={() => navigation.navigate('JobRequestForm')}
          style={styles.createButton}
        >
          Create Job Request
        </Button>
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'active', label: 'Active' },
          ...(currentCategory === 'service_provider' ? [{ value: 'requests', label: 'Requests' }] : []),
          ...(currentCategory === 'service_requirer' ? [{ value: 'offers', label: 'My Offers' }] : []),
          { value: 'completed', label: 'Completed' },
        ]}
        style={styles.tabButtons}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.jobsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F0F0F0',
  },
  tabButtons: {
    margin: 16,
  },
  jobsList: {
    padding: 16,
    paddingBottom: 80,
  },
  separator: {
    height: 16,
  },
  jobCard: {
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
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewButton: {
    marginRight: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  chatButton: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

export default JobsScreen;