import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  JobHeader,
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  ThemedAvatar,
  ThemedModal,
  ChatFAB,
  ShareFAB,
  LoadingSpinner,
  ConfirmModal,
} from '../components/ui';
import { colors, spacing, borderRadius } from '../theme';
import { fetchJobDetails, applyForJob, favoriteJob } from '../store/slices/jobsSlice';
import { selectUser } from '../store/slices/authSlice';
import { createConversation } from '../store/slices/chatSlice';

const { width: screenWidth } = Dimensions.get('window');

const JobDetailsScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { currentJob, loading } = useSelector((state) => state.jobs);
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    loadJobDetails();
  }, [jobId]);
  
  useEffect(() => {
    if (currentJob) {
      setIsFavorite(currentJob.isFavorite || false);
    }
  }, [currentJob]);
  
  const loadJobDetails = async () => {
    try {
      await dispatch(fetchJobDetails(jobId)).unwrap();
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    }
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleApplyPress = () => {
    if (currentJob?.clientId === user?.id) {
      Alert.alert('Error', 'You cannot apply to your own job');
      return;
    }
    setShowApplyModal(true);
  };
  
  const handleConfirmApply = async () => {
    setApplying(true);
    try {
      await dispatch(applyForJob({
        jobId: currentJob.id,
        userId: user.id,
      })).unwrap();
      
      setShowApplyModal(false);
      Alert.alert(
        'Application Sent',
        'Your application has been sent to the client. They will review it and get back to you.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error applying for job:', error);
      Alert.alert('Error', 'Failed to apply for job. Please try again.');
    } finally {
      setApplying(false);
    }
  };
  
  const handleChatPress = async () => {
    try {
      const conversation = await dispatch(createConversation({
        participantId: currentJob.clientId,
        jobId: currentJob.id,
      })).unwrap();
      
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        participant: currentJob.client,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };
  
  const handleSharePress = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality will be implemented');
  };
  
  const handleFavoritePress = async () => {
    try {
      await dispatch(favoriteJob({
        jobId: currentJob.id,
        isFavorite: !isFavorite,
      })).unwrap();
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };
  
  const handleMorePress = () => {
    // Show more options menu
    Alert.alert(
      'More Options',
      'Choose an action',
      [
        { text: 'Report Job', onPress: () => console.log('Report job') },
        { text: 'Block Client', onPress: () => console.log('Block client') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  const renderJobInfo = () => (
    <ThemedCard style={styles.card}>
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleSection}>
          <ThemedText variant="h5" style={{ marginBottom: spacing[1] }}>
            {currentJob.title}
          </ThemedText>
          <ThemedText variant="body2" style={{ color: colors.text.secondary }}>
            {currentJob.category}
          </ThemedText>
        </View>
        
        <View style={styles.jobPriceSection}>
          <ThemedText variant="h4" style={{ color: colors.primary }}>
            ₦{currentJob.budget?.toLocaleString()}
          </ThemedText>
          <ThemedBadge
            variant={currentJob.urgency === 'urgent' ? 'error' : currentJob.urgency === 'medium' ? 'warning' : 'success'}
            style={{ marginTop: spacing[1] }}
          >
            {currentJob.urgency}
          </ThemedBadge>
        </View>
      </View>
      
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Posted
          </ThemedText>
          <ThemedText variant="body2">
            {currentJob.timeAgo}
          </ThemedText>
        </View>
        
        <View style={styles.metaItem}>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Applicants
          </ThemedText>
          <ThemedText variant="body2">
            {currentJob.applicants || 0}
          </ThemedText>
        </View>
        
        <View style={styles.metaItem}>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Location
          </ThemedText>
          <ThemedText variant="body2">
            {currentJob.location}
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderDescription = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[3] }}>
        Job Description
      </ThemedText>
      <ThemedText variant="body1" style={{ lineHeight: 24 }}>
        {currentJob.description}
      </ThemedText>
      
      {currentJob.requirements && (
        <View style={{ marginTop: spacing[4] }}>
          <ThemedText variant="h6" style={{ marginBottom: spacing[2] }}>
            Requirements
          </ThemedText>
          {currentJob.requirements.map((requirement, index) => (
            <View key={index} style={styles.requirementItem}>
              <ThemedText variant="body2">• {requirement}</ThemedText>
            </View>
          ))}
        </View>
      )}
      
      {currentJob.skills && currentJob.skills.length > 0 && (
        <View style={{ marginTop: spacing[4] }}>
          <ThemedText variant="h6" style={{ marginBottom: spacing[2] }}>
            Required Skills
          </ThemedText>
          <View style={styles.skillsContainer}>
            {currentJob.skills.map((skill, index) => (
              <ThemedBadge
                key={index}
                variant="outline"
                style={styles.skillBadge}
              >
                {skill}
              </ThemedBadge>
            ))}
          </View>
        </View>
      )}
    </ThemedCard>
  );
  
  const renderClientInfo = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[3] }}>
        Client Information
      </ThemedText>
      
      <View style={styles.clientHeader}>
        <ThemedAvatar
          source={currentJob.client?.avatar}
          initials={currentJob.client?.name}
          size="medium"
        />
        
        <View style={styles.clientInfo}>
          <ThemedText variant="h6">
            {currentJob.client?.name}
          </ThemedText>
          <ThemedText variant="body2" style={{ color: colors.text.secondary }}>
            {currentJob.client?.title || 'Client'}
          </ThemedText>
          
          <View style={styles.clientStats}>
            <View style={styles.clientStat}>
              <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
                Rating
              </ThemedText>
              <ThemedText variant="body2" style={{ fontWeight: '600' }}>
                {currentJob.client?.rating?.toFixed(1) || 'N/A'} ⭐
              </ThemedText>
            </View>
            
            <View style={styles.clientStat}>
              <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
                Jobs Posted
              </ThemedText>
              <ThemedText variant="body2" style={{ fontWeight: '600' }}>
                {currentJob.client?.jobsPosted || 0}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      
      {currentJob.client?.bio && (
        <ThemedText
          variant="body2"
          style={{
            marginTop: spacing[3],
            color: colors.text.secondary,
            fontStyle: 'italic',
          }}
        >
          "{currentJob.client.bio}"
        </ThemedText>
      )}
    </ThemedCard>
  );
  
  const renderActionButtons = () => {
    const isOwnJob = currentJob?.clientId === user?.id;
    const hasApplied = currentJob?.hasApplied;
    
    if (isOwnJob) {
      return (
        <View style={styles.actionButtons}>
          <ThemedButton
            variant="outline"
            onPress={() => navigation.navigate('EditJob', { jobId: currentJob.id })}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            Edit Job
          </ThemedButton>
          <ThemedButton
            variant="primary"
            onPress={() => navigation.navigate('JobApplicants', { jobId: currentJob.id })}
            style={{ flex: 1 }}
          >
            View Applicants
          </ThemedButton>
        </View>
      );
    }
    
    if (hasApplied) {
      return (
        <View style={styles.actionButtons}>
          <ThemedButton
            variant="outline"
            disabled
            style={{ flex: 1 }}
          >
            Application Sent
          </ThemedButton>
        </View>
      );
    }
    
    return (
      <View style={styles.actionButtons}>
        <ThemedButton
          variant="outline"
          onPress={handleChatPress}
          style={{ flex: 1, marginRight: spacing[2] }}
        >
          Message Client
        </ThemedButton>
        <ThemedButton
          variant="primary"
          onPress={handleApplyPress}
          style={{ flex: 1 }}
        >
          Apply Now
        </ThemedButton>
      </View>
    );
  };
  
  if (loading || !currentJob) {
    return (
      <View style={styles.container}>
        <JobHeader
          job={{ title: 'Loading...', category: '' }}
          onBackPress={handleBackPress}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <JobHeader
        job={currentJob}
        onBackPress={handleBackPress}
        onSharePress={handleSharePress}
        onFavoritePress={handleFavoritePress}
        onMorePress={handleMorePress}
        isFavorite={isFavorite}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderJobInfo()}
        {renderDescription()}
        {renderClientInfo()}
        
        {/* Bottom spacing for action buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        {renderActionButtons()}
      </View>
      
      {/* Chat FAB */}
      {currentJob.clientId !== user?.id && (
        <ChatFAB
          onPress={handleChatPress}
          position="bottom-right"
          style={{ bottom: 120 }}
        />
      )}
      
      {/* Apply Modal */}
      <ConfirmModal
        visible={showApplyModal}
        title="Apply for Job"
        message={`Are you sure you want to apply for "${currentJob.title}"? The client will be able to see your profile and contact you.`}
        confirmText="Apply"
        cancelText="Cancel"
        onConfirm={handleConfirmApply}
        onCancel={() => setShowApplyModal(false)}
        loading={applying}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  jobTitleSection: {
    flex: 1,
    marginRight: spacing[3],
  },
  jobPriceSection: {
    alignItems: 'flex-end',
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  metaItem: {
    alignItems: 'center',
  },
  requirementItem: {
    marginBottom: spacing[1],
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[1],
  },
  skillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  clientStats: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  clientStat: {
    marginRight: spacing[4],
  },
  bottomActions: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
  },
});

export default JobDetailsScreen;