import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  ThemedAvatar,
  ThemedListItem,
  ThemedModal,
  SegmentedControl,
  LoadingSpinner,
  SkeletonCard,
  AddFAB,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  fetchUserJobs,
  cancelJob,
  markJobComplete,
  reopenJob,
} from '../store/slices/jobsSlice';
import { selectUser } from '../store/slices/authSlice';
import { formatDistanceToNow, format } from 'date-fns';

const MyJobsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { userJobs, loading, refreshing } = useSelector((state) => state.jobs);
  
  const [filter, setFilter] = useState(0); // 0: All, 1: Active, 2: Completed, 3: Cancelled
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const filterOptions = [
    { label: 'All', key: 'all' },
    { label: 'Active', key: 'active' },
    { label: 'Completed', key: 'completed' },
    { label: 'Cancelled', key: 'cancelled' },
  ];
  
  useEffect(() => {
    loadUserJobs();
  }, []);
  
  const loadUserJobs = useCallback(async () => {
    try {
      await dispatch(fetchUserJobs(user.id)).unwrap();
    } catch (error) {
      console.error('Error loading user jobs:', error);
    }
  }, [dispatch, user.id]);
  
  const handleRefresh = useCallback(async () => {
    await loadUserJobs();
  }, [loadUserJobs]);
  
  const getFilteredJobs = () => {
    if (!userJobs) return [];
    
    switch (filter) {
      case 1: // Active
        return userJobs.filter(job => 
          ['open', 'in_progress', 'pending_completion'].includes(job.status)
        );
      case 2: // Completed
        return userJobs.filter(job => job.status === 'completed');
      case 3: // Cancelled
        return userJobs.filter(job => job.status === 'cancelled');
      default: // All
        return userJobs;
    }
  };
  
  const getJobStatusColor = (status) => {
    switch (status) {
      case 'open':
        return colors.primary.main;
      case 'in_progress':
        return colors.warning;
      case 'pending_completion':
        return colors.info;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'disputed':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };
  
  const getJobStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'pending_completion':
        return 'Pending Completion';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };
  
  const getJobActions = (job) => {
    const actions = [];
    
    switch (job.status) {
      case 'open':
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) },
          { label: 'Edit Job', action: () => navigation.navigate('EditJob', { jobId: job.id }) },
          { label: 'Cancel Job', action: () => handleCancelJob(job), destructive: true }
        );
        break;
      case 'in_progress':
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) },
          { label: 'Chat with Provider', action: () => navigation.navigate('Chat', { jobId: job.id }) },
          { label: 'Mark Complete', action: () => handleMarkComplete(job) }
        );
        break;
      case 'pending_completion':
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) },
          { label: 'Confirm Completion', action: () => handleConfirmCompletion(job) }
        );
        break;
      case 'completed':
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) },
          { label: 'Leave Review', action: () => navigation.navigate('LeaveReview', { jobId: job.id }) },
          { label: 'Repost Job', action: () => handleRepostJob(job) }
        );
        break;
      case 'cancelled':
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) },
          { label: 'Repost Job', action: () => handleRepostJob(job) }
        );
        break;
      default:
        actions.push(
          { label: 'View Details', action: () => navigation.navigate('JobDetails', { jobId: job.id }) }
        );
    }
    
    return actions;
  };
  
  const handleJobPress = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };
  
  const handleCancelJob = (job) => {
    setSelectedJob(job);
    setShowCancelModal(true);
  };
  
  const confirmCancelJob = async () => {
    if (!selectedJob) return;
    
    try {
      setActionLoading(true);
      await dispatch(cancelJob(selectedJob.id)).unwrap();
      setShowCancelModal(false);
      setSelectedJob(null);
      await loadUserJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
      Alert.alert('Error', 'Failed to cancel job. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleMarkComplete = async (job) => {
    try {
      setActionLoading(true);
      await dispatch(markJobComplete(job.id)).unwrap();
      await loadUserJobs();
      Alert.alert('Success', 'Job marked as complete. Waiting for provider confirmation.');
    } catch (error) {
      console.error('Error marking job complete:', error);
      Alert.alert('Error', 'Failed to mark job as complete. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleConfirmCompletion = (job) => {
    Alert.alert(
      'Confirm Job Completion',
      'Are you satisfied with the work completed? This will release payment to the service provider.',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Confirm', onPress: () => finalizeJobCompletion(job) },
      ]
    );
  };
  
  const finalizeJobCompletion = async (job) => {
    try {
      setActionLoading(true);
      // This would trigger payment release and job completion
      await dispatch(markJobComplete(job.id)).unwrap();
      await loadUserJobs();
      Alert.alert('Success', 'Job completed successfully! Payment has been released.');
    } catch (error) {
      console.error('Error finalizing job completion:', error);
      Alert.alert('Error', 'Failed to complete job. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleRepostJob = (job) => {
    Alert.alert(
      'Repost Job',
      'Create a new job based on this one?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Repost',
          onPress: () => {
            navigation.navigate('CreateJob', {
              template: {
                title: job.title,
                description: job.description,
                category: job.category,
                budget: job.budget,
                location: job.location,
                requirements: job.requirements,
                skills: job.skills,
              },
            });
          },
        },
      ]
    );
  };
  
  const renderJobCard = (job) => {
    const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });
    const applicantCount = job.applications?.length || 0;
    
    return (
      <ThemedCard key={job.id} style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <ThemedText variant="h6" numberOfLines={2}>
              {job.title}
            </ThemedText>
            <ThemedBadge
              variant="outline"
              style={{
                backgroundColor: getJobStatusColor(job.status) + '20',
                borderColor: getJobStatusColor(job.status),
              }}
            >
              {getJobStatusText(job.status)}
            </ThemedBadge>
          </View>
        </View>
        
        <ThemedText variant="body2" numberOfLines={3} style={styles.jobDescription}>
          {job.description}
        </ThemedText>
        
        <View style={styles.jobMeta}>
          <View style={styles.jobMetaItem}>
            <ThemedText variant="caption" style={styles.jobMetaLabel}>
              Budget:
            </ThemedText>
            <ThemedText variant="body2" style={styles.jobMetaValue}>
              ₦{job.budget?.toLocaleString()}
            </ThemedText>
          </View>
          
          <View style={styles.jobMetaItem}>
            <ThemedText variant="caption" style={styles.jobMetaLabel}>
              Location:
            </ThemedText>
            <ThemedText variant="body2" style={styles.jobMetaValue} numberOfLines={1}>
              {job.location}
            </ThemedText>
          </View>
          
          <View style={styles.jobMetaItem}>
            <ThemedText variant="caption" style={styles.jobMetaLabel}>
              Posted:
            </ThemedText>
            <ThemedText variant="body2" style={styles.jobMetaValue}>
              {timeAgo}
            </ThemedText>
          </View>
        </View>
        
        {job.status === 'open' && (
          <View style={styles.applicantInfo}>
            <ThemedText variant="caption">
              {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
            </ThemedText>
          </View>
        )}
        
        <View style={styles.jobActions}>
          <ThemedButton
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            View Details
          </ThemedButton>
          
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => handleJobPress(job)}
          >
            More
          </ThemedButton>
        </View>
      </ThemedCard>
    );
  };
  
  const renderEmptyState = () => {
    const filterText = filterOptions[filter].label.toLowerCase();
    
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          {/* Briefcase icon would be rendered here */}
        </View>
        <ThemedText variant="h6" style={styles.emptyTitle}>
          No {filterText} jobs
        </ThemedText>
        <ThemedText variant="body2" style={styles.emptyMessage}>
          {filter === 0
            ? "You haven't posted any jobs yet. Create your first job to get started!"
            : `No ${filterText} jobs found.`}
        </ThemedText>
        
        {filter === 0 && (
          <ThemedButton
            variant="primary"
            onPress={() => navigation.navigate('CreateJob')}
            style={{ marginTop: spacing[4] }}
          >
            Create Your First Job
          </ThemedButton>
        )}
      </View>
    );
  };
  
  const renderLoadingState = () => (
    <View style={styles.content}>
      {[...Array(3)].map((_, index) => (
        <SkeletonCard key={index} style={styles.skeletonCard} />
      ))}
    </View>
  );
  
  const filteredJobs = getFilteredJobs();
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="My Jobs"
        subtitle={`${userJobs?.length || 0} total jobs`}
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => navigation.navigate('CreateJob')}
          >
            + New
          </ThemedButton>
        }
      />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          segments={filterOptions}
          selectedIndex={filter}
          onSelectionChange={setFilter}
        />
      </View>
      
      {loading && !refreshing ? (
        renderLoadingState()
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredJobs.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.jobsList}>
              {filteredJobs.map(renderJobCard)}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Floating Action Button */}
      <AddFAB
        onPress={() => navigation.navigate('CreateJob')}
        position="bottom-right"
      />
      
      {/* Job Actions Modal */}
      <ThemedModal
        visible={showJobModal}
        onClose={() => {
          setShowJobModal(false);
          setSelectedJob(null);
        }}
        title={selectedJob?.title}
        size="medium"
      >
        {selectedJob && (
          <View style={styles.modalContent}>
            {getJobActions(selectedJob).map((action, index) => (
              <ThemedListItem
                key={index}
                title={action.label}
                onPress={() => {
                  setShowJobModal(false);
                  action.action();
                }}
                titleStyle={action.destructive ? { color: colors.error } : {}}
                style={index > 0 ? { marginTop: spacing[1] } : {}}
              />
            ))}
          </View>
        )}
      </ThemedModal>
      
      {/* Cancel Job Confirmation */}
      <ThemedModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedJob(null);
        }}
        title="Cancel Job"
        size="medium"
      >
        <View style={styles.cancelContent}>
          <ThemedText variant="body1" style={{ marginBottom: spacing[4] }}>
            Are you sure you want to cancel this job? This action cannot be undone.
          </ThemedText>
          
          <View style={styles.cancelActions}>
            <ThemedButton
              variant="outline"
              onPress={() => {
                setShowCancelModal(false);
                setSelectedJob(null);
              }}
              style={{ flex: 1, marginRight: spacing[2] }}
              disabled={actionLoading}
            >
              Keep Job
            </ThemedButton>
            
            <ThemedButton
              variant="error"
              onPress={confirmCancelJob}
              style={{ flex: 1 }}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Cancel Job
            </ThemedButton>
          </View>
        </View>
      </ThemedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  filterContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flex: 1,
  },
  jobsList: {
    paddingVertical: spacing[2],
  },
  jobCard: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
  },
  jobHeader: {
    marginBottom: spacing[3],
  },
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobDescription: {
    marginBottom: spacing[3],
    color: colors.text.secondary,
  },
  jobMeta: {
    marginBottom: spacing[3],
  },
  jobMetaItem: {
    flexDirection: 'row',
    marginBottom: spacing[1],
  },
  jobMetaLabel: {
    width: 60,
    color: colors.text.secondary,
  },
  jobMetaValue: {
    flex: 1,
    fontWeight: '500',
  },
  applicantInfo: {
    marginBottom: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  skeletonCard: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    height: 200,
  },
  modalContent: {
    paddingVertical: spacing[2],
  },
  cancelContent: {
    paddingVertical: spacing[2],
  },
  cancelActions: {
    flexDirection: 'row',
  },
});

export default MyJobsScreen;