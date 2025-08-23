import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  ThemedCard,
  ThemedText,
  ThemedButton,
  ThemedBadge,
  ThemedModal,
  ThemedListItem,
  LoadingSpinner,
} from './';
import { colors, spacing } from '../../theme';
import {
  fetchUserRating,
  fetchRatingHistory,
  fetchRatingRecommendations,
  selectUserRating,
  selectUserRatingHistory,
  selectUserRecommendations,
  selectUserTrend,
  selectRatingLoading,
  markRecommendationCompleted,
} from '../../store/slices/creditRatingSlice';
import { selectUser } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const CreditRating = ({
  userId,
  showDetails = true,
  showRecommendations = true,
  compact = false,
  style,
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const targetUserId = userId || currentUser?.id;
  
  const rating = useSelector(state => selectUserRating(state, targetUserId));
  const ratingHistory = useSelector(state => selectUserRatingHistory(state, targetUserId));
  const recommendations = useSelector(state => selectUserRecommendations(state, targetUserId));
  const trend = useSelector(state => selectUserTrend(state, targetUserId));
  const loading = useSelector(selectRatingLoading);
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (targetUserId) {
      loadRatingData();
    }
  }, [targetUserId]);
  
  useEffect(() => {
    if (rating) {
      // Animate rating display
      Animated.timing(animatedValue, {
        toValue: rating.score,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [rating]);
  
  const loadRatingData = async () => {
    try {
      await Promise.all([
        dispatch(fetchUserRating(targetUserId)),
        dispatch(fetchRatingHistory({ userId: targetUserId })),
        dispatch(fetchRatingRecommendations(targetUserId)),
      ]);
    } catch (error) {
      console.error('Error loading rating data:', error);
    }
  };
  
  const handleRecommendationAction = async (recommendation) => {
    try {
      // Mark recommendation as completed
      dispatch(markRecommendationCompleted({
        userId: targetUserId,
        recommendationId: recommendation.id,
      }));
      
      // Navigate to appropriate screen based on action
      switch (recommendation.action) {
        case 'verify_identity':
          // Navigate to verification screen
          break;
        case 'improve_performance':
          // Navigate to jobs screen
          break;
        case 'complete_profile':
          // Navigate to edit profile screen
          break;
        case 'improve_payments':
          // Navigate to payment settings
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling recommendation action:', error);
    }
  };
  
  const getRatingColor = (score) => {
    if (score >= 85) return colors.status.success;
    if (score >= 70) return colors.primary.main;
    if (score >= 55) return colors.status.warning;
    if (score >= 40) return colors.status.error;
    return colors.text.secondary;
  };
  
  const getTrendIcon = (trend) => {
    if (!trend) return null;
    
    switch (trend.trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };
  
  const getTrendColor = (trend) => {
    if (!trend) return colors.text.secondary;
    
    switch (trend.trend) {
      case 'improving':
        return colors.status.success;
      case 'declining':
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };
  
  const renderCompactView = () => {
    if (!rating) {
      return (
        <View style={[styles.compactContainer, style]}>
          <View style={styles.compactRating}>
            <ThemedText variant="caption">No Rating</ThemedText>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={[styles.compactRating, { backgroundColor: getRatingColor(rating.score) + '20' }]}>
          <ThemedText
            variant="body2"
            style={[styles.compactScore, { color: getRatingColor(rating.score) }]}
          >
            {rating.score}
          </ThemedText>
        </View>
        
        <View style={styles.compactInfo}>
          <ThemedText variant="caption" style={styles.compactTier}>
            {rating.tier}
          </ThemedText>
          
          {trend && (
            <ThemedText
              variant="caption"
              style={[styles.compactTrend, { color: getTrendColor(trend) }]}
            >
              {getTrendIcon(trend)} {trend.change > 0 ? '+' : ''}{trend.change}
            </ThemedText>
          )}
        </View>
      </View>
    );
  };
  
  const renderFullView = () => {
    if (loading && !rating) {
      return (
        <ThemedCard style={[styles.container, style]}>
          <LoadingSpinner size="small" />
        </ThemedCard>
      );
    }
    
    if (!rating) {
      return (
        <ThemedCard style={[styles.container, style]}>
          <View style={styles.noRating}>
            <ThemedText variant="h6" style={styles.noRatingTitle}>
              No Credit Rating
            </ThemedText>
            <ThemedText variant="body2" style={styles.noRatingMessage}>
              Complete your profile and start working to build your credit rating.
            </ThemedText>
          </View>
        </ThemedCard>
      );
    }
    
    return (
      <ThemedCard style={[styles.container, style]}>
        <View style={styles.header}>
          <ThemedText variant="h6" style={styles.title}>
            Credit Rating
          </ThemedText>
          
          {showDetails && (
            <ThemedButton
              variant="text"
              size="small"
              onPress={() => setShowDetailsModal(true)}
            >
              Details
            </ThemedButton>
          )}
        </View>
        
        <View style={styles.ratingDisplay}>
          <View style={styles.scoreContainer}>
            <Animated.Text
              style={[
                styles.score,
                { color: getRatingColor(rating.score) },
              ]}
            >
              {Math.round(rating.score)}
            </Animated.Text>
            
            <ThemedBadge
              variant="outline"
              style={{
                backgroundColor: getRatingColor(rating.score) + '20',
                borderColor: getRatingColor(rating.score),
              }}
            >
              {rating.tier}
            </ThemedBadge>
          </View>
          
          {trend && (
            <View style={styles.trendContainer}>
              <ThemedText
                variant="body2"
                style={[styles.trendText, { color: getTrendColor(trend) }]}
              >
                {getTrendIcon(trend)} {trend.change > 0 ? '+' : ''}{trend.change} points
              </ThemedText>
              <ThemedText variant="caption" style={styles.trendPeriod}>
                Last 30 days
              </ThemedText>
            </View>
          )}
        </View>
        
        {showDetails && rating.breakdown && (
          <View style={styles.breakdown}>
            <ThemedText variant="body2" style={styles.breakdownTitle}>
              Rating Breakdown
            </ThemedText>
            
            <View style={styles.breakdownItems}>
              <View style={styles.breakdownItem}>
                <ThemedText variant="caption">Verification</ThemedText>
                <ThemedText variant="body2" style={styles.breakdownValue}>
                  {rating.breakdown.verification}
                </ThemedText>
              </View>
              
              <View style={styles.breakdownItem}>
                <ThemedText variant="caption">Performance</ThemedText>
                <ThemedText variant="body2" style={styles.breakdownValue}>
                  {rating.breakdown.transactions}
                </ThemedText>
              </View>
              
              <View style={styles.breakdownItem}>
                <ThemedText variant="caption">Activity</ThemedText>
                <ThemedText variant="body2" style={styles.breakdownValue}>
                  {rating.breakdown.activity}
                </ThemedText>
              </View>
              
              <View style={styles.breakdownItem}>
                <ThemedText variant="caption">Financial</ThemedText>
                <ThemedText variant="body2" style={styles.breakdownValue}>
                  {rating.breakdown.financial}
                </ThemedText>
              </View>
            </View>
          </View>
        )}
        
        {showRecommendations && recommendations && recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <View style={styles.recommendationsHeader}>
              <ThemedText variant="body2" style={styles.recommendationsTitle}>
                Improve Your Rating
              </ThemedText>
              
              <ThemedButton
                variant="text"
                size="small"
                onPress={() => setShowRecommendationsModal(true)}
              >
                View All
              </ThemedButton>
            </View>
            
            <View style={styles.recommendationsList}>
              {recommendations.slice(0, 2).map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationContent}>
                    <ThemedText variant="body2" style={styles.recommendationTitle}>
                      {rec.title}
                    </ThemedText>
                    
                    <ThemedBadge
                      variant="outline"
                      size="small"
                      style={{
                        backgroundColor: rec.impact === 'High' 
                          ? colors.status.error + '20'
                          : colors.status.warning + '20',
                        borderColor: rec.impact === 'High' 
                          ? colors.status.error
                          : colors.status.warning,
                      }}
                    >
                      {rec.impact} Impact
                    </ThemedBadge>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ThemedCard>
    );
  };
  
  const renderDetailsModal = () => (
    <ThemedModal
      visible={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      title="Credit Rating Details"
      size="large"
    >
      {rating && (
        <View style={styles.modalContent}>
          <View style={styles.modalRating}>
            <ThemedText variant="h4" style={[styles.modalScore, { color: getRatingColor(rating.score) }]}>
              {rating.score}
            </ThemedText>
            
            <ThemedText variant="h6" style={styles.modalTier}>
              {rating.tier}
            </ThemedText>
          </View>
          
          <View style={styles.modalBreakdown}>
            <ThemedText variant="h6" style={styles.modalSectionTitle}>
              Rating Breakdown
            </ThemedText>
            
            {Object.entries(rating.breakdown).map(([key, value]) => (
              <View key={key} style={styles.modalBreakdownItem}>
                <ThemedText variant="body1" style={styles.modalBreakdownLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </ThemedText>
                
                <View style={styles.modalBreakdownBar}>
                  <View
                    style={[
                      styles.modalBreakdownFill,
                      {
                        width: `${value}%`,
                        backgroundColor: getRatingColor(value),
                      },
                    ]}
                  />
                </View>
                
                <ThemedText variant="body2" style={styles.modalBreakdownValue}>
                  {value}
                </ThemedText>
              </View>
            ))}
          </View>
          
          {ratingHistory && ratingHistory.length > 0 && (
            <View style={styles.modalHistory}>
              <ThemedText variant="h6" style={styles.modalSectionTitle}>
                Rating History
              </ThemedText>
              
              {ratingHistory.slice(-5).map((historyItem, index) => (
                <View key={index} style={styles.modalHistoryItem}>
                  <ThemedText variant="body2">
                    {new Date(historyItem.date).toLocaleDateString()}
                  </ThemedText>
                  
                  <ThemedText
                    variant="body2"
                    style={{ color: getRatingColor(historyItem.score) }}
                  >
                    {historyItem.score}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ThemedModal>
  );
  
  const renderRecommendationsModal = () => (
    <ThemedModal
      visible={showRecommendationsModal}
      onClose={() => setShowRecommendationsModal(false)}
      title="Improve Your Rating"
      size="large"
    >
      {recommendations && (
        <View style={styles.modalContent}>
          {recommendations.map((rec, index) => (
            <ThemedListItem
              key={index}
              title={rec.title}
              subtitle={rec.description}
              rightComponent={
                <View style={styles.recommendationActions}>
                  <ThemedBadge
                    variant="outline"
                    size="small"
                    style={{
                      backgroundColor: rec.impact === 'High' 
                        ? colors.status.error + '20'
                        : colors.status.warning + '20',
                      borderColor: rec.impact === 'High' 
                        ? colors.status.error
                        : colors.status.warning,
                      marginBottom: spacing[2],
                    }}
                  >
                    {rec.impact} Impact
                  </ThemedBadge>
                  
                  {!rec.completed && (
                    <ThemedButton
                      variant="outline"
                      size="small"
                      onPress={() => handleRecommendationAction(rec)}
                    >
                      Take Action
                    </ThemedButton>
                  )}
                </View>
              }
              style={[
                styles.recommendationModalItem,
                rec.completed && styles.completedRecommendation,
              ]}
            />
          ))}
        </View>
      )}
    </ThemedModal>
  );
  
  if (compact) {
    return renderCompactView();
  }
  
  return (
    <>
      {renderFullView()}
      {renderDetailsModal()}
      {renderRecommendationsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  compactScore: {
    fontWeight: 'bold',
  },
  compactInfo: {
    flex: 1,
  },
  compactTier: {
    color: colors.text.secondary,
  },
  compactTrend: {
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    color: colors.text.primary,
  },
  ratingDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: spacing[2],
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendText: {
    fontWeight: '600',
  },
  trendPeriod: {
    color: colors.text.secondary,
  },
  breakdown: {
    marginBottom: spacing[4],
  },
  breakdownTitle: {
    marginBottom: spacing[3],
    color: colors.text.secondary,
  },
  breakdownItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownValue: {
    fontWeight: '600',
    marginTop: spacing[1],
  },
  recommendations: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing[4],
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  recommendationsTitle: {
    color: colors.text.secondary,
  },
  recommendationsList: {
    gap: spacing[2],
  },
  recommendationItem: {
    padding: spacing[3],
    backgroundColor: colors.background.surface,
    borderRadius: 8,
  },
  recommendationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationTitle: {
    flex: 1,
    marginRight: spacing[2],
  },
  noRating: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  noRatingTitle: {
    marginBottom: spacing[2],
    color: colors.text.secondary,
  },
  noRatingMessage: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  modalContent: {
    paddingVertical: spacing[2],
  },
  modalRating: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  modalScore: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: spacing[2],
  },
  modalTier: {
    color: colors.text.secondary,
  },
  modalBreakdown: {
    marginBottom: spacing[6],
  },
  modalSectionTitle: {
    marginBottom: spacing[4],
    color: colors.text.primary,
  },
  modalBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  modalBreakdownLabel: {
    width: 100,
  },
  modalBreakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.surface,
    borderRadius: 4,
    marginHorizontal: spacing[3],
    overflow: 'hidden',
  },
  modalBreakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalBreakdownValue: {
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
  },
  modalHistory: {
    marginBottom: spacing[4],
  },
  modalHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  recommendationActions: {
    alignItems: 'flex-end',
  },
  recommendationModalItem: {
    marginBottom: spacing[2],
    borderRadius: 8,
    backgroundColor: colors.background.surface,
  },
  completedRecommendation: {
    opacity: 0.6,
  },
});

export default CreditRating;