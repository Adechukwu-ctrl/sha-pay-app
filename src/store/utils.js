/**
 * Redux State Management Utilities
 * Helper functions for working with Redux state
 */

/**
 * Action creators for common operations
 */

// Generic action creator for clearing errors
export const createClearErrorAction = (sliceName) => ({
  type: `${sliceName}/clearError`,
});

// Generic action creator for setting loading state
export const createSetLoadingAction = (sliceName, loading) => ({
  type: `${sliceName}/setLoading`,
  payload: loading,
});

/**
 * State selectors for common patterns
 */

// Get loading state from any slice
export const getLoadingState = (state, sliceName) => {
  return state[sliceName]?.loading || false;
};

// Get error state from any slice
export const getErrorState = (state, sliceName) => {
  return state[sliceName]?.error || null;
};

// Check if any slice is loading
export const isAnySliceLoading = (state, sliceNames = []) => {
  if (sliceNames.length === 0) {
    sliceNames = ['auth', 'jobs', 'payment', 'chat', 'user'];
  }
  return sliceNames.some(sliceName => getLoadingState(state, sliceName));
};

// Get all errors from specified slices
export const getAllErrors = (state, sliceNames = []) => {
  if (sliceNames.length === 0) {
    sliceNames = ['auth', 'jobs', 'payment', 'chat', 'user'];
  }
  return sliceNames
    .map(sliceName => getErrorState(state, sliceName))
    .filter(Boolean);
};

/**
 * Data transformation utilities
 */

// Transform job data for display
export const transformJobForDisplay = (job) => {
  if (!job) return null;
  
  return {
    ...job,
    formattedAmount: `₦${job.amount?.toLocaleString() || '0'}`,
    formattedDeadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline',
    statusColor: getJobStatusColor(job.status),
    isOverdue: job.deadline ? new Date(job.deadline) < new Date() : false,
  };
};

// Transform payment data for display
export const transformPaymentForDisplay = (payment) => {
  if (!payment) return null;
  
  return {
    ...payment,
    formattedAmount: `₦${payment.amount?.toLocaleString() || '0'}`,
    formattedServiceCharge: `₦${payment.serviceCharge?.toLocaleString() || '0'}`,
    formattedTotal: `₦${payment.totalAmount?.toLocaleString() || '0'}`,
    statusColor: getPaymentStatusColor(payment.status),
    formattedDate: payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '',
  };
};

// Transform user rating for display
export const transformRatingForDisplay = (rating) => {
  if (!rating) return null;
  
  return {
    ...rating,
    stars: '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating),
    formattedDate: rating.ratedAt ? new Date(rating.ratedAt).toLocaleDateString() : '',
  };
};

/**
 * Status color utilities
 */

export const getJobStatusColor = (status) => {
  const colors = {
    pending: '#FFA500',
    accepted: '#4CAF50',
    in_progress: '#2196F3',
    completed: '#8BC34A',
    disputed: '#F44336',
    cancelled: '#9E9E9E',
  };
  return colors[status] || '#9E9E9E';
};

export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: '#FFA500',
    processing: '#2196F3',
    completed: '#4CAF50',
    failed: '#F44336',
    refunded: '#9C27B0',
  };
  return colors[status] || '#9E9E9E';
};

export const getDisputeStatusColor = (status) => {
  const colors = {
    open: '#F44336',
    under_review: '#FF9800',
    resolved: '#4CAF50',
    closed: '#9E9E9E',
  };
  return colors[status] || '#9E9E9E';
};

/**
 * Validation utilities
 */

// Validate job data
export const validateJobData = (jobData) => {
  const errors = {};
  
  if (!jobData.title?.trim()) {
    errors.title = 'Job title is required';
  }
  
  if (!jobData.description?.trim()) {
    errors.description = 'Job description is required';
  }
  
  if (!jobData.amount || jobData.amount < 1000) {
    errors.amount = 'Amount must be at least ₦1,000';
  }
  
  if (!jobData.deadline) {
    errors.deadline = 'Deadline is required';
  } else if (new Date(jobData.deadline) <= new Date()) {
    errors.deadline = 'Deadline must be in the future';
  }
  
  if (!jobData.category?.trim()) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate payment data
export const validatePaymentData = (paymentData) => {
  const errors = {};
  
  if (!paymentData.accountName?.trim()) {
    errors.accountName = 'Account name is required';
  }
  
  if (!paymentData.accountNumber?.trim()) {
    errors.accountNumber = 'Account number is required';
  } else if (!/^\d{10}$/.test(paymentData.accountNumber)) {
    errors.accountNumber = 'Account number must be 10 digits';
  }
  
  if (!paymentData.bankName?.trim()) {
    errors.bankName = 'Bank name is required';
  }
  
  if (!paymentData.paymentMethod) {
    errors.paymentMethod = 'Payment method is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate user profile data
export const validateUserProfile = (profileData) => {
  const errors = {};
  
  if (!profileData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!profileData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!profileData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!profileData.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^\+234[0-9]{10}$/.test(profileData.phoneNumber)) {
    errors.phoneNumber = 'Phone number must be in format +234XXXXXXXXXX';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Calculation utilities
 */

// Calculate service charge
export const calculateServiceCharge = (amount, rate = 0.025) => {
  return Math.round(amount * rate);
};

// Calculate total amount with service charge
export const calculateTotalAmount = (amount, serviceChargeRate = 0.025) => {
  const serviceCharge = calculateServiceCharge(amount, serviceChargeRate);
  return amount + serviceCharge;
};

// Calculate average rating
export const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

// Calculate completion rate
export const calculateCompletionRate = (completedJobs, totalJobs) => {
  if (totalJobs === 0) return 0;
  return Math.round((completedJobs / totalJobs) * 100);
};

/**
 * Date utilities
 */

// Format date for display
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
};

// Check if date is overdue
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

/**
 * Search and filter utilities
 */

// Filter jobs by criteria
export const filterJobs = (jobs, filters) => {
  return jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.category && job.category !== filters.category) return false;
    if (filters.minAmount && job.amount < filters.minAmount) return false;
    if (filters.maxAmount && job.amount > filters.maxAmount) return false;
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchableText = `${job.title} ${job.description} ${job.category}`.toLowerCase();
      if (!searchableText.includes(searchTerm)) return false;
    }
    return true;
  });
};

// Sort jobs by criteria
export const sortJobs = (jobs, sortBy = 'createdAt', sortOrder = 'desc') => {
  return [...jobs].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'createdAt' || sortBy === 'deadline') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle numeric sorting
    if (sortBy === 'amount') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

/**
 * Local storage utilities (without AsyncStorage dependency)
 */

// Simple in-memory cache for development
const memoryCache = new Map();

export const cacheData = (key, data, ttl = 300000) => { // 5 minutes default TTL
  const expiresAt = Date.now() + ttl;
  memoryCache.set(key, { data, expiresAt });
};

export const getCachedData = (key) => {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const clearCache = (key = null) => {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
};