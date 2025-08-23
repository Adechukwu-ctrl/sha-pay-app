import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from './index';

/**
 * Typed hooks for Redux usage throughout the application
 * These provide better TypeScript support and autocomplete
 */

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

/**
 * Custom hooks for specific state slices
 * These provide convenient access to commonly used state
 */

// Auth hooks
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    userType: auth.userType,
    loading: auth.loading,
    error: auth.error,
    verificationStatus: auth.verificationStatus,
    creditRating: auth.creditRating,
    dispatch,
  };
};

// Jobs hooks
export const useJobs = () => {
  const jobs = useAppSelector((state) => state.jobs);
  const dispatch = useAppDispatch();
  
  return {
    jobs: jobs.jobs,
    jobRequests: jobs.jobRequests,
    jobOffers: jobs.jobOffers,
    activeJobs: jobs.activeJobs,
    completedJobs: jobs.completedJobs,
    disputes: jobs.disputes,
    selectedJob: jobs.selectedJob,
    loading: jobs.loading,
    error: jobs.error,
    dispatch,
  };
};

// Payment hooks
export const usePayment = () => {
  const payment = useAppSelector((state) => state.payment);
  const dispatch = useAppDispatch();
  
  return {
    payments: payment.payments,
    currentPayment: payment.currentPayment,
    paymentDetails: payment.paymentDetails,
    serviceChargeRate: payment.serviceChargeRate,
    loading: payment.loading,
    error: payment.error,
    paymentMethods: payment.paymentMethods,
    escrowBalance: payment.escrowBalance,
    transactionHistory: payment.transactionHistory,
    dispatch,
  };
};

// Chat hooks
export const useChat = () => {
  const chat = useAppSelector((state) => state.chat);
  const dispatch = useAppDispatch();
  
  return {
    conversations: chat.conversations,
    currentConversation: chat.currentConversation,
    messages: chat.messages,
    loading: chat.loading,
    error: chat.error,
    unreadCount: chat.unreadCount,
    dispatch,
  };
};

// User hooks
export const useUser = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  
  return {
    profile: user.profile,
    skills: user.skills,
    ratings: user.ratings,
    currentCategory: user.currentCategory,
    loading: user.loading,
    error: user.error,
    dispatch,
  };
};

/**
 * Utility hooks for common state combinations
 */

// Combined auth and user data
export const useCurrentUser = () => {
  const { user, isAuthenticated, userType } = useAuth();
  const { profile, currentCategory } = useUser();
  
  return {
    user,
    profile,
    isAuthenticated,
    userType,
    currentCategory,
    isServiceProvider: currentCategory === 'service_provider',
    isServiceRequirer: currentCategory === 'service_requirer',
  };
};

// Loading states across all slices
export const useGlobalLoading = () => {
  const authLoading = useAppSelector((state) => state.auth.loading);
  const jobsLoading = useAppSelector((state) => state.jobs.loading);
  const paymentLoading = useAppSelector((state) => state.payment.loading);
  const chatLoading = useAppSelector((state) => state.chat.loading);
  const userLoading = useAppSelector((state) => state.user.loading);
  
  return {
    isLoading: authLoading || jobsLoading || paymentLoading || chatLoading || userLoading,
    authLoading,
    jobsLoading,
    paymentLoading,
    chatLoading,
    userLoading,
  };
};

// Error states across all slices
export const useGlobalErrors = () => {
  const authError = useAppSelector((state) => state.auth.error);
  const jobsError = useAppSelector((state) => state.jobs.error);
  const paymentError = useAppSelector((state) => state.payment.error);
  const chatError = useAppSelector((state) => state.chat.error);
  const userError = useAppSelector((state) => state.user.error);
  
  const hasErrors = !!(authError || jobsError || paymentError || chatError || userError);
  
  return {
    hasErrors,
    authError,
    jobsError,
    paymentError,
    chatError,
    userError,
    allErrors: [authError, jobsError, paymentError, chatError, userError].filter(Boolean),
  };
};

/**
 * Performance hooks for optimized rendering
 */

// Memoized selectors for expensive computations
export const useJobStats = () => {
  return useAppSelector((state) => {
    const jobs = state.jobs.jobs;
    const activeJobs = state.jobs.activeJobs;
    const completedJobs = state.jobs.completedJobs;
    
    return {
      totalJobs: jobs.length,
      activeJobsCount: activeJobs.length,
      completedJobsCount: completedJobs.length,
      pendingJobsCount: jobs.filter(job => job.status === 'pending').length,
      averageRating: completedJobs.reduce((acc, job) => acc + (job.rating || 0), 0) / completedJobs.length || 0,
    };
  });
};

export const usePaymentStats = () => {
  return useAppSelector((state) => {
    const payments = state.payment.payments;
    const transactionHistory = state.payment.transactionHistory;
    
    return {
      totalPayments: payments.length,
      totalEarnings: payments.reduce((acc, payment) => acc + payment.amount, 0),
      escrowBalance: state.payment.escrowBalance,
      pendingPayments: payments.filter(payment => payment.status === 'pending').length,
      completedPayments: payments.filter(payment => payment.status === 'completed').length,
      transactionCount: transactionHistory.length,
    };
  });
};