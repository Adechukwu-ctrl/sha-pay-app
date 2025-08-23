import { store } from '../store';
import { calculateUserRating } from '../store/slices/creditRatingSlice';

/**
 * Credit Rating Service
 * Calculates user credit ratings based on verification data and transaction history
 */

class CreditRatingService {
  constructor() {
    this.ratingFactors = {
      // Verification factors (40% of total score)
      verification: {
        weight: 0.4,
        factors: {
          nimc: { weight: 0.3, maxScore: 100 },
          bvn: { weight: 0.3, maxScore: 100 },
          cbn: { weight: 0.2, maxScore: 100 },
          phone: { weight: 0.1, maxScore: 100 },
          email: { weight: 0.1, maxScore: 100 },
        },
      },
      
      // Transaction history (35% of total score)
      transactionHistory: {
        weight: 0.35,
        factors: {
          completionRate: { weight: 0.4, maxScore: 100 },
          onTimeDelivery: { weight: 0.3, maxScore: 100 },
          clientSatisfaction: { weight: 0.2, maxScore: 100 },
          disputeRate: { weight: 0.1, maxScore: 100 },
        },
      },
      
      // Account activity (15% of total score)
      accountActivity: {
        weight: 0.15,
        factors: {
          accountAge: { weight: 0.3, maxScore: 100 },
          profileCompleteness: { weight: 0.3, maxScore: 100 },
          responseTime: { weight: 0.2, maxScore: 100 },
          activeJobs: { weight: 0.2, maxScore: 100 },
        },
      },
      
      // Financial behavior (10% of total score)
      financialBehavior: {
        weight: 0.1,
        factors: {
          paymentHistory: { weight: 0.5, maxScore: 100 },
          withdrawalPattern: { weight: 0.3, maxScore: 100 },
          balanceManagement: { weight: 0.2, maxScore: 100 },
        },
      },
    };
    
    this.ratingTiers = {
      excellent: { min: 85, max: 100, label: 'Excellent', color: '#10B981' },
      good: { min: 70, max: 84, label: 'Good', color: '#3B82F6' },
      fair: { min: 55, max: 69, label: 'Fair', color: '#F59E0B' },
      poor: { min: 40, max: 54, label: 'Poor', color: '#EF4444' },
      unrated: { min: 0, max: 39, label: 'Unrated', color: '#6B7280' },
    };
  }
  
  /**
   * Calculate overall credit rating for a user
   * @param {Object} userData - User data including verification and transaction history
   * @returns {Object} Rating object with score, tier, and breakdown
   */
  calculateCreditRating(userData) {
    try {
      const verificationScore = this.calculateVerificationScore(userData.verification || {});
      const transactionScore = this.calculateTransactionScore(userData.transactions || []);
      const activityScore = this.calculateActivityScore(userData);
      const financialScore = this.calculateFinancialScore(userData.payments || []);
      
      const totalScore = (
        verificationScore * this.ratingFactors.verification.weight +
        transactionScore * this.ratingFactors.transactionHistory.weight +
        activityScore * this.ratingFactors.accountActivity.weight +
        financialScore * this.ratingFactors.financialBehavior.weight
      );
      
      const tier = this.getRatingTier(totalScore);
      
      return {
        score: Math.round(totalScore * 10) / 10,
        tier: tier.label,
        color: tier.color,
        breakdown: {
          verification: Math.round(verificationScore * 10) / 10,
          transactions: Math.round(transactionScore * 10) / 10,
          activity: Math.round(activityScore * 10) / 10,
          financial: Math.round(financialScore * 10) / 10,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calculating credit rating:', error);
      return this.getDefaultRating();
    }
  }
  
  /**
   * Calculate verification score based on completed verifications
   * @param {Object} verification - Verification data
   * @returns {number} Verification score (0-100)
   */
  calculateVerificationScore(verification) {
    const factors = this.ratingFactors.verification.factors;
    let totalScore = 0;
    
    // NIMC verification
    if (verification.nimc?.verified) {
      totalScore += factors.nimc.weight * factors.nimc.maxScore;
    }
    
    // BVN verification
    if (verification.bvn?.verified) {
      totalScore += factors.bvn.weight * factors.bvn.maxScore;
    }
    
    // CBN verification (for financial service providers)
    if (verification.cbn?.verified) {
      totalScore += factors.cbn.weight * factors.cbn.maxScore;
    }
    
    // Phone verification
    if (verification.phone?.verified) {
      totalScore += factors.phone.weight * factors.phone.maxScore;
    }
    
    // Email verification
    if (verification.email?.verified) {
      totalScore += factors.email.weight * factors.email.maxScore;
    }
    
    return Math.min(totalScore, 100);
  }
  
  /**
   * Calculate transaction history score
   * @param {Array} transactions - User's transaction history
   * @returns {number} Transaction score (0-100)
   */
  calculateTransactionScore(transactions) {
    if (!transactions || transactions.length === 0) {
      return 0;
    }
    
    const completedJobs = transactions.filter(t => t.status === 'completed');
    const totalJobs = transactions.length;
    
    // Completion rate
    const completionRate = (completedJobs.length / totalJobs) * 100;
    
    // On-time delivery rate
    const onTimeJobs = completedJobs.filter(t => 
      new Date(t.completedAt) <= new Date(t.deadline)
    );
    const onTimeRate = completedJobs.length > 0 
      ? (onTimeJobs.length / completedJobs.length) * 100 
      : 0;
    
    // Client satisfaction (average rating)
    const ratingsSum = completedJobs.reduce((sum, t) => sum + (t.rating || 0), 0);
    const avgRating = completedJobs.length > 0 
      ? (ratingsSum / completedJobs.length) * 20 // Convert 5-star to 100-point scale
      : 0;
    
    // Dispute rate (lower is better)
    const disputes = transactions.filter(t => t.hasDispute);
    const disputeRate = totalJobs > 0 
      ? Math.max(0, 100 - (disputes.length / totalJobs) * 100)
      : 100;
    
    const factors = this.ratingFactors.transactionHistory.factors;
    
    return (
      completionRate * factors.completionRate.weight +
      onTimeRate * factors.onTimeDelivery.weight +
      avgRating * factors.clientSatisfaction.weight +
      disputeRate * factors.disputeRate.weight
    );
  }
  
  /**
   * Calculate account activity score
   * @param {Object} userData - User data
   * @returns {number} Activity score (0-100)
   */
  calculateActivityScore(userData) {
    const now = new Date();
    const accountCreated = new Date(userData.createdAt || now);
    
    // Account age (months)
    const accountAgeMonths = (now - accountCreated) / (1000 * 60 * 60 * 24 * 30);
    const accountAgeScore = Math.min(accountAgeMonths * 10, 100); // 10 points per month, max 100
    
    // Profile completeness
    const profileFields = [
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.phone,
      userData.bio,
      userData.location,
      userData.profileImage,
      userData.skills?.length > 0,
    ];
    const completedFields = profileFields.filter(field => field).length;
    const profileCompleteness = (completedFields / profileFields.length) * 100;
    
    // Response time (based on average response time in hours)
    const avgResponseTime = userData.avgResponseTime || 24; // Default 24 hours
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime - 1) * 10); // Penalty for slow response
    
    // Active jobs
    const activeJobs = userData.activeJobs || 0;
    const activeJobsScore = Math.min(activeJobs * 20, 100); // 20 points per active job, max 100
    
    const factors = this.ratingFactors.accountActivity.factors;
    
    return (
      accountAgeScore * factors.accountAge.weight +
      profileCompleteness * factors.profileCompleteness.weight +
      responseTimeScore * factors.responseTime.weight +
      activeJobsScore * factors.activeJobs.weight
    );
  }
  
  /**
   * Calculate financial behavior score
   * @param {Array} payments - User's payment history
   * @returns {number} Financial score (0-100)
   */
  calculateFinancialScore(payments) {
    if (!payments || payments.length === 0) {
      return 50; // Neutral score for new users
    }
    
    // Payment history (on-time payments)
    const onTimePayments = payments.filter(p => 
      p.status === 'completed' && 
      new Date(p.paidAt) <= new Date(p.dueDate)
    );
    const paymentHistoryScore = (onTimePayments.length / payments.length) * 100;
    
    // Withdrawal pattern (regular vs irregular)
    const withdrawals = payments.filter(p => p.type === 'withdrawal');
    const withdrawalFrequency = withdrawals.length / Math.max(1, payments.length / 10);
    const withdrawalPatternScore = Math.min(withdrawalFrequency * 25, 100);
    
    // Balance management (maintaining positive balance)
    const balanceHistory = payments.map(p => p.balanceAfter || 0);
    const negativeBalanceCount = balanceHistory.filter(b => b < 0).length;
    const balanceManagementScore = Math.max(0, 100 - (negativeBalanceCount / balanceHistory.length) * 100);
    
    const factors = this.ratingFactors.financialBehavior.factors;
    
    return (
      paymentHistoryScore * factors.paymentHistory.weight +
      withdrawalPatternScore * factors.withdrawalPattern.weight +
      balanceManagementScore * factors.balanceManagement.weight
    );
  }
  
  /**
   * Get rating tier based on score
   * @param {number} score - Credit score (0-100)
   * @returns {Object} Rating tier object
   */
  getRatingTier(score) {
    for (const [key, tier] of Object.entries(this.ratingTiers)) {
      if (score >= tier.min && score <= tier.max) {
        return tier;
      }
    }
    return this.ratingTiers.unrated;
  }
  
  /**
   * Get default rating for new users
   * @returns {Object} Default rating object
   */
  getDefaultRating() {
    return {
      score: 0,
      tier: 'Unrated',
      color: '#6B7280',
      breakdown: {
        verification: 0,
        transactions: 0,
        activity: 0,
        financial: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
  
  /**
   * Update user's credit rating
   * @param {string} userId - User ID
   * @param {Object} userData - User data for rating calculation
   */
  async updateUserCreditRating(userId, userData) {
    try {
      const rating = this.calculateCreditRating(userData);
      
      // Update rating in Redux store
      store.dispatch(calculateUserRating({ userId, userData: { rating } }));
      
      // You can also save to backend here
      // await api.updateUserRating(userId, rating);
      
      return rating;
    } catch (error) {
      console.error('Error updating user credit rating:', error);
      throw error;
    }
  }
  
  /**
   * Get rating recommendations for improvement
   * @param {Object} rating - Current rating object
   * @returns {Array} Array of improvement recommendations
   */
  getRatingRecommendations(rating) {
    const recommendations = [];
    
    if (rating.breakdown.verification < 70) {
      recommendations.push({
        category: 'Verification',
        title: 'Complete Identity Verification',
        description: 'Verify your NIMC, BVN, and other documents to boost your rating.',
        impact: 'High',
        action: 'verify_identity',
      });
    }
    
    if (rating.breakdown.transactions < 60) {
      recommendations.push({
        category: 'Performance',
        title: 'Improve Job Completion Rate',
        description: 'Complete more jobs on time to build trust with clients.',
        impact: 'High',
        action: 'improve_performance',
      });
    }
    
    if (rating.breakdown.activity < 50) {
      recommendations.push({
        category: 'Profile',
        title: 'Complete Your Profile',
        description: 'Add skills, bio, and profile picture to appear more professional.',
        impact: 'Medium',
        action: 'complete_profile',
      });
    }
    
    if (rating.breakdown.financial < 60) {
      recommendations.push({
        category: 'Financial',
        title: 'Maintain Good Payment History',
        description: 'Pay on time and manage your account balance responsibly.',
        impact: 'Medium',
        action: 'improve_payments',
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate rating trend over time
   * @param {Array} ratingHistory - Historical rating data
   * @returns {Object} Trend analysis
   */
  calculateRatingTrend(ratingHistory) {
    if (!ratingHistory || ratingHistory.length < 2) {
      return { trend: 'stable', change: 0, period: 'insufficient_data' };
    }
    
    const recent = ratingHistory[ratingHistory.length - 1];
    const previous = ratingHistory[ratingHistory.length - 2];
    
    const change = recent.score - previous.score;
    const percentChange = (change / previous.score) * 100;
    
    let trend = 'stable';
    if (change > 2) trend = 'improving';
    else if (change < -2) trend = 'declining';
    
    return {
      trend,
      change: Math.round(change * 10) / 10,
      percentChange: Math.round(percentChange * 10) / 10,
      period: '30_days',
    };
  }
}

// Export singleton instance
export default new CreditRatingService();