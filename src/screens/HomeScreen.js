import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  HomeHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedInput,
  ThemedList,
  ThemedBadge,
  ThemedAvatar,
  AddFAB,
  FilterFAB,
  SegmentedControl,
  LoadingSpinner,
  SkeletonCard,
} from '../components/ui';
import { colors, spacing, borderRadius } from '../theme';
import { fetchJobs, fetchUserStats } from '../store/slices/jobsSlice';
import { selectUser } from '../store/slices/authSlice';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { jobs, loading, userStats } = useSelector((state) => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [filteredJobs, setFilteredJobs] = useState([]);
  
  const categories = [
    { label: 'All Jobs', key: 'all' },
    { label: 'My Category', key: 'my_category' },
    { label: 'Nearby', key: 'nearby' },
    { label: 'Recent', key: 'recent' },
  ];
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, selectedCategory]);
  
  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchJobs()).unwrap(),
        dispatch(fetchUserStats()).unwrap(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const filterJobs = () => {
    let filtered = jobs || [];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    const category = categories[selectedCategory];
    switch (category.key) {
      case 'my_category':
        filtered = filtered.filter((job) => job.category === user?.preferredCategory);
        break;
      case 'nearby':
        // Filter by location proximity (implement based on your location logic)
        filtered = filtered.filter((job) => job.isNearby);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // All jobs - no additional filtering
        break;
    }
    
    setFilteredJobs(filtered);
  };
  
  const handleJobPress = (job) => {
    navigation.navigate('JobDetails', { jobId: job.id });
  };
  
  const handleCreateJob = () => {
    navigation.navigate('CreateJob');
  };
  
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };
  
  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };
  
  const handleFilterPress = () => {
    navigation.navigate('JobFilters');
  };
  
  const renderStatsCard = () => (
    <ThemedCard
      variant="primary"
      style={{
        margin: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.background.paper }}>
            {userStats?.completedJobs || 0}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.background.paper, opacity: 0.8 }}>
            Completed
          </ThemedText>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.background.paper }}>
            ₦{userStats?.totalEarnings?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.background.paper, opacity: 0.8 }}>
            Earnings
          </ThemedText>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.background.paper }}>
            {userStats?.rating?.toFixed(1) || '0.0'}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.background.paper, opacity: 0.8 }}>
            Rating
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <ThemedInput
        placeholder="Search jobs, categories..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon="magnify"
        variant="outlined"
        style={{
          flex: 1,
          marginRight: spacing[2],
        }}
      />
      <FilterFAB
        onPress={handleFilterPress}
        size="small"
        position="static"
        style={{
          position: 'relative',
          marginTop: 0,
        }}
      />
    </View>
  );
  
  const renderCategoryTabs = () => (
    <SegmentedControl
      segments={categories}
      selectedIndex={selectedCategory}
      onSelectionChange={setSelectedCategory}
      style={{
        marginHorizontal: spacing[4],
        marginBottom: spacing[3],
      }}
    />
  );
  
  const renderJobCard = (job) => (
    <ThemedCard
      key={job.id}
      onPress={() => handleJobPress(job)}
      style={{
        marginHorizontal: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <ThemedText variant="h6" numberOfLines={2}>
            {job.title}
          </ThemedText>
          <ThemedText variant="body2" style={{ color: colors.text.secondary, marginTop: spacing[1] }}>
            {job.category}
          </ThemedText>
        </View>
        
        <View style={styles.jobPrice}>
          <ThemedText variant="h6" style={{ color: colors.primary }}>
            ₦{job.budget?.toLocaleString()}
          </ThemedText>
          <ThemedBadge
            variant={job.urgency === 'urgent' ? 'error' : job.urgency === 'medium' ? 'warning' : 'success'}
            size="small"
            style={{ marginTop: spacing[1] }}
          >
            {job.urgency}
          </ThemedBadge>
        </View>
      </View>
      
      <ThemedText
        variant="body2"
        numberOfLines={3}
        style={{
          marginTop: spacing[2],
          color: colors.text.secondary,
        }}
      >
        {job.description}
      </ThemedText>
      
      <View style={styles.jobFooter}>
        <View style={styles.jobClient}>
          <ThemedAvatar
            source={job.client?.avatar}
            initials={job.client?.name}
            size="xs"
          />
          <View style={{ marginLeft: spacing[2] }}>
            <ThemedText variant="caption" style={{ fontWeight: '600' }}>
              {job.client?.name}
            </ThemedText>
            <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
              {job.location}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.jobMeta}>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            {job.applicants} applicants
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
            {job.timeAgo}
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText variant="h6" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
        No jobs found
      </ThemedText>
      <ThemedText variant="body2" style={{ textAlign: 'center', color: colors.text.secondary }}>
        Try adjusting your search or filters
      </ThemedText>
    </View>
  );
  
  const renderLoadingState = () => (
    <View>
      {[1, 2, 3].map((index) => (
        <SkeletonCard
          key={index}
          style={{
            marginHorizontal: spacing[4],
            marginBottom: spacing[3],
            height: 150,
          }}
        />
      ))}
    </View>
  );
  
  return (
    <View style={styles.container}>
      <HomeHeader
        user={user}
        notificationCount={userStats?.unreadNotifications || 0}
        onProfilePress={handleProfilePress}
        onNotificationPress={handleNotificationPress}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats */}
        {renderStatsCard()}
        
        {/* Search Bar */}
        {renderSearchBar()}
        
        {/* Category Tabs */}
        {renderCategoryTabs()}
        
        {/* Jobs List */}
        {loading ? (
          renderLoadingState()
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map(renderJobCard)
        ) : (
          renderEmptyState()
        )}
        
        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Create Job FAB */}
      <AddFAB
        onPress={handleCreateJob}
        extended
        label="Post Job"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.background.paper,
    opacity: 0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  jobPrice: {
    alignItems: 'flex-end',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  jobClient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  emptyState: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});

export default HomeScreen;