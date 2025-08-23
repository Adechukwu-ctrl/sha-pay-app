import React, { useState, useEffect } from 'react';
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
  ThemedAvatar,
  ThemedBadge,
  ThemedListItem,
  ThemedModal,
  EditFAB,
  LoadingSpinner,
} from '../components/ui';
import { colors, spacing } from '../theme';
import { selectUser, updateProfile, logout } from '../store/slices/authSlice';
import { fetchUserStats, fetchUserReviews } from '../store/slices/jobsSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { userStats, userReviews, loading } = useSelector((state) => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  useEffect(() => {
    loadProfileData();
  }, []);
  
  const loadProfileData = async () => {
    try {
      await Promise.all([
        dispatch(fetchUserStats()).unwrap(),
        dispatch(fetchUserReviews()).unwrap(),
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };
  
  const handleBackPress = () => {
    navigation.goBack();
  };
  
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };
  
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };
  
  const renderProfileHeader = () => (
    <ThemedCard style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <ThemedAvatar
          source={user?.avatar}
          initials={user?.name}
          size="xl"
          showOnlineIndicator
          isOnline={user?.isOnline}
        />
        
        <View style={styles.profileInfo}>
          <ThemedText variant="h5" style={{ marginBottom: spacing[1] }}>
            {user?.name}
          </ThemedText>
          
          <ThemedText variant="body2" style={{ color: colors.text.secondary, marginBottom: spacing[2] }}>
            {user?.title || 'Service Provider'}
          </ThemedText>
          
          <View style={styles.profileBadges}>
            <ThemedBadge
              variant={user?.isVerified ? 'success' : 'warning'}
              style={{ marginRight: spacing[2] }}
            >
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </ThemedBadge>
            
            <ThemedBadge variant="primary">
              {user?.userType === 'service_provider' ? 'Provider' : 'Requester'}
            </ThemedBadge>
          </View>
          
          {user?.bio && (
            <ThemedText
              variant="body2"
              style={{
                marginTop: spacing[3],
                color: colors.text.secondary,
                fontStyle: 'italic',
              }}
            >
              "{user.bio}"
            </ThemedText>
          )}
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderStatsCard = () => (
    <ThemedCard style={styles.card}>
      <ThemedText variant="h6" style={{ marginBottom: spacing[4] }}>
        Statistics
      </ThemedText>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.primary }}>
            {userStats?.completedJobs || 0}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Jobs Completed
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.success }}>
            ₦{userStats?.totalEarnings?.toLocaleString() || '0'}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Total Earnings
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.warning }}>
            {userStats?.rating?.toFixed(1) || '0.0'}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Average Rating
          </ThemedText>
        </View>
        
        <View style={styles.statItem}>
          <ThemedText variant="h4" style={{ color: colors.secondary }}>
            {userStats?.responseTime || 'N/A'}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.text.secondary }}>
            Response Time
          </ThemedText>
        </View>
      </View>
    </ThemedCard>
  );
  
  const renderSkillsCard = () => {
    if (!user?.skills || user.skills.length === 0) return null;
    
    return (
      <ThemedCard style={styles.card}>
        <ThemedText variant="h6" style={{ marginBottom: spacing[3] }}>
          Skills & Expertise
        </ThemedText>
        
        <View style={styles.skillsContainer}>
          {user.skills.map((skill, index) => (
            <ThemedBadge
              key={index}
              variant="outline"
              style={styles.skillBadge}
            >
              {skill}
            </ThemedBadge>
          ))}
        </View>
      </ThemedCard>
    );
  };
  
  const renderReviewsCard = () => {
    if (!userReviews || userReviews.length === 0) {
      return (
        <ThemedCard style={styles.card}>
          <ThemedText variant="h6" style={{ marginBottom: spacing[3] }}>
            Reviews
          </ThemedText>
          <ThemedText variant="body2" style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No reviews yet
          </ThemedText>
        </ThemedCard>
      );
    }
    
    return (
      <ThemedCard style={styles.card}>
        <View style={styles.reviewsHeader}>
          <ThemedText variant="h6">
            Reviews ({userReviews.length})
          </ThemedText>
          
          <ThemedButton
            variant="text"
            size="small"
            onPress={() => navigation.navigate('AllReviews')}
          >
            View All
          </ThemedButton>
        </View>
        
        {userReviews.slice(0, 3).map((review, index) => (
          <View key={review.id || index} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <ThemedAvatar
                source={review.reviewer?.avatar}
                initials={review.reviewer?.name}
                size="small"
              />
              
              <View style={styles.reviewInfo}>
                <ThemedText variant="body2" style={{ fontWeight: '600' }}>
                  {review.reviewer?.name}
                </ThemedText>
                <View style={styles.reviewRating}>
                  <ThemedText variant="caption" style={{ color: colors.warning }}>
                    {'⭐'.repeat(review.rating)} {review.rating}/5
                  </ThemedText>
                  <ThemedText variant="caption" style={{ color: colors.text.secondary, marginLeft: spacing[2] }}>
                    {review.timeAgo}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <ThemedText
              variant="body2"
              style={{
                marginTop: spacing[2],
                color: colors.text.secondary,
              }}
              numberOfLines={3}
            >
              {review.comment}
            </ThemedText>
            
            {index < userReviews.slice(0, 3).length - 1 && (
              <View style={styles.reviewDivider} />
            )}
          </View>
        ))}
      </ThemedCard>
    );
  };
  
  const renderMenuItems = () => (
    <ThemedCard style={styles.card}>
      <ThemedListItem
        title="My Jobs"
        subtitle="View your posted and applied jobs"
        leftIcon="briefcase-outline"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('MyJobs')}
      />
      
      <ThemedListItem
        title="Payment History"
        subtitle="View your transaction history"
        leftIcon="credit-card-outline"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('PaymentHistory')}
      />
      
      <ThemedListItem
        title="Notifications"
        subtitle="Manage your notification preferences"
        leftIcon="bell-outline"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('Notifications')}
      />
      
      <ThemedListItem
        title="Settings"
        subtitle="App settings and preferences"
        leftIcon="cog-outline"
        rightIcon="chevron-right"
        onPress={handleSettingsPress}
      />
      
      <ThemedListItem
        title="Help & Support"
        subtitle="Get help and contact support"
        leftIcon="help-circle-outline"
        rightIcon="chevron-right"
        onPress={() => navigation.navigate('Support')}
      />
      
      <ThemedListItem
        title="Logout"
        subtitle="Sign out of your account"
        leftIcon="logout"
        rightIcon="chevron-right"
        onPress={() => setShowLogoutModal(true)}
        style={{ borderBottomWidth: 0 }}
      />
    </ThemedCard>
  );
  
  return (
    <View style={styles.container}>
      <ThemedHeader
        title="Profile"
        onLeftPress={handleBackPress}
        rightIcon="cog"
        onRightPress={handleSettingsPress}
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
        {renderProfileHeader()}
        {renderStatsCard()}
        {renderSkillsCard()}
        {renderReviewsCard()}
        {renderMenuItems()}
        
        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Edit Profile FAB */}
      <EditFAB
        onPress={handleEditProfile}
      />
      
      {/* Logout Confirmation Modal */}
      <ThemedModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        size="small"
      >
        <ThemedText variant="body1" style={{ marginBottom: spacing[4] }}>
          Are you sure you want to logout?
        </ThemedText>
        
        <View style={styles.modalActions}>
          <ThemedButton
            variant="outline"
            onPress={() => setShowLogoutModal(false)}
            style={{ flex: 1, marginRight: spacing[2] }}
          >
            Cancel
          </ThemedButton>
          
          <ThemedButton
            variant="error"
            onPress={handleLogout}
            style={{ flex: 1 }}
          >
            Logout
          </ThemedButton>
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
  content: {
    flex: 1,
  },
  profileCard: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.background.default,
    borderRadius: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  reviewItem: {
    marginBottom: spacing[3],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing[3],
  },
  modalActions: {
    flexDirection: 'row',
  },
});

export default ProfileScreen;