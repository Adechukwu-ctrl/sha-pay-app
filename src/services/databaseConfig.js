// Database Configuration and Models for Sha_Pay!
// This file defines the data structure and models used throughout the application

// User Profile Model
export const UserProfileModel = {
  id: 'string', // Unique user identifier
  firstName: 'string',
  lastName: 'string',
  email: 'string',
  phone: 'string',
  profileImage: 'string|null', // URL to profile image
  bio: 'string',
  location: 'string',
  joinedDate: 'string', // ISO date string
  verificationStatus: {
    nimc: 'boolean',
    bvn: 'boolean',
    cbn: 'boolean',
  },
  creditRating: 'number', // 0-5 scale
  totalJobs: 'number',
  completedJobs: 'number',
  successRate: 'number', // Percentage
  currentCategory: 'string', // 'provider' | 'requirer'
  isActive: 'boolean',
  lastLoginAt: 'string', // ISO date string
  createdAt: 'string', // ISO date string
  updatedAt: 'string', // ISO date string
};

// User Skills Model
export const UserSkillModel = {
  id: 'string',
  userId: 'string',
  name: 'string',
  level: 'string', // 'Beginner' | 'Intermediate' | 'Expert'
  verified: 'boolean',
  verifiedBy: 'string|null', // User ID who verified
  verifiedAt: 'string|null', // ISO date string
  createdAt: 'string',
  updatedAt: 'string',
};

// User Ratings Model
export const UserRatingModel = {
  id: 'string',
  userId: 'string', // User being rated
  jobId: 'string',
  rating: 'number', // 1-5 scale
  feedback: 'string',
  ratedBy: 'string', // User ID who gave the rating
  ratedAt: 'string', // ISO date string
  qualityAspects: {
    communication: 'number', // 1-5 scale
    timeliness: 'number', // 1-5 scale
    workQuality: 'number', // 1-5 scale
    professionalism: 'number', // 1-5 scale
  },
  wouldRecommend: 'boolean',
  wouldHireAgain: 'boolean',
  createdAt: 'string',
  updatedAt: 'string',
};

// Job Model
export const JobModel = {
  id: 'string',
  title: 'string',
  description: 'string',
  category: 'string',
  skills: 'array', // Array of skill names
  amount: 'number',
  currency: 'string', // Default: 'NGN'
  deadline: 'string', // ISO date string
  location: 'string',
  locationType: 'string', // 'remote' | 'onsite' | 'hybrid'
  status: 'string', // 'pending' | 'accepted' | 'in_progress' | 'completed' | 'disputed' | 'cancelled'
  priority: 'string', // 'low' | 'medium' | 'high' | 'urgent'
  requesterId: 'string', // User who posted the job
  providerId: 'string|null', // User who accepted the job
  acceptedAt: 'string|null', // ISO date string
  startedAt: 'string|null', // ISO date string
  completedAt: 'string|null', // ISO date string
  estimatedDuration: 'string', // e.g., '2 weeks', '3 days'
  attachments: 'array', // Array of file URLs
  requirements: 'array', // Array of requirement strings
  deliverables: 'array', // Array of deliverable strings
  createdAt: 'string',
  updatedAt: 'string',
};

// Job Application Model
export const JobApplicationModel = {
  id: 'string',
  jobId: 'string',
  applicantId: 'string',
  coverLetter: 'string',
  proposedAmount: 'number',
  estimatedCompletion: 'string',
  portfolio: 'array', // Array of portfolio item URLs
  status: 'string', // 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  appliedAt: 'string', // ISO date string
  respondedAt: 'string|null', // ISO date string
  createdAt: 'string',
  updatedAt: 'string',
};

// Payment Transaction Model
export const PaymentTransactionModel = {
  id: 'string',
  jobId: 'string',
  payerId: 'string', // Usually the job requester
  payeeId: 'string', // Usually the job provider
  amount: 'number',
  serviceCharge: 'number', // 2.5% of amount
  totalAmount: 'number', // amount + serviceCharge
  currency: 'string', // Default: 'NGN'
  status: 'string', // 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'string', // 'bank_transfer' | 'card' | 'wallet'
  transactionReference: 'string',
  gatewayReference: 'string|null',
  escrowReleased: 'boolean',
  escrowReleasedAt: 'string|null', // ISO date string
  paymentDetails: {
    accountName: 'string',
    accountNumber: 'string',
    bankName: 'string',
    bankCode: 'string|null',
  },
  createdAt: 'string',
  updatedAt: 'string',
};

// Chat Conversation Model
export const ConversationModel = {
  id: 'string',
  jobId: 'string|null', // Can be null for general conversations
  participants: 'array', // Array of user objects
  lastMessage: 'object|null', // Last message object
  unreadCount: 'number',
  status: 'string', // 'active' | 'archived' | 'blocked'
  jobTitle: 'string|null',
  createdAt: 'string',
  updatedAt: 'string',
};

// Chat Message Model
export const MessageModel = {
  id: 'string',
  conversationId: 'string',
  text: 'string',
  senderId: 'string',
  senderName: 'string',
  timestamp: 'string', // ISO date string
  type: 'string', // 'text' | 'image' | 'file' | 'system'
  status: 'string', // 'sent' | 'delivered' | 'read'
  edited: 'boolean',
  editedAt: 'string|null', // ISO date string
  attachments: 'array', // Array of attachment objects
  replyTo: 'string|null', // Message ID being replied to
  deleted: 'boolean',
  deletedAt: 'string|null', // ISO date string
  createdAt: 'string',
  updatedAt: 'string',
};

// Dispute Model
export const DisputeModel = {
  id: 'string',
  jobId: 'string',
  raisedBy: 'string', // User ID who raised the dispute
  againstUser: 'string', // User ID the dispute is against
  reason: 'string',
  description: 'string',
  evidence: 'array', // Array of evidence file URLs
  status: 'string', // 'open' | 'under_review' | 'resolved' | 'closed'
  resolution: 'string|null',
  resolvedBy: 'string|null', // Admin/mediator user ID
  resolvedAt: 'string|null', // ISO date string
  refundAmount: 'number|null',
  penaltyAmount: 'number|null',
  createdAt: 'string',
  updatedAt: 'string',
};

// Notification Model
export const NotificationModel = {
  id: 'string',
  userId: 'string',
  title: 'string',
  message: 'string',
  type: 'string', // 'job' | 'payment' | 'chat' | 'system' | 'dispute'
  relatedId: 'string|null', // Related job, payment, or conversation ID
  read: 'boolean',
  readAt: 'string|null', // ISO date string
  actionUrl: 'string|null', // Deep link URL
  priority: 'string', // 'low' | 'medium' | 'high'
  createdAt: 'string',
  updatedAt: 'string',
};

// Verification Document Model
export const VerificationDocumentModel = {
  id: 'string',
  userId: 'string',
  documentType: 'string', // 'nimc' | 'bvn' | 'cbn' | 'passport' | 'drivers_license'
  documentNumber: 'string',
  documentUrl: 'string|null', // URL to uploaded document
  verificationStatus: 'string', // 'pending' | 'verified' | 'rejected'
  verifiedAt: 'string|null', // ISO date string
  verifiedBy: 'string|null', // Admin user ID
  rejectionReason: 'string|null',
  expiryDate: 'string|null', // ISO date string
  createdAt: 'string',
  updatedAt: 'string',
};

// Credit Rating Model
export const CreditRatingModel = {
  id: 'string',
  userId: 'string',
  score: 'number', // 0-5 scale
  factors: {
    paymentHistory: 'number', // 0-5 scale
    jobCompletion: 'number', // 0-5 scale
    clientFeedback: 'number', // 0-5 scale
    disputeHistory: 'number', // 0-5 scale
    verificationLevel: 'number', // 0-5 scale
  },
  lastCalculatedAt: 'string', // ISO date string
  calculationMethod: 'string', // Version of algorithm used
  createdAt: 'string',
  updatedAt: 'string',
};

// Database Configuration
export const DatabaseConfig = {
  // Local storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    USER_PROFILE: 'user_profile',
    CONVERSATIONS: 'conversations_',
    MESSAGES: 'messages_',
    JOBS: 'jobs_',
    NOTIFICATIONS: 'notifications_',
    CACHE_TIMESTAMP: 'cache_timestamp_',
  },
  
  // API endpoints
  API_ENDPOINTS: {
    BASE_URL: 'https://your-backend-api.com/api',
    AUTH: '/auth',
    USERS: '/users',
    JOBS: '/jobs',
    PAYMENTS: '/payments',
    CHAT: '/chat',
    NOTIFICATIONS: '/notifications',
    DISPUTES: '/disputes',
    VERIFICATION: '/verification',
  },
  
  // Cache settings
  CACHE_SETTINGS: {
    DEFAULT_TTL: 300000, // 5 minutes in milliseconds
    USER_PROFILE_TTL: 600000, // 10 minutes
    JOBS_TTL: 180000, // 3 minutes
    MESSAGES_TTL: 60000, // 1 minute
  },
  
  // Validation rules
  VALIDATION_RULES: {
    PASSWORD_MIN_LENGTH: 8,
    PHONE_REGEX: /^\+234[0-9]{10}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NIN_LENGTH: 11,
    BVN_LENGTH: 11,
    MIN_JOB_AMOUNT: 1000, // NGN
    MAX_JOB_AMOUNT: 10000000, // NGN
    SERVICE_CHARGE_RATE: 0.025, // 2.5%
  },
  
  // Status enums
  STATUS_ENUMS: {
    JOB_STATUS: ['pending', 'accepted', 'in_progress', 'completed', 'disputed', 'cancelled'],
    PAYMENT_STATUS: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    DISPUTE_STATUS: ['open', 'under_review', 'resolved', 'closed'],
    VERIFICATION_STATUS: ['pending', 'verified', 'rejected'],
    MESSAGE_STATUS: ['sent', 'delivered', 'read'],
    USER_CATEGORY: ['provider', 'requirer'],
    SKILL_LEVEL: ['Beginner', 'Intermediate', 'Expert'],
    PRIORITY_LEVEL: ['low', 'medium', 'high', 'urgent'],
  },
};

// Helper functions for data validation
export const ValidationHelpers = {
  isValidEmail: (email) => DatabaseConfig.VALIDATION_RULES.EMAIL_REGEX.test(email),
  isValidPhone: (phone) => DatabaseConfig.VALIDATION_RULES.PHONE_REGEX.test(phone),
  isValidPassword: (password) => password && password.length >= DatabaseConfig.VALIDATION_RULES.PASSWORD_MIN_LENGTH,
  isValidNIN: (nin) => nin && nin.length === DatabaseConfig.VALIDATION_RULES.NIN_LENGTH,
  isValidBVN: (bvn) => bvn && bvn.length === DatabaseConfig.VALIDATION_RULES.BVN_LENGTH,
  isValidJobAmount: (amount) => {
    const numAmount = parseFloat(amount);
    return numAmount >= DatabaseConfig.VALIDATION_RULES.MIN_JOB_AMOUNT && 
           numAmount <= DatabaseConfig.VALIDATION_RULES.MAX_JOB_AMOUNT;
  },
  calculateServiceCharge: (amount) => {
    return parseFloat(amount) * DatabaseConfig.VALIDATION_RULES.SERVICE_CHARGE_RATE;
  },
  generateId: () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  formatCurrency: (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
};

export default {
  UserProfileModel,
  UserSkillModel,
  UserRatingModel,
  JobModel,
  JobApplicationModel,
  PaymentTransactionModel,
  ConversationModel,
  MessageModel,
  DisputeModel,
  NotificationModel,
  VerificationDocumentModel,
  CreditRatingModel,
  DatabaseConfig,
  ValidationHelpers,
};